#!/usr/bin/env bash
# ============================================================
# educa-worker.sh — avance le backlog EDUCA tâche par tâche,
# s'arrête AVANT le mur de tokens, et se reprogramme tout seul
# à l'heure exacte où le quota revient.
#
# Dépendances : bash, jq, git, claude (CLI), et optionnellement openclaw.
# Lancé par une automation OpenClaw (ou launchd/systemd) toutes les 20 min :
#   openclaw automations create "*/20 * * * *" --name "EDUCA worker" \
#     --command "scripts/educa-worker.sh" --command-cwd "$HOME/projets/edugame" --no-deliver
#
# Variables d'environnement :
#   EDUCA_REPO    chemin du dépôt            (défaut : dossier courant)
#   EDUCA_SEUIL   % de quota max avant pause (défaut : 85)
#   EDUCA_SLEEP   1 = dormir jusqu'au reset au lieu de sortir (usage tmux)
#   EDUCA_TURNS   --max-turns par tâche      (défaut : 60)
#   EDUCA_BUDGET  --max-budget-usd par tâche (défaut : 3)
# ============================================================
set -uo pipefail

REPO="${EDUCA_REPO:-$PWD}"
SEUIL="${EDUCA_SEUIL:-85}"
TURNS="${EDUCA_TURNS:-60}"
BUDGET="${EDUCA_BUDGET:-3}"
RL="$HOME/.claude/rate-limit.json"
Q="$REPO/ops/BACKLOG.jsonl"
JOURNAL="$REPO/ops/journal.md"
LOCKDIR="/tmp/educa-worker.lock"

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

# --- verrou portable (mkdir est atomique, y compris sur macOS) ------
if ! mkdir "$LOCKDIR" 2>/dev/null; then
  log "un worker tourne déjà — sortie"; exit 0
fi
trap 'rmdir "$LOCKDIR" 2>/dev/null' EXIT

cd "$REPO" || { log "dépôt introuvable : $REPO"; exit 1; }
command -v jq     >/dev/null || { log "jq manquant";     exit 1; }
command -v claude >/dev/null || { log "claude manquant"; exit 1; }

# ============================================================
# 1. QUOTA — le reset le plus proche parmi les fenêtres connues
# ============================================================
prochain_reset() {
  [ -f "$RL" ] || { echo ""; return; }
  jq -r '[ (if (.five_hour_pct // 0) >= '"$SEUIL"' then .five_hour_reset else empty end),
          (if (.seven_day_pct // 0) >= '"$SEUIL"' then .seven_day_reset else empty end) ]
        | map(select(. != null)) | min // empty' "$RL"
}

programmer_reveil() {          # $1 = epoch du reset
  local reset="$1" iso
  if command -v openclaw >/dev/null; then
    iso=$(date -u -r "$reset" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null \
       || date -u -d "@$reset" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
    [ -n "$iso" ] && openclaw automations create --at "$iso" \
      --name "EDUCA reprise $(date +%H%M)" \
      --command "scripts/educa-worker.sh" --command-cwd "$REPO" --no-deliver \
      && log "réveil programmé à $iso"
  fi
}

attendre_ou_sortir() {         # $1 = epoch du reset
  local reset="$1" now delta
  now=$(date +%s); delta=$(( reset - now + 60 ))
  [ "$delta" -lt 0 ] && return 0
  if [ "${EDUCA_SLEEP:-0}" = "1" ]; then
    log "quota atteint — pause de $((delta/60)) min"
    sleep "$delta"
  else
    log "quota atteint — reprise prévue dans $((delta/60)) min"
    programmer_reveil "$reset"
    exit 0
  fi
}

reset=$(prochain_reset)
[ -n "$reset" ] && attendre_ou_sortir "$reset"

# ============================================================
# 2. TÂCHE — la première 'pending' dont les dépendances sont 'done'
# ============================================================
TACHE=$(jq -s -c '
  (map(select(.status=="done") | .id)) as $ok
  | map(select(.status=="pending" and (all(.deps[]?; . as $d | $ok | index($d)))))
  | .[0] // empty' "$Q")

[ -z "$TACHE" ] && { log "rien à faire (backlog vide ou tout bloqué)"; exit 0; }

ID=$(jq -r '.id'     <<<"$TACHE")
TITRE=$(jq -r '.titre'  <<<"$TACHE")
AGENT=$(jq -r '.agent'  <<<"$TACHE")
PROMPT=$(jq -r '.prompt' <<<"$TACHE")
DONE_WHEN=$(jq -r '.done_when' <<<"$TACHE")

maj_statut() {                 # $1 = id, $2 = nouveau statut
  jq -c --arg id "$1" --arg st "$2" --arg ts "$(date -Iseconds)" \
    'if .id == $id then .status = $st | .updated_at = $ts else . end' "$Q" > "$Q.tmp" \
    && mv "$Q.tmp" "$Q"
}

log "=== $ID — $TITRE (agent: $AGENT)"
maj_statut "$ID" "in_progress"

git rev-parse --verify "openclaw/$ID" >/dev/null 2>&1 \
  && git checkout "openclaw/$ID" >/dev/null 2>&1 \
  || git checkout -b "openclaw/$ID" >/dev/null 2>&1

# ============================================================
# 3. EXÉCUTION — une session Claude, bornée en tours et en budget
# ============================================================
CONSIGNE="Tu travailles sur le dépôt EDUCA. Lis d'abord ops/HANDOFF.md (état de la session
précédente) puis BRIEF-OPENCLAW.md (règles de travail, section 0). Délègue au sous-agent
$AGENT. Tâche $ID — $TITRE.

$PROMPT

Critère de fin (vérifié par educa-qa avant de conclure) : $DONE_WHEN

Avant de terminer, quoi qu'il arrive : mets à jour ops/HANDOFF.md (10 lignes max :
où tu en es, décisions prises, fichiers touchés, prochaine étape) et commit sur la
branche courante. Ne pousse jamais sur main."

ERRLOG=$(mktemp)
OUT=$(claude -p "$CONSIGNE" \
        --output-format json \
        --permission-mode acceptEdits \
        --max-turns "$TURNS" \
        --max-budget-usd "$BUDGET" 2>"$ERRLOG")

SID=$(jq -r '.session_id // empty' <<<"$OUT" 2>/dev/null)
TXT="$OUT $(cat "$ERRLOG")"

# --- limite atteinte en cours de route : on reprend LA MÊME session ---
if grep -qiE 'usage limit|rate limit|resets at|out of extra usage' <<<"$TXT"; then
  log "limite atteinte pendant $ID — session $SID mise en attente"
  reset=$(prochain_reset)
  [ -z "$reset" ] && reset=$(( $(date +%s) + 3600 ))
  attendre_ou_sortir "$reset"          # sort et se reprogramme (ou dort si EDUCA_SLEEP=1)
  if [ -n "$SID" ]; then
    OUT=$(claude -r "$SID" -p "Reprends exactement où tu t'es arrêté. Relis d'abord ops/HANDOFF.md." \
            --output-format json --permission-mode acceptEdits \
            --max-turns "$TURNS" --max-budget-usd "$BUDGET" 2>>"$ERRLOG")
    TXT="$OUT $(cat "$ERRLOG")"
  fi
fi

# ============================================================
# 4. VERDICT — jamais 'done' sans vérification
# ============================================================
if jq -e '.is_error == true' >/dev/null 2>&1 <<<"$OUT"; then
  maj_statut "$ID" "blocked"; VERDICT="BLOQUÉE"
else
  maj_statut "$ID" "done";    VERDICT="terminée"
fi

git add -A && git commit -q -m "openclaw($ID): $TITRE" 2>/dev/null

{
  printf '\n## %s — %s (%s)\n' "$(date '+%Y-%m-%d %H:%M')" "$ID" "$VERDICT"
  printf -- '- %s\n' "$TITRE"
  printf -- '- branche : openclaw/%s · session : %s\n' "$ID" "${SID:-n/a}"
  jq -r '"- résumé : " + ((.result // "") | gsub("\n"; " ") | .[0:400])' <<<"$OUT" 2>/dev/null
} >> "$JOURNAL"

log "$ID $VERDICT — journal mis à jour"
rm -f "$ERRLOG"

# une seule tâche par exécution : la prochaine passe du cron prendra la suivante,
# ce qui garantit qu'on relit le quota entre deux tâches.

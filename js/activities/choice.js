/* ============================================================
   ACTIVITIES/CHOICE.JS — Les exercices « touche la bonne réponse »
   • écouter : « Tu entends [m] dans moto ? », « Quel mot commence par [m] ? »
   • son → lettre : « Touche la lettre qui fait [m] »
   • syllabe : « Touche la syllabe ma »
   • lire un mot : le mot est écrit (coloré), l'enfant touche l'image —
     le mot n'est PAS dit avant la réponse : c'est l'enfant qui lit
   • phrase : lire, puis toucher l'image qui correspond exactement
   L'aide (💡) existe partout ; l'utiliser compte « avec aide »
   (demi-information pour l'Élo, jamais une punition).
   ============================================================ */

import { h, sleep } from '../ui/dom.js';
import { wordEl, sentenceEl } from '../ui/word.js';
import { spokenSyllables } from '../core/seg.js';
import { choiceGrid, lock, mark, listenButton, cheer, comfort, praise, noteSupport } from './common.js';

function setupPrompt(q, api) {
  const { voice, cur } = api;
  const card = h('div', { class: 'paper prompt-card' });
  let kind = 'emoji';
  let hear = null;
  let help = null;
  if (q.kind === 'sound') {
    kind = 'letter';
    card.append(listenButton(() => { noteSupport(api, 'instruction-replay'); voice.sound(q.ph, { caption: '🔊' }); }, 'Réécouter le son'));
    help = () => voice.seq(q.anchor ? ['Écoute :', { sound: q.ph }, '. Comme dans', { word: q.anchor }, '.']
      : ['Écoute bien :', { sound: q.ph }, { pause: 300 }, { sound: q.ph }]);
  } else if (q.kind === 'hearword') {
    kind = 'syllable';
    card.append(listenButton(() => { noteSupport(api, 'instruction-replay'); voice.say(q.answer, { slowWord: true, caption: '🔊' }); }, 'Réécouter le mot'));
    help = () => voice.seq([{ word: q.answer }, { pause: 300 }, { word: q.answer }]);
  } else if (q.kind === 'syllable') {
    kind = 'syllable';
    card.append(listenButton(() => { noteSupport(api, 'instruction-replay'); voice.say(q.answer, { slowWord: true, caption: '🔊' }); }, 'Réécouter la syllabe'));
    help = () => voice.seq([{ word: q.answer }, { pause: 300 }, { word: q.answer }]);
  } else if (q.kind === 'listen') {
    if (q.mode === 'contains') {
      kind = 'yesno';
      card.append(h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, q.word.emoji));
    }
    card.append(listenButton(() => { noteSupport(api, 'instruction-replay'); voice.seq(q.prompt, { caption: q.caption }); }, 'Réécouter'));
    if (q.mode === 'initial') hear = o => voice.say(o.say, { slowWord: true });
    help = () => voice.seq([...q.prompt]);
  } else if (q.kind === 'read') {
    card.append(wordEl(q.word.parsed, { className: 'big-word' }));
    hear = o => voice.say(o.say);
    help = () => voice.seq(spokenSyllables(q.word.parsed).flatMap(s => [{ word: s }, { pause: 250 }]));
  } else if (q.kind === 'sentence') {
    kind = 'pair';
    card.append(sentenceEl(q.sentence, { className: 'big-sentence' }));
    help = () => voice.seq(q.sentence.words.map(w => ({ word: w.text })));
  }
  return { card, kind, hear, help };
}

/* Ce que dit Kaya après une erreur : on montre ET on explique. */
function explain(q, chosen, cur) {
  switch (q.kind) {
    case 'sound': {
      const ph = cur.steps.find(s => s.show === chosen.id)?.ph;
      const twin = (cur.confusable[q.answer] || []).includes(chosen.id);
      const parts = [twin ? 'Attention, elles se ressemblent !' : 'Presque !'];
      if (ph) parts.push('Celle-là fait le son', { sound: ph }, '.');
      parts.push('Le son', { sound: q.ph }, ', c\'est celle avec l\'étoile.');
      if (q.anchor) parts.push('Comme dans', { word: q.anchor }, '!');
      return { parts, caption: `Le son « ${q.ph} » s'écrit « ${q.answer} »`, confusion: twin ? `${q.answer}/${chosen.id}` : undefined };
    }
    case 'hearword':
      return { parts: ['Ça, c\'est', { word: chosen.id }, '. On cherchait', { word: q.answer }, '.'], caption: `On cherchait « ${q.answer} »` };
    case 'syllable': {
      const reversed = chosen.id === [...q.answer].reverse().join('');
      const parts = ['Ça, c\'est', { word: chosen.id }, '. On cherchait', { word: q.answer }, '.'];
      if (reversed) parts.push('Attention au sens : on lit de gauche à droite !');
      return { parts, caption: `On cherchait « ${q.answer} »`, confusion: reversed ? 'inversion' : `${q.answer}/${chosen.id}` };
    }
    case 'listen': {
      if (q.mode === 'initial') {
        return { parts: ['C\'est', { word: q.answer }, 'qui commence par le son', { sound: q.ph }, '!'], caption: `C'est « ${q.answer} » !` };
      }
      return q.answer === 'oui'
        ? { parts: ['Si ! Dans', { word: q.word.text }, ', on entend bien le son', { sound: q.ph }, '.'], caption: `Oui, on l'entend dans « ${q.word.text} »` }
        : { parts: ['Écoute bien : dans', { word: q.word.text }, ', on n\'entend pas le son', { sound: q.ph }, '.'], caption: `Le son « ${q.ph} » n'est pas dans « ${q.word.text} »` };
    }
    case 'read': {
      const syl = spokenSyllables(q.word.parsed).map(s => ({ word: s }));
      return { parts: ['Ce mot, c\'est', ...syl, '…', { word: q.word.text }, '! C\'est l\'image avec l\'étoile.'], caption: `Ce mot, c'est « ${q.word.text} »` };
    }
    default:
      return { parts: ['La phrase dit :', { say: q.sentence.text }, 'C\'est l\'image avec l\'étoile !'], caption: q.sentence.text };
  }
}

/**
 * @returns {Promise<{ outcome: 'ok'|'ko'|'help', confusion?: string }>}
 */
export async function runChoice(q, api) {
  const { voice, cur } = api;
  const { card, kind, hear, help } = setupPrompt(q, api);
  const grid = choiceGrid(q.options, { kind, onHear: hear ? o => { noteSupport(api, 'option-audio'); hear(o); } : null });
  api.stage.replaceChildren(card, grid.el);
  let helped = false;
  let reading = 0;   // jeton : « Réécouter » ou « Aide » arrêtent la lecture en cours

  async function speakPrompt() {
    const token = ++reading;
    // Le sous-titre de la question ne donne jamais la réponse (sinon on la copie au lieu d'écouter).
    await voice.seq(q.prompt, { caption: q.caption });
    if (q.kind === 'listen' && q.mode === 'initial') {
      for (const b of grid.buttons) {
        if (token !== reading || !api.alive() || grid.isDone()) return;
        b.classList.add('speaking');
        await voice.say(b.dataset.say, { interrupt: false, slowWord: true });
        b.classList.remove('speaking');
      }
    }
  }
  api.setReplay(() => { noteSupport(api, 'instruction-replay'); speakPrompt(); });
  api.setHelp(help ? () => {
    noteSupport(api, 'explicit-help');
    if (q.kind === 'read' || q.kind === 'sentence') noteSupport(api, 'text-audio');
    reading += 1; helped = true; help();
  } : null);
  speakPrompt();

  // api.skipped : « je ne sais pas » (test de positionnement) — jamais deviner au hasard.
  const chosen = await (api.skipped ? Promise.race([grid.chosen, api.skipped.then(() => null)]) : grid.chosen);
  api.setReplay(null);
  api.setHelp(null);
  voice.stop();
  lock(grid.buttons);
  grid.buttons.forEach(b => b.classList.remove('speaking'));
  if (!chosen) {
    api.feedback('', 'D\'accord !');
    await sleep(600);
    return { outcome: 'ko', skipped: true };
  }
  mark(grid.buttons, chosen.id, q.answer);
  const okBtn = grid.buttons.find(b => b.dataset.id === q.answer);
  if (api.quick) {   // positionnement : rythme rapide, aucune explication, aucun son d'erreur
    const right = chosen.id === q.answer;
    if (right) api.sfx.correct();
    api.feedback(right ? 'ok' : '', right ? praise(api.rand) : 'D\'accord !');
    await sleep(700);
    return { outcome: right ? 'ok' : 'ko' };
  }

  if (chosen.id === q.answer) {
    const result = { outcome: helped ? 'help' : 'ok' };
    api.onAnswer?.(result);   // enregistrée avant le bravo
    const text = praise(api.rand);
    cheer(api, okBtn, text);
    const parts = q.kind === 'read' ? [text, { word: q.word.text }]
      : q.kind === 'syllable' ? [text, { word: q.answer }] : [text];
    await Promise.race([voice.seq(parts), sleep(2200)]);
    return result;
  }
  const { parts, caption, confusion } = explain(q, chosen, cur);
  const result = { outcome: 'ko', confusion };
  api.onAnswer?.(result);     // enregistrée avant la correction
  await comfort(api, parts, caption);
  return result;
}

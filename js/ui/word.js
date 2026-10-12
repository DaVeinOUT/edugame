/* ============================================================
   UI/WORD.JS — Afficher un mot comme en classe
   Coloration syllabique (une couleur par syllabe, en alternance)
   et lettres muettes en gris : la pratique de nombreuses classes
   françaises pour les lecteurs débutants et dyslexiques.
   Le réglage « coloration syllabique » peut l'éteindre (body.no-syl).
   ============================================================ */

import { h } from './dom.js';

/**
 * @param {{ text: string, syllables: { graphemes: { g: string, mute: boolean }[] }[] }} parsed
 * @param {{ className?: string }} [opts]
 */
export function wordEl(parsed, { className = '' } = {}) {
  const el = h('span', { class: `word read ${className}`.trim(), lang: 'fr' });
  parsed.syllables.forEach((syl, i) => {
    const s = h('span', { class: i % 2 ? 'syl-b' : 'syl-a' });
    syl.graphemes.forEach(g => s.append(g.mute ? h('span', { class: 'mute' }, g.g) : g.g));
    el.append(s);
  });
  return el;
}

/**
 * Phrase : chaque mot est coloré séparément (l'alternance repart à chaque mot).
 * @param {{ words: object[] }} sentence
 */
export function sentenceEl(sentence, { className = '' } = {}) {
  const el = h('div', { class: `sentence read ${className}`.trim(), lang: 'fr' });
  sentence.words.forEach((p, i) => {
    const w = wordEl(p);
    if (i === 0) {
      // Majuscule en début de phrase, en gardant la coloration.
      const first = w.querySelector('.syl-a');
      if (first?.firstChild?.nodeType === 3) first.firstChild.textContent = first.firstChild.textContent.replace(/^./, c => c.toUpperCase());
    }
    if (i === sentence.words.length - 1) w.append(h('span', { class: 'punct' }, '.'));
    el.append(w);
  });
  return el;
}

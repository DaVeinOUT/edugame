import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayTime } from '../../js/services/play-time.js';
import { localDay } from '../../js/core/time.js';
import { newProfile } from '../../js/core/schema.js';

function session(start = new Date(2026, 9, 13, 12).getTime()) {
  let time = start;
  const profiles = new Map([['first', { ...newProfile(), id: 'first' }], ['other', { ...newProfile(), id: 'other' }]]);
  const view = new EventTarget();
  const doc = new EventTarget();
  doc.defaultView = new EventTarget();
  doc.visibilityState = 'visible';
  let scheduled;
  let cancelled = false;
  let flushes = 0;
  const ctx = { store: {
    updateProfile(id, fn) { const next = fn(profiles.get(id)); profiles.set(id, next); return next; },
    flush() { flushes++; },
  } };
  const play = createPlayTime({ view, ctx, profileId: 'first', document: doc, now: () => time,
    schedule(fn) { scheduled = fn; return 42; }, cancel(id) { assert.equal(id, 42); cancelled = true; } });
  return { play, profiles, view, doc, ctx, start,
    at(ms) { time = start + ms; }, tick() { scheduled(); },
    get cancelled() { return cancelled; }, get flushes() { return flushes; },
  };
}

test('sortie après zéro réponse : temps enregistré une fois, sans séance ni réponse inventée', () => {
  const s = session();
  s.at(1700);
  assert.equal(s.play.finish(), 1);
  assert.equal(s.play.finish(), 0);
  s.at(10000);
  s.tick();
  assert.equal(s.profiles.get('first').stats.seconds, 1);
  assert.equal(s.profiles.get('first').stats.answers, 0);
  assert.equal(s.profiles.get('first').stats.sessions, 0);
  assert.equal(s.cancelled, true);
});

test('pagehide sauvegarde le temps même sans événement de visibilité', () => {
  const s = session();
  s.at(2300);
  s.doc.defaultView.dispatchEvent(new Event('pagehide'));
  assert.equal(s.profiles.get('first').stats.seconds, 2);
  s.at(10000);
  s.play.finish();
  assert.equal(s.profiles.get('first').stats.seconds, 2);
});

test('les relevés périodiques accumulent les fractions sans doubler le temps', () => {
  const s = session();
  s.at(600); s.tick();
  s.at(1200); s.tick();
  s.at(1800); s.tick();
  s.at(2400); s.tick();
  s.play.finish();
  assert.equal(s.profiles.get('first').stats.seconds, 2);
  assert.equal(s.flushes, 2);
});

test('les relevés seuls ne font pas jouer une tablette posée plus d’une minute', () => {
  const s = session();
  for (let ms = 5000; ms <= 180000; ms += 5000) { s.at(ms); s.tick(); }
  assert.equal(s.profiles.get('first').stats.seconds, 60);
  s.view.dispatchEvent(new Event('pointerdown'));
  s.at(185000);
  s.play.finish();
  assert.equal(s.profiles.get('first').stats.seconds, 65);
});

test('l’arrière-plan ne compte pas et le retour reprend le temps actif', () => {
  const s = session();
  s.at(12500);
  s.doc.visibilityState = 'hidden';
  s.doc.dispatchEvent(new Event('visibilitychange'));
  s.at(3600000); s.tick();
  assert.equal(s.profiles.get('first').stats.seconds, 12);
  s.doc.visibilityState = 'visible';
  s.doc.dispatchEvent(new Event('visibilitychange'));
  s.at(3607500);
  s.play.finish();
  assert.equal(s.profiles.get('first').stats.seconds, 20);
});

test('minuit répartit le temps entre les deux jours locaux', () => {
  const start = new Date(2026, 9, 13, 23, 59, 50).getTime();
  const s = session(start);
  s.at(25000);
  s.play.finish();
  const stats = s.profiles.get('first').stats;
  assert.deepEqual(stats.days, { [localDay(start)]: 10, [localDay(start + 25000)]: 15 });
  assert.equal(stats.seconds, 25);
});

test('le profil de départ reste destinataire même si l’actif change', () => {
  const s = session();
  s.ctx.profile = () => s.profiles.get('other');
  s.at(12000);
  s.play.finish();
  assert.equal(s.profiles.get('first').stats.seconds, 12);
  assert.equal(s.profiles.get('other').stats.seconds, 0);
});

test('une horloge qui recule ne rejoue pas un intervalle déjà compté', () => {
  const s = session();
  s.at(10000); s.tick();
  s.at(5000); s.tick();
  s.view.dispatchEvent(new Event('keydown'));
  s.at(15000);
  s.play.finish();
  assert.equal(s.profiles.get('first').stats.seconds, 15);
});

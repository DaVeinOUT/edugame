import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPin, checkPin, isPin } from '../../js/core/pin.js';

test('le code de l\'espace des grands : jamais en clair, vérifié par son empreinte', async () => {
  const saved = await hashPin('2580');
  assert.notEqual(saved.hash, '2580');
  assert.ok(!JSON.stringify(saved).includes('2580'), 'le code n\'apparaît pas dans ce qui est enregistré');
  assert.equal(await checkPin('2580', saved), true);
  assert.equal(await checkPin('2581', saved), false);
  assert.equal(await checkPin('2580', null), false);
  const other = await hashPin('2580');
  assert.notEqual(other.hash, saved.hash, 'deux tablettes, deux sels : deux empreintes différentes');
});

test('un code fait exactement 4 chiffres', () => {
  assert.equal(isPin('0042'), true);
  for (const bad of ['123', '12345', 'abcd', '12 4', '']) assert.equal(isPin(bad), false, bad);
});

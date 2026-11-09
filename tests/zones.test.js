import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZONES, isZoneUnlocked, afterChapterComplete, unlockedZones } from '../js/3d/zones.js';

describe('zones', () => {
  it('5 zones ordonnées', () => {
    assert.equal(ZONES.length, 5);
    assert.deepEqual(ZONES.map((z) => z.num), [1, 2, 3, 4, 5]);
  });

  it('seule z1 ouverte au départ', () => {
    const save = { completed: {}, zones: { z1: true } };
    assert.equal(isZoneUnlocked(save, 'z1'), true);
    assert.equal(isZoneUnlocked(save, 'z2'), false);
    assert.equal(unlockedZones(save).length, 1);
  });

  it('terminer ch1 débloque z2', () => {
    let save = { completed: { ch1: true }, zones: { z1: true } };
    save = afterChapterComplete(save, 'ch1');
    assert.equal(isZoneUnlocked(save, 'z2'), true);
    assert.equal(isZoneUnlocked(save, 'z3'), false);
  });

  it('chaîne jusqu’à z4 après ch1–ch3', () => {
    let save = { completed: {}, zones: { z1: true } };
    for (const id of ['ch1', 'ch2', 'ch3']) {
      save = { ...save, completed: { ...save.completed, [id]: true } };
      save = afterChapterComplete(save, id);
    }
    assert.equal(isZoneUnlocked(save, 'z4'), true);
    assert.ok(unlockedZones(save).some((z) => z.id === 'z4'));
  });
});

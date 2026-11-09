import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSave,
  loadSave,
  writeSave,
  markChapterDone,
  markProofDone,
  progressSummary,
  migrateSave,
  SAVE_KEY,
  SAVE_VERSION,
} from '../js/save.js';
import { isZoneUnlocked } from '../js/3d/zones.js';

function memStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

describe('save', () => {
  it('defaultSave versionné v2 avec z1', () => {
    const s = defaultSave();
    assert.equal(s.v, SAVE_VERSION);
    assert.equal(s.chapter, 1);
    assert.equal(s.zones.z1, true);
  });

  it('écriture et lecture', () => {
    const storage = memStorage();
    let save = defaultSave();
    save = markChapterDone(save, 'ch1');
    const w = writeSave(save, storage);
    assert.equal(w.ok, true);
    const { save: loaded } = loadSave(storage);
    assert.equal(loaded.completed.ch1, true);
    assert.ok(loaded.badges.includes('ch-ch1'));
    assert.equal(isZoneUnlocked(loaded, 'z2'), true);
  });

  it('badge logicienne après 6 preuves', () => {
    let save = defaultSave();
    for (const id of ['p208', 'p202', 'p201', 'p205', 'p206', 'p285']) {
      save = markProofDone(save, id);
    }
    assert.ok(save.badges.includes('logicienne'));
    assert.equal(progressSummary(save).proofsDone, 6);
    assert.equal(save.completed.ch4, true);
  });

  it('JSON corrompu → mémoire sûre', () => {
    const storage = memStorage();
    storage.setItem(SAVE_KEY, '{nope');
    const { save, mode } = loadSave(storage);
    assert.equal(save.chapter, 1);
    assert.equal(mode, 'memory');
  });

  it('migre v1 → v2 et débloque les zones', () => {
    const v1 = {
      v: 1,
      chapter: 3,
      completed: { ch1: true, ch2: true },
      proofs: { p208: true },
      badges: ['ch-ch1', 'ch-ch2', 'proof-p208'],
      helpUsed: {},
      settings: {},
      updatedAt: 1,
    };
    const m = migrateSave(v1);
    assert.equal(m.v, 2);
    assert.equal(isZoneUnlocked(m, 'z1'), true);
    assert.equal(isZoneUnlocked(m, 'z2'), true);
    assert.equal(isZoneUnlocked(m, 'z3'), true);
    assert.equal(isZoneUnlocked(m, 'z4'), false);
    assert.equal(m.proofs.p208, true);
  });
});

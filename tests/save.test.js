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
} from '../js/save.js';

function memStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

describe('save', () => {
  it('defaultSave versionné', () => {
    const s = defaultSave();
    assert.equal(s.v, 1);
    assert.equal(s.chapter, 1);
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
  });

  it('badge logicienne après 6 preuves', () => {
    let save = defaultSave();
    for (const id of ['p208', 'p202', 'p201', 'p205', 'p206', 'p285']) {
      save = markProofDone(save, id);
    }
    assert.ok(save.badges.includes('logicienne'));
    assert.equal(progressSummary(save).proofsDone, 6);
  });

  it('JSON corrompu → mémoire sûre', () => {
    const storage = memStorage();
    storage.setItem(SAVE_KEY, '{nope');
    const { save, mode } = loadSave(storage);
    assert.equal(save.chapter, 1);
    assert.equal(mode, 'memory');
  });

  it('conserve la progression d’une sauvegarde v2 (ère 3D)', () => {
    const v2 = {
      v: 2,
      chapter: 3,
      completed: { ch1: true, ch2: true },
      proofs: { p208: true },
      badges: ['ch-ch1', 'ch-ch2', 'proof-p208'],
      helpUsed: {},
      settings: { reduceMotion: true },
      zones: { z1: true, z2: true, z3: true },
      pos: { x: 1, z: 2 },
      updatedAt: 1,
    };
    const m = migrateSave(v2);
    assert.equal(m.v, 1);
    assert.equal(m.completed.ch1, true);
    assert.equal(m.completed.ch2, true);
    assert.equal(m.proofs.p208, true);
    assert.ok(m.badges.includes('proof-p208'));
    assert.equal(m.settings.reduceMotion, true);
    assert.equal(m.zones, undefined);

    const storage = memStorage();
    storage.setItem(SAVE_KEY, JSON.stringify(v2));
    const { save } = loadSave(storage);
    assert.equal(save.completed.ch2, true);
    assert.equal(save.proofs.p208, true);
  });
});

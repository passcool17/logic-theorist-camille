import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSave,
  loadSave,
  writeSave,
  markChapterDone,
  markProofDone,
  progressSummary,
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
});

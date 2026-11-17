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

describe('save v9 (réglages son / animations / mode)', () => {
  it('une vieille sauvegarde v1 (avant v9) se charge et reçoit les nouveaux réglages', () => {
    const old = {
      v: 1,
      chapter: 4,
      completed: { ch1: true, ch2: true, ch3: true },
      proofs: { p208: true, p202: true },
      badges: ['ch-ch1', 'ch-ch2', 'ch-ch3', 'proof-p208', 'proof-p202'],
      helpUsed: {},
      settings: { reduceMotion: true },
      updatedAt: 1731700000000,
    };
    const storage = memStorage();
    storage.setItem(SAVE_KEY, JSON.stringify(old));
    const { save } = loadSave(storage);
    assert.equal(save.chapter, 4);
    assert.equal(save.proofs.p202, true);
    assert.equal(save.completed.ch3, true);
    assert.deepEqual(save.badges, old.badges);
    assert.equal(save.settings.reduceMotion, true);
    assert.equal(save.settings.muted, false);
    assert.equal(save.settings.music, 0.5);
    assert.equal(save.settings.sfx, 0.8);
    assert.equal(save.settings.proofMode, 'guided');
    // Réécriture : même clé, même forme v1.
    writeSave(save, storage);
    const raw = JSON.parse(storage.getItem(SAVE_KEY));
    assert.equal(raw.v, 1);
    assert.equal(raw.proofs.p208, true);
  });

  it('les réglages (muet, volumes) survivent à un rechargement', () => {
    const storage = memStorage();
    let save = defaultSave();
    save = { ...save, settings: { ...save.settings, muted: true, music: 0.2, sfx: 0, proofMode: 'free' } };
    writeSave(save, storage);
    const { save: back } = loadSave(storage);
    assert.equal(back.settings.muted, true);
    assert.equal(back.settings.music, 0.2);
    assert.equal(back.settings.sfx, 0);
    assert.equal(back.settings.proofMode, 'free');
  });

  it('nettoie des réglages abîmés', () => {
    const m = migrateSave({ v: 1, settings: { muted: 'yes', music: 7, sfx: -1, proofMode: 'zzz' } });
    assert.equal(m.settings.muted, false);
    assert.equal(m.settings.music, 1);
    assert.equal(m.settings.sfx, 0);
    assert.equal(m.settings.proofMode, 'guided');
  });

  it('badges bonus : chaque théorème, mode libre, et les 6 nouveaux', async () => {
    const { BONUS_PROOFS, PROOFS } = await import('../js/logic/proofs.js');
    const { CORE_IDS, BONUS_IDS, markFreeSolve } = await import('../js/save.js');
    assert.deepEqual(CORE_IDS, PROOFS.map((p) => p.id));
    assert.deepEqual(BONUS_IDS, BONUS_PROOFS.map((p) => p.id));
    let save = defaultSave();
    save = markFreeSolve(save);
    assert.ok(save.badges.includes('libre'));
    for (const id of BONUS_IDS) save = markProofDone(save, id);
    assert.ok(save.badges.includes('chercheuse'));
    assert.ok(!save.badges.includes('logicienne'), 'logicienne reste pour les 6 preuves de LT');
  });
});

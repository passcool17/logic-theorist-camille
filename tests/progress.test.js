import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROOFS } from '../js/logic/proofs.js';
import { defaultSave, markChapterDone, markProofDone, progressSummary } from '../js/save.js';

describe('progression', () => {
  it('5 chapitres + 6 preuves = carnet complet', () => {
    let save = defaultSave();
    for (let n = 1; n <= 5; n++) save = markChapterDone(save, `ch${n}`);
    for (const p of PROOFS) save = markProofDone(save, p.id);
    const sum = progressSummary(save);
    assert.equal(sum.chaptersDone, 5);
    assert.equal(sum.proofsDone, 6);
    assert.ok(sum.badges >= 6);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROOFS, allProofsSound, checkProof } from '../js/logic/proofs.js';
import { pretty } from '../js/logic/formula.js';

describe('proofs', () => {
  it('contient 6 preuves', () => {
    assert.equal(PROOFS.length, 6);
  });

  it('chaque preuve est résoluble (solution acceptée)', () => {
    const report = allProofsSound();
    for (const r of report) {
      assert.equal(r.ok, true, `${r.code}: ${r.error}`);
    }
  });

  it('une mauvaise preuve est rejetée', () => {
    const p = PROOFS[0];
    const bad = checkProof(p.initials, [], p.goal);
    assert.equal(bad.ok, false);
  });

  it('pretty du but *2.08', () => {
    assert.equal(pretty(PROOFS[0].goal), 'p ⊃ p');
  });
});

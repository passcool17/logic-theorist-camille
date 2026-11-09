import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { makeArena, placeTile, canPlaceTile } from '../js/3d/tiles.js';
import { PROOFS } from '../js/logic/proofs.js';

describe('tiles pedestal', () => {
  it('refuse une mauvaise tuile sans avancer', () => {
    const proof = PROOFS[0]; // p208: substitution puis chain
    let arena = makeArena(proof);
    const bad = placeTile(arena, 'detachment');
    assert.equal(bad.step, 0);
    assert.equal(bad.placed.length, 0);
    assert.match(bad.lastError, /Modus ponens|Substitution|Raccourci/);
  });

  it('accepte la séquence solution et marque done', () => {
    const proof = PROOFS[0];
    let arena = makeArena(proof);
    for (const step of proof.solution) {
      assert.equal(canPlaceTile(arena, step.rule).ok, true);
      arena = placeTile(arena, step.rule);
      assert.equal(arena.lastError, null);
    }
    assert.equal(arena.done, true);
    assert.equal(arena.step, proof.solution.length);
    assert.deepEqual(arena.placed, proof.solution.map((s) => s.rule));
  });

  it('chaque preuve a une arène résoluble par ses tuiles', () => {
    for (const proof of PROOFS) {
      let arena = makeArena(proof);
      for (const step of proof.solution) {
        arena = placeTile(arena, step.rule);
        assert.equal(arena.lastError, null, proof.id);
      }
      assert.equal(arena.done, true, proof.id);
    }
  });
});

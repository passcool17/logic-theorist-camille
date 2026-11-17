import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_PROOFS, findProof, proofHeading, proofCardTitle } from '../js/logic/proofs.js';
import { BADGE_INFO } from '../js/chapters.js';

describe('libellé honnête du défi inspiré de *2.85 (QA v9 bug 1)', () => {
  const p = findProof('p285');
  it('le titre de la carte du ch.4 dit « inspiré de *2.85 »', () => {
    assert.match(proofCardTitle(p), /inspiré de \*2\.85/);
  });
  it('l’en-tête de l’arbre dit « inspiré de *2.85 », pas « Preuve *2.85 »', () => {
    assert.match(proofHeading(p), /inspiré de \*2\.85/);
    assert.doesNotMatch(proofHeading(p), /^Preuve/);
  });
  it('le badge dit « inspiré de *2.85 »', () => {
    assert.match(BADGE_INFO['proof-p285'].label, /inspiré de \*2\.85/);
  });
  it('les vraies preuves gardent « Preuve *x.xx » et leur titre', () => {
    for (const q of ALL_PROOFS.filter((x) => !x.inspiredBy)) {
      assert.equal(proofHeading(q), `Preuve ${q.code}`);
      assert.equal(proofCardTitle(q), q.title);
    }
  });
  it('chaque défi « inspiré » est marqué partout (aucune preuve n’a [défi…] sans inspiredBy)', () => {
    for (const q of ALL_PROOFS) {
      if (/inspiré/.test(q.goalDisplay || '')) assert.ok(q.inspiredBy, q.id);
    }
  });
});

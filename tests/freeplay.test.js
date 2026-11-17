import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_PROOFS, findProof } from '../js/logic/proofs.js';
import { pretty } from '../js/logic/formula.js';
import { initialLines, freeTry, goalReached, substChoices, SUBST_PALETTE } from '../js/proofplay.js';

/** Rejoue la solution en mode libre, comme Camille le ferait avec les boutons. */
function solveFree(proof) {
  let lines = initialLines(proof);
  let last = null;
  for (const step of proof.solution) {
    const subst = {};
    for (const [k, f] of Object.entries(step.subst || {})) subst[k] = pretty(f);
    last = freeTry(proof, lines, { rule: step.rule, picks: step.from, subst });
    assert.ok(last.kind === 'step' || last.kind === 'done', `${proof.code}: ${last.message}`);
    lines = [...lines, last.line];
  }
  return { lines, last };
}

describe('mode libre', () => {
  for (const p of ALL_PROOFS) {
    it(`${p.code} se résout à la main`, () => {
      const { lines, last } = solveFree(p);
      assert.equal(last.kind, 'done');
      assert.ok(goalReached(p, lines));
    });
  }

  it('le choix des remplacements utilise la palette p q r ¬p ¬q ¬r', () => {
    assert.deepEqual(SUBST_PALETTE, ['p', 'q', 'r', '¬p', '¬q', '¬r']);
    const p = findProof('p207');
    assert.deepEqual(substChoices(initialLines(p)[0].formula), ['q', 'p']);
  });

  it('refuse gentiment un mauvais nombre de lignes', () => {
    const p = findProof('p208');
    const lines = initialLines(p);
    assert.equal(freeTry(p, lines, { rule: 'detachment', picks: [0] }).kind, 'need');
    assert.equal(freeTry(p, lines, { rule: 'substitution', picks: [] }).kind, 'need');
    assert.equal(freeTry(p, lines, { rule: 'chain', picks: [0, 1, 1] }).kind, 'need');
    assert.equal(freeTry(p, lines, { rule: null, picks: [0] }).kind, 'need');
  });

  it('un Modus ponens impossible est un essai raté (avec un message pour Camille)', () => {
    const p = findProof('p208');
    const lines = initialLines(p);
    const r = freeTry(p, lines, { rule: 'detachment', picks: [0, 1] });
    assert.equal(r.kind, 'reject');
    assert.equal(r.reject.rule, 'detachment');
    assert.equal(r.reject.at, 0);
    assert.match(r.message, /emboîtent/);
  });

  it('un Raccourci impossible est un essai raté', () => {
    const p = findProof('p208');
    const r = freeTry(p, initialLines(p), { rule: 'chain', picks: [0, 1] });
    assert.equal(r.kind, 'reject');
  });

  it('une substitution qui ne change rien demande un remplacement', () => {
    const p = findProof('p207');
    const r = freeTry(p, initialLines(p), { rule: 'substitution', picks: [0], subst: {} });
    assert.equal(r.kind, 'need');
    const r2 = freeTry(p, initialLines(p), { rule: 'substitution', picks: [0], subst: { p: 'p' } });
    assert.equal(r2.kind, 'need');
  });

  it('une ligne déjà là n’est pas recopiée', () => {
    const p = findProof('p207');
    let lines = initialLines(p);
    const a = freeTry(p, lines, { rule: 'substitution', picks: [0], subst: { q: 'r' } });
    assert.equal(a.kind, 'step');
    lines = [...lines, a.line];
    const b = freeTry(p, lines, { rule: 'substitution', picks: [0], subst: { q: 'r' } });
    assert.equal(b.kind, 'dup');
    assert.equal(b.index, 1);
  });

  it('refuse une variable ou un remplacement hors palette', () => {
    const p = findProof('p207');
    const r = freeTry(p, initialLines(p), { rule: 'substitution', picks: [0], subst: { q: 'p>q' } });
    assert.equal(r.kind, 'need');
  });

  it('limite le nombre de lignes pour garder l’arbre lisible', () => {
    const p = findProof('p207');
    let lines = initialLines(p);
    const opts = ['p', 'r', '¬p', '¬q', '¬r', 'q'];
    let full = null;
    for (const q of opts) {
      for (const pp of opts) {
        const r = freeTry(p, lines, { rule: 'substitution', picks: [0], subst: { q, p: pp } });
        if (r.kind === 'full') { full = r; break; }
        if (r.kind === 'step') lines = [...lines, r.line];
        if (r.kind === 'done') { lines = [...lines, r.line]; }
      }
      if (full) break;
    }
    assert.ok(full, 'limite atteinte');
  });
});

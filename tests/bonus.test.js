import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROOFS, BONUS_PROOFS, ALL_PROOFS, findProof, checkProof } from '../js/logic/proofs.js';
import { pretty, parse, eq } from '../js/logic/formula.js';

/** Table de vérité : vrai pour toutes les valeurs des variables ? (⊃ = ¬a ∨ b) */
function evalF(f, env) {
  switch (f.type) {
    case 'var': return env[f.name];
    case 'not': return !evalF(f.arg, env);
    case 'or': return evalF(f.left, env) || evalF(f.right, env);
    case 'imp': return !evalF(f.left, env) || evalF(f.right, env);
    default: throw new Error(f.type);
  }
}
function vars(f, out = new Set()) {
  if (f.type === 'var') out.add(f.name);
  else if (f.type === 'not') vars(f.arg, out);
  else { vars(f.left, out); vars(f.right, out); }
  return out;
}
function tautology(f) {
  const vs = [...vars(f)];
  for (let m = 0; m < 1 << vs.length; m++) {
    const env = {};
    vs.forEach((v, i) => (env[v] = !!(m & (1 << i))));
    if (!evalF(f, env)) return false;
  }
  return true;
}

// Énoncés vérifiés sur Metamath (set.mm, réf. [WhiteheadRussell]) le 2026-11-16.
const EXPECTED = {
  p207: { code: '*2.07', goal: 'p>(p|p)' },
  p22: { code: '*2.2', goal: 'p>(p|q)' },
  p221: { code: '*2.21', goal: '~p>(~p|q)' }, // ¬p ⊃ (p ⊃ q)
  p203: { code: '*2.03', goal: '(~p|~q)>(~q|~p)' }, // (p ⊃ ¬q) ⊃ (q ⊃ ¬p)
  p204: { code: '*2.04', goal: '(~p|(~q|r))>(~q|(~p|r))' }, // [p ⊃ (q ⊃ r)] ⊃ [q ⊃ (p ⊃ r)]
  p211: { code: '*2.11', goal: 'p|~p' },
};

describe('nouveaux théorèmes *2 (mode libre)', () => {
  it('il y a 6 bonus, tous différents des 6 preuves de base', () => {
    assert.equal(BONUS_PROOFS.length, 6);
    const ids = new Set(PROOFS.map((p) => p.id));
    for (const p of BONUS_PROOFS) assert.ok(!ids.has(p.id), p.id);
    assert.equal(ALL_PROOFS.length, 12);
  });

  for (const [id, exp] of Object.entries(EXPECTED)) {
    it(`${exp.code} : énoncé exact et preuve acceptée par checkProof`, () => {
      const p = findProof(id);
      assert.ok(p, id);
      assert.equal(p.code, exp.code);
      assert.ok(eq(p.goal, parse(exp.goal)), `${pretty(p.goal)} ≠ ${exp.goal}`);
      const r = checkProof(p.initials, p.solution, p.goal);
      assert.equal(r.ok, true, r.error);
      assert.ok(p.kid && p.kid.length > 20, 'explication pour Camille');
      assert.ok(p.goalDisplay, 'affichage ⊃');
      assert.equal(p.hints.length >= 1, true);
      assert.equal(p.initialNotes.length, p.initials.length);
    });
  }

  it('chaque but et chaque ligne de départ (12 preuves) est une vraie tautologie', () => {
    for (const p of ALL_PROOFS) {
      assert.ok(tautology(p.goal), `${p.code} but : ${pretty(p.goal)}`);
      p.initials.forEach((f, i) => assert.ok(tautology(f), `${p.code} ligne ${i} : ${pretty(f)}`));
    }
  });
});

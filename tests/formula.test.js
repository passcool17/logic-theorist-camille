import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, pretty, eq, substitute, v, not, or, imp, freeVars } from '../js/logic/formula.js';

describe('formula', () => {
  it('parse et pretty variables et connecteurs', () => {
    assert.equal(pretty(parse('p')), 'p');
    assert.equal(pretty(parse('~p')), '¬p');
    assert.equal(pretty(parse('p|q')), 'p ∨ q');
    assert.equal(pretty(parse('p>q')), 'p ⊃ q');
    assert.equal(pretty(parse('(p|q)>r')), '(p ∨ q) ⊃ r');
  });

  it('égalité structurelle', () => {
    assert.ok(eq(parse('p>q'), imp(v('p'), v('q'))));
    assert.ok(!eq(parse('p>q'), parse('q>p')));
  });

  it('substitution', () => {
    const f = parse('p|q');
    const g = substitute(f, { p: parse('~r') });
    assert.ok(eq(g, parse('~r|q')));
  });

  it('priorité ¬ > ∨ > ⊃', () => {
    assert.ok(eq(parse('~p|q'), or(not(v('p')), v('q'))));
    assert.ok(eq(parse('p>q>r'), imp(v('p'), imp(v('q'), v('r')))));
  });

  it('freeVars', () => {
    assert.deepEqual(freeVars(parse('(p|q)>~p')), ['p', 'q']);
  });
});

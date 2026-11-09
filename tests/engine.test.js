import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, eq, pretty } from '../js/logic/formula.js';
import { detachment, chainForward, tryRule, applySubstitution } from '../js/logic/engine.js';

describe('engine', () => {
  it('substitution renomme', () => {
    const r = applySubstitution(parse('(p|p)>p'), { p: parse('q') });
    assert.ok(eq(r, parse('(q|q)>q')));
  });

  it('détachement (modus ponens)', () => {
    const a = parse('p');
    const aImpB = parse('p>q');
    const b = detachment(a, aImpB);
    assert.ok(eq(b, parse('q')));
    assert.equal(detachment(parse('r'), aImpB), null);
  });

  it('chaînage avant', () => {
    const r = chainForward(parse('p>q'), parse('q>r'));
    assert.ok(eq(r, parse('p>r')));
    assert.equal(chainForward(parse('p>q'), parse('r>s')), null);
  });

  it('tryRule accepte l’ordre inverse des prémisses', () => {
    const d = tryRule('detachment', [parse('p>q'), parse('p')]);
    assert.ok(d.ok && eq(d.result, parse('q')));
    const c = tryRule('chain', [parse('q>r'), parse('p>q')]);
    assert.ok(c.ok && eq(c.result, parse('p>r')));
  });

  it('tryRule signale les erreurs', () => {
    const bad = tryRule('detachment', [parse('p'), parse('q>r')]);
    assert.equal(bad.ok, false);
  });
});

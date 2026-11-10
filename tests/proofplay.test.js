import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROOFS } from '../js/logic/proofs.js';
import { initialLines, guidedTry, buildTree, ch4StepProgress, goalReached } from '../js/proofplay.js';

const p208 = PROOFS.find((p) => p.id === 'p208');

function flat(node, out = []) {
  out.push(node);
  node.children.forEach((c) => flat(c, out));
  return out;
}

describe('mode guidé et arbre', () => {
  it('un mauvais essai devient un nœud gris ✕ sans ajouter de ligne', () => {
    const lines = initialLines(p208);
    const r = guidedTry(p208, lines, 0, 'detachment');
    assert.equal(r.kind, 'reject');
    assert.equal(lines.length, 2);
    const tree = buildTree(p208, lines, [r.reject]);
    assert.equal(tree.root.kind, 'pending');
    assert.deepEqual(flat(tree.root).filter((n) => n.kind === 'reject').map((n) => n.label), ['Modus ponens']);
  });

  it('la bonne suite atteint le but ; les ✕ restent sous leur étape', () => {
    let lines = initialLines(p208);
    const rejects = [];
    rejects.push(guidedTry(p208, lines, 0, 'chain').reject);
    let r = guidedTry(p208, lines, 0, 'substitution');
    assert.equal(r.kind, 'step');
    lines = [...lines, r.line];
    rejects.push(guidedTry(p208, lines, 1, 'substitution').reject);
    r = guidedTry(p208, lines, 1, 'chain');
    lines = [...lines, r.line];
    assert.ok(goalReached(p208, lines));
    const tree = buildTree(p208, lines, rejects);
    assert.ok(tree.solved);
    assert.equal(tree.root.label, 'p ⊃ p');
    const nodes = flat(tree.root);
    assert.equal(nodes.filter((n) => n.kind === 'reject').length, 2);
    assert.equal(nodes.filter((n) => n.kind !== 'reject').length, 4); // 2 axiomes + 2 étapes
  });

  it('compte les étapes du chapitre 4', () => {
    const all = ch4StepProgress(PROOFS, {}, null);
    assert.equal(all.done, 0);
    assert.equal(all.total, PROOFS.reduce((s, p) => s + p.solution.length, 0));
    const mid = ch4StepProgress(PROOFS, { p202: true }, { id: 'p208', step: 1 });
    assert.equal(mid.done, 2);
  });
});

describe('découpage des formules de l’arbre', async () => {
  const { breakLines } = await import('../js/ui/treeview.js');
  it('coupe au connecteur principal et garde les courtes intactes', () => {
    assert.deepEqual(breakLines('p ⊃ p', 9), ['p ⊃ p']);
    assert.deepEqual(breakLines('q ⊃ (p ∨ q)', 9), ['q ⊃', '(p ∨ q)']);
  });
  it('ne perd aucun caractère sur une longue formule', () => {
    const f = '((q ⊃ r) ⊃ ((p ⊃ q) ⊃ (p ⊃ r))) ⊃ ((p ⊃ q) ⊃ ((q ⊃ r) ⊃ (p ⊃ r)))';
    const lines = breakLines(f, 9);
    assert.ok(lines.length > 2);
    assert.equal(lines.join(' ').replace(/\s+/g, ''), f.replace(/\s+/g, ''));
  });
});

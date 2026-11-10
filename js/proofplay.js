/**
 * Mode guidé du chapitre 4, en fonctions pures (testables sans DOM).
 * La règle du jeu ne change pas : la tuile doit correspondre à l’étape
 * suivante de la solution. Un mauvais essai est simplement noté (gris ✕),
 * en montrant ce que le moteur obtient avec cette règle.
 */

import { tryRule, RULE_LABELS } from './logic/engine.js';
import { eq, pretty } from './logic/formula.js';

/** Lignes de départ d’une preuve. */
export function initialLines(proof) {
  return proof.initials.map((f, i) => ({
    formula: f,
    rule: 'donné',
    note: proof.initialNotes[i] || '',
    from: [],
  }));
}

export function goalReached(proof, lines) {
  return lines.some((l) => eq(l.formula, proof.goal));
}

/**
 * Applique une tuile.
 * @returns {{ kind: 'done'|'end'|'step'|'reject'|'error', line?, reject?, message }}
 */
export function guidedTry(proof, lines, stepIndex, rule) {
  if (goalReached(proof, lines)) return { kind: 'done', message: 'But déjà atteint.' };
  const step = proof.solution[stepIndex];
  if (!step) return { kind: 'end', message: 'Plus d’étape prévue.' };
  const premises = step.from.map((i) => lines[i].formula);
  if (step.rule !== rule) {
    // Ce que donne la mauvaise règle sur les mêmes lignes, d’après le moteur.
    const attempt = tryRule(rule, premises, step.subst || {});
    let label = RULE_LABELS[rule] || rule;
    if (attempt.ok && !premises.some((p) => eq(p, attempt.result))) label = pretty(attempt.result);
    return {
      kind: 'reject',
      reject: { label, rule, at: stepIndex },
      message: `Essaie plutôt « ${RULE_LABELS[step.rule]} » pour cette étape.`,
    };
  }
  const outcome = tryRule(rule, premises, step.subst || {});
  if (!outcome.ok) return { kind: 'error', message: outcome.error };
  return {
    kind: 'step',
    line: { formula: outcome.result, rule, note: step.note || '', from: [...step.from] },
    message: step.note || `Bien joué : ${RULE_LABELS[rule]}.`,
  };
}

/** Nombre total d’étapes du chapitre 4 et nombre déjà faites. */
export function ch4StepProgress(proofs, saveProofs, current) {
  let total = 0;
  let done = 0;
  for (const p of proofs) {
    total += p.solution.length;
    if (saveProofs[p.id]) done += p.solution.length;
    else if (current && current.id === p.id) done += Math.min(current.step, p.solution.length);
  }
  return { done, total };
}

/**
 * Modèle d’arbre affiché : cible en haut, puis la ligne qui atteint le but
 * (ou un nœud « ? » en attente), puis les prémisses. Les essais rejetés
 * pendent sous l’étape où ils ont été tentés, en gris.
 * Nœud : { key, kind: 'ok'|'given'|'pending'|'reject', label, children[] }
 */
export function buildTree(proof, lines, rejects = [], maxRejects = 3) {
  const nInit = proof.initials.length;
  const used = new Set();
  lines.forEach((l) => (l.from || []).forEach((i) => used.add(i)));
  const shown = rejects.slice(-maxRejects);
  const rejectsAt = (stepIdx) =>
    shown
      .filter((r) => r.at === stepIdx)
      .map((r, k) => ({ key: `R${stepIdx}-${k}-${r.rule}`, kind: 'reject', label: r.label, rule: r.rule, children: [] }));

  const seen = new Set();
  const lineNode = (i) => {
    seen.add(i);
    const l = lines[i];
    const derived = i >= nInit;
    const kids = (l.from || []).filter((j) => !seen.has(j)).map(lineNode);
    if (derived) kids.push(...rejectsAt(i - nInit));
    return {
      key: `L${i}`,
      kind: derived ? 'ok' : 'given',
      label: pretty(l.formula),
      index: i,
      children: kids,
    };
  };

  const hit = lines.findIndex((l) => eq(l.formula, proof.goal));
  let root;
  if (hit >= 0) {
    root = lineNode(hit);
  } else {
    const frontier = lines.map((_, i) => i).filter((i) => !used.has(i));
    const stepIdx = lines.length - nInit;
    root = {
      key: 'pending',
      kind: 'pending',
      label: '?',
      children: [...frontier.map(lineNode), ...rejectsAt(stepIdx)],
    };
  }
  // Lignes hors de l’arbre principal (rares) : on les garde visibles.
  const extra = lines.map((_, i) => i).filter((i) => !seen.has(i)).map(lineNode);
  root.children.push(...extra);
  return { goal: proof.goalDisplay || pretty(proof.goal), solved: hit >= 0, root };
}

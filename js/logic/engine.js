/**
 * Petit moteur LT-inspiré : substitution, détachement (modus ponens), chaînage.
 * Écrit maison — aucune copie des dépôts sans licence.
 */

import { eq, substitute, imp, pretty } from './formula.js';

/**
 * Applique une substitution à une formule connue (axiome / théorème).
 * @param {object} formula
 * @param {Record<string, object>} map
 */
export function applySubstitution(formula, map) {
  return substitute(formula, map);
}

/**
 * Modus ponens / détachement : de A et A⊃B infère B.
 * Retourne B ou null si inapplicable.
 */
export function detachment(a, aImpB) {
  if (aImpB.type !== 'imp') return null;
  if (!eq(aImpB.left, a)) return null;
  return aImpB.right;
}

/**
 * Chaînage avant (raccourci) : de A⊃B et B⊃C infère A⊃C.
 */
export function chainForward(aImpB, bImpC) {
  if (aImpB.type !== 'imp' || bImpC.type !== 'imp') return null;
  if (!eq(aImpB.right, bImpC.left)) return null;
  return imp(aImpB.left, bImpC.right);
}

/**
 * Chaînage arrière : de A⊃C cible, avec B⊃C connu, cherche A⊃B
 * (ici : construit A⊃B si on a A⊃C et B⊃C — utilisé pédagogiquement
 *  comme « raccourci » quand les deux prémisses d'implication s'emboîtent).
 * Pour le jeu, chainForward suffit ; on expose aussi tryRule.
 */

/**
 * Essaie une règle nommée sur une liste de prémisses.
 * @param {'substitution'|'detachment'|'chain'} rule
 * @param {object[]} premises
 * @param {Record<string, object>} [substMap]
 * @returns {{ ok: boolean, result?: object, error?: string }}
 */
export function tryRule(rule, premises, substMap = {}) {
  try {
    if (rule === 'substitution') {
      if (premises.length < 1) return { ok: false, error: 'Il faut une formule à substituer.' };
      const result = applySubstitution(premises[0], substMap);
      return { ok: true, result };
    }
    if (rule === 'detachment') {
      if (premises.length < 2) return { ok: false, error: 'Il faut A et A⊃B.' };
      // Accepte (A, A⊃B) ou (A⊃B, A)
      let result = detachment(premises[0], premises[1]);
      if (!result) result = detachment(premises[1], premises[0]);
      if (!result) return { ok: false, error: 'Le détachement ne s’applique pas ici.' };
      return { ok: true, result };
    }
    if (rule === 'chain') {
      if (premises.length < 2) return { ok: false, error: 'Il faut A⊃B et B⊃C.' };
      let result = chainForward(premises[0], premises[1]);
      if (!result) result = chainForward(premises[1], premises[0]);
      if (!result) return { ok: false, error: 'Le chaînage ne s’applique pas ici.' };
      return { ok: true, result };
    }
    return { ok: false, error: `Règle inconnue: ${rule}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Vérifie qu'une séquence d'étapes prouve le but.
 * Chaque étape : { rule, from: number[], subst?, note? }
 * lines[0..] = axiomes/prémices initiales ; on ajoute les résultats.
 */
export function checkProof(initialLines, steps, goal) {
  const lines = initialLines.map((f) => ({ formula: f, rule: 'donné' }));
  for (let s = 0; s < steps.length; s++) {
    const step = steps[s];
    const premises = (step.from || []).map((idx) => {
      if (idx < 0 || idx >= lines.length) throw new Error(`Étape ${s}: indice ${idx} invalide`);
      return lines[idx].formula;
    });
    const outcome = tryRule(step.rule, premises, step.subst || {});
    if (!outcome.ok) {
      return { ok: false, error: `Étape ${s + 1}: ${outcome.error}`, lines };
    }
    lines.push({ formula: outcome.result, rule: step.rule, from: step.from });
  }
  const last = lines[lines.length - 1];
  if (!last || !eq(last.formula, goal)) {
    return {
      ok: false,
      error: `Le dernier résultat (${last ? pretty(last.formula) : '∅'}) ≠ but (${pretty(goal)})`,
      lines,
    };
  }
  return { ok: true, lines };
}

export const RULE_LABELS = {
  substitution: 'Substitution',
  detachment: 'Modus ponens',
  chain: 'Raccourci',
};

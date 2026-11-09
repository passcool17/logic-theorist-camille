/**
 * Pose de tuiles sur le socle du chapitre 4 (logique pure, sans three).
 * Une tuile correcte avance l’étape ; une mauvaise est refusée sans pénalité.
 */

export const TILE_IDS = ['substitution', 'detachment', 'chain'];

export const TILE_LABELS = {
  substitution: 'Substitution',
  detachment: 'Modus ponens',
  chain: 'Raccourci',
};

/**
 * @param {{ step: number, solution: { rule: string }[], placed: string[] }} arena
 * @param {string} tileId
 */
export function canPlaceTile(arena, tileId) {
  if (!TILE_IDS.includes(tileId)) return { ok: false, reason: 'Tuile inconnue.' };
  const need = arena.solution[arena.step];
  if (!need) return { ok: false, reason: 'Preuve déjà complète.' };
  if (need.rule !== tileId) {
    return {
      ok: false,
      reason: `Essaie plutôt « ${TILE_LABELS[need.rule]} » pour cette étape.`,
    };
  }
  return { ok: true };
}

/**
 * Place la tuile si correcte. Retourne le nouvel état (copie).
 */
export function placeTile(arena, tileId) {
  const check = canPlaceTile(arena, tileId);
  if (!check.ok) return { ...arena, lastError: check.reason, lastPlaced: null };
  const placed = [...arena.placed, tileId];
  const step = arena.step + 1;
  const done = step >= arena.solution.length;
  return {
    ...arena,
    placed,
    step,
    done,
    lastError: null,
    lastPlaced: tileId,
  };
}

export function makeArena(proof) {
  return {
    proofId: proof.id,
    solution: proof.solution.map((s) => ({ rule: s.rule })),
    step: 0,
    placed: [],
    done: false,
    lastError: null,
    lastPlaced: null,
  };
}

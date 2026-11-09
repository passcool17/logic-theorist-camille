/**
 * Helpers caméra purs (testables) — trois-quarts stable, pas de plongée verticale.
 */

/** Pitch max depuis l’horizontale (rad) ≈ 27°. */
export const MAX_PITCH = 0.48;
/** Pitch marche campus ≈ 23°. */
export const WALK_PITCH = 0.32; // ~18°
/** Pitch cadrage preuve (un peu plus bas pour laisser l’arbre au-dessus du panneau). */
export const PROOF_PITCH = 0.30; // ~17°

/**
 * Offset caméra derrière la cible (yaw autour de Y, pitch depuis l’horizontale).
 * @returns {{ x:number, y:number, z:number, pitch:number }}
 */
export function followCamOffset({ dist, pitch, yaw, targetY = 1 }) {
  const p = Math.min(Math.max(Number(pitch) || 0, 0.12), MAX_PITCH);
  const d = Math.max(1, Number(dist) || 1);
  const height = targetY + Math.tan(p) * d;
  return {
    x: Math.sin(yaw) * d,
    y: height,
    z: Math.cos(yaw) * d,
    pitch: p,
  };
}

/** Hauteur de cadrage pour un arbre de `lineCount` nœuds (échelle proof-view). */
export function proofFocusY(lineCount = 2) {
  const n = Math.max(1, lineCount | 0);
  // Tronc agrandi : base 0.9 + n * 0.95 → centre ≈ moitié
  return Math.min(4.2, 1.1 + n * 0.55);
}

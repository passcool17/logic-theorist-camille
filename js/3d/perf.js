/**
 * Allègement automatique façon Vallée (DPR + ombres), pensé Samsung S20.
 */

const touch = typeof matchMedia === 'function'
  && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in globalThis);

export const IS_TOUCH = touch;

/** DPR plafonné : S20 ~3 → on cap à 2 (puis paliers adaptatifs). */
export const BASE_DPR = Math.min(
  (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1),
  touch ? 1.75 : 2,
);

const LEVELS = [
  { dpr: 2, shadows: true },
  { dpr: 1.5, shadows: true },
  { dpr: 1.25, shadows: true },
  { dpr: 1.25, shadows: false },
  { dpr: 1, shadows: false },
];

export function makePerf(renderer, sun) {
  const q = { level: touch ? 1 : 0, slow: 0, calm: 2, frames: 0, win: 0, fps: 60 };
  apply(q.level);

  function apply(level) {
    q.level = Math.max(0, Math.min(LEVELS.length - 1, level));
    const L = LEVELS[q.level];
    const dpr = Math.min(BASE_DPR, L.dpr);
    if (renderer.getPixelRatio() !== dpr) renderer.setPixelRatio(dpr);
    renderer.shadowMap.enabled = !!L.shadows;
    if (sun) sun.castShadow = !!L.shadows;
  }

  function tick(dt) {
    if (dt > 0.25) return;
    q.frames++;
    q.win += dt;
    if (q.win < 1) return;
    q.fps = q.frames / q.win;
    q.frames = 0;
    q.win = 0;
    if (q.calm > 0) { q.calm--; return; }
    q.slow = q.fps < 40 ? q.slow + 1 : 0;
    if (q.slow >= 4 && q.level < LEVELS.length - 1) {
      apply(q.level + 1);
      q.slow = 0;
      q.calm = 4;
    }
  }

  return {
    tick,
    quality: () => ({ ...q, dpr: renderer.getPixelRatio() }),
    setLevel: apply,
  };
}

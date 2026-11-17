/**
 * Petites animations (Web Animations API, transform/opacity seulement → 60 fps sur S20).
 * Tout passe par reduced() : réglage « Moins d’animations » OU préférence du système.
 * En mouvement réduit : durées quasi nulles, pas de secousse, pas d’étincelles.
 */

let userReduce = false;
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export function setUserReduce(on) {
  userReduce = !!on;
  syncRootClass();
}

export function reduced() {
  return userReduce || !!(mq && mq.matches);
}

function syncRootClass() {
  document.documentElement.classList.toggle('rm', reduced());
}
mq?.addEventListener?.('change', syncRootClass);

const EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';
const EASE_BACK = 'cubic-bezier(.34,1.56,.64,1)';

function run(el, frames, opts) {
  if (!el || typeof el.animate !== 'function') return null;
  if (reduced()) return null;
  return el.animate(frames, { fill: 'none', ...opts });
}

/** Entrée d’écran : glisse légèrement dans le sens de la navigation. */
export function screenEnter(el, dir = 'forward') {
  const dx = dir === 'back' ? -18 : dir === 'none' ? 0 : 18;
  return run(el, [
    { opacity: 0, transform: `translate3d(${dx}px, 6px, 0)` },
    { opacity: 1, transform: 'none' },
  ], { duration: 260, easing: EASE_OUT });
}

/** Apparition d’un élément nouveau (nœud d’arbre, ligne). */
export function popIn(el, delay = 0) {
  return run(el, [
    { opacity: 0, transform: 'scale(.6)' },
    { opacity: 1, transform: 'scale(1.06)', offset: 0.7 },
    { opacity: 1, transform: 'scale(1)' },
  ], { duration: 380, delay, easing: EASE_BACK });
}

export function slideIn(el, delay = 0) {
  return run(el, [
    { opacity: 0, transform: 'translate3d(0, 10px, 0)' },
    { opacity: 1, transform: 'none' },
  ], { duration: 260, delay, easing: EASE_OUT });
}

/** Petit « non » horizontal (essai raté). */
export function shake(el) {
  return run(el, [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-6px)' },
    { transform: 'translateX(5px)' },
    { transform: 'translateX(-3px)' },
    { transform: 'translateX(0)' },
  ], { duration: 360, easing: 'ease-out' });
}

/** Trait de l’arbre qui se dessine. */
export function drawPath(path, delay = 0) {
  if (!path || reduced() || typeof path.getTotalLength !== 'function') return null;
  const len = path.getTotalLength();
  if (!len) return null;
  path.style.strokeDasharray = `${len}`;
  const a = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 420, delay, easing: EASE_OUT, fill: 'backwards' });
  a.onfinish = () => { path.style.strokeDasharray = ''; };
  return a;
}

/** Réactions de JOHNNIAC : 'happy' (saut), 'puzzled' (penche la tête). */
export function react(el, kind) {
  if (!el) return null;
  if (kind === 'happy') {
    return run(el, [
      { transform: 'translateY(0) scale(1, 1)' },
      { transform: 'translateY(2px) scale(1.04, .94)', offset: 0.15 },
      { transform: 'translateY(-14px) scale(.97, 1.04)', offset: 0.45 },
      { transform: 'translateY(0) scale(1.03, .97)', offset: 0.75 },
      { transform: 'translateY(0) scale(1, 1)' },
    ], { duration: 640, easing: 'ease-out' });
  }
  if (kind === 'puzzled') {
    return run(el, [
      { transform: 'rotate(0)' },
      { transform: 'rotate(-6deg)', offset: 0.3 },
      { transform: 'rotate(4deg)', offset: 0.6 },
      { transform: 'rotate(-2deg)', offset: 0.8 },
      { transform: 'rotate(0)' },
    ], { duration: 620, easing: 'ease-in-out' });
  }
  return null;
}

/** Étincelles autour d’un élément (succès). 12 éléments, retirés à la fin. */
export function sparkle(host, count = 12) {
  if (!host || reduced()) return;
  const layer = document.createElement('div');
  layer.className = 'sparkles';
  layer.setAttribute('aria-hidden', 'true');
  host.append(layer);
  const colors = ['#e9c74a', '#9dbb94', '#f4a9a0', '#7a9e74', '#fff3c4'];
  let left = count;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.style.background = colors[i % colors.length];
    layer.append(s);
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 46 + Math.random() * 40;
    const a = s.animate([
      { transform: 'translate(-50%, -50%) scale(.4)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1)`, opacity: 1, offset: 0.6 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * dist * 1.15}px), calc(-50% + ${Math.sin(ang) * dist * 1.15 + 18}px)) scale(.6)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 300, easing: EASE_OUT });
    a.onfinish = () => {
      if (--left === 0) layer.remove();
    };
  }
}

/** Progression qui « pousse » depuis l’ancienne valeur (sans relayout : scaleX). */
export function growBar(fill, from, to) {
  if (!fill || from === to) return null;
  return run(fill, [
    { transform: `scaleX(${from})` },
    { transform: `scaleX(${to})` },
  ], { duration: 520, easing: EASE_OUT });
}

/**
 * Carte d’entrée de chapitre : grande illustration + titre, ~1,3 s, touche pour passer.
 * Mouvement réduit → rien (on va directement à l’écran).
 */
export function chapterIntro({ num, title, artHTML }) {
  if (reduced()) return Promise.resolve();
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'chapter-intro';
    ov.setAttribute('role', 'status');
    ov.innerHTML = `<div class="ci-card"><div class="ci-art"></div><p class="ci-num"></p><p class="ci-title"></p><p class="ci-skip">Touche pour continuer</p></div>`;
    ov.querySelector('.ci-art').innerHTML = artHTML;
    ov.querySelector('.ci-num').textContent = `Chapitre ${num}`;
    ov.querySelector('.ci-title').textContent = title;
    document.body.append(ov);
    const card = ov.querySelector('.ci-card');
    ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    card.animate([
      { opacity: 0, transform: 'translateY(24px) scale(.94)' },
      { opacity: 1, transform: 'none' },
    ], { duration: 420, easing: EASE_BACK });
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const out = ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
      out.onfinish = () => ov.remove();
      resolve();
    };
    const timer = setTimeout(close, 1500);
    ov.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close, { once: true });
  });
}

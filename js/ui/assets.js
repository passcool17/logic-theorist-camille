/**
 * Illustrations peintes (partie A, livrées par Atelier assets le 2026-11-16, voir GAME.md).
 * Fichiers dans assets/art/ ; tous précachés par le service worker (tests/assets.test.js le vérifie).
 * Les icônes de règles sont des SVG en `currentColor` : elles sont copiées en ligne dans art.js
 * (en <img>, currentColor ne marcherait pas). Les .svg de assets/art/ restent la source.
 */

export const ART_DIR = './assets/art/';

const robot = (mood) => ({ file: `johnniac-${mood}.webp`, w: 391, h: 480, alt: '' });

export const ART = {
  hero: { file: 'johnniac-hero.webp', w: 586, h: 720, alt: 'JOHNNIAC, l’ordinateur de 1955, te fait signe' },
  head: { file: 'johnniac-head.webp', w: 120, h: 120, alt: '' },
  moods: {
    idle: robot('idle'),
    thinking: robot('thinking'),
    happy: robot('happy'),
    oops: robot('oops'),
  },
  chapters: {
    ch1: { file: 'ch1-machine.webp', w: 960, h: 720, alt: 'JOHNNIAC rêve d’un arbre de fiches' },
    ch2: { file: 'ch2-workshop.webp', w: 960, h: 720, alt: 'Trois chercheurs et JOHNNIAC jouent avec des fiches' },
    ch3: { file: 'ch3-rules.webp', w: 960, h: 720, alt: 'Trois tuiles de règles sur une table' },
    ch4: { file: 'ch4-proof-workshop.webp', w: 960, h: 720, alt: 'Une élève et JOHNNIAC construisent un arbre de preuve' },
    ch5: { file: 'ch5-why-it-matters.webp', w: 960, h: 720, alt: 'Une réunion d’été sur la pelouse et un grand livre de logique' },
  },
};

/** Liste plate des images (pour le test et le service worker). */
export function artEntries() {
  return [ART.hero, ART.head, ...Object.values(ART.moods), ...Object.values(ART.chapters)];
}

export function artURL(entry) {
  return `${ART_DIR}${entry.file}`;
}

/** Balise <img> avec largeur/hauteur (aucun saut de mise en page). */
export function artImg(entry, className = '', { lazy = false, priority = false } = {}) {
  if (!entry) return '';
  const alt = entry.alt.replace(/"/g, '&quot;');
  const extra = `${lazy ? ' loading="lazy"' : ''}${priority ? ' fetchpriority="high"' : ''}`;
  return `<img class="${className}" src="${artURL(entry)}" width="${entry.w}" height="${entry.h}" alt="${alt}" decoding="async"${extra}>`;
}

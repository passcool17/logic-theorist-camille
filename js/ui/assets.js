/**
 * Illustrations peintes (partie A, livrées par Atelier assets).
 * Tant qu’un fichier n’est pas livré, `ready: false` → le jeu garde les SVG maison.
 * Pour brancher une image : copier le fichier dans assets/art/, passer `ready: true`,
 * l’ajouter à ASSETS dans sw.js, puis monter la version (lt-camille-vN).
 * Un test (tests/assets.test.js) vérifie qu’une image « ready » existe et est en cache SW.
 */

export const ART_DIR = './assets/art/';

export const ART = {
  johnniac: { file: 'johnniac.webp', w: 480, h: 780, ready: false, alt: 'JOHNNIAC, l’ordinateur de 1955' },
  chapters: {
    ch1: { file: 'chapter-1.webp', w: 800, h: 450, ready: false, alt: 'Une machine qui raisonne' },
    ch2: { file: 'chapter-2.webp', w: 800, h: 450, ready: false, alt: 'L’atelier de 1955' },
    ch3: { file: 'chapter-3.webp', w: 800, h: 450, ready: false, alt: 'Les règles du jeu' },
    ch4: { file: 'chapter-4.webp', w: 800, h: 450, ready: false, alt: 'Prouve comme LT' },
    ch5: { file: 'chapter-5.webp', w: 800, h: 450, ready: false, alt: 'Pourquoi c’est important' },
  },
  rules: {
    substitution: { file: 'rule-substitution.webp', w: 128, h: 128, ready: false, alt: '' },
    detachment: { file: 'rule-detachment.webp', w: 128, h: 128, ready: false, alt: '' },
    chain: { file: 'rule-chain.webp', w: 128, h: 128, ready: false, alt: '' },
  },
};

/** Liste plate des entrées (pour le test et le service worker). */
export function artEntries() {
  return [ART.johnniac, ...Object.values(ART.chapters), ...Object.values(ART.rules)];
}

export function artURL(entry) {
  return `${ART_DIR}${entry.file}`;
}

/** <img> prêt à insérer, ou null si l’image n’est pas encore livrée. */
export function artImg(entry, className = '') {
  if (!entry || !entry.ready) return null;
  const alt = entry.alt.replace(/"/g, '&quot;');
  return `<img class="${className}" src="${artURL(entry)}" width="${entry.w}" height="${entry.h}" alt="${alt}" decoding="async">`;
}

import { ART, artImg } from './assets.js';

/**
 * Illustrations maison en SVG (aucune image externe) :
 * JOHNNIAC, icônes des règles, lauriers, ruban, brindille, paysage.
 * Formes simples et plates pour rester légères sur mobile.
 */

/** Ordinateur rétro JOHNNIAC. mood : 'smile' | 'proud' | 'think' */
export function johnniacSVG({ mood = 'smile', note = true, plants = true } = {}) {
  const faces = {
    smile: ['<path d="M44 66 q5 -6 10 0" /><path d="M66 66 q5 -6 10 0" />', '<path d="M48 80 q12 10 24 0" />'],
    proud: ['<path d="M43 64 l5 5 l5 -5" /><path d="M67 64 l5 5 l5 -5" />', '<path d="M46 78 q14 14 28 0" /><circle cx="40" cy="76" r="3" fill="#f4a9a0" stroke="none" opacity=".8"/><circle cx="80" cy="76" r="3" fill="#f4a9a0" stroke="none" opacity=".8"/>'],
    think: ['<circle cx="49" cy="66" r="3" fill="#dff4ff" stroke="none"/><circle cx="71" cy="66" r="3" fill="#dff4ff" stroke="none"/>', '<path d="M50 82 h20" />'],
  };
  const [eyes, mouth] = faces[mood] || faces.smile;
  const face = `<g class="jn-eyes">${eyes}</g>${mouth}`;
  const leaves = plants
    ? `<g fill="#9dbb94" opacity=".9">
        <path d="M6 196 q-6 -30 8 -52 q4 26 -8 52z"/><path d="M14 198 q2 -26 20 -38 q-4 24 -20 38z" fill="#b7cfa9"/>
        <path d="M124 196 q8 -28 -4 -50 q-6 24 4 50z"/><path d="M118 198 q-4 -22 -20 -32 q4 22 20 32z" fill="#b7cfa9"/>
       </g>`
    : '';
  const paper = note
    ? `<g transform="rotate(-3 62 178)">
        <rect x="36" y="160" width="54" height="34" rx="2" fill="#fffdf6" stroke="#d9cfb8"/>
        <rect x="56" y="156" width="14" height="7" fill="#e9dfc5" opacity=".9"/>
        <text x="63" y="173" text-anchor="middle" font-size="6.6" fill="#3b3b3b" font-family="Segoe Print, Comic Sans MS, cursive">Raisonner,</text>
        <text x="63" y="182" text-anchor="middle" font-size="6.2" fill="#3b3b3b" font-family="Segoe Print, Comic Sans MS, cursive">c’est connecter.</text>
        <path d="M80 186 c-2 -3 -6 0 0 4 c6 -4 2 -7 0 -4z" fill="none" stroke="#3b3b3b" stroke-width=".8"/>
       </g>`
    : '';
  return `<svg class="johnniac" viewBox="0 0 130 210" role="img" aria-label="JOHNNIAC, l’ordinateur qui sourit">
  <ellipse cx="65" cy="203" rx="58" ry="6" fill="#cfd8c3" opacity=".7"/>
  ${leaves}
  <line x1="30" y1="22" x2="30" y2="6" stroke="#8b8f86" stroke-width="2"/><circle class="jn-bulb" cx="30" cy="5" r="3.5" fill="#e9c74a"/>
  <rect x="14" y="20" width="102" height="178" rx="9" fill="#e6ddc8" stroke="#8f8a7a" stroke-width="1.5"/>
  <rect x="14" y="132" width="102" height="66" rx="6" fill="#d7ceb8" stroke="#8f8a7a" stroke-width="1.5"/>
  <rect x="36" y="26" width="58" height="12" rx="3" fill="#f6f0e0" stroke="#8f8a7a"/>
  <text x="65" y="35" text-anchor="middle" font-size="7.5" font-weight="700" fill="#4b4b45" letter-spacing=".6">JOHNNIAC</text>
  <rect x="26" y="44" width="78" height="56" rx="8" fill="#6f6b60"/>
  <rect x="31" y="48" width="68" height="48" rx="6" fill="#2f5f7a"/>
  <rect x="31" y="48" width="68" height="20" rx="6" fill="#3c7392" opacity=".55"/>
  <g fill="none" stroke="#dff4ff" stroke-width="3" stroke-linecap="round" transform="translate(5 -8)">${face}</g>
  <rect x="8" y="54" width="7" height="30" rx="2" fill="#cfc6b0" stroke="#8f8a7a"/>
  <rect x="115" y="54" width="7" height="30" rx="2" fill="#cfc6b0" stroke="#8f8a7a"/>
  <g>
    <circle cx="30" cy="110" r="3" fill="#e9c74a"/><circle cx="39" cy="110" r="3" fill="#e9c74a"/><circle cx="48" cy="110" r="3" fill="#8cc084"/><circle cx="57" cy="110" r="3" fill="#8cc084"/>
    <circle cx="74" cy="108" r="2.6" fill="#5aa0c8"/><circle cx="82" cy="108" r="2.6" fill="#8cc084"/><circle cx="90" cy="108" r="2.6" fill="#5aa0c8"/><circle cx="98" cy="108" r="2.6" fill="#e9c74a"/>
    <circle cx="74" cy="116" r="2.6" fill="#8cc084"/><circle cx="82" cy="116" r="2.6" fill="#5aa0c8"/><circle cx="90" cy="116" r="2.6" fill="#5aa0c8"/><circle cx="98" cy="116" r="2.6" fill="#8cc084"/>
  </g>
  <rect x="22" y="121" width="86" height="9" rx="3" fill="#cbc2ab"/>
  <g fill="#f6f0e0" stroke="#6f6b60" stroke-width=".8">
    <rect x="27" y="122.5" width="5" height="6" rx="1"/><rect x="37" y="122.5" width="5" height="6" rx="1"/><rect x="47" y="122.5" width="5" height="6" rx="1"/><rect x="57" y="122.5" width="5" height="6" rx="1"/>
  </g>
  <circle cx="96" cy="126" r="5" fill="#4f9a5a" stroke="#2f6a3a"/>
  <g stroke="#9a937f" stroke-width="1.6">
    <line x1="22" y1="140" x2="34" y2="140"/><line x1="22" y1="145" x2="34" y2="145"/><line x1="22" y1="150" x2="34" y2="150"/><line x1="22" y1="155" x2="34" y2="155"/>
    <line x1="96" y1="160" x2="108" y2="160"/><line x1="96" y1="165" x2="108" y2="165"/><line x1="96" y1="170" x2="108" y2="170"/>
  </g>
  <rect x="20" y="196" width="14" height="6" rx="2" fill="#8f8a7a"/><rect x="96" y="196" width="14" height="6" rx="2" fill="#8f8a7a"/>
  ${paper}
</svg>`;
}

/** Petite tête de JOHNNIAC (logo, bulles) : image peinte 120×120 affichée ~40 px. */
export function johnniacHeadSVG() {
  return artImg(ART.head, 'jn-head');
}

/** Icônes des règles (Atelier assets, grille 24, currentColor → suivent la couleur du texte). */
export const RULE_ICONS = {
  substitution: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="7" height="7" rx="2"/><circle cx="17" cy="17" r="4" fill="currentColor" fill-opacity=".2"/><path d="M14 6h3a2 2 0 0 1 2 2v2"/><path d="m17 8 2 2 2-2"/><path d="M10 18H7a2 2 0 0 1-2-2v-2"/><path d="m7 16-2-2-2 2"/></svg>`,
  detachment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="3"/><path d="M9 12h6"/><path d="m12 9 3 3-3 3"/><circle cx="19.5" cy="12" r="2.5" fill="currentColor"/></svg>`,
  chain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="4.5" cy="17" r="2.5" fill="currentColor"/><circle cx="12" cy="17" r="2.5" fill="currentColor" fill-opacity=".35" stroke-opacity=".5"/><circle cx="19.5" cy="17" r="2.5" fill="currentColor"/><path d="M4.5 11.5Q12 1.5 19 11"/><path d="M19.33 7.62 L19 11 L15.67 10.32"/></svg>`,
};

/** Icônes des chapitres (accueil). */
export const CHAPTER_ICONS = {
  ch1: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 6a10 10 0 0 0-6 18v4h12v-4a10 10 0 0 0-6-18z" fill="#f3dc8a" stroke="#b9963a" stroke-width="1.5"/><rect x="15" y="30" width="10" height="4" rx="1.5" fill="#9a937f"/><path d="M17 18l3 3 3-3" fill="none" stroke="#b9963a" stroke-width="1.5"/></svg>`,
  ch2: `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="9" width="28" height="22" rx="3" fill="#f6f0e0" stroke="#8f8a7a" stroke-width="1.5"/><g fill="#4d7b95"><rect x="10" y="14" width="2.5" height="4"/><rect x="16" y="20" width="2.5" height="4"/><rect x="22" y="14" width="2.5" height="4"/><rect x="28" y="22" width="2.5" height="4"/></g><path d="M6 13l4-4" stroke="#8f8a7a" stroke-width="1.5"/></svg>`,
  ch3: RULE_ICONS.substitution,
  ch4: `<svg viewBox="0 0 40 40" aria-hidden="true" stroke-width="2" fill="none"><path d="M20 10v10M20 20l-9 9M20 20l9 9" stroke="#6b8f71"/><circle cx="20" cy="9" r="5" fill="#d9e8cf" stroke="#6b8f71"/><circle cx="11" cy="30" r="4.5" fill="#d9e8cf" stroke="#6b8f71"/><circle cx="29" cy="30" r="4.5" fill="#e4e4e2" stroke="#9a9a96" stroke-dasharray="2 2"/></svg>`,
  ch5: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 5l4.3 8.8 9.7 1.4-7 6.8 1.7 9.6L20 27l-8.7 4.6L13 22l-7-6.8 9.7-1.4z" fill="#f3dc8a" stroke="#b9963a" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
};

export function laurelSVG(side = 'left') {
  const flip = side === 'right' ? ' transform="scale(-1 1) translate(-24 0)"' : '';
  return `<svg class="laurel" viewBox="0 0 24 48" aria-hidden="true"><g${flip} fill="#9dbb94"><path d="M18 46 C6 38 4 22 12 6" fill="none" stroke="#86a77d" stroke-width="1.4"/><ellipse cx="9" cy="12" rx="2.4" ry="5" transform="rotate(-25 9 12)"/><ellipse cx="6.5" cy="22" rx="2.4" ry="5" transform="rotate(-10 6.5 22)"/><ellipse cx="7" cy="32" rx="2.4" ry="5" transform="rotate(10 7 32)"/><ellipse cx="11" cy="41" rx="2.4" ry="5" transform="rotate(35 11 41)"/><ellipse cx="14.5" cy="16" rx="2" ry="4.4" transform="rotate(30 14.5 16)" fill="#b7cfa9"/><ellipse cx="13" cy="27" rx="2" ry="4.4" transform="rotate(40 13 27)" fill="#b7cfa9"/></g></svg>`;
}

export function sprigSVG() {
  return `<svg class="sprig" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 30V12" stroke="#6b8f71" stroke-width="2" fill="none"/><path d="M16 18C8 18 4 12 4 6c7 0 12 5 12 12z" fill="#8fae86"/><path d="M16 14c0-7 5-12 12-12 0 7-5 12-12 12z" fill="#6b8f71"/></svg>`;
}

export function ribbonSVG() {
  return `<svg class="ribbon-svg" viewBox="0 0 48 60" aria-hidden="true"><path d="M3 0h42v52l-21-9-21 9z" fill="#f6efdc" stroke="#d8ccb0" stroke-width="1.5"/><path d="M24 12l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L24 30.6l-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2z" fill="#4f6f56"/></svg>`;
}

/** Paysage d’aquarelle en bas d’écran (décor fixe, très léger). */
export function landscapeSVG() {
  const flowers = [[40, 92], [72, 104], [118, 96], [262, 100], [300, 90], [334, 106], [190, 108], [214, 96]]
    .map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="3.2" fill="#fffdf5"/><circle r="1.2" fill="#e9c74a"/></g>`).join('');
  return `<svg viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 52 Q40 30 80 44 T170 38 T260 30 T360 46 V120 H0z" fill="#c9d8dc" opacity=".55"/>
  <path d="M0 64 Q60 42 120 58 T230 52 T360 58 V120 H0z" fill="#b5cdb3" opacity=".7"/>
  <path d="M0 80 Q70 62 150 76 T290 70 T360 76 V120 H0z" fill="#cfe0b8"/>
  <path d="M0 96 Q90 80 180 92 T360 88 V120 H0z" fill="#bcd49f"/>
  <path d="M170 120 C176 106 196 100 188 90 C182 84 200 80 214 78" fill="none" stroke="#efe6cc" stroke-width="9" stroke-linecap="round"/>
  <g fill="#8fae86" opacity=".9"><circle cx="12" cy="84" r="14"/><circle cx="30" cy="92" r="11"/><circle cx="346" cy="80" r="16"/><circle cx="326" cy="92" r="11"/></g>
  <g fill="#6b8f71" opacity=".75"><path d="M4 120 q2-34 12-46 q-1 26-6 46z"/><path d="M352 120 q-4-36-14-48 q2 28 8 48z"/></g>
  ${flowers}
</svg>`;
}

/* ---------- Illustrations peintes (partie A, Atelier assets) ---------- */

/** Humeurs du jeu → images : smile→idle, think→thinking, proud→happy, oops (essai raté). */
const MOOD_ART = { smile: 'idle', idle: 'idle', think: 'thinking', thinking: 'thinking', proud: 'happy', happy: 'happy', oops: 'oops' };

/** Portrait de JOHNNIAC. `hero` = grande image de l’accueil (non différée, priorité haute). */
export function johnniacPortrait({ mood = 'smile', hero = false } = {}) {
  if (hero) return artImg(ART.hero, 'jn-img jn-hero', { priority: true });
  return artImg(ART.moods[MOOD_ART[mood] || 'idle'], 'jn-img');
}

/** Icône d’une règle (SVG en ligne). */
export function ruleIcon(rule) {
  return RULE_ICONS[rule] || '';
}

/** Illustration de chapitre 960×720. `lazy` pour les bandeaux, pas pour la carte d’entrée. */
export function chapterArt(id, { lazy = true } = {}) {
  return artImg(ART.chapters[id], 'chapter-img', { lazy });
}

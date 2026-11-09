/** Registre des 5 chapitres. */

export const CHAPTERS = [
  {
    id: 'ch1',
    num: 1,
    title: 'Une machine qui raisonne',
    duration: '≈ 5 min',
    badge: 'Exploratrice',
    badgeId: 'ch-ch1',
  },
  {
    id: 'ch2',
    num: 2,
    title: 'L’atelier de 1955',
    duration: '≈ 6 min',
    badge: 'Atelière',
    badgeId: 'ch-ch2',
  },
  {
    id: 'ch3',
    num: 3,
    title: 'Les règles du jeu',
    duration: '≈ 7 min',
    badge: 'Stratège',
    badgeId: 'ch-ch3',
  },
  {
    id: 'ch4',
    num: 4,
    title: 'Prouve comme LT',
    duration: '≈ 10 min',
    badge: 'Logicienne',
    badgeId: 'ch-ch4',
  },
  {
    id: 'ch5',
    num: 5,
    title: 'Pourquoi c’est important',
    duration: '≈ 5 min',
    badge: 'Historienne',
    badgeId: 'ch-ch5',
  },
];

export const BADGE_INFO = {
  'ch-ch1': { label: 'Exploratrice', emoji: '🔭', how: 'Chapitre 1 terminé' },
  'ch-ch2': { label: 'Atelière', emoji: '🗂️', how: 'Chapitre 2 terminé' },
  'ch-ch3': { label: 'Stratège', emoji: '🧩', how: 'Chapitre 3 terminé' },
  'ch-ch4': { label: 'Prouveuse', emoji: '🌳', how: 'Chapitre 4 terminé' },
  'ch-ch5': { label: 'Historienne', emoji: '📜', how: 'Chapitre 5 terminé' },
  'proof-p208': { label: '*2.08', emoji: '✨', how: 'Identité prouvée' },
  'proof-p202': { label: '*2.02', emoji: '✨', how: 'Simplification' },
  'proof-p201': { label: '*2.01', emoji: '✨', how: 'Réduction' },
  'proof-p205': { label: '*2.05', emoji: '✨', how: 'Syllogisme' },
  'proof-p206': { label: '*2.06', emoji: '✨', how: 'Chaîne' },
  'proof-p285': { label: '*2.85', emoji: '💎', how: 'La perle de LT' },
  logicienne: { label: 'Logicienne LT', emoji: '🤖', how: 'Les 6 preuves' },
};

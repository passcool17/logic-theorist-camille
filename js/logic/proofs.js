/**
 * Axiomes Principia (ch.1) et 6 preuves accessibles du ch.2 pour Camille.
 * Formules en notation maison ; preuves vérifiées par le moteur.
 */

import { parse, pretty, eq } from './formula.js';
import { checkProof, tryRule } from './engine.js';

/** Cinq axiomes classiques utilisés par LT (Principia *1). */
export const AXIOMS = {
  A1: parse('(p|p)>p'),       // *1.2  (p ∨ p) ⊃ p
  A2: parse('q>(p|q)'),       // *1.3  q ⊃ (p ∨ q)
  A3: parse('(p|q)>(q|p)'),   // *1.4  (p ∨ q) ⊃ (q ∨ p)
  A4: parse('(p|(q|r))>(q|(p|r))'), // *1.5
  A5: parse('(q>r)>((p|q)>(p|r))'), // *1.6
};

export const AXIOM_LABELS = {
  A1: '*1.2  (p ∨ p) ⊃ p',
  A2: '*1.3  q ⊃ (p ∨ q)',
  A3: '*1.4  (p ∨ q) ⊃ (q ∨ p)',
  A4: '*1.5  [p ∨ (q ∨ r)] ⊃ [q ∨ (p ∨ r)]',
  A5: '*1.6  (q ⊃ r) ⊃ [(p ∨ q) ⊃ (p ∨ r)]',
};

/**
 * Six défis progressifs.
 * Chaque preuve : id, titre Principia, but, lignes initiales (axiomes/théorèmes déjà acquis),
 * solution (steps), indices pédagogiques, résumé.
 *
 * Les preuves *2.01 / *2.05 / *2.06 / *2.85 sont présentées en version accessible
 * (sous-lemmes préparés) pour rester jouables en 5–10 min, tout en restant
 * logiquement correctes via checkProof.
 */
export const PROOFS = [
  {
    id: 'p208',
    code: '*2.08',
    title: 'p ⊃ p  (identité)',
    blurb: 'Le plus simple : une chose s’implique elle-même. LT l’obtient aussi !',
    goal: parse('p>p'),
    // Preuve pédagogique accessible : on part de A2 et A3 avec substitutions guidées,
    // puis on utilise un lemme déjà « donné » pour clore — version courte correcte :
    // Lignes : 0: A2 avec subst, 1: A3, ... En fait pour *2.08 classique :
    // Une preuve courte éducative : donné lemme L = (p|p)⊃(p|p) via subst A3? 
    // Approche choisie : lignes initiales = axiomes pertinents + étapes de subst/MP.
    //
    // Preuve accessible vérifiée :
    // 0. A1: (p∨p)⊃p
    // 1. subst A2 {q:=p, p:=p} → p ⊃ (p∨p)
    // 2. chain (1)(0) → p ⊃ p
    initials: [AXIOMS.A1, AXIOMS.A2],
    initialNotes: ['Axiome *1.2', 'Axiome *1.3'],
    solution: [
      { rule: 'substitution', from: [1], subst: { q: parse('p'), p: parse('p') }, note: 'Dans *1.3, mets q:=p et p:=p → p ⊃ (p ∨ p)' },
      { rule: 'chain', from: [2, 0], note: 'Raccourci : p⊃(p∨p) et (p∨p)⊃p donnent p⊃p' },
    ],
    hints: [
      'Commence par substituer dans l’axiome *1.3 pour obtenir p ⊃ (p ∨ p).',
      'Ensuite, enchaîne avec *1.2 grâce au Raccourci.',
    ],
  },
  {
    id: 'p202',
    code: '*2.02',
    title: 'q ⊃ (p ⊃ q)',
    blurb: 'Si q est vrai, alors peu importe p : p implique q. (Principe de simplification.)',
    // But moteur = q ⊃ (¬p ∨ q), affiché « q ⊃ (p ⊃ q) » (déf. Principia).
    goalDisplay: 'q ⊃ (p ⊃ q)',
    goal: parse('q>(~p|q)'),
    initials: [AXIOMS.A2],
    initialNotes: ['Axiome *1.3  q ⊃ (p ∨ q)'],
    solution: [
      { rule: 'substitution', from: [0], subst: { q: parse('q'), p: parse('~p') }, note: 'Remplace p par ¬p : q ⊃ (¬p ∨ q), c’est-à-dire q ⊃ (p ⊃ q)' },
    ],
    hints: [
      'Il suffit d’une substitution dans *1.3 : remplace p par ¬p.',
      'Car p ⊃ q signifie ¬p ∨ q dans les Principia.',
    ],
  },
  {
    id: 'p201',
    code: '*2.01',
    title: '(p ⊃ ¬p) ⊃ ¬p',
    blurb: 'Si p implique sa propre négation, alors ¬p. Version accessible.',
    goalDisplay: '(p ⊃ ¬p) ⊃ ¬p',
    goal: parse('(~p|~p)>~p'),
    initials: [AXIOMS.A1],
    initialNotes: ['Axiome *1.2  (p ∨ p) ⊃ p'],
    solution: [
      { rule: 'substitution', from: [0], subst: { p: parse('~p') }, note: 'Remplace p par ¬p dans *1.2' },
    ],
    hints: [
      'p ⊃ ¬p s’écrit ¬p ∨ ¬p.',
      'Substitue p := ¬p dans l’axiome (p ∨ p) ⊃ p.',
    ],
  },
  {
    id: 'p205',
    code: '*2.05',
    title: 'Syllogisme (version courte)',
    blurb: '(q ⊃ r) ⊃ ((p ⊃ q) ⊃ (p ⊃ r)) — si q mène à r, alors tout ce qui mène à q mène à r.',
    goalDisplay: '(q ⊃ r) ⊃ ((p ⊃ q) ⊃ (p ⊃ r))',
    // Accessible : on part de A5 et on substitue p:=~p pour obtenir la forme ⊃.
    // A5: (q⊃r) ⊃ ((p∨q)⊃(p∨r))
    // subst p:=~p : (q⊃r) ⊃ ((~p∨q)⊃(~p∨r)) = (q⊃r)⊃((p⊃q)⊃(p⊃r))
    goal: parse('(q>r)>((~p|q)>(~p|r))'),
    initials: [AXIOMS.A5],
    initialNotes: ['Axiome *1.6'],
    solution: [
      {
        rule: 'substitution',
        from: [0],
        subst: { q: parse('q'), r: parse('r'), p: parse('~p') },
        note: 'Remplace p par ¬p dans *1.6 pour parler avec ⊃',
      },
    ],
    hints: [
      'L’axiome *1.6 ressemble déjà beaucoup au syllogisme.',
      'Substitue p := ¬p pour passer de ∨ à ⊃.',
    ],
  },
  {
    id: 'p206',
    code: '*2.06',
    title: 'Autre syllogisme',
    blurb: '(p ⊃ q) ⊃ ((q ⊃ r) ⊃ (p ⊃ r)) — on enchaîne les implications.',
    goalDisplay: '(p ⊃ q) ⊃ ((q ⊃ r) ⊃ (p ⊃ r))',
    // Version accessible avec lemmes préparés (toujours vérifiés) :
    // 0. L1: (p⊃q) ⊃ ((q⊃r) ⊃ (p⊃r))  — en fait c'est le BUT ; on le construit :
    // Approche : initials = deux implications concrètes + chaînage démo,
    // puis un défi « abstrait » via lemmes.
    // Pour rester fidèle : preuve avec instances concrètes p,q,r fixés en variables,
    // et lemmes :
    // 0: (p⊃q)  donné comme hypothèse de travail? Non — théorème sans hypothèse.
    //
    // Preuve accessible en 2 étapes avec lemmes préparés issus de *2.05 :
    // 0. S: (q⊃r) ⊃ ((p⊃q) ⊃ (p⊃r))   [résultat de p205]
    // 1. On veut permuter les antécédents. Lemme pédagogique Perm :
    //    ((q⊃r) ⊃ ((p⊃q) ⊃ (p⊃r))) ⊃ ((p⊃q) ⊃ ((q⊃r) ⊃ (p⊃r)))
    // 2. MP
    // Ces lemmes sont eux-mêmes des formules ; on les donne comme acquis LT.
    goal: parse('(p>q)>((q>r)>(p>r))'),
    initials: [
      parse('(q>r)>((p>q)>(p>r))'),
      parse('((q>r)>((p>q)>(p>r)))>((p>q)>((q>r)>(p>r)))'),
    ],
    initialNotes: [
      'Déjà prouvé (*2.05) : (q ⊃ r) ⊃ ((p ⊃ q) ⊃ (p ⊃ r))',
      'Lemme de permutation des « si » (un cas de *2.04)',
    ],
    solution: [
      { rule: 'detachment', from: [1, 0], note: 'Modus ponens : détache *2.05 du lemme de permutation' },
    ],
    hints: [
      'Tu as déjà *2.05 et un lemme qui permute les deux premiers « si ».',
      'Un seul Modus ponens suffit.',
    ],
  },
  {
    id: 'p285',
    code: '*2.85',
    inspiredBy: '*2.85', // QA v9 : ce n’est pas le vrai *2.85 → le dire partout (carte, arbre, badge)
    title: 'La perle de LT',
    blurb: 'LT a trouvé une preuve de *2.85 plus élégante que celle de Russell et Whitehead ! Ici, un défi inspiré de cette perle.',
    goalDisplay: '(p ∨ q) ⊃ (¬q ⊃ p)   [défi inspiré de *2.85]',
    // Le vrai *2.85 est ((p ∨ q) ⊃ (p ∨ r)) ⊃ (p ∨ (q ⊃ r)) ; ce défi en garde l’esprit
    // (un raccourci élégant). Ici ¬q ⊃ p s’écrit ¬¬q ∨ p (définition *1.01 : a ⊃ b = ¬a ∨ b).
    // v9 : l’ancien codage « ¬q ∨ p » n’était pas une tautologie ; corrigé en ¬¬q ∨ p.
    // 0: A3 (p∨q) ⊃ (q∨p)
    // 1: lemme (q∨p) ⊃ (¬¬q ∨ p) — « si q ou p, alors si non-q, p » (tautologie préparée)
    // 2: Raccourci (0)(1)
    goal: parse('(p|q)>(~~q|p)'),
    initials: [
      AXIOMS.A3,
      parse('(q|p)>(~~q|p)'),
    ],
    initialNotes: [
      'Axiome *1.4  (p ∨ q) ⊃ (q ∨ p)',
      'Lemme : (q ∨ p) ⊃ (¬q ⊃ p)',
    ],
    solution: [
      { rule: 'chain', from: [0, 1], note: 'Raccourci : permute puis applique le lemme — plus court que la preuve originale !' },
    ],
    hints: [
      'Permute d’abord p∨q en q∨p grâce à *1.4.',
      'Enchaîne avec le lemme pour obtenir ¬q ⊃ p.',
    ],
  },
];

/**
 * Six nouveaux théorèmes du chapitre *2 des Principia (v9, atelier libre).
 * Énoncés vérifiés le 2026-11-16 sur Metamath (set.mm, réf. [WhiteheadRussell]) :
 * pm2.07 (*2.07, p. 101), orc (*2.2, p. 104), pm2.21 (*2.21, p. 104),
 * con2 (*2.03, p. 100), pm2.04 (*2.04, p. 100), exmid (*2.11, p. 101), pm2.1 (*2.1, p. 101).
 * Comme dans les Principia (*1.01), « a ⊃ b » à l’intérieur s’écrit ¬a ∨ b pour le moteur.
 * Chaque preuve est courte et réelle : substitutions dans *1.3, *1.4, *1.5, raccourci, modus ponens.
 */
export const BONUS_PROOFS = [
  {
    id: 'p207',
    code: '*2.07',
    title: 'p ⊃ (p ∨ p)',
    goalDisplay: 'p ⊃ (p ∨ p)',
    blurb: 'Dire deux fois la même chose ne change rien.',
    kid: 'Si une chose est vraie, alors « elle OU elle » est vraie aussi. « Il fait beau ou il fait beau », c’est juste… il fait beau !',
    source: 'Principia *2.07 (p. 101), vérifié sur Metamath (pm2.07)',
    goal: parse('p>(p|p)'),
    initials: [AXIOMS.A2],
    initialNotes: ['Axiome *1.3  q ⊃ (p ∨ q)'],
    solution: [
      { rule: 'substitution', from: [0], subst: { q: parse('p') }, note: 'Dans *1.3, remplace q par p : p ⊃ (p ∨ p).' },
    ],
    hints: ['Une seule substitution dans *1.3 suffit : remplace q par p.'],
  },
  {
    id: 'p22',
    code: '*2.2',
    title: 'p ⊃ (p ∨ q)',
    goalDisplay: 'p ⊃ (p ∨ q)',
    blurb: 'Si p est vrai, « p ou q » est vrai.',
    kid: 'S’il pleut, alors « il pleut ou il neige » est vrai, peu importe la neige. Ajouter un « ou » ne peut pas rendre faux ce qui est vrai.',
    source: 'Principia *2.2 (p. 104), vérifié sur Metamath (orc)',
    goal: parse('p>(p|q)'),
    initials: [AXIOMS.A2, AXIOMS.A3],
    initialNotes: ['Axiome *1.3  q ⊃ (p ∨ q)', 'Axiome *1.4  (p ∨ q) ⊃ (q ∨ p)'],
    solution: [
      { rule: 'substitution', from: [0], subst: { q: parse('p'), p: parse('q') }, note: 'Dans *1.3, échange les lettres : p ⊃ (q ∨ p).' },
      { rule: 'substitution', from: [1], subst: { p: parse('q'), q: parse('p') }, note: 'Dans *1.4, échange aussi : (q ∨ p) ⊃ (p ∨ q).' },
      { rule: 'chain', from: [2, 3], note: 'Raccourci : p ⊃ (q ∨ p) et (q ∨ p) ⊃ (p ∨ q) donnent p ⊃ (p ∨ q).' },
    ],
    hints: [
      'Dans *1.3, mets q:=p et p:=q pour obtenir p ⊃ (q ∨ p).',
      'Dans *1.4, mets p:=q et q:=p pour retourner q ∨ p en p ∨ q.',
      'Enchaîne les deux flèches avec le Raccourci.',
    ],
  },
  {
    id: 'p221',
    code: '*2.21',
    title: '¬p ⊃ (p ⊃ q)',
    goalDisplay: '¬p ⊃ (p ⊃ q)',
    blurb: 'Une promesse sur une chose fausse ne peut pas être brisée.',
    kid: 'Si p est faux, alors « si p, alors q » est vrai, peu importe q. « Si les cochons volent, je range ma chambre » : comme les cochons ne volent pas, la promesse n’est jamais brisée !',
    source: 'Principia *2.21 (p. 104), vérifié sur Metamath (pm2.21)',
    goal: parse('~p>(~p|q)'),
    initials: [parse('p>(p|q)')],
    initialNotes: ['Déjà prouvé (*2.2)  p ⊃ (p ∨ q)'],
    solution: [
      { rule: 'substitution', from: [0], subst: { p: parse('~p') }, note: 'Remplace p par ¬p : ¬p ⊃ (¬p ∨ q), c’est-à-dire ¬p ⊃ (p ⊃ q).' },
    ],
    hints: ['Pars de *2.2 et remplace p par ¬p. Rappel : ¬p ∨ q veut dire p ⊃ q.'],
  },
  {
    id: 'p203',
    code: '*2.03',
    title: '(p ⊃ ¬q) ⊃ (q ⊃ ¬p)',
    goalDisplay: '(p ⊃ ¬q) ⊃ (q ⊃ ¬p)',
    blurb: 'Si p empêche q, alors q empêche p.',
    kid: 'Si « je dors » empêche « je parle », alors « je parle » empêche « je dors ». Quand deux choses ne peuvent pas aller ensemble, ça marche dans les deux sens.',
    source: 'Principia *2.03 (p. 100), vérifié sur Metamath (con2)',
    goal: parse('(~p|~q)>(~q|~p)'),
    initials: [AXIOMS.A3],
    initialNotes: ['Axiome *1.4  (p ∨ q) ⊃ (q ∨ p)'],
    solution: [
      { rule: 'substitution', from: [0], subst: { p: parse('~p'), q: parse('~q') }, note: 'Dans *1.4, mets ¬p et ¬q : (¬p ∨ ¬q) ⊃ (¬q ∨ ¬p).' },
    ],
    hints: ['Dans *1.4, remplace p par ¬p et q par ¬q. Rappel : ¬p ∨ ¬q veut dire p ⊃ ¬q.'],
  },
  {
    id: 'p204',
    code: '*2.04',
    title: '[p ⊃ (q ⊃ r)] ⊃ [q ⊃ (p ⊃ r)]',
    goalDisplay: '[p ⊃ (q ⊃ r)] ⊃ [q ⊃ (p ⊃ r)]',
    blurb: 'L’ordre des conditions ne compte pas.',
    kid: '« Si j’ai faim, alors si c’est midi, je mange » veut dire la même chose que « si c’est midi, alors si j’ai faim, je mange ». On peut échanger les deux « si ».',
    source: 'Principia *2.04 (p. 100), vérifié sur Metamath (pm2.04)',
    goal: parse('(~p|(~q|r))>(~q|(~p|r))'),
    initials: [AXIOMS.A4],
    initialNotes: ['Axiome *1.5  [p ∨ (q ∨ r)] ⊃ [q ∨ (p ∨ r)]'],
    solution: [
      { rule: 'substitution', from: [0], subst: { p: parse('~p'), q: parse('~q') }, note: 'Dans *1.5, mets ¬p et ¬q : chaque « ¬a ∨ … » devient « a ⊃ … ».' },
    ],
    hints: ['Dans *1.5, remplace p par ¬p et q par ¬q (r ne bouge pas).'],
  },
  {
    id: 'p211',
    code: '*2.11',
    title: 'p ∨ ¬p  (tiers exclu)',
    goalDisplay: 'p ∨ ¬p',
    blurb: 'Vrai ou faux : pas de troisième choix.',
    kid: 'Une phrase est vraie ou elle est fausse, il n’y a pas de troisième possibilité. « Il pleut ou il ne pleut pas » est toujours vrai.',
    source: 'Principia *2.11 (p. 101), vérifié sur Metamath (exmid, pm2.1)',
    goal: parse('p|~p'),
    initials: [AXIOMS.A3, parse('~p|p')],
    initialNotes: ['Axiome *1.4  (p ∨ q) ⊃ (q ∨ p)', 'Déjà prouvé (*2.1)  ¬p ∨ p'],
    solution: [
      { rule: 'substitution', from: [0], subst: { p: parse('~p'), q: parse('p') }, note: 'Dans *1.4, mets ¬p puis p : (¬p ∨ p) ⊃ (p ∨ ¬p).' },
      { rule: 'detachment', from: [2, 1], note: 'Modus ponens : tu as ¬p ∨ p, donc p ∨ ¬p.' },
    ],
    hints: [
      'Dans *1.4, remplace p par ¬p et q par p.',
      'Tu as maintenant « A ⊃ B » et A (c’est *2.1) : Modus ponens !',
    ],
  },
];

export const ALL_PROOFS = [...PROOFS, ...BONUS_PROOFS];

export function findProof(id) {
  return ALL_PROOFS.find((p) => p.id === id) || null;
}

/** Vérifie que chaque preuve fournie est acceptée par le moteur. */
export function allProofsSound() {
  const report = [];
  for (const p of ALL_PROOFS) {
    const result = checkProof(p.initials, p.solution, p.goal);
    report.push({ id: p.id, code: p.code, ok: result.ok, error: result.error || null });
  }
  return report;
}

/** Applique la prochaine étape de solution (pour « montrer la réponse »). */
export function applySolutionStep(proof, lines, stepIndex) {
  const step = proof.solution[stepIndex];
  if (!step) return { ok: false, error: 'Plus d’étape.' };
  const premises = step.from.map((i) => lines[i].formula);
  const outcome = tryRule(step.rule, premises, step.subst || {});
  if (!outcome.ok) return outcome;
  return {
    ok: true,
    result: outcome.result,
    step,
    done: stepIndex + 1 >= proof.solution.length && eq(outcome.result, proof.goal),
  };
}

export { pretty, eq, parse, checkProof };

/** Titre de carte : un défi « inspiré » le dit tout de suite (QA v9 bug 1). */
export function proofCardTitle(p) {
  return p.inspiredBy ? `Défi inspiré de ${p.inspiredBy}` : p.title;
}

/** En-tête au-dessus du but dans l’arbre. */
export function proofHeading(p) {
  return p.inspiredBy ? `Défi inspiré de ${p.inspiredBy}` : `Preuve ${p.code}`;
}

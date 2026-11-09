/** Contenu pédagogique des chapitres (français québécois chaleureux). */

export const CH1 = {
  pages: [
    {
      kind: 'story',
      title: 'Calculer… ou raisonner ?',
      body: `Salut Camille ! 🌟

Une calculatrice additionne des nombres. Elle est rapide, mais elle ne « comprend » pas pourquoi 2 + 2 = 4.

En 1955–1956, trois chercheurs — Allen Newell, Herbert Simon et Cliff Shaw — ont voulu autre chose : une machine qui trouve des preuves, comme un mathématicien.

Ils l’ont appelée Logic Theorist — LT pour les intimes.`,
    },
    {
      kind: 'story',
      title: 'Des symboles, pas seulement des chiffres',
      body: `LT ne compte pas : elle joue avec des symboles logiques.

Par exemple :

• p ∨ q  signifie « p ou q »
• ¬p  signifie « non p »
• p ⊃ q  signifie « si p, alors q »

C’est le langage des Principia Mathematica, un gros livre de Whitehead et Russell qui veut reconstruire les maths à partir de la logique.`,
    },
    {
      kind: 'quiz',
      title: 'Mini-défi',
      question: 'Quelle phrase décrit le mieux Logic Theorist ?',
      choices: [
        { id: 'a', text: 'Un programme qui additionne très vite', ok: false },
        { id: 'b', text: 'Un programme qui cherche des preuves avec des règles', ok: true },
        { id: 'c', text: 'Un robot qui parle français', ok: false },
      ],
      explain: 'Bravo ! LT raisonne : elle explore un arbre de possibilités avec des règles (substitution, modus ponens…).',
    },
  ],
};

export const CH2 = {
  pages: [
    {
      kind: 'story',
      title: 'Trois cerveaux à la RAND',
      body: `Newell et Simon travaillaient à la RAND Corporation, en Californie. Shaw était le vrai informaticien du trio.

Ils ont choisi les théorèmes du chapitre 2 des Principia Mathematica — pas pour réinventer la logique, mais parce qu’un exemplaire traînait sur l’étagère de Simon !`,
    },
    {
      kind: 'story',
      title: 'Des fiches 3 × 5',
      body: `Avant même d’avoir un programme sur ordinateur, ils ont écrit LT à la main, sur des fiches cartonnées.

En janvier 1956, Simon a réuni sa femme, ses trois enfants et quelques étudiants. Chaque personne tenait une fiche : elle devenait une « pièce » du programme.

Nature imitant l’art imitant la nature, disait-il.`,
    },
    {
      kind: 'story',
      title: 'Puis le JOHNNIAC',
      body: `Ensuite, Shaw a codé le tout dans un langage inventé pour l’occasion : IPL (Information Processing Language).

Le programme a tourné sur le JOHNNIAC, un ordinateur de la RAND nommé en hommage à John von Neumann.

Imagine une grande armoire pleine de tubes… et, quelque part dedans, la première vraie « pensée » automatique.`,
    },
    {
      kind: 'quiz',
      title: 'Qui faisait quoi ?',
      question: 'Qui a joué le rôle de « composant humain » du programme avant l’ordinateur ?',
      choices: [
        { id: 'a', text: 'Seulement des ingénieurs de la NASA', ok: false },
        { id: 'b', text: 'La famille de Simon et des étudiants, avec des fiches', ok: true },
        { id: 'c', text: 'Bertrand Russell en personne', ok: false },
      ],
      explain: 'Exact ! La première « exécution » de LT, c’était une simulation jouée par des humains.',
    },
  ],
};

export const CH3 = {
  pages: [
    {
      kind: 'story',
      title: 'Trois coups magiques',
      body: `LT n’essaie pas toutes les possibilités bêtement. Elle a des méthodes — un peu comme des sorts :

1. Substitution — renommer les lettres (p devient q, etc.)
2. Modus ponens (détachement) — de A et « A ⊃ B », conclure B
3. Raccourci (chaînage) — de « A ⊃ B » et « B ⊃ C », conclure « A ⊃ C »

Et des heuristiques : des règles du pouce pour ne pas se perdre dans l’arbre.`,
    },
    {
      kind: 'tiles',
      title: 'Touche les tuiles',
      body: 'Essaie chaque règle une fois. Tu verras un mini-exemple.',
      tiles: [
        {
          id: 'substitution',
          label: 'Substitution',
          demo: 'De (p ∨ p) ⊃ p, en mettant p := q, on obtient (q ∨ q) ⊃ q.',
        },
        {
          id: 'detachment',
          label: 'Modus ponens',
          demo: 'Si tu as p, et p ⊃ q, tu peux conclure q. On « détache » le q.',
        },
        {
          id: 'chain',
          label: 'Raccourci',
          demo: 'Si p ⊃ q et q ⊃ r, alors p ⊃ r. On saute l’étape du milieu.',
        },
      ],
    },
    {
      kind: 'quiz',
      title: 'Quel outil ?',
      question: 'Tu as « il pleut ⊃ le sol est mouillé » et « le sol est mouillé ⊃ les chaussures sont sales ». Que faire pour lier la pluie aux chaussures ?',
      choices: [
        { id: 'a', text: 'Substitution', ok: false },
        { id: 'b', text: 'Raccourci (chaînage)', ok: true },
        { id: 'c', text: 'Additionner 2 + 2', ok: false },
      ],
      explain: 'Oui : le raccourci enchaîne les deux implications.',
    },
  ],
};

export const CH5 = {
  pages: [
    {
      kind: 'story',
      title: '38 sur 52',
      body: `LT a prouvé 38 des 52 premiers théorèmes du chapitre 2 des Principia Mathematica.

Pour le théorème *2.85, elle a même trouvé une preuve plus courte et plus élégante que celle de Russell et Whitehead. Simon l’a montrée à Russell, qui « a réagi avec ravissement ».`,
    },
    {
      kind: 'story',
      title: 'Naissance de l’IA symbolique',
      body: `À l’été 1956, à Dartmouth, John McCarthy invente le mot « artificial intelligence ».

Newell et Simon y présentent LT. L’accueil est tiède — mais l’histoire retiendra que c’était l’un des tout premiers programmes d’IA : une machine qui cherche, avec des heuristiques, dans un espace de symboles.`,
    },
    {
      kind: 'story',
      title: '1 + 1 = 2… après des centaines de pages',
      body: `Les Principia veulent tout reconstruire : même 1 + 1 = 2.

La remarque célèbre apparaît avec la proposition *54·43 : « From this proposition it will follow, when arithmetical addition has been defined, that 1 + 1 = 2. »

Selon l’édition, c’est vers la page 360 (abrégé), 362 (2ᵉ édition) ou 379 (1ʳᵉ édition de 1910) du tome I. Autrement dit : après des centaines de pages de logique serrée.

La preuve complète de 1 + 1 = 2 arrive encore plus loin, dans le tome II.`,
    },
    {
      kind: 'quiz',
      title: 'Et toi ?',
      question: 'Pourquoi LT compte-t-elle dans l’histoire ?',
      choices: [
        { id: 'a', text: 'Parce qu’elle a inventé Internet', ok: false },
        {
          id: 'b',
          text: 'Parce qu’elle a montré qu’une machine peut découvrir des preuves par recherche heuristique',
          ok: true,
        },
        { id: 'c', text: 'Parce qu’elle a remplacé tous les mathématiciens', ok: false },
      ],
      explain: 'C’est ça. LT ouvre la voie de l’IA symbolique — et toi, tu viens de marcher dans ses pas.',
    },
  ],
};

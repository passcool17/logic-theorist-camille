# Logic Theorist Camille — SPEC

**Date :** 2026-11-09 (America/Toronto)
**Public :** Camille, 13 ans ; français québécois chaleureux
**Approbation :** Pascal « Oui, j'approuve le plan, go » (via APP)

## But
Jeu web éducatif 2D léger pour maîtriser Logic Theorist (1955–56, Newell, Simon, Shaw) : une machine qui raisonne, pas seulement calcule. Publier sur GitHub Pages `passcool17/logic-theorist-camille`.

## Contraintes
- HTML/CSS/JS vanilla (modules ES), aucune étape de build, aucune grosse dépendance
- Mobile d’abord (Samsung S20, 360×800), PWA (manifest + service worker versionné)
- Couleurs sauge `#6B8F71` / crème `#F7F1E3` / encre `#2C3A2F`
- Sauvegarde `localStorage` clé `lt.camille.v1`
- Aide sans pénalité (indice → montrer la réponse)
- Carnet de badges
- Ne pas copier le code de `dmoews/logic-theorist` ni `jeffshrager/IPL-V` (sans licence) — réécrire tout
- Ne pas toucher aux autres dépôts ; push normal sur `main` uniquement

## Architecture
```
index.html + style.css + favicon.svg + manifest.webmanifest + sw.js
js/main.js          — bootstrap UI / navigation
js/save.js          — localStorage
js/ui.js            — écrans partagés
js/chapters.js      — registre des 5 chapitres
js/logic/formula.js — AST ∨ ¬ ⊃, parse, égalité, pretty
js/logic/engine.js  — substitution, détachement, chaînage
js/logic/proofs.js  — 6 preuves Principia ch.2 accessibles + axiomes
js/chapters/ch1..ch5.js — contenu + mini-défis
tests/*.test.js     — Node --test
```

## Chapitres (5–10 min chacun)
1. Une machine qui raisonne — calculer vs raisonner + mini-défi
2. L’atelier de 1955 — Newell/Simon/Shaw, fiches, simulation humaine, IPL/JOHNNIAC
3. Les règles du jeu — tuiles Substitution, Modus ponens, Raccourci + heuristiques
4. Prouve comme LT — 6 preuves progressives (*2.01, *2.02, *2.05, *2.06, *2.08, *2.85 simplifié/accessible) avec arbre de recherche visuel ; moteur réellement correct
5. Pourquoi c’est important — 38/52, *2.85 plus élégant, Dartmouth 1956, Principia pour 13 ans (1+1=2 vers p.360–362 tome I selon édition ; prudence)

## Faits vérifiés (ne pas inventer)
- LT prouve 38 des 52 premiers théorèmes du ch.2 de Principia
- Preuve de *2.85 plus courte/élégante que Russell & Whitehead ; Russell « responded with delight »
- Simulation manuelle janv. 1956 (famille Simon + étudiants) sur fiches 3×5
- IPL sur JOHNNIAC (RAND) ; Dartmouth été 1956
- *54·43 (« From this proposition… 1+1=2 ») : ~p.360 (abrégé), 362 (2e éd.), 379 (1re éd. 1910) — dire « après des centaines de pages, vers la page 360 du tome I selon l’édition »

## Maquette ch.4
Robot JOHNNIAC rétro, arbre de recherche, tuiles Substitution / Modus ponens / Raccourci, tons sauge et crème.

## Critères de done
- Tests Node moteur + preuves (chacune résoluble) + save + progression : verts
- Revue indépendante : critiques/importants corrigés
- Pages Actions vert ; URL publique 200 ; hashes fichiers = locaux
- Captures `/workspace/lt-*.png` (360×800 + bureau)

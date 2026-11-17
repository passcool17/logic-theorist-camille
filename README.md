# Logic Theorist · Camille

Jeu web éducatif pour découvrir **Logic Theorist** (1955–56, Newell, Simon, Shaw) — le programme qui raisonne plutôt que de seulement calculer.

Fait pour **Camille** (13 ans) : français québécois chaleureux, mobile d’abord, couleurs sauge et crème, cinq chapitres courts, illustrations peintes (JOHNNIAC et chapitres, par le bot Atelier assets, voir `GAME.md`).

**Jouer :** https://passcool17.github.io/logic-theorist-camille/

## Lancer en local

```bash
npm test
npm run serve   # http://localhost:8891
```

Aucun build. HTML / CSS / JS modules ES.

## Contenu

1. Une machine qui raisonne  
2. L’atelier de 1955 (fiches, simulation humaine, JOHNNIAC)  
3. Les règles (substitution, modus ponens, raccourci)  
4. Prouve comme LT — 6 preuves accessibles du ch. 2 des Principia + arbre visuel, mode **guidé** ou **libre** (Camille choisit les lignes), et un atelier bonus de 6 nouveaux théorèmes *2 (*2.07, *2.2, *2.21, *2.03, *2.04, *2.11)  
5. Pourquoi c’est important (38/52, *2.85, Dartmouth, Principia pour 13 ans)

## Son et animations (v9)

Musique douce en boucle (MusicGen, CC BY-NC 4.0 → non commercial) et petits sons synthétisés ; rien ne joue avant le premier toucher. Bouton haut-parleur pour couper (touche M), volumes et « Moins d’animations » dans ⚙. Animations légères (Web Animations API), désactivées si `prefers-reduced-motion`. Détails, ressources et licences : `GAME.md`.

## Version 3D

La version campus 3D a été **retirée du site le 2026-11-09** à la demande de Pascal. Le code 3D reste dans l’historique git et sur la branche `feat/lt-3d`. L’accueil et `/simple/` servent la version 2D.

## Licence du code de ce dépôt

Code et textes originaux de ce jeu. **Ne copie pas** `dmoews/logic-theorist` ni `jeffshrager/IPL-V` (pas de licence claire) : on s’inspire seulement des idées historiques.

## Sauvegarde

`localStorage` clé `lt.camille.v1` (progression conservée ; réglages son / animations / mode ajoutés en v9 avec valeurs par défaut ; les saves v2 de l’ère 3D sont migrées). PWA avec service worker versionné (`lt-camille-v10`) et modules versionnés par import map.

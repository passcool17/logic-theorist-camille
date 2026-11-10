# GAME.md — Logic Theorist Camille

## Concept
Camille apprend Logic Theorist en cinq chapitres calmes. Le chapitre 4 est un mini-atelier de preuves avec un robot JOHNNIAC, un arbre de recherche et des tuiles de règles (visuel aligné sur la maquette de Pascal, nov. 2026).

## Version publiée
**2D seule** (racine du site), merge `85b3d1f` (PR #4 feat/lt-2d-maquette). La campus 3D a été retirée le **2026-11-09** à la demande de Pascal ; le code reste dans l’historique git et sur `feat/lt-3d`. `/simple/` redirige vers la racine.

## Contrôles
- Toucher / cliquer les cartes de chapitre
- Quiz (ch. 1, 2, 3, 5) : un mauvais choix laisse réessayer tout de suite (« Réessaie ») ; la bonne réponse débloque Continuer / Terminer
- Chapitre 3 : toucher les trois tuiles au moins une fois
- Chapitre 4 : choisir une tuile (Substitution / Modus ponens / Raccourci) puis « Essayer », ou glisser la tuile dans l’arbre ; indices sans pénalité ; l’arbre montre ✓ / ✕

## État (save)
```
lt.camille.v1 = {
  v: 1,
  chapter, completed, proofs, badges, helpUsed, settings, updatedAt
}
```
Les sauvegardes `v: 2` (ère 3D) sont acceptées : `completed` / `proofs` / `badges` sont conservés.

## Cache PWA
Service worker `lt-camille-v8` (incrémenter `CACHE` + `?v=` dans `index.html` / `sw.js` à chaque livraison jouable). L’activate supprime les anciens caches (`lt-camille-v1`…`v7`).

## Moteur
`js/logic/` — formules ∨ ¬ ⊃, substitution, détachement, chaînage. `js/proofplay.js` — mode guidé + arbre. `js/ui/art.js` / `js/ui/treeview.js` — JOHNNIAC et arbre. `js/quiz.js` — réessai quiz. Tests Node obligatoires. Les 6 preuves de `proofs.js` doivent rester `checkProof`-valides.

## Prochaines idées (non promises)
- Mode libre (choisir les lignes à la main, pas seulement guidé)
- Plus de théorèmes Principia
- Portrait JOHNNIAC illustré
- Mode « simulation fiches » coopératif

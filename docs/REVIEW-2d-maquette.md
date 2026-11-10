# Revue — 2D fidèle à la maquette de Pascal (feat/lt-2d-maquette)

Portée : visuel seulement. Moteur (`js/logic/*`), quiz (`js/quiz.js`) et sauvegarde (`lt.camille.v1`) inchangés.

## Vérifié
- `npm test` : 27/27 (22 existants + 5 nouveaux pour `js/proofplay.js` et le découpage des formules).
- `guidedTry` reprend exactement l’ancien `applyGuided` : même règle attendue, mêmes messages ; le moteur n’est appelé en plus que pour étiqueter l’essai rejeté (gris ✕), sans ajouter de ligne.
- Chrome headless 360×800 : aucun débordement horizontal (scrollWidth = 360), aucune erreur JS, écran du ch.4 tenu dans 800 px avec « Essayer / Continuer » visible.
- Toucher → sélection → Essayer ; glisser une tuile sur l’arbre (souris et toucher CDP) ; clavier via `click` (detail 0).
- Preuves à formules longues (*2.06, *2.85) : formules coupées au connecteur principal, arbre réduit au besoin (échelle ≥ 0,5) sans être coupé.
- Cache SW passé à `lt-camille-v8`, nouveaux modules ajoutés à la liste.

## Points ouverts / risques
- `touch-action: none` sur les tuiles : on ne peut pas faire défiler la page en partant d’une tuile (l’écran ch.4 tient sans défilement à 360×800).
- Le clic natif est ignoré 600 ms après un pointerup géré par le jeu (évite la double sélection ; Chrome perd parfois le clic juste après un glisser).
- Pas testé sur un vrai S20 ni dans Samsung Internet.

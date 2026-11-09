# Revue rapide — fix/lt3d-qa

## Changements
1. **Caméra campus** : pitch borné (`WALK_PITCH` ≈18°) via `js/3d/camera.js` ; hauteur recalculée après évitement labo (évite la plongée).
2. **Occlusion** : meshes du labo (toits + murs) fondent si le rayon caméra→Camille les traverse, ou s’ils sont très près de la caméra.
3. **Arbre ch.4** : nœuds/espacement agrandis (`NODE_RADIUS` 0.48, `NODE_STEP` 1.15) ; caméra + `setViewOffset` pour le placer au-dessus du panneau.
4. **Panneau ch.4** : footer épinglé (`.proof-footer`) ; état `is-done` compact (≤28 vh) avec « Preuve trouvée ! / Continuer » toujours visibles sans défiler.
5. **Cache** : `lt-camille-v6`.

## Tests
32 tests Node (29 existants + 3 caméra).

## Assessment
**Ready for merge:** Yes — corrections ciblées des 3 défauts QA ; republier autorisé par Pascal.

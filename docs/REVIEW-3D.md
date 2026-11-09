# Revue indépendante — monde 3D (feat/lt-3d)

## Strengths
- Unités pures testées : zones, tuiles, migration save v2 (29 tests)
- three r170 + import map ; `/simple/` conserve la 2D ; SW versionné
- Perf adaptative (DPR/ombres) pour S20 ; QA `?qa=1&zone=z4`

## Passes visuelles (v2 caméra + décor)
- Caméra trois-quarts éloignée (portrait dist≈18.5 / h≈12.5) ; Camille ~8–12 % hauteur
- Évitement boîte labo pour la caméra
- Lumière dorée fin d’après-midi, ciel shader, brouillard chaud, ACES
- Végétation : arbres arrondis, buissons, fleurs, herbe InstancedMesh, bancs, lampadaires
- Labo : toit, fenêtres, porte, tableau, fiches, rack JOHNNIAC
- Camille / JOHNNIAC / PNJ plus arrondis (capsules, sphères, visages)

## Assessment
**Ready for PR update (not merge):** Yes — attendre Pascal avant fusion/Pages.

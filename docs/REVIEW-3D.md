# Revue indépendante — monde 3D (feat/lt-3d)

## Strengths
- Unités pures testées : `zones.js`, `tiles.js`, migration save v2 (29 tests)
- Réutilise moteur logique / quiz / contenus 2D sans duplication métier
- three r170 vendored + import map ; SW `lt-camille-v3` ; `/simple/` conserve la 2D
- Perf adaptative (DPR/ombres) pour S20 ; QA `?qa=1&zone=z4`

## Issues corrigées avant PR
### Important
1. **Caméra** : lerp trop agressif / offset confus → suivi stabilisé derrière Camille
2. **Save v2** : migration explicite depuis v1 pour ne pas perdre badges/preuves

### Minor (reporté)
- Camille/JOHNNIAC low-poly (pas bake Vallée)
- PNJ non animés
- Arbre de preuve = piles de sphères (lisible, pas un vrai graphe spatial)
- `overflow:hidden` global dans `style.css` racine (OK pour 3D ; 2D a sa copie `/simple/style.css`)

## Assessment
**Ready for PR (not merge):** Yes — attendre accord Pascal avant fusion/Pages.

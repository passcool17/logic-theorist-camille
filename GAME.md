# GAME.md — Logic Theorist Camille

## Concept
Campus 3D cozy (sauge/crème) inspiré de Vallée des Maths : Camille marche en 3ᵉ personne, JOHNNIAC la suit, Newell/Simon/Shaw sont des PNJ. Cinq zones = cinq chapitres. La 2D reste en `/simple/`.

## Contrôles 3D
- WASD / flèches, joystick tactile
- `E` / bouton E : interagir (zone ou PNJ)
- Chapitre 4 : hub de preuves → tuiles Substitution / Modus ponens / Raccourci (un toucher = une étape) ; l’arbre 3D pousse dans la salle

## Contrôles 2D (`/simple/`)
- Cartes de chapitre, quiz avec réessai (« Réessaie »), tuiles ch.3, preuves guidées

## Progression
Zones séquentielles (`js/3d/zones.js`). Save v2 avec migration v1. Badges inchangés + déblocage de zones.

## Performance
`js/3d/perf.js` : DPR plafonné, paliers adaptatifs (ombres coupées si FPS bas). Pensé Samsung S20.

## QA
`/?qa=1&zone=z4&autostart=1` — aller vite au chapitre 4.

## Cache PWA
`lt-camille-v3`

## Prochaines idées
- Mode libre sur les lignes de preuve
- Camille plus détaillée (bake)
- Sons d’atelier doux

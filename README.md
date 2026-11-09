# Logic Theorist · Camille

Jeu web éducatif sur **Logic Theorist** (1955–56, Newell, Simon, Shaw).

- **Monde 3D** (accueil) : petit campus labo 1955, five zones, JOHNNIAC, PNJ.
- **Version simple 2D** : [/simple/](./simple/) — mêmes chapitres, panneau tactile.

**Jouer :** https://passcool17.github.io/logic-theorist-camille/

## Local

```bash
npm test
npm run serve   # http://localhost:8891
```

three.js r170 via import map (`vendor/three.module.min.js`), sans étape de build.

## QA rapide chapitre 4 (3D)

```
/?qa=1&zone=z4&autostart=1
```

Débloque les zones jusqu’à z4 et spawn près du socle de preuves.

## Sauvegarde

Clé `lt.camille.v1`, schéma **v2** (migration auto depuis v1) : `zones`, `pos`, `completed`, `proofs`, `badges`.

## Licence

Code original. Pas de copie de `dmoews/logic-theorist` ni `jeffshrager/IPL-V`.

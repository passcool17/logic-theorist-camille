# Logic Theorist · Camille

Jeu web éducatif pour découvrir **Logic Theorist** (1955–56, Newell, Simon, Shaw) — le programme qui raisonne plutôt que de seulement calculer.

Fait pour **Camille** (13 ans) : français québécois chaleureux, mobile d’abord, couleurs sauge et crème, cinq chapitres courts.

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
4. Prouve comme LT — 6 preuves accessibles du ch. 2 des Principia + arbre visuel  
5. Pourquoi c’est important (38/52, *2.85, Dartmouth, Principia pour 13 ans)

## Licence du code de ce dépôt

Code et textes originaux de ce jeu. **Ne copie pas** `dmoews/logic-theorist` ni `jeffshrager/IPL-V` (pas de licence claire) : on s’inspire seulement des idées historiques.

## Sauvegarde

`localStorage` clé `lt.camille.v1`. PWA avec service worker versionné (`lt-camille-v1`).

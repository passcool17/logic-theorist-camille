# Logic Theorist Camille Implementation Plan

> **For agentic workers:** Inline execution (économies crédits, pas de Cursor cloud).

**Goal:** Publier un jeu PWA éducatif 5 chapitres sur Logic Theorist pour Camille.

**Architecture:** Vanilla ES modules, moteur logique testé, UI mobile-first sauge/crème, SW versionné.

**Tech Stack:** HTML/CSS/JS, Node `--test`, GitHub Pages Actions.

## Global Constraints
- Pas de copie des repos sans licence ; push normal main ; `/workspace/games/logic-theorist-camille`

---

### Task 1: Moteur logique + tests
- Create: `js/logic/formula.js`, `js/logic/engine.js`, `js/logic/proofs.js`, `tests/*.test.js`
- [x] Formules AST, parse, subst, MP, chaînage, 6 preuves résolubles

### Task 2: Shell PWA + save + chapitres 1–5
- Create: `index.html`, `style.css`, `js/*`, `manifest`, `sw.js`
- [x] Navigation, badges, aide, localStorage

### Task 3: Docs + repo + Pages + vérif
- Create: README, GAME, workflow ; `gh repo create` ; push ; hash 200 ; captures ; revue

# GAME.md — Logic Theorist Camille

## Concept
Camille (13 ans) apprend Logic Theorist en cinq chapitres calmes. Le chapitre 4 est un atelier de preuves avec JOHNNIAC, un arbre de recherche et des tuiles de règles (visuel aligné sur la maquette de Pascal, nov. 2026).

## Version publiée
**v9** (`lt-camille-v9`, nov. 2026) — 2D seule à la racine. La campus 3D a été retirée le 2026-11-09 ; son code reste dans l’historique git et sur `feat/lt-3d`. `/simple/` redirige vers la racine.

Nouveau en v9 (parties B et C approuvées par Pascal le 2026-11-16) :
- **Son** : musique douce en boucle + petits sons (toucher, choix, étape réussie, preuve trouvée, essai raté, page). Rien ne joue avant le premier toucher. Bouton haut-parleur (coupe / remet le son, touche **M**), réglages Musique / Effets / Moins d’animations dans l’écran ⚙ « Réglages et à propos ». Tout est sauvegardé.
- **Animations** : glissement entre écrans, carte d’entrée de chapitre (~1,5 s, touche pour passer), nœud d’arbre qui apparaît et trait qui se dessine à chaque étape, JOHNNIAC qui respire / cligne des yeux, saute de joie (étincelles) quand la preuve est trouvée et penche la tête avec une bulle « ? » quand l’essai rate. `prefers-reduced-motion` ou le réglage « Moins d’animations » → durées ~0, pas de carte de chapitre, pas d’étincelles.
- **Mode libre** au chapitre 4 (bouton Guidé / Libre, mémorisé) : Camille choisit la règle, touche elle-même la ou les lignes, et pour la Substitution choisit ce que devient chaque lettre (p, q, r, ¬p, ¬q, ¬r) avec aperçu du résultat. Effacer la dernière ligne, indice puis « toute la recette ». Max 8 lignes trouvées par preuve. Le mode guidé reste disponible.
- **Illustrations peintes** (partie A, Atelier assets) : JOHNNIAC en 4 humeurs + héros + tête, 5 images de chapitres, 3 icônes de règles ; polissage (cartes qui répondent au doigt, chapitre en deux colonnes en paysage).
- **6 nouveaux théorèmes** des Principia (*2), section « Atelier libre » (bonus, pas obligatoire pour le chapitre 5).
- Correctif : le défi *2.85 était codé avec une formule qui n’était pas une tautologie (`¬q ∨ p` au lieu de `¬¬q ∨ p` pour « ¬q ⊃ p ») ; corrigé, et il est maintenant présenté honnêtement comme « défi inspiré de *2.85 » (le vrai *2.85 est `((p ∨ q) ⊃ (p ∨ r)) ⊃ (p ∨ (q ⊃ r))`). Un test vérifie par table de vérité que chaque but et chaque ligne de départ des 12 preuves est une tautologie.

## Contrôles
- Toucher / cliquer les cartes de chapitre
- Quiz (ch. 1, 2, 3, 5) : un mauvais choix laisse réessayer tout de suite ; la bonne réponse débloque Continuer
- Chapitre 3 : toucher les trois tuiles au moins une fois
- Chapitre 4, **guidé** : choisir une tuile puis « Essayer », ou glisser la tuile dans l’arbre ; indices sans pénalité ; l’arbre montre ✓ / ✕
- Chapitre 4, **libre** : 1) une règle, 2) une ligne (Substitution) ou deux lignes (Modus ponens, Raccourci), 3) Appliquer
- Haut-parleur : coupe / remet le son (aussi touche M) ; ⚙ : volumes et animations

## Les 12 preuves
| id | Principia | Énoncé | Mode |
|---|---|---|---|
| p208 | *2.08 | p ⊃ p | LT (obligatoire) |
| p202 | *2.02 | q ⊃ (p ⊃ q) | LT |
| p201 | *2.01 | (p ⊃ ¬p) ⊃ ¬p | LT |
| p205 | *2.05 | (q ⊃ r) ⊃ ((p ⊃ q) ⊃ (p ⊃ r)) | LT |
| p206 | *2.06 | (p ⊃ q) ⊃ ((q ⊃ r) ⊃ (p ⊃ r)) | LT |
| p285 | défi inspiré de *2.85 | (p ∨ q) ⊃ (¬q ⊃ p) | LT |
| p207 | *2.07 | p ⊃ (p ∨ p) | bonus v9 |
| p22 | *2.2 | p ⊃ (p ∨ q) | bonus v9 |
| p221 | *2.21 | ¬p ⊃ (p ⊃ q) | bonus v9 |
| p203 | *2.03 | (p ⊃ ¬q) ⊃ (q ⊃ ¬p) | bonus v9 |
| p204 | *2.04 | [p ⊃ (q ⊃ r)] ⊃ [q ⊃ (p ⊃ r)] | bonus v9 |
| p211 | *2.11 | p ∨ ¬p (tiers exclu) | bonus v9 (utilise *2.1 : ¬p ∨ p, donné) |

Énoncés des bonus vérifiés le 2026-11-16 sur Metamath (set.mm, qui cite [WhiteheadRussell] avec la page) : pm2.07 (p. 101), orc = *2.2 (p. 104), pm2.21 (p. 104), con2 = *2.03 (p. 100), pm2.04 (p. 100), exmid = *2.11 (p. 101), pm2.1 (p. 101). Comme dans les Principia (*1.01), « a ⊃ b » à l’intérieur d’une formule est codé `¬a ∨ b` pour le moteur ; l’écran montre la forme ⊃. Le lemme de p206 est un cas de *2.04 (c’est aussi ainsi que les Principia prouvent *2.06).

## État (save)
```
lt.camille.v1 = {
  v: 1,
  chapter, completed, proofs, badges, helpUsed,
  settings: { reduceMotion, muted, music (0..1), sfx (0..1), proofMode: 'guided'|'free' },
  updatedAt
}
```
Clé et `v: 1` inchangées. Les vieilles saves (sans les nouveaux réglages) reçoivent les valeurs par défaut (`normalizeSettings`, test de migration dans `tests/save.test.js`). Les saves `v: 2` (ère 3D) restent acceptées. Badges ajoutés : `proof-p207`…`proof-p211`, `libre` (une preuve en mode libre), `chercheuse` (les 6 bonus). `logicienne` reste lié aux 6 preuves de LT.

## Version / cache
- `APP_VERSION` (js/main.js), `CACHE` (sw.js) et tous les `?v=` = **`lt-camille-v9`**.
- Les modules sont versionnés par l’**import map** de `index.html` (chaque `./js/…js` → `…js?v=lt-camille-v9`) : à chaque livraison, remplacer la version partout (index.html, sw.js, main.js). Un test vérifie que les trois sont alignés et que chaque module est dans l’import map et le précache.
- Le SW précache avec `cache: 'reload'` (évite de précacher un vieux module du cache HTTP) et laisse passer les requêtes `Range`.

## Illustrations (partie A — livrées par Atelier assets, intégrées en v9)
Peintes pour ce jeu par le bot **Atelier assets · 2D & 3D** le 2026-11-16 (direction approuvée par Pascal à 20 h 20, heure de Toronto). Source et détails : `/workspace/assets/logic-theorist-camille/MANIFEST.md` (planche `preview-final.png`, sources dans `src/`, non publiées). Copiées dans `assets/art/` (14 fichiers, 380 223 octets ; les 11 WebP sont précachés, les 3 SVG sont copiés en ligne dans `js/ui/art.js` pour suivre `currentColor`).

| Fichier | Taille | Utilisé dans |
|---|---|---|
| `johnniac-hero.webp` | 586×720 | accueil (grand JOHNNIAC qui salue, `fetchpriority="high"`) |
| `johnniac-idle/thinking/happy/oops.webp` | 391×480, transparent | hub ch.4 et scène de preuve : smile→idle, indice ouvert→thinking, preuve trouvée→happy, essai raté→oops |
| `johnniac-head.webp` | 120×120 (affiché ~34 px) | logo et bulles de JOHNNIAC |
| `ch1-machine.webp` … `ch5-why-it-matters.webp` | 960×720 | carte d’entrée de chapitre + bandeau de la 1re page (`loading="lazy"` pour le bandeau) |
| `rule-substitution/detachment/chain.svg` | grille 24 | tuiles de règles (ch.3, ch.4) et icônes d’essais ratés dans l’arbre |

Les trois chercheurs du ch.2 et l’élève du ch.4 sont des personnages inventés (pas des portraits de Newell, Simon ou Shaw). Les anciens SVG maison de JOHNNIAC restent dans `js/ui/art.js` (`johnniacSVG`) comme secours, non utilisés. Pour changer une image : remplacer le fichier, garder les dimensions de `js/ui/assets.js` (le test vérifie la vraie taille du WebP), monter la version.

## Ressources et licences
| Ressource | Source | Licence |
|---|---|---|
| Code, textes, SVG d’interface | écrits pour ce jeu | dépôt privé de Pascal |
| `assets/art/*` (11 WebP + 3 SVG) | faits pour ce projet par le bot Atelier assets · 2D & 3D (images générées par IA puis détourées / compressées ; SVG dessinés à la main), voir MANIFEST.md | originaux pour ce projet, aucun élément tiers |
| `assets/audio/music-loop.mp3` (19,5 s, 157 Ko, mono 64 kb/s) | généré le 2026-11-16 avec **MusicGen** (`facebook/musicgen-small`, CPU, `/home/box/opt/musicgen`), prompt « soft calm celesta and warm pad, slow, peaceful, gentle vintage computer lab lullaby, loopable », puis bouclé (fondu croisé 3 s) et normalisé (~-20 LUFS) avec ffmpeg | poids du modèle sous **CC BY-NC 4.0** (Meta) → usage non commercial seulement |
| Effets sonores | synthétisés en Web Audio (`js/audio.js`), aucun fichier | — |
| Énoncés Principia | Whitehead & Russell (domaine public), vérifiés sur Metamath set.mm | — |

Aucune dépendance npm ajoutée (pas de howler / gsap : Web Audio et Web Animations suffisent). Ne copie pas `dmoews/logic-theorist` ni `jeffshrager/IPL-V` (pas de licence claire).

## Moteur
`js/logic/` — formules ∨ ¬ ⊃, substitution, détachement, chaînage. `js/proofplay.js` — mode guidé (`guidedTry`), mode libre (`freeTry`, `SUBST_PALETTE`, `FREE_MAX_LINES`) et arbre. `js/audio.js` — bus musique / effets. `js/ui/motion.js` — animations (WAAPI, transform/opacity). `js/ui/assets.js` — emplacements d’illustrations. Tests Node obligatoires (`npm test`) ; les 12 preuves doivent rester `checkProof`-valides et chaque preuve doit se résoudre en mode libre.

## Prochaines idées (non promises)
- Vignettes de chapitre sur l’accueil (aujourd’hui : petites icônes)
- Écouter la musique sur le S20 et ajuster le volume par défaut si besoin (je n’ai pas pu l’écouter, seulement la mesurer)
- Mode libre : glisser une ligne sur une autre au lieu de toucher
- D’autres théorèmes *2 (ex. *2.12 p ⊃ ¬¬p, *2.14 ¬¬p ⊃ p), le vrai *2.85 en défi avancé
- Mode « simulation fiches » coopératif

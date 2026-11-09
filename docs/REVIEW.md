# Revue de code indépendante — 2026-11-09

## Strengths
- Moteur logique réel (AST, subst, MP, chaînage) avec 19 tests Node verts
- 6 preuves `checkProof`-valides ; pas de copie des dépôts sans licence
- PWA versionnée ; save localStorage tolérante ; UI mobile sauge/crème
- Faits historiques prudents (38/52, *2.85, pages *54·43 selon édition)

## Issues corrigées avant publication
### Important
1. **SW `cache.addAll` fragile** — un 404 cassait toute l’install → `cache.add` individuel avec catch
2. **Chapitre 4 non marqué terminé** si on quittait après la 6ᵉ preuve sans cliquer → auto `markChapterDone('ch4')`
3. **Clé `goal` dupliquée** dans preuve *2.02 → nettoyée

### Minor (reporté)
- Mode libre (choix manuel des lignes) non implémenté — guidé volontaire pour 13 ans
- `settings.reduceMotion` non exposé dans l’UI
- *2.85 en forme accessible, pas la preuve historique complète

## Assessment
**Ready to publish: Yes (with fixes above applied)**

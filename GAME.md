# GAME.md — Logic Theorist Camille

## Concept
Camille apprend Logic Theorist en cinq chapitres calmes. Le chapitre 4 est un mini-atelier de preuves avec un robot JOHNNIAC, un arbre de recherche et des tuiles de règles.

## Contrôles
- Toucher / cliquer les cartes de chapitre
- Quiz : un choix ; la bonne réponse est mise en évidence
- Chapitre 3 : toucher les trois tuiles au moins une fois
- Chapitre 4 : toucher Substitution / Modus ponens / Raccourci dans le bon ordre guidé ; indices sans pénalité

## État (save)
```
lt.camille.v1 = {
  v: 1,
  chapter, completed, proofs, badges, helpUsed, settings, updatedAt
}
```

## Moteur
`js/logic/` — formules ∨ ¬ ⊃, substitution, détachement, chaînage. Tests Node obligatoires. Les 6 preuves de `proofs.js` doivent rester `checkProof`-valides.

## Prochaines idées (non promises)
- Mode libre (choisir les lignes à la main, pas seulement guidé)
- Plus de théorèmes Principia
- Portrait JOHNNIAC illustré
- Mode « simulation fiches » coopératif

# Notes de migration (19 septembre 2026)

Source : les fichiers `recettes*.json` et `livres.json` de « Index-de-mes-recettes ».

- 19 202 recettes au départ, **19 158** à l'arrivée, réparties dans 148 dossiers de livres.
- 43 doublons parfaits (même id, contenu identique) : une seule copie gardée.
- Recette 14318 (« Trempette chaude s'mores », livre 88) présente deux fois avec une seule différence (`ingredientPrincipal` : « chocolat, pomme » ou « chocolat ») : version « chocolat, pomme » gardée.
- **Deux id étaient utilisés par deux recettes de livres différents.** Le livre 72 a gardé les siens; les recettes du livre 73 ont reçu de nouveaux id :
  - 13429 « Le Poire sour » (livre 73) → 30180
  - 13430 « Le Vermouth cassis » (livre 73) → 30181
  Si un favori, une note ou une entrée d'agenda avait été enregistré sur l'un de ces deux id, il est à refaire.
- Nettoyage : le mot « null » écrit en texte dans `image` remplacé par une vraie valeur vide (11 recettes), champ `catégorie` → `categorie` (17), champ ` image` avec espace → `image` (1), espaces au début de 4 titres retirés.
- Aucun texte de recette n'a été modifié.
- Le livre « The Martha Stewart Living Cookbook » n'a encore aucune recette (fichier vide `[]`).
- Les fichiers vides `recettes7`, `recettes9`, `recettes10` et `recettesLivre21` ne sont plus nécessaires.

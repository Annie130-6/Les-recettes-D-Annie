# Les recettes d'Annie

Index de mes livres de recettes (site GitHub Pages).

## Organisation

```
index.html
css/style.css
js/config.js          ← adresse des photos (à modifier ici seulement)
js/app.js             ← le programme
data/livres.json      ← la liste des livres (un champ "dossier" par livre)
livres/
  001-kitchen-galerie/
    recettes.json     ← les recettes de ce livre
    images/           ← (à venir) les nouvelles photos de ce livre
  002-.../
```

## Ajouter un livre

1. Ajouter une ligne dans `data/livres.json` avec un `id` neuf et un `dossier` (ex. `149-nom-du-livre`).
2. Créer `livres/149-nom-du-livre/recettes.json` avec les recettes du livre.
3. Si le fichier d'un livre est abîmé, le site affiche un avertissement jaune avec le nom du livre et continue de fonctionner pour tous les autres.

## Photos

- Anciennes photos : elles restent là où elles sont; l'adresse est dans `js/config.js`.
- Nouvelles photos : les mettre dans `livres/<dossier>/images/` et écrire dans le champ `image` de la recette : `livres/<dossier>/images/<id-de-la-recette>.jpg`.

## Important

Ne jamais changer l'`id` d'une recette : les favoris, notes, agenda et épicerie sont enregistrés avec cet id.

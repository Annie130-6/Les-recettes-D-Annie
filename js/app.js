let livres = [];
let recettes = [];

const pageLivres = document.getElementById("pageLivres");
const pageRecettes = document.getElementById("pageRecettes");
const pageFavoris = document.getElementById("pageFavoris");
const pageIngredients = document.getElementById("pageIngredients");
const search = document.getElementById("search");
const results = document.getElementById("results");
const pageEpicerie = document.getElementById("pageEpicerie");


function afficherAvertissement(message) {
  document.body.insertAdjacentHTML('afterbegin', `<p style="background:#fff3cd;color:#664d03;padding:10px;margin:0">${message}</p>`);
}

// Adresse d'une photo. Anciennes photos : lues à l'adresse IMAGES_BASE (voir js/config.js).
// Nouvelles photos : écrire dans le champ image "livres/<dossier>/images/<nom>.jpg".
function urlImage(img) {
  if (!img) return "";
  if (img.startsWith("livres/")) return PHOTOS_BASE + img;
  if (/^https?:\/\//.test(img) || img.startsWith("livres/")) return img;
  return IMAGES_BASE + (img.includes("/") ? img : "app-complete/" + img);
}

function urlCouverture(couv) {
  if (!couv) return "";
  if (couv.startsWith("livres/")) return PHOTOS_BASE + couv;
  if (/^https?:\/\//.test(couv) || couv.startsWith("livres/")) return couv;
  return IMAGES_BASE + couv;
}

async function chargerDonnees() {
  const version = Date.now();
  const echecs = [];
  try {
    const rL = await fetch(`data/livres.json?v=${version}`);
    if (!rL.ok) throw new Error(`data/livres.json introuvable (${rL.status})`);
    livres = await rL.json();
  } catch (err) {
    document.body.insertAdjacentHTML('afterbegin', `<p style="background:red;color:white">ERREUR: impossible de charger la liste des livres (${err.message})</p>`);
    afficherLivres();
    return;
  }

  // Chaque livre a son propre fichier : si l'un est abîmé, seul ce livre est touché.
  const morceaux = await Promise.all(livres.map(async (livre) => {
    if (!livre.dossier) return [];
    try {
      const r = await fetch(`livres/${livre.dossier}/recettes.json?v=${version}`);
      if (!r.ok) throw new Error(`fichier introuvable (${r.status})`);
      const data = await r.json();
      if (!Array.isArray(data)) throw new Error("le fichier n'est pas une liste");
      return data;
    } catch (err) {
      echecs.push(`${livre.titre} (${err.message})`);
      return [];
    }
  }));

  recettes = morceaux.flat().sort((a, b) => a.id - b.id);
  if (echecs.length) {
    afficherAvertissement(`⚠️ ${echecs.length} livre(s) n'ont pas pu être chargés : ${echecs.join(" ; ")}`);
  }
  afficherLivres();
}



function allerALaFin() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}




function cacherPages() {
  pageLivres.style.display = "none";
  pageRecettes.style.display = "none";
  pageFavoris.style.display = "none";
  pageIngredients.style.display = "none";
  pageAgenda.style.display = "none";
  pageEpicerie.style.display = "none";
}

function carteLivreHTML(livre) {
  return `
      <div class="livre carte-livre">
        <img src="${urlCouverture(livre.couverture)}" alt="${livre.titre}" loading="lazy" decoding="async">
        <div>
      <h3>${livre.titre}</h3>
          <p>${[livre.langue, livre.nbRecettes ? livre.nbRecettes + " recettes" : null, livre.statut].filter(Boolean).join(" · ")}</p>
          <button onclick="afficherRecettesDuLivre(${livre.id})">Ouvrir le livre</button>
        </div>
      </div>
      <hr>
    `;
}

let nombreAfficheLivres = 60;
let triLivresMode = "defaut"; // "alpha" | "recentAncien" | "ancienRecent"

function trierListeLivres(liste) {
  const copie = [...liste];
  if (triLivresMode === "alpha") {
    copie.sort((a, b) => a.titre.localeCompare(b.titre, "fr", { sensitivity: "base" }));
  } else if (triLivresMode === "recentAncien") {
    copie.sort((a, b) => b.id - a.id);
  } else if (triLivresMode === "ancienRecent") {
    copie.sort((a, b) => a.id - b.id);
  }
  return copie;
}

function trierLivresAlpha() {
  triLivresMode = triLivresMode === "alpha" ? "defaut" : "alpha";
  rendreLivres();
}

function trierLivresDate() {
  triLivresMode = triLivresMode === "recentAncien" ? "ancienRecent" : "recentAncien";
  rendreLivres();
}


function afficherLivres() {
  cacherPages();
  pageLivres.style.display = "block";
  nombreAfficheLivres = 60;
  rendreLivres();
}

function rendreLivres() {
  const listeTriee = trierListeLivres(livres);

  let html = `<h2>📚 Mes livres (${livres.length})</h2>
    <button class="btn-scroll-jump" onclick="sauterDeCartes(25)">⏩ +25</button>
    <div class="tri-boutons">
      <button onclick="trierLivresAlpha()">🔤 ${triLivresMode === "alpha" ? "✓ " : ""}A → Z</button>
      <button onclick="trierLivresDate()">📅 ${triLivresMode === "ancienRecent" ? "Plus ancien → récent" : "Plus récent → ancien"}</button>
    </div>`;

  listeTriee.slice(0, nombreAfficheLivres).forEach(livre => {
    html += carteLivreHTML(livre);
  });

  if (livres.length > nombreAfficheLivres) {
    html += `<button class="btn-scroll-jump" onclick="afficherPlusDeLivres()">⏩ Afficher 60 de plus (${livres.length - nombreAfficheLivres} restants)</button>`;
  }

  pageLivres.innerHTML = html;
}


function afficherPlusDeLivres() {
  nombreAfficheLivres += 60;
  rendreLivres();
}

function sauterDeCartes(nombre) {
  window.scrollBy({ top: nombre * 220, behavior: "smooth" });
}



function carteRecetteHTML(recette) {
  let etoiles = "";
  for (let n = 1; n <= 3; n++) {
    const pleine = noteDe(recette.id) >= n ? " etoile-pleine" : "";
    etoiles += `<span class="etoile${pleine}" onclick="noter(${recette.id}, ${n})">★</span>`;
  }
  const coeur = estFavori(recette.id) ? "❤️" : "🤍";
  const panier = estDansEpicerie(recette.id) ? "🛒" : "🧺";

  return `

<div class="carte-recette">
      ${recette.image ? `<img src="${urlImage(recette.image)}" alt="${recette.titre}" class="photo-recette" loading="lazy" decoding="async" onerror="this.style.display='none'">` : ""}




      <div class="contenu-recette">

            <h3 onclick="ouvrirDetailRecette(${recette.id})" style="cursor:pointer">${recette.titre}</h3>



    
      <p>${(livres.find(l => l.id === recette.livreId) || {}).titre || ""}${recette.page ? ` · Page ${recette.page}` : ""} · ${categoriesDeRecette(recette).map(c => `<span class="cat-tag" onclick="retirerCategorie(${recette.id}, '${c.replace(/'/g,"\\'")}')">${c} ✕</span>`).join(" ")}</p>


                  ${recette.ingredients && recette.ingredients.length ? `<p class="ing-liste">${recette.ingredients.join(", ")}</p>` : ""}

      ${recette.preparation && recette.preparation.length ? `<p class="prep-liste">${recette.preparation.map((etape, i) => `${i + 1}. ${etape}`).join("<br>")}</p>` : ""}


      <div>${etoiles}<span class="coeur" onclick="basculerFavori(${recette.id})">${coeur}</span><span class="panier" onclick="ouvrirModalEpicerie(${recette.id}, '${recette.titre.replace(/'/g, "\\'")}')">${panier}</span></div>



      <button onclick="ouvrirModalAgenda(${recette.id}, '${recette.titre.replace(/'/g, "\\'")}')">📅 Ajouter à l'agenda</button>
      <button onclick="ajouterIngredients(${recette.id})">🥕 Ingrédients</button>




      <button onclick="ajouterCategorie(${recette.id})">🏷️ Ajouter une catégorie</button>
      ${recette.source ? `<a href="${recette.source}" target="_blank" rel="noopener" class="btn-source">🔗 Voir la recette originale</a>` : ""}
      </div>
    </div>
    <hr>
  `;
}
 
      






let livreActuelId = null;
let recettesLivreBase = [];

  function afficherRecettesDuLivre(livreId) {
    recettesLivreBase = recettes.filter(r => r.livreId === livreId);
    afficherRecettes(recettesLivreBase);
    livreActuelId = livreId;
  }

let recettesActuelles = [];
let nombreAffiche = 60;
let triRecettesMode = "defaut"; // "alpha" | "recentAncien" | "ancienRecent"

function trierListeRecettes(liste) {
  const copie = [...liste];
  if (triRecettesMode === "alpha") {
    copie.sort((a, b) => a.titre.localeCompare(b.titre, "fr", { sensitivity: "base" }));
  } else if (triRecettesMode === "recentAncien") {
    copie.sort((a, b) => b.id - a.id);
  } else if (triRecettesMode === "ancienRecent") {
    copie.sort((a, b) => a.id - b.id);
  }
  return copie;
}

function trierRecettesAlpha() {
  triRecettesMode = triRecettesMode === "alpha" ? "defaut" : "alpha";
  rendreRecettes();
}

function trierRecettesDate() {
  triRecettesMode = triRecettesMode === "recentAncien" ? "ancienRecent" : "recentAncien";
  rendreRecettes();
}


function afficherRecettes(liste) {
  cacherPages();
  pageRecettes.style.display = "block";
  livreActuelId = null;
  recettesActuelles = liste;
  nombreAffiche = 60;
  rendreRecettes();
}


function ouvrirDetailRecette(id) {
  const recette = recettes.find(r => r.id === id);
  if (!recette) return;
  const livre = (livres.find(l => l.id === recette.livreId) || {}).titre || "";
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-recette-overlay" id="modalRecetteOverlay" onclick="if(event.target===this) fermerDetailRecette()">
      <div class="modal-recette-box">
        <button class="btn-fermer-recette" onclick="fermerDetailRecette()">✕</button>

        ${(() => {
          const imgs = (recette.images && recette.images.length ? recette.images : (recette.image ? [recette.image] : []));
          if (!imgs.length) return "";
          const tags = imgs.map(img => `<img src="${urlImage(img)}" alt="${recette.titre}">`).join("");
          return imgs.length > 1 ? `<div class="galerie-recette">${tags}</div>` : tags;
        })()}


        
        <h2>${recette.titre}</h2>
        <p>${livre}${recette.page ? ` · Page ${recette.page}` : ""}</p>
        ${recette.ingredients && recette.ingredients.length ? `<h3>Ingrédients</h3><p>${recette.ingredients.join(", ")}</p>` : ""}
        ${recette.preparation && recette.preparation.length ? `<h3>Préparation</h3><p>${recette.preparation.map((e,i)=>`${i+1}. ${e}`).join("<br>")}</p>` : ""}
      </div>
    </div>
  `);
}
function fermerDetailRecette() {
  const el = document.getElementById('modalRecetteOverlay');
  if (el) el.remove();
}



function rendreRecettes() {
  const liste = trierListeRecettes(recettesActuelles);

  let html = `<div class="filtres">
    <button class="btn-mode" onclick="basculerMode()">Mode : ${modeCategories}</button>
    <div class="chips">`;
  toutesLesCategories().forEach(c => {
    const actif = categoriesChoisies.includes(c) ? " chip-actif" : "";
    html += `<span class="chip${actif}" onclick="basculerCategorie('${c.replace(/'/g, "\\'")}')">${c}</span>`;
  });
  html += `</div></div>`;

  html += `<div class="tri-boutons">
    <button onclick="trierRecettesAlpha()">🔤 ${triRecettesMode === "alpha" ? "✓ " : ""}A → Z</button>
    <button onclick="trierRecettesDate()">📅 ${triRecettesMode === "ancienRecent" ? "Plus ancien → récent" : "Plus récent → ancien"}</button>
  </div>`;

  html += `<h2>🍽️ Recettes (${liste.length})</h2>`;

  liste.slice(0, nombreAffiche).forEach(recette => {
    html += carteRecetteHTML(recette);
  });

  if (liste.length > nombreAffiche) {
    html += `<button class="btn-scroll-jump" onclick="afficherPlusDeRecettes()">⏩ Afficher 60 de plus (${liste.length - nombreAffiche} restantes)</button>`;
  }

  results.innerHTML = html;
}



function afficherPlusDeRecettes() {
  nombreAffiche += 60;
  rendreRecettes();
}







function afficherFavoris() {
  cacherPages();
  pageFavoris.style.display = "block";
  pageFavoris.innerHTML = "<h2>⭐ Favoris</h2><p>Bientôt disponible.</p>";
}

let rechercheIngredient = "";

function afficherIngredients() {
  cacherPages();
  pageIngredients.style.display = "block";

  const compte = {};

  const ingredientsIgnores = new Set(["sel", "poivre", "beurre non sale","poivre noir", " beurre non sale froid", "sel et poivre", "beurre non salé", "beurre non sale", "huile de canola", "eau", "poivre noir moulu", "eau froide", "poivre noir frais moulu", "beurre", "huile", "huile d'olive", "eau", "sucre"]);


   recettes.forEach(r => {
    const mots = new Set();
    ingredientsDeRecette(r).forEach(i => {
      const propre = sansAccents(i);
      if (!ingredientsIgnores.has(propre)) mots.add(propre);
    });
    mots.forEach(m => compte[m] = (compte[m] || 0) + 1);
  });



  const liste = Object.keys(compte)
    .filter(m => compte[m] >= 1)
    .filter(m => m.includes(sansAccents(rechercheIngredient)))
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }));


  let html = `<h2>🥕 Ingrédients (${liste.length})</h2>
    <input id="chercheIng" placeholder="Filtrer les ingrédients..." value="${rechercheIngredient}">
    <div class="chips">`;
  liste.forEach(m => {
    html += `<span class="chip ${ingredientsChoisis.includes(m) ? "chip-actif" : ""}" onclick="toggleIngredient('${m}')">${m} (${compte[m]})</span>`;
  });
  html += `</div>`;


   if (ingredientsChoisis.length > 0) {
  const recettesMatch = recettes.filter(r => {
    const ingredientsRecette = ingredientsDeRecette(r).map(i => sansAccents(i));
    return ingredientsChoisis.every(choisi =>
      ingredientsRecette.some(i => i.includes(choisi))
    );
  });
  html += `<h3>🍽️ Recettes (${recettesMatch.length})</h3>`;
  recettesMatch.forEach(recette => {
    html += carteRecetteHTML(recette);
  });
}

  

  pageIngredients.innerHTML = html;
 



  


  pageIngredients.innerHTML = html;

  const champ = document.getElementById("chercheIng");
  champ.addEventListener("input", () => {
    rechercheIngredient = champ.value;
    afficherIngredients();
    document.getElementById("chercheIng").focus();
  });
}


function toggleIngredient(mot) {
  const m = sansAccents(mot);
  if (ingredientsChoisis.includes(m)) {
    ingredientsChoisis = ingredientsChoisis.filter(i => i !== m);
  } else {
    ingredientsChoisis.push(m);
  }

afficherIngredients();

  
}




  function sansAccents(texte) {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

let timerRecherche = null;
search.addEventListener("input", () => {
  clearTimeout(timerRecherche);
  timerRecherche = setTimeout(appliquerFiltres, 300);
});



chargerDonnees();


const pageAgenda = document.getElementById("pageAgenda");
const btnAgenda = document.getElementById("btnAgenda");
let anneeAffichee = new Date().getFullYear();
let moisAffiche = new Date().getMonth();
let recetteEnCoursId = null;
let recetteEnCoursTitre = null;

btnAgenda.addEventListener("click", () => {
  cacherPages();
  pageAgenda.style.display = "block";
  afficherAgenda();
});

function chargerAgenda() {
  const data = localStorage.getItem("agendaRecettes");
  return data ? JSON.parse(data) : {};
}

function sauvegarderAgenda(agenda) {
  localStorage.setItem("agendaRecettes", JSON.stringify(agenda));
}

function ouvrirModalAgenda(recetteId, titre) {
  recetteEnCoursId = recetteId;
  recetteEnCoursTitre = titre;
  document.getElementById("modalTitreRecette").textContent = titre;
  document.getElementById("modalDateInput").value = new Date().toISOString().split("T")[0];
  document.getElementById("modalAgenda").style.display = "flex";
}

document.getElementById("modalAnnuler").addEventListener("click", () => {
  document.getElementById("modalAgenda").style.display = "none";
});

document.getElementById("modalConfirmer").addEventListener("click", () => {
  const date = document.getElementById("modalDateInput").value;
  if (!date) { alert("Choisis une date."); return; }
  const agenda = chargerAgenda();
  if (!agenda[date]) agenda[date] = [];
  agenda[date].push({ id: recetteEnCoursId, titre: recetteEnCoursTitre });
  sauvegarderAgenda(agenda);
  document.getElementById("modalAgenda").style.display = "none";
  afficherAgenda();
});

function afficherAgenda() {
  cacherPages();
  pageAgenda.style.display = "block";

  const agenda = chargerAgenda();
  const premierJour = new Date(anneeAffichee, moisAffiche, 1);
  const nbJours = new Date(anneeAffichee, moisAffiche + 1, 0).getDate();
  let premierJourSemaine = premierJour.getDay();
  premierJourSemaine = premierJourSemaine === 0 ? 6 : premierJourSemaine - 1;

  const nomsMois = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

  let html = `
    <h2>📅 Agenda</h2>
    <div class="agenda-nav">
  <button onclick="moisPrecedent()">◀</button>
  <strong>${nomsMois[moisAffiche]} ${anneeAffichee}</strong>
  <button onclick="moisSuivant()">▶</button>
  <button onclick="ajouterAgendaAEpicerie()">🛒 Ajouter le mois à l'épicerie</button>
</div>

    <div class="agenda-grille">
      <div class="agenda-entete">Lun</div>
      <div class="agenda-entete">Mar</div>
      <div class="agenda-entete">Mer</div>
      <div class="agenda-entete">Jeu</div>
      <div class="agenda-entete">Ven</div>
      <div class="agenda-entete">Sam</div>
      <div class="agenda-entete">Dim</div>
  `;

  for (let i = 0; i < premierJourSemaine; i++) {
    html += `<div class="agenda-case agenda-vide"></div>`;
  }

  for (let jour = 1; jour <= nbJours; jour++) {
    const dateStr = `${anneeAffichee}-${String(moisAffiche+1).padStart(2,"0")}-${String(jour).padStart(2,"0")}`;
    const recettesJour = agenda[dateStr] || [];

    html += `<div class="agenda-case"><div class="agenda-jour">${jour}</div>`;
    recettesJour.forEach((r, index) => {
      html += `<div class="agenda-recette"><span class="agenda-titre-recette" onclick="voirIngredientsAgenda(${r.id})">${r.titre}</span> <span class="agenda-supprimer" onclick="supprimerDuCalendrier('${dateStr}', ${index})">✕</span></div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  pageAgenda.innerHTML = html;
}

function moisPrecedent() {
  moisAffiche--;
  if (moisAffiche < 0) { moisAffiche = 11; anneeAffichee--; }
  afficherAgenda();
}

function moisSuivant() {
  moisAffiche++;
  if (moisAffiche > 11) { moisAffiche = 0; anneeAffichee++; }
  afficherAgenda();
}

function voirIngredientsAgenda(id) {
  const recette = recettes.find(r => r.id === id);
  if (!recette) return;
  const ingredients = ingredientsDeRecette(recette);
  const liste = ingredients.length ? ingredients.join(", ") : "Aucun ingrédient noté";
  alert(recette.titre + " :\n\n" + liste);
}



function supprimerDuCalendrier(dateStr, index) {
  const agenda = chargerAgenda();
  agenda[dateStr].splice(index, 1);
  if (agenda[dateStr].length === 0) delete agenda[dateStr];
  sauvegarderAgenda(agenda);
  afficherAgenda();
}

const btnLivres = document.getElementById("btnLivres");
const btnRecettes = document.getElementById("btnRecettes");
const btnFavoris = document.getElementById("btnFavoris");
const btnIngredients = document.getElementById("btnIngredients");
const btnEpicerie = document.getElementById("btnEpicerie");

btnLivres.addEventListener("click", afficherLivres);
btnRecettes.addEventListener("click", () => afficherRecettes(recettes));
btnFavoris.addEventListener("click", () => afficherRecettes(recettes.filter(r => estFavori(r.id))));
btnIngredients.addEventListener("click", afficherIngredients);
btnEpicerie.addEventListener("click", afficherEpicerie);

// ===== CATÉGORIES : mapping et nettoyage =====

let categoriesChoisies = [];
let ingredientsChoisis = [];
let modeCategories = "ET";
let catsAjoutees = {};

let catsRetirees = JSON.parse(localStorage.getItem("categoriesRetirees") || "{}");

function chargerCatsAjoutees() {
  const data = localStorage.getItem("categoriesRecettes");
  catsAjoutees = data ? JSON.parse(data) : {};
}
chargerCatsAjoutees();

// Livres 100% asiatiques -> tag "Asiatique" ajouté automatiquement
const livresAsiatiques = new Set([2, 22, 23, 24]);

// Table de correspondance ancienne catégorie -> catégorie atomique
const mappingCategories = {
  // Viandes et volailles
  "Canard mulard": "Canard",
  "Jambon et charcuteries": "Charcuterie",
  "Volaille": "Poulet/Volaille",

  // Poissons et fruits de mer
  "Poissons": "Poisson",
  "Fruits de mer": "Fruits de mer",

  // Entrées, bouchées, soupes
  "Entrées": "Entrée",
  "Bouchées froides": "Entrée",
  "Bouchées chaudes": "Entrée",
  "Bouchées dessert": "Dessert",
  "Soupes": "Soupe",
  "Soupes et potages": "Soupe",
  "Soupes réconfortantes": "Soupe",
  "Entrées allégées": "Entrée",
  "Trempettes et tartinade": "Trempette",
  "Salsas et trempettes": "Trempette",

  // Sucré
  "Desserts": "Dessert",
  "Petites douceurs": "Dessert",
  "Jolies salades de fruits": "Dessert",
  "Flambées - Fruits": "Dessert",
  "Crêpes": "Crêpes",

  // Sauces, marinades, vinaigrettes, condiments
  "Sauces": "Sauce",
  "Sauces à fondue": "Sauce",
  "Sauces, beurres, moutardes et mayonnaises": "Sauce",
  "Sauces et tartinades à sandwichs": "Sauce",
  "Marinades": "Marinade",
  "Marinades et glaçages salés": "Marinade",
  "Vinaigrettes": "Vinaigrette",
  "Condiments": "Conserve/Condiment",
  "Conserves": "Conserve/Condiment",
  "Conserves et provisions": "Conserve/Condiment",

  // Salades, pâtes, riz, pains
  "Salades": "Salade",
  "Salades de pommes de terre": "Salade",
  "Festin de salades": "Salade",
  "Saines salades-repas": "Salade",
  "Un légume toute une salade": "Salade",
  "Voyages pour papilles": "Salade",
  "Pâtes": "Pâtes",
  "Pâtes à la viande": "Pâtes",
  "Pâtes au poisson et fruits de mer": "Pâtes",
  "Pâtes au poulet": "Pâtes",
  "Pâtes sans viande": "Pâtes",
  "Riz, pâtes et cie": "Pâtes",
  "Riz": "Riz",
  "Pains": "Pains",

  // Légumes, accompagnements, boissons, fondues
  "Légumes": "Légumes",
  "Légumes et plats d'accompagnement": "Légumes",
  "Légumes d'accompagnement": "Légumes",
  "Légumes d'accompagnement et potages": "Légumes",
  "Accompagnements": "Accompagnement",
  "Boissons": "Boisson",
  "Cocktails": "Boisson",
  "Cocktails et boissons": "Boisson",
  "Breuvages": "Boisson",
  "Fondues": "Fondue",

  // Sandwich/burger, méthodes de cuisson
  "Sandwiches": "Sandwich/Burger",
  "Sandwichs et burgers": "Sandwich/Burger",
  "Sandwichs et pain": "Sandwich/Burger",
  "Hamburgers et sandwichs": "Sandwich/Burger",
  "Burgers et sandwichs": "Sandwich/Burger",
  "Autocuiseur": "Autocuiseur",
  "Mijoteuse": "Mijoteuse",
  "Vive la mijoteuse!": "Mijoteuse",
  "Plats tout-en-un": "Mijoteuse",
  "Mijotés express": "Mijoteuse",
  "Fumoir": "Fumoir",
  "Sous-vide": "Sous-vide",

  // Thématiques diverses
  "Saveurs d'ailleurs": "Mijoteuse",
  "Mets traditionnels": "Mijoteuse",
  "Essentiels": "Sauce",
  "Tapas, sangria et fiesta": "Entrée",
  "Repas d'été": "Plat principal",
  "Repas express": "Plat principal",
  "Divers": "Plat principal",

  // Plats principaux génériques
  "Plat": "Plat principal",
  "Plats principaux": "Plat principal",
  "Plats principaux express": "Plat principal",
};

// Catégories "fourre-tout" à trier selon l'ingrédient principal
const categoriesAMelanger = new Set([
  "Viandes",
  "Bœuf et porc",
  "Flambées - Viandes",
  "Poissons et fruits de mer",
  "Flambées - Poissons et fruits de mer",
  "Maraîcher",
  "Grisantes grillades",
  "Sur planche de cèdre",
  "Épatantes papillotes",
  "Mixed grill",
  "Brochettes",
]);

const ingredientVersCategorieViande = {
  "bœuf": "Bœuf", "boeuf": "Bœuf",
  "porc": "Porc",
  "agneau": "Agneau",
  "veau": "Veau",
  "poulet": "Poulet/Volaille",
  "dindon": "Dindon", "dinde": "Dindon",
  "canard": "Canard",
  "jambon": "Charcuterie", "bacon": "Charcuterie",
  "saucisse": "Charcuterie", "saucisses": "Charcuterie",
  "smoked meat": "Charcuterie", "salami": "Charcuterie",
};

const ingredientVersCategoriePoisson = {
  "saumon": "Poisson", "thon": "Poisson", "morue": "Poisson",
  "truite": "Poisson", "tilapia": "Poisson", "doré": "Poisson",
  "sole": "Poisson", "flétan": "Poisson", "aiglefin": "Poisson",
  "cabillaud": "Poisson", "brochet": "Poisson", "mahi-mahi": "Poisson",
  "achigan": "Poisson", "sardines": "Poisson", "anchois": "Poisson",
  "lotte": "Poisson", "rouget": "Poisson", "omble": "Poisson",
  "crevette": "Fruits de mer", "crevettes": "Fruits de mer",
  "homard": "Fruits de mer", "crabe": "Fruits de mer",
  "moules": "Fruits de mer", "pétoncle": "Fruits de mer",
  "pétoncles": "Fruits de mer", "huîtres": "Fruits de mer",
  "palourdes": "Fruits de mer", "calmar": "Fruits de mer",
  "calmars": "Fruits de mer", "langoustines": "Fruits de mer",
};

// Catégories mixtes entrée/soupe -> triées selon le titre
const categoriesMixtesEntreeSoupe = new Set([
  "Soupes, entrées et accompagnements",
  "Antipasti et soupes",
]);
const motsClesSoupe = ["soupe", "crème de", "potage", "velouté", "chaudrée", "consommé", "bisque"];

function trierEntreeOuSoupe(titre) {
  const t = (titre || "").toLowerCase();
  return motsClesSoupe.some(mot => t.includes(mot)) ? "Soupe" : "Entrée";
}

function categorieFinale(categorieBrute, ingredientPrincipal, titre) {
  if (!categorieBrute) return null;

  if (categoriesMixtesEntreeSoupe.has(categorieBrute)) {
    return trierEntreeOuSoupe(titre);
  }

  if (categoriesAMelanger.has(categorieBrute)) {
    const ing = (ingredientPrincipal || "").toLowerCase();
    for (const cle in ingredientVersCategorieViande) {
      if (ing.includes(cle)) return ingredientVersCategorieViande[cle];
    }
    for (const cle in ingredientVersCategoriePoisson) {
      if (ing.includes(cle)) return ingredientVersCategoriePoisson[cle];
    }
    return "Légumes"; // repli pour Maraîcher etc. si aucun match viande/poisson
  }

  return mappingCategories[categorieBrute] || categorieBrute;
}

function categoriesDeRecette(r) {
  const base = [];
  if (Array.isArray(r.categories)) base.push(...r.categories);

  const catNettoyee = categorieFinale(r.categorie, r.ingredientPrincipal, r.titre);
  if (catNettoyee) base.push(catNettoyee);

  if (livresAsiatiques.has(r.livreId)) base.push("Asiatique");

  const ajout = catsAjoutees[r.id] || [];
  const retires = catsRetirees[r.id] || [];
  return [...new Set([...base, ...ajout])].filter(c => !retires.includes(c));
}

function retirerCategorie(recetteId, cat) {
  if (!catsRetirees[recetteId]) catsRetirees[recetteId] = [];
  if (!catsRetirees[recetteId].includes(cat)) catsRetirees[recetteId].push(cat);
  if (catsAjoutees[recetteId]) {
    catsAjoutees[recetteId] = catsAjoutees[recetteId].filter(c => c !== cat);
  }
  localStorage.setItem("categoriesRetirees", JSON.stringify(catsRetirees));
  localStorage.setItem("categoriesRecettes", JSON.stringify(catsAjoutees));
  appliquerFiltres();
}

function toutesLesCategories() {
  return [
    "Accompagnement","Agneau","Apéro", "Asiatique","Autocuiseur",
    "Bœuf","Boisson",
    "Canard","Charcuterie","Comment faire","Conserve/Condiment","Crêpes",
    "Dessert","Dindon",
    "Entrée","Fondue","Fromage maison","Fruits de mer","Fumoir",
    "Indien","Légumes",
    "Marinade","Mélange d'épices","Mexicain","Mijoteuse",
    "Noël","Pains","Pâtes","Pizza","Plat principal","Poisson","Porc",
    "Poulet/Volaille","Quiche","Riz",
    "Salade","Sandwich/Burger","Sauce","Sous-vide","Soupe",
    "Trempette","Veau","Vinaigrette","Viande vieillie",
  ];
}

function ajouterCategorie(recetteId) {
  const c = prompt("Nouvelle catégorie pour cette recette :");
  if (!c || !c.trim()) return;
  if (!catsAjoutees[recetteId]) catsAjoutees[recetteId] = [];
  if (!catsAjoutees[recetteId].includes(c.trim())) catsAjoutees[recetteId].push(c.trim());
  localStorage.setItem("categoriesRecettes", JSON.stringify(catsAjoutees));
  appliquerFiltres();
}

function basculerCategorie(cat) {
  if (categoriesChoisies.includes(cat)) {
    categoriesChoisies = categoriesChoisies.filter(c => c !== cat);
  } else {
    categoriesChoisies.push(cat);
  }
  appliquerFiltres();
}

function basculerMode() {
  modeCategories = modeCategories === "ET" ? "OU" : "ET";
  appliquerFiltres();
}










  function appliquerFiltres() {
  const mots = sansAccents(search.value).split(/\s+/).filter(m => m);
  const choisies = categoriesChoisies.map(sansAccents);

      const base = livreActuelId ? recettesLivreBase : recettes;
    const filtres = base.filter(r => {


        const cats = categoriesDeRecette(r).map(sansAccents);
    const ingr = ingredientsDeRecette(r).map(sansAccents);
    const champs = sansAccents(r.titre) + " " + cats.join(" ") + " " + ingr.join(" ");


    const okTexte = mots.every(m => champs.includes(m));
    const okCats = choisies.length === 0 ? true
      : modeCategories === "ET"
      ? choisies.every(c => cats.includes(c))
      : choisies.some(c => cats.includes(c));
    const okIng = ingredientsChoisis.length === 0 ? true
      : ingredientsChoisis.every(i => ingr.includes(i));
    
    return okTexte && okCats && okIng;
  });



      recettesActuelles = filtres;
    nombreAffiche = 60;
    rendreRecettes();
  }




let notes = JSON.parse(localStorage.getItem("notesRecettes") || "{}");
let favoris = JSON.parse(localStorage.getItem("favorisRecettes") || "[]");

let ingredientsEpicerie = JSON.parse(localStorage.getItem("ingredientsEpicerie") || "{}");

function sauvegarderIngredientsEpicerie() {
  localStorage.setItem("ingredientsEpicerie", JSON.stringify(ingredientsEpicerie));
}

function estDansEpicerie(id) { return !!ingredientsEpicerie[id]; }

function estDansEpicerie(id) { return !!ingredientsEpicerie[id]; }

let recetteEpicerieEnCoursId = null;

function ouvrirModalEpicerie(recetteId, titre) {
  recetteEpicerieEnCoursId = recetteId;
  const recette = recettes.find(r => r.id === recetteId);
  const ingredients = ingredientsDeRecette(recette);
  const dejaChoisis = ingredientsEpicerie[recetteId] || [];


  document.getElementById("modalEpicerieTitre").textContent = titre;
  let html = "";
  ingredients.forEach(ing => {
    const checked = dejaChoisis.includes(ing) ? "checked" : "";
    html += `<label><input type="checkbox" value="${ing.replace(/"/g, "&quot;")}" ${checked}> ${ing}</label><br>`;
  });
  document.getElementById("modalEpicerieListe").innerHTML = html;
  document.getElementById("modalEpicerie").style.display = "flex";
}

document.getElementById("modalEpicerieAnnuler").addEventListener("click", () => {
  document.getElementById("modalEpicerie").style.display = "none";
});

document.getElementById("modalEpicerieConfirmer").addEventListener("click", () => {
  const cases = document.querySelectorAll("#modalEpicerieListe input[type=checkbox]:checked");
  const choisis = Array.from(cases).map(c => c.value);
  if (choisis.length) {
    ingredientsEpicerie[recetteEpicerieEnCoursId] = choisis;
  } else {
    delete ingredientsEpicerie[recetteEpicerieEnCoursId];
  }
  sauvegarderIngredientsEpicerie();
  document.getElementById("modalEpicerie").style.display = "none";
  appliquerFiltres();
});


function noteDe(id) {
  if (notes[id] !== undefined) return notes[id];
  const r = recettes.find(r => r.id === id);
  return (r && r.note) || 0;
}
function estFavori(id) {
  if (favoris.includes(id)) return true;
  const r = recettes.find(r => r.id === id);
  return !!(r && r.favori);
}



function noter(id, n) {
  notes[id] = (notes[id] === n) ? 0 : n;
  localStorage.setItem("notesRecettes", JSON.stringify(notes));
  appliquerFiltres();
}

function basculerFavori(id) {
  favoris = estFavori(id) ? favoris.filter(f => f !== id) : [...favoris, id];
  localStorage.setItem("favorisRecettes", JSON.stringify(favoris));
  appliquerFiltres();
}



const motsIgnores = new Set(["de","des","du","la","le","les","au","aux","et","en","avec",
"pour","ma","mon","mes","sa","son","ses","un","une","dans","sur","sous","par","ou","a",
"l","d","the","style","facon","facile","maison","rapide","petits","petites","petit",
"petite","grand","grande","notre","nos","leur","qui","que","plus","tres","bon",
"bonne","meilleur","meilleure","classique","simple"]);


let ingAjoutes = JSON.parse(localStorage.getItem("ingredientsRecettes") || "{}");

let epicerieCoches = JSON.parse(localStorage.getItem("epicerieCoches") || "{}");
let epicerieMasques = new Set(JSON.parse(localStorage.getItem("epicerieMasques") || "[]"));


function ingredientsDeRecette(r) {
  const base = Array.isArray(r.ingredients) ? r.ingredients : (r.ingredientPrincipal ? [r.ingredientPrincipal] : []);

  const ajout = ingAjoutes[r.id] || [];
  return [...new Set([...base, ...ajout])];
}

function ajouterIngredients(recetteId) {
  const saisie = prompt("Ingrédients (séparés par des virgules) :",
    (ingAjoutes[recetteId] || []).join(", "));
  if (saisie === null) return;
  const liste = saisie.split(",").map(s => s.trim()).filter(s => s);
  if (liste.length) ingAjoutes[recetteId] = liste;
  else delete ingAjoutes[recetteId];
  localStorage.setItem("ingredientsRecettes", JSON.stringify(ingAjoutes));
  appliquerFiltres();
}

function toggleCocheIngredient(cle) {
  epicerieCoches[cle] = !epicerieCoches[cle];
  localStorage.setItem("epicerieCoches", JSON.stringify(epicerieCoches));
}

function supprimerIngredientsCoches() {
  Object.keys(epicerieCoches).forEach(cle => {
    if (epicerieCoches[cle]) {
      epicerieMasques.add(cle);
      delete epicerieCoches[cle];
    }
  });
  localStorage.setItem("epicerieCoches", JSON.stringify(epicerieCoches));
  localStorage.setItem("epicerieMasques", JSON.stringify([...epicerieMasques]));
  afficherEpicerie();
}

function ajouterAgendaAEpicerie() {
  const agenda = chargerAgenda();
  const prefixe = anneeAffichee + "-" + String(moisAffiche + 1).padStart(2, "0");
  let compteur = 0;
  Object.keys(agenda).forEach(date => {
    if (date.startsWith(prefixe)) {
      agenda[date].forEach(evenement => {
        if (!ingredientsEpicerie[evenement.id]) {
          const recette = recettes.find(r => r.id === evenement.id);
          if (recette) {
            ingredientsEpicerie[evenement.id] = ingredientsDeRecette(recette);
            compteur++;
          }
        }
      });
    }
  });
  sauvegarderIngredientsEpicerie();
  afficherEpicerie();
}




  function afficherEpicerie() {
  cacherPages();
  pageEpicerie.style.display = "block";

  const idsSelectionnes = Object.keys(ingredientsEpicerie).map(Number);
    
const recettesSelectionnees = recettes.filter(r => idsSelectionnes.includes(r.id));


  if (recettesSelectionnees.length === 0) {
    pageEpicerie.innerHTML = `<h2>🛒 Liste d'épicerie</h2>
      <p>Aucune recette sélectionnée. Coche des recettes (🧺) ou ajoute ton agenda du mois.</p>`;
    return;
  }

  const groupes = {};
  recettesSelectionnees.forEach(r => {
    (ingredientsEpicerie[r.id] || []).forEach(ing => {

      const cle = sansAccents(ing.trim());
      if (epicerieMasques.has(cle)) return;
if (!groupes[cle]) {

        groupes[cle] = { affichage: ing.trim(), recettes: [] };
      }
      groupes[cle].recettes.push(r.titre);
    });
  });

  const clesTriees = Object.keys(groupes).sort((a, b) => a.localeCompare(b, "fr"));

  let html = `<h2>🛒 Liste d'épicerie (${recettesSelectionnees.length} recette${recettesSelectionnees.length > 1 ? "s" : ""})</h2>
    <button onclick="viderEpicerie()">Vider la liste</button>
    <button onclick="supprimerIngredientsCoches()">Supprimer les articles cochés</button>

    <ul class="liste-epicerie">`;

  clesTriees.forEach(cle => {
    const groupe = groupes[cle];
    const recettesPourIng = [...new Set(groupe.recettes)].join(", ");
    const cocheAttr = epicerieCoches[cle] ? "checked" : "";
    const cleEchappee = cle.replace(/'/g, "\\'");
    html += `<li><input type="checkbox" ${cocheAttr} onchange="toggleCocheIngredient('${cleEchappee}')"> ${groupe.affichage} <em>(${recettesPourIng})</em></li>`;

  });

  html += `</ul>`;
  pageEpicerie.innerHTML = html;
}


function viderEpicerie() {
  ingredientsEpicerie = {};
  epicerieCoches = {};
  epicerieMasques = new Set();
  localStorage.setItem("epicerieCoches", JSON.stringify(epicerieCoches));
  localStorage.setItem("epicerieMasques", JSON.stringify([...epicerieMasques]));

  sauvegarderIngredientsEpicerie();
  afficherEpicerie();
}



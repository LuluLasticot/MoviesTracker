// src/app.ts

import { chargerFilms, afficherFilms } from "./controllers/FilmController";
import { Film } from "./models/Film";
import { searchMoviesOnTMDB } from "./api/tmdb"; // AJOUT AUTO-COMPLETE
import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";

// On va stocker nos films dans un tableau global (en mémoire)
let films: Film[] = [];
let genreChoices: Choices | null = null;
let filmEnCoursDeModification: number | null = null; // servira plus tard pour "modifier un film"

// Pour l'autocomplete
let suggestionBox: HTMLUListElement | null = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Charger et afficher les films
    films = await chargerFilms();
    afficherFilms(films);

    // 2. Mettre à jour le compteur
    updateMovieCount();

    // 3. Initialiser Choices.js pour le sélecteur "genres"
    const genreSelect = document.getElementById("genres") as HTMLSelectElement;
    if (genreSelect) {
      genreChoices = new Choices(genreSelect, {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: "Sélectionnez un ou plusieurs genres",
      });
    }

    // 4. Gérer le bouton "Ajouter un film"
    const addButton = document.getElementById("ajouter-film-btn");
    if (addButton) {
      addButton.addEventListener("click", (event) => {
        event.preventDefault();
        ajouterNouveauFilm();
      });
    }

    const sortSelect = document.querySelector(".sort-select") as HTMLSelectElement;
    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
        trierFilms(sortSelect.value);
        });
    }

    // 5. Initialiser l'autocomplete sur le champ "film-title"
    initAutocomplete(); // AJOUT AUTO-COMPLETE

  } catch (error) {
    console.error("Erreur lors du chargement initial :", error);
  }
});

/* =========================================================
   AUTO-COMPLETION TMDB
   ========================================================= */
function initAutocomplete(): void {
  const titleInput = document.getElementById("film-title") as HTMLInputElement;
  if (!titleInput) return;

  // Créer un <ul> pour la liste de suggestions
  suggestionBox = document.createElement("ul");
  suggestionBox.classList.add("autocomplete-list");

  // Pour que la liste soit positionnée juste sous le champ, 
  // on place 'position: relative' sur le parent si besoin.
  // On va insérer la suggestionBox dans le parent du champ
  const parent = titleInput.parentElement;
  if (parent) {
    parent.style.position = "relative"; // s'assure que le <ul> sera bien positionné
    parent.appendChild(suggestionBox);
  }

  // Écoute de l'événement "input"
  titleInput.addEventListener("input", async () => {
    const query = titleInput.value.trim();
    if (query.length < 2) {
      clearSuggestions();
      return;
    }
    try {
      const results = await searchMoviesOnTMDB(query);
      showSuggestions(results, titleInput);
    } catch (error) {
      console.error("Erreur auto-complétion TMDB :", error);
    }
  });
}

function trierFilms(critere: string) {
    if (critere === "Note") {
      // tri décroissant par note
      films.sort((a, b) => b.note - a.note);
    } else if (critere === "Titre") {
      // tri alphabétique
      films.sort((a, b) => a.titre.localeCompare(b.titre));
    } else if (critere === "Année") {
      // tri décroissant par année
      films.sort((a, b) => b.annee - a.annee);
    }
  
    afficherFilms(films);
  }

// Affiche la liste de suggestions (top 5)
function showSuggestions(movies: any[], inputEl: HTMLInputElement) {
  clearSuggestions();
  if (!suggestionBox) return;

  const top5 = movies.slice(0, 5);
  top5.forEach((movie: any) => {
    const li = document.createElement("li");
    const year = movie.release_date ? movie.release_date.substring(0, 4) : "????";
    li.textContent = `${movie.title} (${year})`;

    li.addEventListener("click", () => {
      // On remplit le champ titre
      inputEl.value = movie.title;
      // On préremplit l'affiche (hidden input)
      fillFormWithTMDB(movie);
      // On efface la liste de suggestions
      clearSuggestions();
    });

    suggestionBox!.appendChild(li);
  });
}

function clearSuggestions() {
  if (suggestionBox) {
    suggestionBox.innerHTML = "";
  }
}

/**
 * Remplit certains champs (affiche, année...) avec les infos du film TMDB
 */
function fillFormWithTMDB(movie: any) {
  // 1. Récupérer l'année depuis "release_date"
  const anneeSelect = document.getElementById("annee") as HTMLSelectElement;
  if (movie.release_date) {
    const releaseYear = movie.release_date.substring(0, 4);
    // On essaie de sélectionner l'année si elle existe dans la liste
    anneeSelect.value = releaseYear;
  }

  // 2. Récupérer l'affiche
  const posterPath = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/400x600?text=No+Poster";

  // 3. Stocker ça dans le champ hidden "affiche"
  const afficheHiddenInput = document.getElementById("affiche") as HTMLInputElement;
  if (afficheHiddenInput) {
    afficheHiddenInput.value = posterPath;
  }

  // 4. (Optionnel) on peut aussi remplir le synopsis, etc.
  // => movie.overview
  const synopsisTextarea = document.getElementById("synopsis") as HTMLTextAreaElement;
  if (synopsisTextarea && movie.overview) {
    synopsisTextarea.value = movie.overview;
  }
}

/* =========================================================
   FONCTION : Ajouter un nouveau film dans la liste
   ========================================================= */
function ajouterNouveauFilm(): void {
  try {
    // Récupérer chaque champ
    const titleInput = document.getElementById("film-title") as HTMLInputElement;
    const anneeSelect = document.getElementById("annee") as HTMLSelectElement;
    const dureeInput = document.getElementById("duree") as HTMLInputElement;
    const realisationsInput = document.getElementById("realisations") as HTMLInputElement;
    const distributionInput = document.getElementById("distribution") as HTMLInputElement;
    const synopsisTextarea = document.getElementById("synopsis") as HTMLTextAreaElement;
    const noteSelect = document.getElementById("note") as HTMLSelectElement;
    const dateVisionnageInput = document.getElementById("dateVisionnage") as HTMLInputElement;
    const plateformeSelect = document.getElementById("plateforme") as HTMLSelectElement;
    const afficheHiddenInput = document.getElementById("affiche") as HTMLInputElement;

    // Genres via Choices.js
    let selectedGenres: string[] = [];
    if (genreChoices) {
      selectedGenres = genreChoices.getValue(true) as string[];
    } else {
      const genreSelect = document.getElementById("genres") as HTMLSelectElement;
      if (genreSelect) {
        selectedGenres = Array.from(genreSelect.selectedOptions).map(opt => opt.value);
      }
    }

    // Parser réalisations et distribution
    const realisations = realisationsInput.value
      .split(",")
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const distributions = distributionInput.value
      .split(",")
      .map(d => d.trim())
      .filter(d => d.length > 0);

    // Construire ou incrémenter un nouvel ID
    const maxId = films.length > 0 ? Math.max(...films.map(f => f.id)) : 0;
    const newId = maxId + 1;

    // Soit on est en mode "édition", soit en mode "création"
    if (filmEnCoursDeModification != null) {
      // MODE ÉDITION
      const film = films.find(f => f.id === filmEnCoursDeModification);
      if (!film) {
        console.error("Film introuvable pour la modification");
        return;
      }
    
      // On met à jour les champs
      film.titre = titleInput.value || "Titre inconnu";
      film.annee = parseInt(anneeSelect.value, 10) || 1900;
      film.genres = selectedGenres;
      film.duree = parseInt(dureeInput.value, 10) || 120;
      film.realisateur = realisations.join(", ");
      film.acteurs = distributions;
      film.synopsis = synopsisTextarea.value || "";
      film.note = parseFloat(noteSelect.value) || 0;
      film.dateDeVisionnage = dateVisionnageInput.value || "";
      film.plateforme = plateformeSelect.value || "Autre";
      film.affiche = afficheHiddenInput.value || "https://via.placeholder.com/400x600?text=No+Poster";
    
      // On sort du mode édition
      filmEnCoursDeModification = null;
    
      // On remet le bouton à "Ajouter un film"
      const addButton = document.getElementById("ajouter-film-btn") as HTMLButtonElement;
      addButton.textContent = "Ajouter un film";
    
      // On réaffiche
      afficherFilms(films);
      updateMovieCount();
      resetForm();
      return;
    }
    

    // Sinon, on crée un nouveau Film
    const newFilm = new Film(
      newId,
      titleInput.value || "Titre inconnu",
      parseInt(anneeSelect.value, 10) || 1900,
      selectedGenres,
      parseInt(dureeInput.value, 10) || 120,
      realisations.join(", "),
      distributions,
      synopsisTextarea.value || "",
      parseFloat(noteSelect.value) || 0,
      dateVisionnageInput.value || "",
      plateformeSelect.value || "Autre",
      afficheHiddenInput?.value || "https://via.placeholder.com/400x600?text=No+Poster"
    );

    films.push(newFilm);
    afficherFilms(films);
    updateMovieCount();
    resetForm();
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un nouveau film :", error);
  }
}

/* =========================================================
   FONCTION : Mise à jour du compteur
   ========================================================= */
function updateMovieCount(): void {
  const movieCountElement = document.querySelector(".movie-count span");
  if (movieCountElement) {
    movieCountElement.textContent = String(films.length).padStart(2, "0");
  }
}

/* =========================================================
   FONCTION : Réinitialiser le formulaire
   ========================================================= */
function resetForm(): void {
  const titleInput = document.getElementById("film-title") as HTMLInputElement;
  titleInput.value = "";

  if (genreChoices) {
    genreChoices.clearStore();
    genreChoices.setChoiceByValue([]);
  } else {
    const genreSelect = document.getElementById("genres") as HTMLSelectElement;
    if (genreSelect) {
      Array.from(genreSelect.selectedOptions).forEach(opt => opt.selected = false);
    }
  }

  const anneeSelect = document.getElementById("annee") as HTMLSelectElement;
  anneeSelect.value = "2025";

  const dureeInput = document.getElementById("duree") as HTMLInputElement;
  dureeInput.value = "120";

  const realisationsInput = document.getElementById("realisations") as HTMLInputElement;
  realisationsInput.value = "";

  const distributionInput = document.getElementById("distribution") as HTMLInputElement;
  distributionInput.value = "";

  const synopsisTextarea = document.getElementById("synopsis") as HTMLTextAreaElement;
  synopsisTextarea.value = "";

  const noteSelect = document.getElementById("note") as HTMLSelectElement;
  noteSelect.value = "0";

  const dateVisionnageInput = document.getElementById("dateVisionnage") as HTMLInputElement;
  dateVisionnageInput.value = "";

  const plateformeSelect = document.getElementById("plateforme") as HTMLSelectElement;
  plateformeSelect.value = "Netflix";

  const afficheHiddenInput = document.getElementById("affiche") as HTMLInputElement;
  if (afficheHiddenInput) {
    afficheHiddenInput.value = "";
  }
}

// app.ts (à la suite de ton code)
export function supprimerFilm(id: number) {
    // On filtre le tableau global "films"
    films = films.filter((film) => film.id !== id);
    
    // On réaffiche
    afficherFilms(films);
    updateMovieCount();
  }

// app.ts
export function modifierFilm(id: number) {
  const film = films.find(f => f.id === id);
  if (!film) return;

  // On passe en mode édition
  filmEnCoursDeModification = id;

  // Remplir le formulaire
  const titleInput = document.getElementById("film-title") as HTMLInputElement;
  titleInput.value = film.titre;

  if (genreChoices) {
    genreChoices.clearStore();
    film.genres.forEach((g) => {
      genreChoices!.setChoiceByValue(g);
    });
  }

  const anneeSelect = document.getElementById("annee") as HTMLSelectElement;
  anneeSelect.value = film.annee.toString();

  const dureeInput = document.getElementById("duree") as HTMLInputElement;
  dureeInput.value = String(film.duree);

  const realisationsInput = document.getElementById("realisations") as HTMLInputElement;
  realisationsInput.value = film.realisateur;

  const distributionInput = document.getElementById("distribution") as HTMLInputElement;
  distributionInput.value = film.acteurs.join(", ");

  const synopsisTextarea = document.getElementById("synopsis") as HTMLTextAreaElement;
  synopsisTextarea.value = film.synopsis;

  const noteSelect = document.getElementById("note") as HTMLSelectElement;
  noteSelect.value = String(film.note);

  const dateVisionnageInput = document.getElementById("dateVisionnage") as HTMLInputElement;
  dateVisionnageInput.value = film.dateDeVisionnage;

  const plateformeSelect = document.getElementById("plateforme") as HTMLSelectElement;
  plateformeSelect.value = film.plateforme;

  const afficheHiddenInput = document.getElementById("affiche") as HTMLInputElement;
  afficheHiddenInput.value = film.affiche;

  // On modifie le texte du bouton pour informer l’utilisateur qu'on est en mode édition
  const addButton = document.getElementById("ajouter-film-btn") as HTMLButtonElement;
  addButton.textContent = "Enregistrer modifications";
}

  

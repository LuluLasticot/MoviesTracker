// app.ts
import { chargerFilms, afficherFilms } from "./controllers/FilmController";
import { Film } from "./models/Film";
import { fetchData } from "./utils/fetchData";

// ----- Import Choices.js si tu l'utilises pour le multi-select ----
import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";

// On va stocker nos films dans un tableau global (en mémoire)
let films: Film[] = [];

// Pour stocker l'instance de Choices concernant les genres
let genreChoices: Choices | null = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Charger les films existants depuis le JSON
    films = await chargerFilms();
    
    // 2. Afficher ces films dans la grille
    afficherFilms(films);

    // 3. Mettre à jour le compteur
    updateMovieCount();

    // 4. Initialiser Choices.js sur le select "genres"
    const genreSelect = document.getElementById("genres") as HTMLSelectElement;
    if (genreSelect) {
      genreChoices = new Choices(genreSelect, {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: "Sélectionnez un ou plusieurs genres",
      });
    }

    // 5. Récupérer le bouton "Ajouter un film" et écouter le clic
    const addButton = document.getElementById("ajouter-film-btn");
    if (addButton) {
      addButton.addEventListener("click", (event) => {
        event.preventDefault(); // Empêche le refresh de la page si c'est un <button> dans un <form>
        ajouterNouveauFilm();
      });
    }

    const sortSelect = document.querySelector(".sort-select") as HTMLSelectElement;
    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            trierFilms(sortSelect.value);
        });
    }
  } catch (error) {
    console.error("Erreur lors du chargement initial :", error);
  }
});

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

// ========== FONCTION : Ajout d'un nouveau film ==========
function ajouterNouveauFilm(): void {
  try {
    // 1. Récupérer chaque champ du formulaire
    const titleInput = document.getElementById("film-title") as HTMLInputElement;
    const anneeSelect = document.getElementById("annee") as HTMLSelectElement;
    const dureeInput = document.getElementById("duree") as HTMLInputElement;
    const realisationsInput = document.getElementById("realisations") as HTMLInputElement;
    const distributionInput = document.getElementById("distribution") as HTMLInputElement;
    const synopsisTextarea = document.getElementById("synopsis") as HTMLTextAreaElement;
    const noteSelect = document.getElementById("note") as HTMLSelectElement;
    const dateVisionnageInput = document.getElementById("dateVisionnage") as HTMLInputElement;
    const plateformeSelect = document.getElementById("plateforme") as HTMLSelectElement;

    // 2. Genres via Choices.js
    //    Si on n'a pas genreChoices, on fallback sur un select multiple classique
    let selectedGenres: string[] = [];
    if (genreChoices) {
      // getValue(true) renvoie un tableau de valeurs sélectionnées
      selectedGenres = genreChoices.getValue(true) as string[];
    } else {
      // fallback : lire via le select multiple
      const genreSelect = document.getElementById("genres") as HTMLSelectElement;
      if (genreSelect) {
        selectedGenres = Array.from(genreSelect.selectedOptions).map(opt => opt.value);
      }
    }

    // 3. Parser les champs "Réalisation(s)" et "Distribution" (séparés par virgule)
    const realisations = realisationsInput.value
      .split(",")
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const distributions = distributionInput.value
      .split(",")
      .map(d => d.trim())
      .filter(d => d.length > 0);

    // 4. Construire un nouvel ID (id = max ID existant + 1)
    const maxId = films.length > 0 ? Math.max(...films.map(f => f.id)) : 0;
    const newId = maxId + 1;

    // 5. Construire un objet Film
    const newFilm = new Film(
      newId,
      titleInput.value || "Titre inconnu",
      parseInt(anneeSelect.value, 10) || 1900,
      selectedGenres,
      parseInt(dureeInput.value, 10) || 120,
      realisations.join(", "), // ou on peut garder un tableau pour realisateur, à toi de voir
      distributions,
      synopsisTextarea.value || "",
      parseFloat(noteSelect.value) || 0,
      dateVisionnageInput.value || "",
      plateformeSelect.value || "Autre",
      "https://via.placeholder.com/400x600?text=No+Poster" // URL par défaut pour l’affiche
    );

    // 6. Ajouter ce nouveau film au tableau
    films.push(newFilm);

    // 7. Réafficher les films
    afficherFilms(films);

    // 8. Mettre à jour le compteur
    updateMovieCount();

    // 9. (Optionnel) Réinitialiser le formulaire
    resetForm();

  } catch (error) {
    console.error("Erreur lors de l'ajout d'un nouveau film :", error);
  }
}

// ========== FONCTION : Mettre à jour le compteur de films ==========
function updateMovieCount(): void {
  const movieCountElement = document.querySelector(".movie-count span");
  if (movieCountElement) {
    movieCountElement.textContent = String(films.length).padStart(2, "0");
  }
}

// ========== FONCTION : Réinitialiser le formulaire (optionnel) ==========
function resetForm(): void {
  const titleInput = document.getElementById("film-title") as HTMLInputElement;
  titleInput.value = "";

  if (genreChoices) {
    // Réinitialiser Choices (librairie)
    genreChoices.clearStore();
    genreChoices.setChoiceByValue([]);
  } else {
    const genreSelect = document.getElementById("genres") as HTMLSelectElement;
    if (genreSelect) {
      Array.from(genreSelect.selectedOptions).forEach(opt => opt.selected = false);
    }
  }

  const anneeSelect = document.getElementById("annee") as HTMLSelectElement;
  anneeSelect.value = "2025"; // ou l'option par défaut

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
  plateformeSelect.value = "Netflix"; // ou autre valeur par défaut
}

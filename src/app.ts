import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";

import { chargerFilms, afficherFilms } from "./controllers/FilmController";

document.addEventListener("DOMContentLoaded", async () => {
    try {
      // --- Ton code existant ---
      const films = await chargerFilms();
      afficherFilms(films);
  
      // Mise à jour du compteur de films
      const movieCountElement = document.querySelector(".movie-count span");
      if (movieCountElement) {
        movieCountElement.textContent = String(films.length).padStart(2, "0");
      }
  
      // =============== NOUVEAU CODE pour Choices.js ===============
      const genreSelect = document.getElementById("genres") as HTMLSelectElement;
      if (genreSelect) {
        const choices = new Choices(genreSelect, {
          removeItemButton: true,   // un petit bouton "x" pour retirer un genre
          placeholder: true,
          placeholderValue: "Sélectionnez un ou plusieurs genres",
          noResultsText: "Aucun genre trouvé",
          noChoicesText: "Aucun genre disponible",
        });
      }
      // ============================================================
  
    } catch (error) {
      console.error("Erreur :", error);
    }
  });
  
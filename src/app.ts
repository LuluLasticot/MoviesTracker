import { chargerFilms, afficherFilms } from "./controllers/FilmController";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const films = await chargerFilms();
    afficherFilms(films);

    // Met à jour le compteur de films
    const movieCountElement = document.querySelector(".movie-count span");
    if (movieCountElement) {
      movieCountElement.textContent = String(films.length).padStart(2, "0");
    }
  } catch (error) {
    console.error("Erreur :", error);
  }
});

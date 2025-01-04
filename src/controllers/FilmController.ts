import type { Film } from "../models/Film";
import { fetchData } from "../utils/fetchData";
import { supprimerFilm } from "../app";

export async function chargerFilms(): Promise<Film[]> {
    return await fetchData<Film[]>("./src/data/films.json");
  }
  
export function afficherFilms(films: Film[]): void {
  const container = document.querySelector(".movies-grid");
  if (!container) return;
  container.innerHTML = "";

  films.forEach((film) => {
    const cardHTML = `
      <div class="movie-card" data-id="${film.id}">
        <img src="${film.affiche}" alt="${film.titre}">
        <div class="movie-info">
          <h3>${film.titre}</h3>
          <p>${film.annee}</p>
          <div class="rating">${film.note}/10</div>
        </div>

        <!-- AJOUT du bouton SUPPRIMER -->
        <button class="delete-btn" data-id="${film.id}">Supprimer</button>
      </div>
    `;
    container.innerHTML += cardHTML;
  });

  // Ajouter un eventListener "click" sur chaque bouton "Supprimer"
  const deleteButtons = container.querySelectorAll(".delete-btn");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const filmId = button.getAttribute("data-id");
      if (filmId) {
        // On appelle une fonction qu'on va définir dans app.ts
        supprimerFilm(parseInt(filmId, 10));
      }
    });
  });
}
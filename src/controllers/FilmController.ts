import type { Film } from "../models/Film";
import { fetchData } from "../utils/fetchData";
import { supprimerFilm } from "../app";
import { modifierFilm } from "../app";

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

        <div class="card-buttons">
          <button class="delete-btn" data-id="${film.id}" title="Supprimer">
            <i class="fas fa-trash"></i>
          </button>
          <button class="edit-btn" data-id="${film.id}" title="Modifier">
            <i class="fas fa-edit"></i>
          </button>
        </div>
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

  const editButtons = container.querySelectorAll(".edit-btn");
  editButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const filmId = button.getAttribute("data-id");
      if (filmId) {
        modifierFilm(parseInt(filmId, 10));
      }
    });
  });
}
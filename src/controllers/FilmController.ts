import type { Film } from "../models/Film";
import { fetchData } from "../utils/fetchData";

export async function chargerFilms(): Promise<Film[]> {
    return await fetchData<Film[]>("./src/data/films.json");
  }
  
export function afficherFilms(films: Film[]): void {
    const container = document.querySelector(".movies-grid");
    if (!container) return;
  
    // On vide le container avant de rajouter les films
    container.innerHTML = "";
  
    films.forEach((film) => {
      // On peut créer le HTML de la card
      const cardHTML = `
        <div class="movie-card">
          <img src="${film.affiche}" alt="${film.titre}">
          <div class="movie-info">
            <h3>${film.titre}</h3>
            <p>${film.annee}</p>
            <div class="rating">${film.note}/10</div>
          </div>
        </div>
      `;
      // On insère la card dans le conteneur
      container.innerHTML += cardHTML;
    });
  }
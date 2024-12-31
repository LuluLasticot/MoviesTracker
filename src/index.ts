import { loadData } from './dataLoader';
import { Film } from './models/Film';

async function init(): Promise<void> {
  // On utilise <Film> au lieu de <Film[]>
  const films = await loadData<Film>('/src/data/films.json');
  console.log('Données chargées :', films); // Inspecte les données ici
  afficherFilms(films);
}

function afficherFilms(films: Film[]): void {
  const filmList = document.getElementById('film-list');
  if (!filmList) {
    console.error("Élément avec l'ID 'film-list' introuvable.");
    return;
  }

  films.forEach((film) => {
    const li = document.createElement('li');
    li.textContent = `${film.titre} (${film.annee}) - Note : ${film.note}/10`;
    filmList.appendChild(li);
  });
}

// Lance la fonction init après le chargement complet du DOM
document.addEventListener('DOMContentLoaded', init);

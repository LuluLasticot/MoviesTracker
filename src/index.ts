import { loadData } from './dataLoader.js';
import { Film } from './models/Film.js';
import { Bibliotheque } from './models/Bibliotheque.js';

let bibliotheque: Bibliotheque;

async function init(): Promise<void> {
  const films = await loadData<Film>('/src/data/films.json');
  const bibliotheques = await loadData<Bibliotheque>('/src/data/bibliotheques.json');

  bibliotheque = bibliotheques[0]; // Simule un utilisateur connecté

  afficherFilms(films);
}

function afficherFilms(films: Film[]): void {
  const filmList = document.getElementById('film-list');
  if (!filmList) {
    console.error("Élément avec l'ID 'film-list' introuvable.");
    return;
  }

  filmList.innerHTML = ''; // Nettoie la liste avant de la remplir

  films.forEach(film => {
    const li = document.createElement('li');
    li.textContent = `${film.titre} (${film.annee}) - Note : ${film.note}/10`;

    // Bouton "Vu"
    const vuButton = document.createElement('button');
    vuButton.textContent = 'Marquer comme vu';
    vuButton.onclick = () => {
      bibliotheque.ajouterFilmVu(film.id);
      console.log('Films vus :', bibliotheque.filmsVus);
    };

    // Bouton "À voir"
    const voirButton = document.createElement('button');
    voirButton.textContent = 'Ajouter à la watchlist';
    voirButton.onclick = () => {
      bibliotheque.ajouterFilmAVoir(film.id);
      console.log('Watchlist :', bibliotheque.filmsAVoir);
    };

    // Bouton "Like"
    const likeButton = document.createElement('button');
    likeButton.textContent = 'Liker';
    likeButton.onclick = () => {
      bibliotheque.likerFilm(film.id);
      console.log('Likes :', bibliotheque.likes);
    };

    // Ajoute les boutons à l'élément <li>
    li.appendChild(vuButton);
    li.appendChild(voirButton);
    li.appendChild(likeButton);

    // Ajoute l'élément <li> à la liste
    filmList.appendChild(li);
  });
}

// Lance la fonction init après le chargement complet du DOM
document.addEventListener('DOMContentLoaded', init);

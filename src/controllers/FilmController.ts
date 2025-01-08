import { Film } from "../models/Film";
import { UserFilmsStorage } from "../models/UserFilms";
import { fetchData } from "../utils/fetchData";
import { searchMoviesOnTMDB, getMovieDetails } from "../api/tmdb";
import { updateMovieCount } from "../app";
import { FilterController } from "./FilterController";
import Choices from 'choices.js';
import { BadgeController } from './BadgeController';

// Stockage des films par utilisateur
let userFilmsStorage: { [key: number]: Film[] } = {};
let currentUserId: number | undefined;
let defaultFilms: Film[] = [];
let filterController: FilterController;
let currentEditingFilmId: number | null = null;
let genreChoices: Choices;

// Initialiser le contrôleur de filtres
export function initializeFilters() {
    filterController = new FilterController();
    
    // Ajouter les gestionnaires d'événements pour la suppression et la modification
    document.addEventListener('filmDelete', ((event: CustomEvent) => {
        const filmId = event.detail.filmId;
        if (currentUserId && filmId) {
            supprimerFilmUtilisateur(currentUserId, filmId);
        }
    }) as EventListener);

    document.addEventListener('filmEdit', ((event: CustomEvent) => {
        const filmId = event.detail.filmId;
        if (filmId) {
            handleEditClick(filmId);
        }
    }) as EventListener);
}

// Initialisation des genres avec Choices.js
export function initializeGenres() {
    const genreSelect = document.getElementById('genres') as HTMLSelectElement;
    if (genreSelect) {
        genreChoices = new Choices(genreSelect, {
            removeItemButton: true,
            maxItemCount: 3,
            searchEnabled: false,
            shouldSort: false,
            placeholder: true,
            placeholderValue: "Sélectionnez jusqu'à 3 genres"
        });
    }
}

// Mettre à jour les affiches des films via TMDB
async function updateMoviePosters(films: Film[]): Promise<Film[]> {
    const updatedFilms = await Promise.all(films.map(async (film) => {
        try {
            // Rechercher le film sur TMDB
            const searchResults = await searchMoviesOnTMDB(film.titre);
            if (searchResults && searchResults.length > 0) {
                // Vérifier que l'année correspond
                const matchingMovie = searchResults.find(m => {
                    const movieYear = m.release_date ? parseInt(m.release_date.split('-')[0]) : null;
                    return movieYear === film.annee;
                }) || searchResults[0];

                // Obtenir les détails complets du film
                const movieDetails = await getMovieDetails(matchingMovie.id);
                if (movieDetails.poster_path) {
                    return {
                        ...film,
                        affiche: `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
                    };
                }
            }
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de l'affiche pour ${film.titre}:`, error);
        }
        return film;
    }));

    return updatedFilms;
}

// Charger les films depuis le localStorage ou le fichier JSON par défaut
export async function chargerFilms(userId?: number): Promise<Film[]> {
    if (userId) {
        currentUserId = userId;
        // Essayer de charger depuis localStorage
        const storedData = localStorage.getItem(`films_${userId}`);
        if (storedData) {
            try {
                userFilmsStorage[userId] = JSON.parse(storedData);
                return userFilmsStorage[userId];
            } catch (error) {
                console.error("Erreur lors du chargement des films:", error);
            }
        }
        // Si pas de données dans localStorage, créer un tableau vide
        userFilmsStorage[userId] = [];
        return userFilmsStorage[userId];
    }
    
    // Si pas d'userId, charger et retourner les films par défaut
    if (defaultFilms.length === 0) {
        // Charger les films depuis le fichier JSON
        defaultFilms = await fetchData<Film[]>("./src/data/films.json");
        // Mettre à jour les affiches via TMDB
        defaultFilms = await updateMoviePosters(defaultFilms);
    }
    return defaultFilms;
}

// Sauvegarder les films d'un utilisateur dans localStorage
function sauvegarderFilms(userId: number): void {
    if (userFilmsStorage[userId]) {
        localStorage.setItem(`films_${userId}`, JSON.stringify(userFilmsStorage[userId]));
    }
}

// Vérifier si un film existe déjà pour un utilisateur
function filmExisteDeja(userId: number, nouveauFilm: Film): boolean {
    if (!userFilmsStorage[userId]) return false;
    
    return userFilmsStorage[userId].some(film => 
        film.titre.toLowerCase() === nouveauFilm.titre.toLowerCase() &&
        film.realisateur?.toLowerCase() === nouveauFilm.realisateur?.toLowerCase() &&
        film.annee === nouveauFilm.annee
    );
}

// Ajouter un film pour un utilisateur
export function ajouterFilm(userId: number, film: Film): boolean {
    if (!userFilmsStorage[userId]) {
        userFilmsStorage[userId] = [];
    }

    // Vérifier si le film existe déjà
    if (filmExisteDeja(userId, film)) {
        return false;
    }

    // Mettre à jour currentUserId
    currentUserId = userId;

    userFilmsStorage[userId].push(film);
    sauvegarderFilms(userId);
    afficherFilms(userFilmsStorage[userId]);
    return true;
}

// Supprimer un film pour un utilisateur
export function supprimerFilmUtilisateur(userId: number, filmId: number): void {
    if (!userFilmsStorage[userId]) return;
    
    const index = userFilmsStorage[userId].findIndex(f => f.id === filmId);
    if (index !== -1) {
        userFilmsStorage[userId].splice(index, 1);
        sauvegarderFilms(userId);
        afficherFilms(userFilmsStorage[userId]);
    }
}

// Modifier un film pour un utilisateur
export function modifierFilmUtilisateur(userId: number, film: Film): void {
    if (!userFilmsStorage[userId]) return;
    
    const index = userFilmsStorage[userId].findIndex(f => f.id === film.id);
    if (index !== -1) {
        userFilmsStorage[userId][index] = film;
        sauvegarderFilms(userId);
        afficherFilms(userFilmsStorage[userId]);
    }
}

// Afficher les films dans le DOM
export function afficherFilms(films?: Film[]): void {
    // Si aucun films n'est passé en paramètre, utiliser les films de l'utilisateur courant
    const filmsToDisplay = films || (currentUserId ? userFilmsStorage[currentUserId] : defaultFilms);

    // Mettre à jour les films dans le FilterController
    if (filterController) {
        filterController.setFilms(filmsToDisplay);
    } else {
        // Si le FilterController n'est pas encore initialisé, l'initialiser
        filterController = new FilterController();
        filterController.setFilms(filmsToDisplay);
    }

    // Mettre à jour le compteur de films
    updateMovieCount();

    // Mettre à jour les badges
    const userId = parseInt(localStorage.getItem('currentUserId') || '0');
    if (userId) {
        BadgeController.getInstance().checkAndUpdateBadges(userId, filmsToDisplay);
    }

    // Déclencher l'événement de mise à jour des films pour le dashboard
    const event = new CustomEvent('filmsUpdated', { 
        detail: { 
            films: filmsToDisplay || [] 
        } 
    });
    document.dispatchEvent(event);
}

// Fonction pour créer une carte de film
function createFilmCard(film: Film): HTMLDivElement {
    const cardElement = document.createElement('div');
    cardElement.innerHTML = `
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
    return cardElement;
}

// Fonction pour ajouter les event listeners aux boutons des cartes
function addFilmCardEventListeners(container: Element): void {
    // Event listeners pour les boutons de suppression
    container.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            const button = event.currentTarget as HTMLButtonElement;
            const filmId = parseInt(button.dataset.id || "0");
            if (filmId && currentUserId) {
                if (confirm("Êtes-vous sûr de vouloir supprimer ce film ?")) {
                    supprimerFilmUtilisateur(currentUserId, filmId);
                }
            }
        });
    });

    // Event listeners pour les boutons de modification
    container.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            const button = event.currentTarget as HTMLButtonElement;
            const filmId = parseInt(button.getAttribute("data-id") || "0");
            if (filmId && currentUserId) {
                handleEditClick(filmId);
            }
        });
    });
}

// Fonction pour gérer le clic sur le bouton de modification
export function handleEditClick(filmId: number) {
    const film = userFilmsStorage[currentUserId!].find(f => f.id === filmId);
    if (!film) return;

    // Remplir le formulaire avec les données du film
    const titleInput = document.getElementById("film-title") as HTMLInputElement;
    const yearSelect = document.getElementById("annee") as HTMLSelectElement;
    const durationInput = document.getElementById("duree") as HTMLInputElement;
    const directorInput = document.getElementById("realisations") as HTMLInputElement;
    const castInput = document.getElementById("distribution") as HTMLInputElement;
    const synopsisInput = document.getElementById("synopsis") as HTMLTextAreaElement;
    const ratingInput = document.getElementById("note") as HTMLInputElement;
    const dateInput = document.getElementById("dateVisionnage") as HTMLInputElement;
    const platformSelect = document.getElementById("plateforme") as HTMLSelectElement;
    const posterInput = document.getElementById("affiche") as HTMLInputElement;

    // Remplir et désactiver les champs non modifiables
    titleInput.value = film.titre;
    titleInput.disabled = true;
    yearSelect.value = film.annee.toString();
    yearSelect.disabled = true;
    durationInput.value = film.duree.toString();
    durationInput.disabled = true;
    directorInput.value = film.realisateur;
    directorInput.disabled = true;
    castInput.value = film.acteurs.join(", ");
    castInput.disabled = true;
    synopsisInput.value = film.synopsis;
    synopsisInput.disabled = true;
    posterInput.value = film.affiche;
    posterInput.disabled = true;

    // Remplir et mettre en évidence les champs modifiables
    ratingInput.value = film.note.toString();
    dateInput.value = film.dateDeVisionnage;
    platformSelect.value = film.plateforme;

    // Ajouter la classe modifiable aux champs qu'on peut modifier
    ratingInput.closest('.form-group')?.classList.add('modifiable');
    dateInput.closest('.form-group')?.classList.add('modifiable');
    platformSelect.closest('.form-group')?.classList.add('modifiable');

    // Gérer les genres
    if (genreChoices) {
        genreChoices.removeActiveItems();
        genreChoices.setChoiceByValue(film.genres);
        genreChoices.disable();
    }

    // Changer le texte du bouton
    const submitButton = document.getElementById('ajouter-film-btn');
    if (submitButton) {
        submitButton.textContent = 'Enregistrer les modifications';
        submitButton.classList.add('edit-mode');
    }

    // Stocker l'ID du film en cours d'édition
    currentEditingFilmId = filmId;

    // Faire défiler jusqu'au formulaire
    document.querySelector('.movie-form')?.scrollIntoView({ behavior: 'smooth' });
}

// Réinitialiser le formulaire après l'édition
export function resetForm() {
    const form = document.querySelector('.movie-form form') as HTMLFormElement;
    if (!form) return;

    // Réinitialiser le formulaire
    form.reset();
    form.classList.remove('edit-mode');

    // Réinitialiser tous les champs
    const allFields = [
        'film-title', 'annee', 'duree', 'realisations', 
        'distribution', 'synopsis', 'note', 'dateVisionnage',
        'plateforme', 'affiche'
    ];

    allFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            // Réinitialiser les attributs
            element.removeAttribute('disabled');
            element.removeAttribute('readonly');
            (element as HTMLElement).style.cssText = '';

            // Réinitialiser le groupe de formulaire
            const formGroup = element.closest('.form-group');
            if (formGroup) {
                formGroup.classList.remove('modifiable', 'non-modifiable', 'edit-mode');
                (formGroup as HTMLElement).style.cssText = '';
                const label = formGroup.querySelector('label');
                if (label) {
                    (label as HTMLElement).style.cssText = '';
                }
            }
        }
    });

    // Réinitialiser Choices.js pour les genres
    if (genreChoices) {
        genreChoices.removeActiveItems();
        genreChoices.enable();
        const choicesElement = document.querySelector('.choices');
        if (choicesElement instanceof HTMLElement) {
            choicesElement.style.cssText = '';
            choicesElement.classList.remove('is-disabled');
        }
    }

    // Réinitialiser le bouton d'ajout
    const submitButton = document.querySelector('.add-movie-btn');
    if (submitButton) {
        submitButton.textContent = 'Ajouter un film';
        submitButton.classList.remove('edit-mode');
        (submitButton as HTMLElement).style.cssText = '';
    }

    // Réinitialiser l'état global
    currentEditingFilmId = null;
}
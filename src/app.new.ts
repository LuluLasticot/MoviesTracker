// src/app.ts

import { chargerFilms, afficherFilms, ajouterFilm, supprimerFilmUtilisateur, modifierFilmUtilisateur, initializeFilters, resetForm as resetFormController } from "./controllers/FilmController";
import { Film } from "./models/Film";
import { searchMoviesOnTMDB, getMovieDetails } from "./api/tmdb";
import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";
import { chargerUtilisateurs, connecterUtilisateur, inscrireUtilisateur, getUtilisateurs } from "./controllers/UtilisateurController";
import { DashboardController } from "./controllers/DashboardController";
import { WatchlistController } from "./controllers/WatchlistController";
import { ProfileController } from "./controllers/ProfileController";
import { StateManager } from "./utils/StateManager";
import { debounce } from "./utils/debounce";

// Interface pour l'état global de l'application
interface AppState {
    films: Film[];
    currentUserId?: number;
    filmEnCoursDeModification: number | null;
}

// Variables locales pour stocker l'état
let localFilms: Film[] = [];
let localCurrentUserId: number | undefined;
let localFilmEnCoursDeModification: number | null = null;

// Initialisation du gestionnaire d'état
const appState = new StateManager<AppState>({
    films: [],
    currentUserId: undefined,
    filmEnCoursDeModification: null
});

// Fonction pour mettre à jour l'interface utilisateur du header
function updateHeaderUI(): void {
    const headerElement = document.getElementById('header-user-info');
    if (headerElement && localCurrentUserId !== undefined) {
        const utilisateurs = getUtilisateurs();
        const currentUser = utilisateurs.find(u => u.id === localCurrentUserId);
        if (currentUser) {
            headerElement.textContent = `Connecté en tant que : ${currentUser.pseudo}`;
        }
    }
}

// Gestionnaire d'état pour suivre les changements
appState.subscribe((state) => {
    if (state.films !== localFilms) {
        localFilms = state.films;
        afficherFilms(localFilms);
    }
    if (state.currentUserId !== localCurrentUserId) {
        localCurrentUserId = state.currentUserId;
        updateHeaderUI();
    }
    if (state.filmEnCoursDeModification !== localFilmEnCoursDeModification) {
        localFilmEnCoursDeModification = state.filmEnCoursDeModification;
    }
});

// Initialisation de l'application
async function initializeApp(): Promise<void> {
    try {
        const films = await chargerFilms();
        appState.setState({
            ...appState.getState(),
            films
        });
        initializeFilters();
    } catch (error) {
        console.error("Erreur lors de l'initialisation de l'application:", error);
    }
}

// Export des fonctions et variables nécessaires
export {
    appState,
    initializeApp,
    updateHeaderUI
};

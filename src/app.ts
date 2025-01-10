// src/app.ts

import { chargerFilms, afficherFilms, ajouterFilm, supprimerFilmUtilisateur, modifierFilmUtilisateur, initializeFilters } from "./controllers/FilmController";
import { Film } from "./models/Film";
import { searchMoviesOnTMDB } from "./api/tmdb";
import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";
import { chargerUtilisateurs, getUtilisateurs } from "./controllers/UtilisateurController";
import { DashboardController } from "./controllers/DashboardController";
import { WatchlistController } from "./controllers/WatchlistController";
import { ProfileController } from "./controllers/ProfileController";
import { StateManager } from "./utils/StateManager";
import { NavigationService } from "./services/NavigationService";
import { AuthService } from "./services/AuthService";
import { FormService } from "./services/FormService";
import { AutocompleteService } from "./services/AutocompleteService";
import { FilmFilterService } from "./services/FilmFilterService";

interface AppState {
  films: Film[];
  filmEnCoursDeModification: number | null;
}

const appState = new StateManager<AppState>({
  films: [],
  filmEnCoursDeModification: null,
});

// Services
const navigationService = NavigationService.getInstance();
const authService = AuthService.getInstance();
const formService = FormService.getInstance();
const autocompleteService = AutocompleteService.getInstance();
const filmFilterService = FilmFilterService.getInstance();

// Variables globales nécessaires
let genreChoices: Choices | null = null;
let dashboardController: DashboardController;
let watchlistController: WatchlistController;
let profileController: ProfileController;

// Types pour Choices.js
interface EventChoice {
  value: string;
  label: string;
  selected: boolean;
  disabled: boolean;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await chargerUtilisateurs();
    
    // Initialiser les modals d'authentification
    initAuthModals();
    
    // Vérifier l'état de l'authentification
    await authService.checkAuthState();
    
    // Charger les films appropriés
    const currentUserId = authService.getCurrentUserId();
    const loadedFilms = await chargerFilms(currentUserId || undefined);
    appState.setState({
      ...appState.getState(),
      films: loadedFilms
    });

    // Initialiser les contrôleurs
    dashboardController = new DashboardController();
    profileController = new ProfileController();
    if (currentUserId) {
      watchlistController = new WatchlistController(currentUserId);
    }
    
    // Déclencher la mise à jour initiale des statistiques
    document.dispatchEvent(new CustomEvent('filmsUpdated', { 
      detail: { films: loadedFilms } 
    }));
    
    // Initialiser les autres composants
    initFilmsStuff();
    await initAutocomplete();
    
    // S'abonner aux changements de filtres
    filmFilterService.subscribe((filterState) => {
      const filteredFilms = filmFilterService.filterAndSortFilms(appState.getState().films);
      afficherFilms(filteredFilms);
    });

    // Afficher les films et mettre à jour l'interface
    const filteredFilms = filmFilterService.filterAndSortFilms(loadedFilms);
    afficherFilms(filteredFilms);
    updateMovieCount();

    // Initialiser les filtres
    initializeFilters();

  } catch (error) {
    console.error("Erreur lors du chargement initial :", error);
  }
});

function initAuthModals(): void {
  const loginModal = document.getElementById("login-modal") as HTMLDivElement;
  const signupModal = document.getElementById("signup-modal") as HTMLDivElement;

  // Gérer la connexion
  const loginForm = document.getElementById("login-form");
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (document.getElementById("login-email") as HTMLInputElement).value;
    const password = (document.getElementById("login-password") as HTMLInputElement).value;

    const success = await authService.login(email, password);
    if (success) {
      loginModal.classList.add("hidden");
      const currentUserId = authService.getCurrentUserId();
      watchlistController = new WatchlistController(currentUserId);
    } else {
      alert("Email ou mot de passe incorrect");
    }
  });

  // Gérer l'inscription
  const signupForm = document.getElementById("signup-form");
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pseudo = (document.getElementById("signup-pseudo") as HTMLInputElement).value;
    const email = (document.getElementById("signup-email") as HTMLInputElement).value;
    const password = (document.getElementById("signup-password") as HTMLInputElement).value;

    const success = await authService.register(pseudo, email, password);
    if (success) {
      signupModal.classList.add("hidden");
      const currentUserId = authService.getCurrentUserId();
      watchlistController = new WatchlistController(currentUserId);
      alert("Inscription réussie ! Vous êtes maintenant connecté.");
    } else {
      alert("Erreur lors de l'inscription");
    }
  });

  // Gérer la déconnexion
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", () => {
    authService.logout();
    window.location.reload(); // Recharger la page pour réinitialiser l'état
  });

  // Gérer les boutons d'annulation
  const cancelButtons = document.querySelectorAll(".modal-cancel");
  cancelButtons.forEach(button => {
    button.addEventListener("click", () => {
      loginModal.classList.add("hidden");
      signupModal.classList.add("hidden");
    });
  });
}

function updateHeaderUI(): void {
  const authButtons = document.querySelector(".auth-buttons") as HTMLDivElement;
  const avatarContainer = document.getElementById("avatar-container") as HTMLDivElement;
  const avatarPseudo = document.getElementById("avatar-pseudo") as HTMLSpanElement;

  if (authService.getCurrentUserId()) {
    // L'utilisateur est connecté
    const users = getUtilisateurs();
    const user = users.find(u => u.id === authService.getCurrentUserId());
    if (user) {
      // Cacher les boutons d'auth et montrer le container avatar
      authButtons.style.display = "none";
      avatarContainer.style.display = "flex";
      avatarPseudo.textContent = user.pseudo;
    }
  } else {
    // L'utilisateur n'est pas connecté
    authButtons.style.display = "flex";
    avatarContainer.style.display = "none";
  }
}

function initFilmsStuff(): void {
  // Initialiser Choices.js une seule fois
  const genreSelect = document.getElementById("genres") as HTMLSelectElement;
  if (genreSelect) {
    // Détruire l'instance existante si elle existe
    if (genreChoices) {
      try {
        genreChoices.destroy();
      } catch (error) {
        console.error("Erreur lors de la destruction de Choices:", error);
      }
    }
    
    genreChoices = new Choices(genreSelect, {
      removeItemButton: true,
      placeholder: true,
      placeholderValue: "Sélectionnez un ou plusieurs genres",
    });
    formService.setGenreChoices(genreChoices);
  }

  // Gérer le bouton "Ajouter un film"
  const addButton = document.getElementById("ajouter-film-btn");
  if (addButton) {
    addButton.addEventListener("click", async (event) => {
      event.preventDefault();
      await ajouterNouveauFilm();
    });
  }

  // Gérer le tri des films
  const sortSelect = document.querySelector(".sort-select") as HTMLSelectElement;
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      // Supprimé la fonction trierFilms
    });
  }
}

async function initAutocomplete(): Promise<void> {
  const searchInput = document.getElementById('search-tmdb') as HTMLInputElement;
  if (searchInput) {
    await autocompleteService.initialize(searchInput);
  }
}

export async function ajouterNouveauFilm(): Promise<void> {
    if (!authService.getCurrentUserId()) {
        alert("Vous devez être connecté pour ajouter un film.");
        return;
    }

    // Récupération des éléments du DOM
    const titreElement = document.getElementById("film-title") as HTMLInputElement;
    const dureeElement = document.getElementById("duree") as HTMLInputElement;
    const realisateurElement = document.getElementById("realisations") as HTMLInputElement;
    const noteElement = document.getElementById("note") as HTMLSelectElement;
    const dateElement = document.getElementById("dateVisionnage") as HTMLInputElement;
    const plateformeElement = document.getElementById("plateforme") as HTMLSelectElement;
    const anneeElement = document.getElementById("annee") as HTMLSelectElement;

    // Récupération des valeurs avec trim() et vérification stricte
    const titre = titreElement?.value?.trim();
    const annee = anneeElement?.value;
    const genresValue = genreChoices?.getValue();
    const genres = Array.isArray(genresValue) 
        ? genresValue.map(choice => choice.value)
        : genresValue 
        ? [genresValue.value] 
        : [];
    const duree = dureeElement?.value?.trim();
    const realisateur = realisateurElement?.value?.trim();
    const acteurs = (document.getElementById("distribution") as HTMLInputElement).value.split(",").map((a) => a.trim()).filter(a => a);
    const synopsis = (document.getElementById("synopsis") as HTMLTextAreaElement).value.trim();
    const note = noteElement?.value;
    const dateDeVisionnage = dateElement?.value;
    const plateforme = plateformeElement?.value;
    const affiche = (document.getElementById("affiche") as HTMLInputElement).value.trim() || "https://via.placeholder.com/400x600?text=No+Poster";

    // Validation des champs obligatoires
    let champsObligatoires = [
        { valeur: titre, nom: "Titre", element: titreElement },
        { valeur: annee, nom: "Année", element: anneeElement },
        { valeur: duree, nom: "Durée", element: dureeElement },
        { valeur: realisateur, nom: "Réalisateur", element: realisateurElement },
        { valeur: note, nom: "Note", element: noteElement },
        { valeur: dateDeVisionnage, nom: "Date de visionnage", element: dateElement },
        { valeur: plateforme, nom: "Plateforme", element: plateformeElement }
    ];

    // Vérifier les champs obligatoires
    for (const champ of champsObligatoires) {
        if (!champ.valeur) {
            alert(`Le champ "${champ.nom}" est obligatoire.`);
            champ.element?.focus();
            return;
        }
    }

    // Créer l'objet film
    const nouveauFilm: Film = {
        id: Date.now(),
        titre: titre!,
        annee: parseInt(annee!),
        genres: genres,
        duree: parseInt(duree!),
        realisateur: realisateur!,
        acteurs: acteurs,
        synopsis: synopsis,
        note: parseInt(note!),
        dateDeVisionnage: dateDeVisionnage!,
        plateforme: plateforme!,
        affiche: affiche
    };

    // Ajouter le film
    const ajoutReussi = ajouterFilm(authService.getCurrentUserId(), nouveauFilm);
    if (!ajoutReussi) {
        alert("Ce film existe déjà dans votre liste !");
        return;
    }
    
    // Réinitialiser le formulaire
    const form = document.querySelector('.movie-form form') as HTMLFormElement;
    if (form) {
        form.reset();
        
        // Réinitialiser manuellement chaque champ
        (document.getElementById("film-title") as HTMLInputElement).value = "";
        (document.getElementById("duree") as HTMLInputElement).value = "120";
        (document.getElementById("realisations") as HTMLInputElement).value = "";
        (document.getElementById("distribution") as HTMLInputElement).value = "";
        (document.getElementById("synopsis") as HTMLTextAreaElement).value = "";
        (document.getElementById("note") as HTMLSelectElement).value = "5";
        (document.getElementById("dateVisionnage") as HTMLInputElement).value = new Date().toISOString().split('T')[0];
        (document.getElementById("plateforme") as HTMLSelectElement).value = "netflix";
        (document.getElementById("annee") as HTMLSelectElement).value = "2024";
        (document.getElementById("affiche") as HTMLInputElement).value = "";
        
        // Réinitialiser les genres
        if (genreChoices) {
            genreChoices.removeActiveItems();
            genreChoices.enable();
        }
    }

    // Mettre à jour l'affichage
    await afficherFilms();
    updateMovieCount();

    // Faire défiler vers la section des films
    const moviesSection = document.querySelector('.movies-list');
    if (moviesSection) {
        moviesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

export function modifierFilm(filmId: number): void {
  if (!authService.getCurrentUserId()) return;

  // Récupérer le film à modifier
  const film = appState.getState().films.find(f => f.id === filmId);
  if (!film) return;

  // Sauvegarder l'ID du film en cours de modification
  appState.setState({
    ...appState.getState(),
    filmEnCoursDeModification: filmId
  });

  // Remplir le formulaire avec les données du film
  const form = document.querySelector('.movie-form') as HTMLElement;
  if (form) {
    // Remplir les champs personnels
    (document.getElementById('note') as HTMLSelectElement).value = film.note.toString();
    (document.getElementById('dateVisionnage') as HTMLInputElement).value = film.dateDeVisionnage;
    (document.getElementById('plateforme') as HTMLSelectElement).value = film.plateforme;

    // Faire défiler jusqu'au formulaire
    form.scrollIntoView({ behavior: 'smooth' });

    // Changer le texte du bouton d'ajout
    const addButton = document.getElementById('ajouter-film-btn') as HTMLButtonElement;
    if (addButton) {
      addButton.textContent = 'Enregistrer les modifications';
    }
  }
}

function resetForm(): void {
  // Réinitialiser chaque champ individuellement
  (document.getElementById("film-title") as HTMLInputElement).value = "";
  (document.getElementById("duree") as HTMLInputElement).value = "120";
  (document.getElementById("realisations") as HTMLInputElement).value = "";
  (document.getElementById("distribution") as HTMLInputElement).value = "";
  (document.getElementById("synopsis") as HTMLTextAreaElement).value = "";
  (document.getElementById("note") as HTMLSelectElement).value = "5";
  (document.getElementById("dateVisionnage") as HTMLInputElement).value = new Date().toISOString().split('T')[0];
  (document.getElementById("plateforme") as HTMLSelectElement).value = "netflix";
  (document.getElementById("annee") as HTMLSelectElement).value = "2024";
  (document.getElementById("affiche") as HTMLInputElement).value = "";
  
  // Réinitialiser le mode modification
  appState.setState({
    ...appState.getState(),
    filmEnCoursDeModification: null
  });
  const addButton = document.getElementById('ajouter-film-btn') as HTMLButtonElement;
  if (addButton) {
    addButton.textContent = 'Ajouter le film';
  }
}

export function supprimerFilm(id: number): void {
  if (!authService.getCurrentUserId()) {
    alert("Vous devez être connecté pour supprimer un film.");
    return;
  }

  // Demander confirmation avant de supprimer
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce film ?")) {
    return;
  }

  // Supprimer le film via le contrôleur
  supprimerFilmUtilisateur(authService.getCurrentUserId(), id);
  
  // Rafraîchir l'affichage
  chargerFilms(authService.getCurrentUserId()).then(filmsActualises => {
    afficherFilms(filmsActualises);
    updateMovieCount();
  });
}

export function updateMovieCount(): void {
  const movieCountElement = document.querySelector(".movie-count span");
  if (!movieCountElement) return;

  if (authService.getCurrentUserId()) {
    // Si un utilisateur est connecté, obtenir le nombre de ses films depuis le localStorage
    const userFilms = localStorage.getItem(`films_${authService.getCurrentUserId()}`);
    const count = userFilms ? JSON.parse(userFilms).length : 0;
    movieCountElement.textContent = String(count).padStart(2, "0");
  } else {
    // Si aucun utilisateur n'est connecté, utiliser le nombre de films par défaut
    movieCountElement.textContent = String(appState.getState().films.length).padStart(2, "0");
  }
}

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const route = link.getAttribute('data-route');
    if (route) {
      navigationService.navigate(route as any);
    }
  });
});

async function handleTMDBSelection(movieId: number): Promise<void> {
  await formService.fillFormWithTMDB(movieId);
}

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

// On va stocker nos films dans un tableau global (en mémoire)
let films: Film[] = [];
// Variable globale pour l'instance de Choices
let genreChoices: Choices | null = null;
let filmEnCoursDeModification: number | null = null;
// Variable globale pour stocker l'utilisateur connecté
let currentUserId: number | undefined = undefined;

// Pour le dashboard
let dashboardController: DashboardController;
let watchlistController: WatchlistController;
let profileController: ProfileController;

// Pour l'autocomplete
let suggestionBox: HTMLUListElement | null = null;

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
    
    // Vérifier si un utilisateur est déjà connecté (stocké dans localStorage)
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      currentUserId = parseInt(storedUserId);
      // Mettre à jour l'interface utilisateur
      updateHeaderUI();
      // Charger les films de l'utilisateur
      films = await chargerFilms(currentUserId);
      // Initialiser la watchlist avec l'ID de l'utilisateur
      watchlistController = new WatchlistController(currentUserId);
    } else {
      // Charger les films par défaut
      films = await chargerFilms();
      // Initialiser la watchlist sans ID utilisateur
      watchlistController = new WatchlistController();
    }

    // Initialiser le contrôleur du dashboard après le chargement des films
    dashboardController = new DashboardController();
    // Initialiser le contrôleur de profil
    profileController = new ProfileController();
    // Déclencher la mise à jour initiale des statistiques
    document.dispatchEvent(new CustomEvent('filmsUpdated', { detail: { films } }));
    
    // Initialiser les autres composants
    initFilmsStuff();
    await initAutocomplete();
    
    // Afficher les films
    afficherFilms(films);
    updateMovieCount();
    updateHeaderUI();

    // Initialiser les filtres
    initializeFilters();

  } catch (error) {
    console.error("Erreur lors du chargement initial :", error);
  }
});

function initAuthModals(): void {
  // 1. Sélectionner les boutons "Login" & "Signup" du header
  const loginBtn = document.querySelector(".login-btn") as HTMLButtonElement;
  const signupBtn = document.querySelector(".signup-btn") as HTMLButtonElement;

  // 2. Sélectionner les modals
  const loginModal = document.getElementById("login-modal") as HTMLDivElement;
  const signupModal = document.getElementById("signup-modal") as HTMLDivElement;

  // 3. Ajouter les event listeners sur les boutons d'ouverture des modales
  loginBtn?.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
    signupModal.classList.add("hidden");
  });

  signupBtn?.addEventListener("click", () => {
    signupModal.classList.remove("hidden");
    loginModal.classList.add("hidden");
  });

  // 4. Gérer les boutons "Annuler"
  const loginCancelBtn = document.getElementById("login-cancel");
  loginCancelBtn?.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });

  const signupCancelBtn = document.getElementById("signup-cancel");
  signupCancelBtn?.addEventListener("click", () => {
    signupModal.classList.add("hidden");
  });

  // 5. Gérer la connexion
  const loginSubmitBtn = document.getElementById("login-submit");
  loginSubmitBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = (document.getElementById("login-email") as HTMLInputElement).value;
    const password = (document.getElementById("login-password") as HTMLInputElement).value;

    const utilisateur = await connecterUtilisateur(email, password);
    if (utilisateur) {
      currentUserId = utilisateur.id;
      updateHeaderUI();
      loginModal.classList.add("hidden");
      // Charger les films de l'utilisateur
      await chargerFilms(currentUserId);
      await afficherFilms();
      // Réinitialiser la watchlist avec l'ID du nouvel utilisateur
      watchlistController = new WatchlistController(currentUserId);
    } else {
      alert("Email ou mot de passe incorrect");
    }
  });

  // 6. Gérer l'inscription
  const signupSubmitBtn = document.getElementById("signup-submit");
  signupSubmitBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const pseudo = (document.getElementById("signup-pseudo") as HTMLInputElement).value;
    const email = (document.getElementById("signup-email") as HTMLInputElement).value;
    const password = (document.getElementById("signup-password") as HTMLInputElement).value;

    const newUser = inscrireUtilisateur(pseudo, email, password);
    if (newUser) {
      currentUserId = newUser.id;
      updateHeaderUI();
      signupModal.classList.add("hidden");
      alert("Inscription réussie ! Vous êtes maintenant connecté.");
      // Réinitialiser la watchlist avec l'ID du nouvel utilisateur
      watchlistController = new WatchlistController(currentUserId);
    }
  });

  // 7. Gérer la déconnexion
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", () => {
    currentUserId = undefined;
    updateHeaderUI();
    afficherFilms([]);  // Vider la liste des films
    // Réinitialiser la watchlist sans ID utilisateur
    watchlistController = new WatchlistController();
  });
}

/* ==================== FONCTION : updateHeaderUI ==================== */
function updateHeaderUI(): void {
  const authButtons = document.querySelector(".auth-buttons") as HTMLDivElement;
  const avatarContainer = document.getElementById("avatar-container") as HTMLDivElement;
  const avatarPseudo = document.getElementById("avatar-pseudo") as HTMLSpanElement;

  if (currentUserId) {
    // L'utilisateur est connecté
    const user = getUtilisateurs().find(u => u.id === currentUserId);
    if (user) {
      // Cacher les boutons d'auth et montrer le container avatar
      authButtons.style.display = "none";
      avatarContainer.style.display = "flex";
      avatarPseudo.textContent = user.pseudo;
    }
  } else {
    // L'utilisateur est déconnecté
    authButtons.style.display = "flex";
    avatarContainer.style.display = "none";
    avatarPseudo.textContent = "";
  }
}

/* ==================== Reste du code (films, etc.) ==================== */
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
      trierFilms(sortSelect.value);
    });
  }

  // Initialiser l'autocomplete
  initAutocomplete();
}

function clearSuggestions(): void {
  if (suggestionBox) {
    suggestionBox.innerHTML = '';
    suggestionBox.style.display = 'none';  // Cacher la boîte de suggestions
  }
}

async function initAutocomplete(): Promise<void> {
  const inputEl = document.getElementById("film-title") as HTMLInputElement;
  
  if (!inputEl) return;

  // Créer la boîte de suggestions si elle n'existe pas
  if (!suggestionBox) {
    suggestionBox = document.createElement('ul');
    suggestionBox.className = 'autocomplete-list';
    const formGroup = inputEl.closest('.form-group') as HTMLElement;
    if (formGroup) {
      formGroup.style.position = 'relative';
      formGroup.appendChild(suggestionBox);
    }
  }

  let debounceTimeout: NodeJS.Timeout;

  inputEl.addEventListener("input", async () => {
    clearTimeout(debounceTimeout);
    const searchTerm = inputEl.value.trim();

    if (searchTerm.length < 2) {
      clearSuggestions();
      return;
    }

    debounceTimeout = setTimeout(async () => {
      try {
        const movies = await searchMoviesOnTMDB(searchTerm);
        
        if (!movies || movies.length === 0) {
          clearSuggestions();
          return;
        }

        // Afficher les suggestions
        suggestionBox!.innerHTML = '';
        suggestionBox!.style.display = 'block';

        movies.forEach(movie => {
          const li = document.createElement('li');
          li.tabIndex = 0;
          const year = movie.release_date ? ` (${movie.release_date.split('-')[0]})` : '';
          li.textContent = `${movie.title}${year}`;
          
          li.addEventListener('click', async () => {
            inputEl.value = movie.title;
            await fillFormWithTMDB(movie.id);
            clearSuggestions();
          });

          li.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
              inputEl.value = movie.title;
              await fillFormWithTMDB(movie.id);
              clearSuggestions();
            }
          });
          
          suggestionBox!.appendChild(li);
        });
      } catch (error) {
        console.error('Erreur lors de la recherche de films:', error);
        clearSuggestions();
      }
    }, 300);
  });

  // Fermer les suggestions si on clique en dehors
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target !== inputEl && !suggestionBox?.contains(target)) {
      clearSuggestions();
    }
  });

  // Gérer la navigation au clavier
  inputEl.addEventListener('keydown', (event) => {
    if (!suggestionBox || suggestionBox.style.display === 'none') return;

    const suggestions = Array.from(suggestionBox.querySelectorAll('li'));
    const currentFocus = document.activeElement;
    const currentIndex = suggestions.findIndex(el => el === currentFocus);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < suggestions.length - 1) {
          (suggestions[currentIndex + 1] as HTMLElement).focus();
        } else {
          (suggestions[0] as HTMLElement).focus();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          (suggestions[currentIndex - 1] as HTMLElement).focus();
        } else {
          (suggestions[suggestions.length - 1] as HTMLElement).focus();
        }
        break;

      case 'Escape':
        clearSuggestions();
        inputEl.blur();
        break;
    }
  });
}

/* =========================================================
   AUTO-COMPLETION TMDB
   ========================================================= */

function trierFilms(critere: string) {
    if (critere === "Note") {
      // tri décroissant par note
      films.sort((a, b) => b.note - a.note);
    } else if (critere === "Titre") {
      // tri alphabétique
      films.sort((a, b) => a.titre.localeCompare(b.titre));
    } else if (critere === "Année") {
      // tri décroissant par année
      films.sort((a, b) => b.annee - a.annee);
    }
  
    afficherFilms(films);
  }

// Affiche la liste de suggestions (top 5)
function showSuggestions(movies: any[], inputEl: HTMLInputElement) {
  clearSuggestions();
  if (!suggestionBox) return;

  const top5 = movies.slice(0, 5);
  top5.forEach((movie: any) => {
    const li = document.createElement("li");
    const year = movie.release_date ? movie.release_date.substring(0, 4) : "????";
    li.textContent = `${movie.title} (${year})`;

    li.addEventListener("click", async () => {
      // On remplit le champ titre
      inputEl.value = movie.title;
      // On préremplit l'affiche (hidden input)
      await fillFormWithTMDB(movie.id);
      // On efface la liste de suggestions
      clearSuggestions();
    });

    // Ajouter un gestionnaire pour la touche Entrée
    li.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter') {
        inputEl.value = movie.title;
        await fillFormWithTMDB(movie.id);
        clearSuggestions();
      }
    });
    
    suggestionBox!.appendChild(li);
  });
}

/* =========================================================
   FONCTION : Ajouter un nouveau film dans la liste
   ========================================================= */
export async function ajouterNouveauFilm(): Promise<void> {
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

  // En mode édition, on ne vérifie que les champs modifiables
  if (filmEnCoursDeModification !== null) {
    champsObligatoires = champsObligatoires.filter(champ => 
      champ.nom === "Note" || 
      champ.nom === "Date de visionnage" || 
      champ.nom === "Plateforme"
    );
  }

  const champsManquants = champsObligatoires
    .filter(champ => {
      const manquant = !champ.valeur;
      if (manquant) {
        console.log(`Champ manquant - ${champ.nom}:`, {
          valeur: champ.valeur,
          elementId: champ.element?.id,
          elementValue: champ.element?.value
        });
      }
      return manquant;
    })
    .map(champ => champ.nom);

  if (champsManquants.length > 0) {
    alert(`Veuillez remplir les champs obligatoires suivants : ${champsManquants.join(", ")}`);
    return;
  }

  if (!currentUserId) {
    alert("Vous devez être connecté pour ajouter ou modifier un film.");
    return;
  }

  // Si on est en mode modification
  if (filmEnCoursDeModification !== null) {
    // Mettre à jour uniquement les champs personnels
    const filmIndex = films.findIndex(f => f.id === filmEnCoursDeModification);
    if (filmIndex !== -1) {
      films[filmIndex] = {
        ...films[filmIndex],
        note: parseFloat(note!),
        dateDeVisionnage: dateDeVisionnage!,
        plateforme: plateforme!
      };

      // Sauvegarder les modifications
      modifierFilmUtilisateur(currentUserId, films[filmIndex]);

      // Réinitialiser le mode modification
      filmEnCoursDeModification = null;
      
      // Utiliser la fonction resetForm du FilmController
      resetFormController();
    }
  } else {
    // Mode ajout d'un nouveau film
    const maxId = films.length > 0 
      ? Math.max(...films.map(f => f.id)) 
      : 0;

    const nouveauFilm: Film = {
      id: maxId + 1,
      titre: titre!,
      annee: parseInt(annee!),
      genres,
      duree: parseInt(duree!),
      realisateur: realisateur!,
      acteurs,
      synopsis,
      note: parseFloat(note!),
      dateDeVisionnage: dateDeVisionnage!,
      plateforme: plateforme!,
      affiche
    };

    // Ajouter le film
    ajouterFilm(currentUserId, nouveauFilm);
  }

  // Réinitialiser le formulaire et rafraîchir l'affichage
  await afficherFilms();
}

export function modifierFilm(filmId: number): void {
  if (!currentUserId) return;

  // Récupérer le film à modifier
  const film = films.find(f => f.id === filmId);
  if (!film) return;

  // Sauvegarder l'ID du film en cours de modification
  filmEnCoursDeModification = filmId;

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
  (document.getElementById("annee") as HTMLSelectElement).value = "2024";
  if (genreChoices) {
    genreChoices.removeActiveItems();
    genreChoices.setChoiceByValue([]);
  }
  (document.getElementById("duree") as HTMLInputElement).value = "";
  (document.getElementById("realisations") as HTMLInputElement).value = "";
  (document.getElementById("distribution") as HTMLInputElement).value = "";
  (document.getElementById("synopsis") as HTMLTextAreaElement).value = "";
  (document.getElementById("note") as HTMLSelectElement).value = "5";
  (document.getElementById("dateVisionnage") as HTMLInputElement).value = new Date().toISOString().split("T")[0];
  (document.getElementById("plateforme") as HTMLSelectElement).value = "Netflix";
  (document.getElementById("affiche") as HTMLInputElement).value = "";

  // Réinitialiser le mode modification
  filmEnCoursDeModification = null;
  const addButton = document.getElementById('ajouter-film-btn') as HTMLButtonElement;
  if (addButton) {
    addButton.textContent = 'Ajouter le film';
  }
}

/* =========================================================
   FONCTION : Supprimer un film
   ========================================================= */
export function supprimerFilm(id: number): void {
  if (!currentUserId) {
    alert("Vous devez être connecté pour supprimer un film.");
    return;
  }

  // Demander confirmation avant de supprimer
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce film ?")) {
    return;
  }

  // Supprimer le film via le contrôleur
  supprimerFilmUtilisateur(currentUserId, id);
  
  // Rafraîchir l'affichage
  chargerFilms(currentUserId).then(filmsActualises => {
    afficherFilms(filmsActualises);
    updateMovieCount();
  });
}

/* =========================================================
   FONCTION : Mise à jour du compteur
   ========================================================= */
export function updateMovieCount(): void {
  const movieCountElement = document.querySelector(".movie-count span");
  if (!movieCountElement) return;

  if (currentUserId) {
    // Si un utilisateur est connecté, obtenir le nombre de ses films depuis le localStorage
    const userFilms = localStorage.getItem(`films_${currentUserId}`);
    const count = userFilms ? JSON.parse(userFilms).length : 0;
    movieCountElement.textContent = String(count).padStart(2, "0");
  } else {
    // Si aucun utilisateur n'est connecté, utiliser le nombre de films par défaut
    movieCountElement.textContent = String(films.length).padStart(2, "0");
  }
}

// Gérer la navigation
function handleNavigation(text: string) {
  // Cacher toutes les sections d'abord
  const sections = [
    '.hero',
    '.movie-form',
    '.movies-list',
    '.dashboard-section',
    '#profile-section',
    '.watchlist-section'
  ];
  
  sections.forEach(section => {
    const element = section.startsWith('#') 
      ? document.getElementById(section.slice(1))
      : document.querySelector(section);
    element?.classList.add('hidden');
  });

  // Afficher la section appropriée
  switch (text) {
    case "Home":
      document.querySelector('.hero')?.classList.remove('hidden');
      document.querySelector('.movie-form')?.classList.remove('hidden');
      document.querySelector('.movies-list')?.classList.remove('hidden');
      break;
    case "Dashboard":
      document.querySelector('.dashboard-section')?.classList.remove('hidden');
      break;
    case "Watchlist":
      document.querySelector('.watchlist-section')?.classList.remove('hidden');
      break;
    case "Profile":
      document.getElementById('profile-section')?.classList.remove('hidden');
      break;
  }
}

// Gérer les clics sur les liens de navigation
const navLinks = document.querySelectorAll(".nav-links a");
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const text = (e.target as HTMLElement).textContent?.trim() || "";
    handleNavigation(text);
    handleNavUnderline(link);
  });
});

function handleNavUnderline(link: Element): void {
  if (!(link instanceof HTMLAnchorElement)) return;
  
  const navLinks = document.querySelectorAll(".nav-links a");
  navLinks.forEach((link) => link.classList.remove("active"));
  link.classList.add("active");
}

/**
 * Remplit certains champs (affiche, année...) avec les infos du film TMDB
 */
async function fillFormWithTMDB(movieId: number): Promise<void> {
  const movieDetails = await getMovieDetails(movieId);
  if (!movieDetails) return;

  // Remplir les champs du formulaire avec les données TMDB
  (document.getElementById("film-title") as HTMLInputElement).value = movieDetails.title;
  (document.getElementById("annee") as HTMLSelectElement).value = new Date(movieDetails.release_date).getFullYear().toString();
  (document.getElementById("duree") as HTMLInputElement).value = movieDetails.runtime?.toString() || "";
  (document.getElementById("realisations") as HTMLInputElement).value = movieDetails.credits?.crew
    .filter(member => member.job === "Director")
    .map(director => director.name)
    .join(", ") || "";
  (document.getElementById("distribution") as HTMLInputElement).value = movieDetails.credits?.cast
    .slice(0, 5)
    .map(actor => actor.name)
    .join(", ") || "";
  (document.getElementById("synopsis") as HTMLTextAreaElement).value = movieDetails.overview || "";
  (document.getElementById("affiche") as HTMLInputElement).value = movieDetails.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
    : "";

  // Gestion des genres
  if (genreChoices && movieDetails.genres) {
    const genreSelect = document.getElementById("genres") as HTMLSelectElement;
    const availableGenres = Array.from(genreSelect.options).map(opt => opt.value);
    
    // Mapper les genres TMDB vers nos genres locaux
    const genreMapping: { [key: string]: string } = {
      "Action": "Action",
      "Adventure": "Aventure",
      "Animation": "Animation",
      "Comedy": "Comédie",
      "Crime": "Policier",
      "Documentary": "Documentaire",
      "Drama": "Drame",
      "Family": "Famille",
      "Fantasy": "Fantastique",
      "History": "Historique",
      "Horror": "Horreur",
      "Music": "Comédie Musicale",
      "Mystery": "Mystère",
      "Romance": "Romance",
      "Science Fiction": "Science-fiction",
      "Thriller": "Thriller",
      "War": "Guerre",
      "Western": "Western"
    };

    // Sélectionner les genres correspondants
    const matchedGenres = movieDetails.genres
      .map(g => genreMapping[g.name])
      .filter(g => g && availableGenres.includes(g));

    genreChoices.removeActiveItems();
    genreChoices.setChoiceByValue(matchedGenres);
  }
}

// Gestion du menu burger
const burgerMenu = document.getElementById('burger-menu');
const mobileMenu = document.getElementById('mobile-menu');
let isMenuOpen = false;

// Créer l'overlay pour le menu mobile
const overlay = document.createElement('div');
overlay.className = 'mobile-menu-overlay';
document.body.appendChild(overlay);

burgerMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        mobileMenu?.classList.remove('hidden');
        mobileMenu?.classList.add('show');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    } else {
        closeMenu();
    }
});

// Fonction pour fermer le menu
function closeMenu() {
    isMenuOpen = false;
    mobileMenu?.classList.remove('show');
    mobileMenu?.classList.add('hidden');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

// Mettre à jour les event listeners
overlay.addEventListener('click', closeMenu);

const mobileLinks = mobileMenu?.querySelectorAll('.nav-links a');
mobileLinks?.forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Fermer le menu si on clique en dehors
document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (isMenuOpen && 
        !mobileMenu?.contains(target) && 
        !burgerMenu?.contains(target)) {
        isMenuOpen = false;
        mobileMenu?.classList.remove('show');
        mobileMenu?.classList.add('hidden');
    }
});

// app.ts ou un code JS
// ... (reste du code inchangé)

import { Film } from "../models/Film";

export class FilterController {
    private films: Film[] = [];

    constructor() {
        this.initializeListeners();
    }

    public setFilms(films: Film[]) {
        this.films = [...films];
        this.applyFilters();
    }

    private initializeListeners() {
        const filterElements = ['sort-select', 'platform-select', 'genre-select'];
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });
    }

    private applyFilters() {
        if (!this.films.length) return;

        let filteredFilms = [...this.films];

        // Récupérer les valeurs des filtres
        const platformValue = (document.getElementById('platform-select') as HTMLSelectElement)?.value;
        const genreValue = (document.getElementById('genre-select') as HTMLSelectElement)?.value;
        const sortValue = (document.getElementById('sort-select') as HTMLSelectElement)?.value || 'date-desc';

        // Appliquer les filtres
        if (platformValue) {
            filteredFilms = filteredFilms.filter(film => film.plateforme === platformValue);
        }

        if (genreValue) {
            filteredFilms = filteredFilms.filter(film => film.genres.includes(genreValue));
        }

        // Appliquer le tri
        filteredFilms.sort((a, b) => {
            switch (sortValue) {
                case 'date-desc':
                    return new Date(b.dateDeVisionnage).getTime() - new Date(a.dateDeVisionnage).getTime();
                case 'date-asc':
                    return new Date(a.dateDeVisionnage).getTime() - new Date(b.dateDeVisionnage).getTime();
                case 'title-asc':
                    return a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' });
                case 'title-desc':
                    return b.titre.localeCompare(a.titre, 'fr', { sensitivity: 'base' });
                case 'rating-desc':
                    return b.note - a.note;
                case 'rating-asc':
                    return a.note - b.note;
                case 'year-desc':
                    return b.annee - a.annee;
                case 'year-asc':
                    return a.annee - b.annee;
                default:
                    return 0;
            }
        });

        // Mettre à jour l'affichage
        const container = document.querySelector('.movies-grid');
        if (!container) return;

        container.innerHTML = '';
        filteredFilms.forEach(film => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.dataset.id = film.id.toString();
            
            card.innerHTML = `
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
            `;

            container.appendChild(card);
        });

        // Réattacher les event listeners
        this.attachCardEventListeners();

        // Déclencher l'événement de mise à jour
        document.dispatchEvent(new CustomEvent('filmsUpdated', { 
            detail: { films: filteredFilms }
        }));
    }

    private attachCardEventListeners() {
        // Gestionnaire pour les boutons de suppression
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const filmId = (e.currentTarget as HTMLElement).dataset.id;
                if (filmId) {
                    document.dispatchEvent(new CustomEvent('filmDelete', {
                        detail: { filmId: parseInt(filmId) }
                    }));
                }
            });
        });

        // Gestionnaire pour les boutons de modification
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const filmId = (e.currentTarget as HTMLElement).dataset.id;
                if (filmId) {
                    document.dispatchEvent(new CustomEvent('filmEdit', {
                        detail: { filmId: parseInt(filmId) }
                    }));
                }
            });
        });
    }
}
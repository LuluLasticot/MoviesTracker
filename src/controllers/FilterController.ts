import { Film } from "../models/Film";

interface FilterState {
    sort: string;
    platform: string;
    genre: string;
    yearMin: number | null;
    yearMax: number | null;
}

export class FilterController {
    private films: Film[] = [];
    private filteredFilms: Film[] = [];
    private filterState: FilterState = {
        sort: 'date-desc',
        platform: '',
        genre: '',
        yearMin: null,
        yearMax: null
    };

    constructor() {
        this.initializeFilters();
    }

    setFilms(films: Film[]) {
        this.films = films;
        this.applyFilters();
    }

    private initializeFilters() {
        // Tri
        const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
        sortSelect?.addEventListener('change', () => {
            this.filterState.sort = sortSelect.value;
            this.applyFilters();
        });

        // Plateforme
        const platformSelect = document.getElementById('platform-select') as HTMLSelectElement;
        platformSelect?.addEventListener('change', () => {
            this.filterState.platform = platformSelect.value;
            this.applyFilters();
        });

        // Genre
        const genreSelect = document.getElementById('genre-select') as HTMLSelectElement;
        genreSelect?.addEventListener('change', () => {
            this.filterState.genre = genreSelect.value;
            this.applyFilters();
        });

        // Année min
        const yearMinInput = document.getElementById('year-min') as HTMLInputElement;
        yearMinInput?.addEventListener('change', () => {
            this.filterState.yearMin = yearMinInput.value ? parseInt(yearMinInput.value) : null;
            this.applyFilters();
        });

        // Année max
        const yearMaxInput = document.getElementById('year-max') as HTMLInputElement;
        yearMaxInput?.addEventListener('change', () => {
            this.filterState.yearMax = yearMaxInput.value ? parseInt(yearMaxInput.value) : null;
            this.applyFilters();
        });

        // Réinitialisation
        const resetButton = document.getElementById('reset-filters');
        resetButton?.addEventListener('click', () => this.resetFilters());
    }

    private resetFilters() {
        // Réinitialiser l'état des filtres
        this.filterState = {
            sort: 'date-desc',
            platform: '',
            genre: '',
            yearMin: null,
            yearMax: null
        };

        // Réinitialiser les éléments du DOM
        (document.getElementById('sort-select') as HTMLSelectElement).value = 'date-desc';
        (document.getElementById('platform-select') as HTMLSelectElement).value = '';
        (document.getElementById('genre-select') as HTMLSelectElement).value = '';
        (document.getElementById('year-min') as HTMLInputElement).value = '';
        (document.getElementById('year-max') as HTMLInputElement).value = '';

        // Réappliquer les filtres
        this.applyFilters();
    }

    private applyFilters() {
        // Appliquer les filtres
        this.filteredFilms = this.films.filter(film => {
            // Filtre par plateforme
            if (this.filterState.platform && film.plateforme !== this.filterState.platform) {
                return false;
            }

            // Filtre par genre
            if (this.filterState.genre && !film.genres.includes(this.filterState.genre)) {
                return false;
            }

            // Filtre par année
            if (this.filterState.yearMin && film.annee < this.filterState.yearMin) {
                return false;
            }
            if (this.filterState.yearMax && film.annee > this.filterState.yearMax) {
                return false;
            }

            return true;
        });

        // Appliquer le tri
        this.filteredFilms.sort((a, b) => {
            switch (this.filterState.sort) {
                case 'date-desc':
                    return new Date(b.dateDeVisionnage).getTime() - new Date(a.dateDeVisionnage).getTime();
                case 'date-asc':
                    return new Date(a.dateDeVisionnage).getTime() - new Date(b.dateDeVisionnage).getTime();
                case 'title-asc':
                    return a.titre.localeCompare(b.titre);
                case 'title-desc':
                    return b.titre.localeCompare(a.titre);
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
        this.updateDisplay();
    }

    private updateDisplay() {
        const container = document.querySelector('.movies-grid');
        if (!container) return;

        container.innerHTML = '';

        this.filteredFilms.forEach((film) => {
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

        // Réattacher les event listeners pour les boutons
        this.reattachCardEventListeners();
    }

    private reattachCardEventListeners() {
        // Boutons de suppression
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const button = event.currentTarget as HTMLButtonElement;
                const filmId = parseInt(button.getAttribute('data-id') || '0');
                // Déclencher un événement personnalisé pour la suppression
                const deleteEvent = new CustomEvent('filmDelete', { detail: { filmId } });
                document.dispatchEvent(deleteEvent);
            });
        });

        // Boutons de modification
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const button = event.currentTarget as HTMLButtonElement;
                const filmId = parseInt(button.getAttribute('data-id') || '0');
                // Déclencher un événement personnalisé pour la modification
                const editEvent = new CustomEvent('filmEdit', { detail: { filmId } });
                document.dispatchEvent(editEvent);
            });
        });
    }
}

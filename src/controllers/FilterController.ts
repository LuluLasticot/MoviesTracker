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
        this.films = [...films]; // Créer une copie du tableau
        this.applyFilters();
    }

    private initializeFilters() {
        // Tri
        const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
        if (sortSelect) {
            sortSelect.value = this.filterState.sort;
            sortSelect.addEventListener('change', () => {
                this.filterState.sort = sortSelect.value;
                this.applyFilters();
            });
        }

        // Plateforme
        const platformSelect = document.getElementById('platform-select') as HTMLSelectElement;
        if (platformSelect) {
            platformSelect.value = this.filterState.platform;
            platformSelect.addEventListener('change', () => {
                this.filterState.platform = platformSelect.value;
                this.applyFilters();
            });
        }

        // Genre
        const genreSelect = document.getElementById('genre-select') as HTMLSelectElement;
        if (genreSelect) {
            genreSelect.value = this.filterState.genre;
            genreSelect.addEventListener('change', () => {
                this.filterState.genre = genreSelect.value;
                this.applyFilters();
            });
        }

        // Année min
        const yearMinInput = document.getElementById('year-min') as HTMLInputElement;
        if (yearMinInput) {
            yearMinInput.value = this.filterState.yearMin?.toString() || '';
            yearMinInput.addEventListener('change', () => {
                this.filterState.yearMin = yearMinInput.value ? parseInt(yearMinInput.value) : null;
                this.applyFilters();
            });
        }

        // Année max
        const yearMaxInput = document.getElementById('year-max') as HTMLInputElement;
        if (yearMaxInput) {
            yearMaxInput.value = this.filterState.yearMax?.toString() || '';
            yearMaxInput.addEventListener('change', () => {
                this.filterState.yearMax = yearMaxInput.value ? parseInt(yearMaxInput.value) : null;
                this.applyFilters();
            });
        }

        // Réinitialisation
        const resetButton = document.getElementById('reset-filters');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetFilters());
        }
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
        const elements = {
            'sort-select': 'date-desc',
            'platform-select': '',
            'genre-select': '',
            'year-min': '',
            'year-max': ''
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id) as HTMLSelectElement | HTMLInputElement;
            if (element) {
                element.value = value;
            }
        });

        // Réappliquer les filtres
        this.applyFilters();
    }

    private applyFilters() {
        if (!this.films) return;

        // Créer une copie du tableau original
        this.filteredFilms = [...this.films];

        // Appliquer les filtres
        this.filteredFilms = this.filteredFilms.filter(film => {
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
                    return new Date(b.dateDeVisionnage || '').getTime() - new Date(a.dateDeVisionnage || '').getTime();
                case 'date-asc':
                    return new Date(a.dateDeVisionnage || '').getTime() - new Date(b.dateDeVisionnage || '').getTime();
                case 'title-asc':
                    return a.titre.localeCompare(b.titre);
                case 'title-desc':
                    return b.titre.localeCompare(a.titre);
                case 'rating-desc':
                    return (b.note || 0) - (a.note || 0);
                case 'rating-asc':
                    return (a.note || 0) - (b.note || 0);
                case 'year-desc':
                    return (b.annee || 0) - (a.annee || 0);
                case 'year-asc':
                    return (a.annee || 0) - (b.annee || 0);
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

        // Sauvegarder le contenu HTML actuel
        const oldHtml = container.innerHTML;

        // Générer le nouveau HTML
        const newHtml = this.filteredFilms.map((film) => `
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
        `).join('');

        // Mettre à jour le DOM uniquement si le contenu a changé
        if (newHtml !== oldHtml) {
            container.innerHTML = newHtml;
            this.reattachCardEventListeners();
        }
    }

    private reattachCardEventListeners() {
        // Boutons de suppression
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const button = event.currentTarget as HTMLButtonElement;
                const filmId = parseInt(button.getAttribute('data-id') || '0');
                if (filmId) {
                    const deleteEvent = new CustomEvent('filmDelete', { 
                        detail: { filmId },
                        bubbles: true,
                        cancelable: true 
                    });
                    document.dispatchEvent(deleteEvent);
                }
            });
        });

        // Boutons de modification
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const button = event.currentTarget as HTMLButtonElement;
                const filmId = parseInt(button.getAttribute('data-id') || '0');
                if (filmId) {
                    const editEvent = new CustomEvent('filmEdit', { 
                        detail: { filmId },
                        bubbles: true,
                        cancelable: true 
                    });
                    document.dispatchEvent(editEvent);
                }
            });
        });
    }
}

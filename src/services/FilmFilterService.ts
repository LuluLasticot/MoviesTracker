import { Film } from '../models/Film';
import { StateManager } from '../utils/StateManager';
import { debounce } from '../utils/debounce';

type SortCriteria = 'Titre' | 'Note' | 'Année' | 'Durée';

interface FilterState {
    activeFilters: {
        platform: string;
        genre: string;
        yearMin?: number;
        yearMax?: number;
    };
    sortCriteria: SortCriteria;
    sortDirection: 'asc' | 'desc';
}

export class FilmFilterService {
    private static instance: FilmFilterService;
    private state: StateManager<FilterState>;
    private readonly DEBOUNCE_DELAY = 300;

    private constructor() {
        this.state = new StateManager<FilterState>({
            activeFilters: {
                platform: '',
                genre: '',
            },
            sortCriteria: 'Titre',
            sortDirection: 'asc'
        });

        this.setupEventListeners();
    }

    public static getInstance(): FilmFilterService {
        if (!FilmFilterService.instance) {
            FilmFilterService.instance = new FilmFilterService();
        }
        return FilmFilterService.instance;
    }

    private setupEventListeners(): void {
        // Tri
        const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.setSortCriteria(sortSelect.value as SortCriteria);
            });
        }

        // Plateforme
        const platformSelect = document.getElementById('platform-select') as HTMLSelectElement;
        if (platformSelect) {
            platformSelect.addEventListener('change', () => {
                this.updateFilter('platform', platformSelect.value);
            });
        }

        // Genre
        const genreSelect = document.getElementById('genre-select') as HTMLSelectElement;
        if (genreSelect) {
            genreSelect.addEventListener('change', () => {
                this.updateFilter('genre', genreSelect.value);
            });
        }

        // Année
        const yearInputs = {
            min: document.getElementById('year-min') as HTMLInputElement,
            max: document.getElementById('year-max') as HTMLInputElement
        };

        const updateYearRange = debounce(() => {
            const minYear = parseInt(yearInputs.min?.value || '');
            const maxYear = parseInt(yearInputs.max?.value || '');
            
            this.state.setState({
                ...this.state.getState(),
                activeFilters: {
                    ...this.state.getState().activeFilters,
                    yearMin: !isNaN(minYear) ? minYear : undefined,
                    yearMax: !isNaN(maxYear) ? maxYear : undefined
                }
            });
        }, this.DEBOUNCE_DELAY);

        Object.values(yearInputs).forEach(input => {
            if (input) {
                input.addEventListener('input', updateYearRange);
            }
        });

        // Bouton de réinitialisation
        const resetButton = document.getElementById('reset-filters');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    public filterAndSortFilms(films: Film[]): Film[] {
        const state = this.state.getState();
        let filteredFilms = [...films];

        // Appliquer les filtres
        if (state.activeFilters.platform) {
            filteredFilms = filteredFilms.filter(film => 
                film.plateforme === state.activeFilters.platform
            );
        }

        if (state.activeFilters.genre) {
            filteredFilms = filteredFilms.filter(film => 
                film.genres.includes(state.activeFilters.genre)
            );
        }

        if (state.activeFilters.yearMin !== undefined) {
            filteredFilms = filteredFilms.filter(film => 
                film.annee >= (state.activeFilters.yearMin || 0)
            );
        }

        if (state.activeFilters.yearMax !== undefined) {
            filteredFilms = filteredFilms.filter(film => 
                film.annee <= (state.activeFilters.yearMax || 9999)
            );
        }

        // Appliquer le tri
        filteredFilms.sort((a, b) => {
            let comparison = 0;
            switch (state.sortCriteria) {
                case 'Note':
                    comparison = (b.note || 0) - (a.note || 0);
                    break;
                case 'Titre':
                    comparison = a.titre.localeCompare(b.titre);
                    break;
                case 'Année':
                    comparison = b.annee - a.annee;
                    break;
                case 'Durée':
                    comparison = (b.duree || 0) - (a.duree || 0);
                    break;
            }
            return state.sortDirection === 'asc' ? comparison : -comparison;
        });

        return filteredFilms;
    }

    public setSortCriteria(criteria: SortCriteria): void {
        const currentState = this.state.getState();
        if (currentState.sortCriteria === criteria) {
            // Si même critère, inverser la direction
            this.state.setState({
                ...currentState,
                sortDirection: currentState.sortDirection === 'asc' ? 'desc' : 'asc'
            });
        } else {
            // Nouveau critère, direction par défaut
            this.state.setState({
                ...currentState,
                sortCriteria: criteria,
                sortDirection: 'asc'
            });
        }
    }

    private updateFilter<K extends keyof FilterState['activeFilters']>(
        key: K,
        value: FilterState['activeFilters'][K]
    ): void {
        this.state.setState({
            ...this.state.getState(),
            activeFilters: {
                ...this.state.getState().activeFilters,
                [key]: value
            }
        });
    }

    public resetFilters(): void {
        // Réinitialiser l'état
        this.state.setState({
            ...this.state.getState(),
            activeFilters: {
                platform: '',
                genre: '',
                yearMin: undefined,
                yearMax: undefined
            }
        });

        // Réinitialiser les éléments du DOM
        const platformSelect = document.getElementById('platform-select') as HTMLSelectElement;
        const genreSelect = document.getElementById('genre-select') as HTMLSelectElement;
        const yearMin = document.getElementById('year-min') as HTMLInputElement;
        const yearMax = document.getElementById('year-max') as HTMLInputElement;

        if (platformSelect) platformSelect.value = '';
        if (genreSelect) genreSelect.value = '';
        if (yearMin) yearMin.value = '';
        if (yearMax) yearMax.value = '';
    }

    public getState(): FilterState {
        return this.state.getState();
    }

    public subscribe(callback: (state: FilterState) => void): () => void {
        return this.state.subscribe(callback);
    }
}

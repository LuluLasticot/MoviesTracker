import { Film } from "../models/Film";
import { FilterState, SortValue, FILTER_IDS, DEFAULT_SORT } from "../types/FilterTypes";
import { debounce } from "../utils/debounce";

export class FilterController {
    private films: Film[] = [];
    private filteredFilms: Film[] = [];
    private filterState: FilterState = {
        sort: DEFAULT_SORT
    };
    private filterChangeCallback: ((films: Film[]) => void) | null = null;

    constructor() {
        this.initializeListeners();
    }

    public setFilms(films: Film[]) {
        this.films = [...films];
        this.applyFilters();
    }

    public onFilterChange(callback: (films: Film[]) => void) {
        this.filterChangeCallback = callback;
    }

    private initializeListeners() {
        Object.values(FILTER_IDS).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', this.handleFilterChange.bind(this));
            }
        });
    }

    private handleFilterChange = debounce((event: Event) => {
        const target = event.target as HTMLSelectElement;
        const value = target.value;

        switch (target.id) {
            case FILTER_IDS.PLATFORM:
                this.filterState.platform = value || undefined;
                break;
            case FILTER_IDS.GENRE:
                this.filterState.genre = value || undefined;
                break;
            case FILTER_IDS.SORT:
                this.filterState.sort = (value as SortValue) || DEFAULT_SORT;
                break;
        }

        this.applyFilters();
    }, 150);

    private applyFilters() {
        if (!this.films.length) return;

        this.filteredFilms = this.films.filter(film => {
            if (this.filterState.platform && film.plateforme !== this.filterState.platform) {
                return false;
            }
            if (this.filterState.genre && !film.genres.includes(this.filterState.genre)) {
                return false;
            }
            return true;
        });

        this.applySorting();

        if (this.filterChangeCallback) {
            this.filterChangeCallback(this.filteredFilms);
        }
    }

    private applySorting() {
        const compareDate = (a: Film, b: Film, ascending: boolean = true) => {
            const multiplier = ascending ? 1 : -1;
            return multiplier * (new Date(a.dateDeVisionnage).getTime() - new Date(b.dateDeVisionnage).getTime());
        };

        const compareString = (a: string, b: string, ascending: boolean = true) => {
            const multiplier = ascending ? 1 : -1;
            return multiplier * a.localeCompare(b);
        };

        const compareNumber = (a: number, b: number, ascending: boolean = true) => {
            const multiplier = ascending ? 1 : -1;
            return multiplier * (a - b);
        };

        this.filteredFilms.sort((a, b) => {
            switch (this.filterState.sort) {
                case 'date-desc':
                    return compareDate(b, a);
                case 'date-asc':
                    return compareDate(a, b);
                case 'title-asc':
                    return compareString(a.titre, b.titre);
                case 'title-desc':
                    return compareString(b.titre, a.titre);
                case 'rating-desc':
                    return compareNumber(b.note, a.note);
                case 'rating-asc':
                    return compareNumber(a.note, b.note);
                default:
                    return 0;
            }
        });
    }

    public resetFilters() {
        this.filterState = {
            sort: DEFAULT_SORT
        };
        
        Object.values(FILTER_IDS).forEach(id => {
            const element = document.getElementById(id) as HTMLSelectElement;
            if (element) {
                element.value = '';
            }
        });

        this.applyFilters();
    }
}
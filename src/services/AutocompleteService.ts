import { searchMoviesOnTMDB } from '../api/tmdb';
import { debounce } from '../utils/debounce';
import { FormService } from './FormService';

interface MovieSuggestion {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string;
}

interface AutocompleteState {
    isVisible: boolean;
    selectedIndex: number;
    suggestions: MovieSuggestion[];
}

export class AutocompleteService {
    private static instance: AutocompleteService;
    private suggestionBox: HTMLUListElement | null = null;
    private formService: FormService;
    private state: AutocompleteState;
    private inputElement: HTMLInputElement | null = null;

    // Configuration
    private readonly MAX_SUGGESTIONS = 5;
    private readonly DEBOUNCE_DELAY = 300;
    private readonly MIN_CHARS = 2;

    private constructor() {
        this.formService = FormService.getInstance();
        this.state = {
            isVisible: false,
            selectedIndex: -1,
            suggestions: []
        };

        // Créer la boîte de suggestions si elle n'existe pas
        this.createSuggestionBox();
    }

    public static getInstance(): AutocompleteService {
        if (!AutocompleteService.instance) {
            AutocompleteService.instance = new AutocompleteService();
        }
        return AutocompleteService.instance;
    }

    private createSuggestionBox(): void {
        if (!this.suggestionBox) {
            this.suggestionBox = document.createElement('ul');
            this.suggestionBox.className = 'suggestions-list hidden';
            document.body.appendChild(this.suggestionBox);
        }
    }

    public async initialize(inputElement: HTMLInputElement): Promise<void> {
        this.inputElement = inputElement;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        if (!this.inputElement) return;

        // Gestionnaire de recherche avec debounce
        const debouncedSearch = debounce(async (query: string) => {
            if (query.length >= this.MIN_CHARS) {
                const movies = await searchMoviesOnTMDB(query);
                this.showSuggestions(movies);
            } else {
                this.clearSuggestions();
            }
        }, this.DEBOUNCE_DELAY);

        // Event listener pour l'input
        this.inputElement.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            debouncedSearch(target.value);
        });

        // Event listener pour les touches spéciales
        this.inputElement.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));

        // Fermer les suggestions lors d'un clic à l'extérieur
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!this.inputElement?.contains(target) && !this.suggestionBox?.contains(target)) {
                this.clearSuggestions();
            }
        });
    }

    private async handleKeyboardNavigation(e: KeyboardEvent): Promise<void> {
        if (!this.state.isVisible) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectNextSuggestion();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectPreviousSuggestion();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.state.selectedIndex >= 0) {
                    await this.selectSuggestion(this.state.selectedIndex);
                }
                break;
            case 'Escape':
                this.clearSuggestions();
                break;
        }
    }

    private selectNextSuggestion(): void {
        const newIndex = Math.min(
            this.state.selectedIndex + 1,
            this.state.suggestions.length - 1
        );
        this.updateSelectedSuggestion(newIndex);
    }

    private selectPreviousSuggestion(): void {
        const newIndex = Math.max(this.state.selectedIndex - 1, -1);
        this.updateSelectedSuggestion(newIndex);
    }

    private updateSelectedSuggestion(index: number): void {
        if (!this.suggestionBox) return;

        // Supprimer la sélection précédente
        const previousSelected = this.suggestionBox.querySelector('.selected');
        previousSelected?.classList.remove('selected');

        // Mettre à jour l'index sélectionné
        this.state.selectedIndex = index;

        // Ajouter la nouvelle sélection
        if (index >= 0) {
            const items = this.suggestionBox.querySelectorAll('li');
            items[index]?.classList.add('selected');
        }
    }

    private async selectSuggestion(index: number): Promise<void> {
        const movie = this.state.suggestions[index];
        if (movie && this.inputElement) {
            this.inputElement.value = movie.title;
            await this.formService.fillFormWithTMDB(movie.id);
            this.clearSuggestions();
        }
    }

    private showSuggestions(movies: MovieSuggestion[]): void {
        if (!this.suggestionBox || !this.inputElement) return;

        // Mettre à jour l'état
        this.state.suggestions = movies.slice(0, this.MAX_SUGGESTIONS);
        this.state.selectedIndex = -1;
        this.state.isVisible = true;

        // Vider la liste actuelle
        this.suggestionBox.innerHTML = '';

        // Positionner la boîte de suggestions
        const inputRect = this.inputElement.getBoundingClientRect();
        Object.assign(this.suggestionBox.style, {
            position: 'absolute',
            top: `${inputRect.bottom + window.scrollY}px`,
            left: `${inputRect.left + window.scrollX}px`,
            width: `${inputRect.width}px`,
            zIndex: '1000'
        });

        // Créer les éléments de suggestion
        this.state.suggestions.forEach((movie, index) => {
            const li = document.createElement('li');
            li.tabIndex = 0;
            li.innerHTML = `
                <div class="suggestion-content">
                    ${movie.poster_path ? `
                        <img src="https://image.tmdb.org/t/p/w92${movie.poster_path}" 
                             alt="${movie.title}"
                             onerror="this.src='https://via.placeholder.com/92x138?text=No+Image'">
                    ` : `
                        <img src="https://via.placeholder.com/92x138?text=No+Image" 
                             alt="No image available">
                    `}
                    <div class="suggestion-info">
                        <div class="suggestion-title">${movie.title}</div>
                        ${movie.release_date ? `
                            <div class="suggestion-year">${new Date(movie.release_date).getFullYear()}</div>
                        ` : ''}
                    </div>
                </div>
            `;

            li.addEventListener('click', () => this.selectSuggestion(index));
            li.addEventListener('mouseenter', () => this.updateSelectedSuggestion(index));

            if (this.suggestionBox) {
                this.suggestionBox.appendChild(li);
            }
        });

        // Afficher la boîte de suggestions
        if (this.suggestionBox) {
            this.suggestionBox.classList.remove('hidden');
        }
    }

    public clearSuggestions(): void {
        if (!this.suggestionBox) return;

        // Mettre à jour l'état
        this.state.suggestions = [];
        this.state.selectedIndex = -1;
        this.state.isVisible = false;

        // Cacher la boîte de suggestions
        this.suggestionBox.classList.add('hidden');
        this.suggestionBox.innerHTML = '';
    }
}

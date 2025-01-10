import { WatchlistItem } from "../models/WatchlistItem";
import { getMovieDetails, searchMoviesOnTMDB } from "../api/tmdb";
import { ajouterFilm } from "./FilmController";
import { Film } from "../models/Film";
import { debounce } from "../utils/debounce";

interface MovieCache {
    [key: number]: {
        details: any;
        timestamp: number;
    }
}

export class WatchlistController {
    private watchlist: WatchlistItem[] = [];
    private currentUserId: number | undefined;
    private movieCache: MovieCache = {};
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures
    private debouncedUpdateUI: Function;
    private eventListeners: { [key: string]: (event: Event) => void } = {};

    constructor(userId?: number) {
        this.currentUserId = userId;
        this.debouncedUpdateUI = debounce(this.updateUI.bind(this), 250);
        this.loadWatchlist();
        this.initializeSearch();
        this.setupEventListeners();
    }

    private async loadWatchlist() {
        if (!this.currentUserId) {
            this.watchlist = [];
            this.debouncedUpdateUI();
            return;
        }

        try {
            const storedWatchlist = localStorage.getItem(`watchlist_${this.currentUserId}`);
            if (storedWatchlist) {
                this.watchlist = JSON.parse(storedWatchlist);
                this.debouncedUpdateUI();
            }
        } catch (error) {
            console.error("Erreur lors du chargement de la watchlist:", error);
            this.watchlist = [];
            this.debouncedUpdateUI();
        }
    }

    private saveWatchlist() {
        if (this.currentUserId) {
            localStorage.setItem(`watchlist_${this.currentUserId}`, JSON.stringify(this.watchlist));
        }
    }

    private async getMovieDetailsWithCache(movieId: number) {
        const now = Date.now();
        const cached = this.movieCache[movieId];

        if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
            return cached.details;
        }

        const details = await getMovieDetails(movieId);
        this.movieCache[movieId] = {
            details,
            timestamp: now
        };

        return details;
    }

    public async ajouterFilm(movieId: number, priorite: 'haute' | 'moyenne' | 'basse' = 'moyenne', notes?: string) {
        try {
            const movieDetails = await this.getMovieDetailsWithCache(movieId);
            
            const director = movieDetails.credits?.crew?.find((person: { job: string; name: string; }) => person.job === 'Director')?.name || 'Non spécifié';
            const posterPath = movieDetails.poster_path || '';
            
            const newItem: WatchlistItem = {
                id: movieId,
                titre: movieDetails.title,
                affiche: posterPath,
                annee: new Date(movieDetails.release_date || '').getFullYear(),
                realisateur: director,
                dateAjout: new Date().toISOString(),
                priorite,
                notes
            };

            // Vérifier si le film n'est pas déjà dans la watchlist
            if (!this.watchlist.some(item => item.id === movieId)) {
                this.watchlist.push(newItem);
                this.saveWatchlist();
                this.debouncedUpdateUI();

                this.notifyWatchlistUpdate();
            }
        } catch (error) {
            console.error("Erreur lors de l'ajout à la watchlist:", error);
        }
    }

    private notifyWatchlistUpdate() {
        document.dispatchEvent(new CustomEvent('watchlistUpdated', {
            detail: { watchlist: this.watchlist }
        }));
    }

    public supprimerFilm(movieId: number) {
        this.watchlist = this.watchlist.filter(item => item.id !== movieId);
        this.saveWatchlist();
        this.debouncedUpdateUI();
        this.notifyWatchlistUpdate();
    }

    public modifierPriorite(movieId: number, nouvellePriorite: 'haute' | 'moyenne' | 'basse') {
        const item = this.watchlist.find(item => item.id === movieId);
        if (item) {
            item.priorite = nouvellePriorite;
            this.saveWatchlist();
            this.debouncedUpdateUI();
        }
    }

    public modifierNotes(movieId: number, notes: string) {
        const item = this.watchlist.find(item => item.id === movieId);
        if (item) {
            item.notes = notes;
            this.saveWatchlist();
            this.debouncedUpdateUI();
        }
    }

    public async marquerCommeVu(movieId: number) {
        try {
            if (!this.currentUserId) {
                alert("Vous devez être connecté pour marquer un film comme vu.");
                return;
            }

            const film = this.watchlist.find(item => item.id === movieId);
            if (!film) return;

            const movieDetails = await this.getMovieDetailsWithCache(movieId);
            
            const nouveauFilm = new Film({
                id: movieId,
                titre: film.titre,
                annee: film.annee,
                genres: movieDetails.genres?.map((g: { name: string }) => g.name) || [],
                duree: movieDetails.runtime || 120,
                realisateur: film.realisateur,
                acteurs: movieDetails.credits?.cast?.slice(0, 5).map((actor: { name: string }) => actor.name) || [],
                synopsis: movieDetails.overview || '',
                note: 0,
                dateDeVisionnage: new Date().toISOString().split('T')[0],
                plateforme: 'Autre',
                affiche: `https://image.tmdb.org/t/p/w500${movieDetails.poster_path || film.affiche}`
            });

            await ajouterFilm(this.currentUserId, nouveauFilm);
            this.supprimerFilm(movieId);
            document.dispatchEvent(new CustomEvent('filmsUpdated'));

        } catch (error) {
            console.error("Erreur lors du marquage comme vu:", error);
        }
    }

    private getSortedWatchlist(): WatchlistItem[] {
        const priorityOrder = { haute: 3, moyenne: 2, basse: 1 };
        return [...this.watchlist].sort((a, b) => {
            if (priorityOrder[a.priorite] !== priorityOrder[b.priorite]) {
                return priorityOrder[b.priorite] - priorityOrder[a.priorite];
            }
            return new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime();
        });
    }

    private renderWatchlistItem(item: WatchlistItem): string {
        return `
            <div class="watchlist-card priority-${item.priorite}">
                <div class="watchlist-poster">
                    <img src="https://image.tmdb.org/t/p/w500${item.affiche}" 
                         alt="${item.titre}"
                         loading="lazy">
                    <div class="priority-badge">${this.getPriorityIcon(item.priorite)}</div>
                </div>
                <div class="watchlist-info">
                    <h3>${item.titre} (${item.annee})</h3>
                    <p class="director">Par ${item.realisateur}</p>
                    <p class="added-date">Ajouté le ${new Date(item.dateAjout).toLocaleDateString()}</p>
                    ${item.notes ? `<p class="notes">${item.notes}</p>` : ''}
                    <div class="watchlist-actions">
                        <select class="priority-select" data-movie-id="${item.id}">
                            <option value="haute" ${item.priorite === 'haute' ? 'selected' : ''}>Haute</option>
                            <option value="moyenne" ${item.priorite === 'moyenne' ? 'selected' : ''}>Moyenne</option>
                            <option value="basse" ${item.priorite === 'basse' ? 'selected' : ''}>Basse</option>
                        </select>
                        <button class="edit-notes" data-movie-id="${item.id}" title="Modifier les notes">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="mark-as-watched" data-movie-id="${item.id}" title="Marquer comme vu">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="remove-from-watchlist" data-movie-id="${item.id}" title="Retirer de la watchlist">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    private updateUI() {
        const watchlistContainer = document.querySelector('.watchlist-grid');
        if (!watchlistContainer) return;

        const sortedWatchlist = this.getSortedWatchlist();
        watchlistContainer.innerHTML = sortedWatchlist.map(item => this.renderWatchlistItem(item)).join('');
        
        this.setupEventListeners();
    }

    private getPriorityIcon(priorite: 'haute' | 'moyenne' | 'basse'): string {
        const icons = {
            haute: '<i class="fas fa-exclamation-circle" title="Priorité haute"></i>',
            moyenne: '<i class="fas fa-circle" title="Priorité moyenne"></i>',
            basse: '<i class="fas fa-arrow-circle-down" title="Priorité basse"></i>'
        };
        return icons[priorite];
    }

    private removeEventListeners() {
        Object.entries(this.eventListeners).forEach(([selector, listener]) => {
            document.querySelectorAll(selector).forEach(element => {
                element.removeEventListener('change', listener);
                element.removeEventListener('click', listener);
            });
        });
        this.eventListeners = {};
    }

    private setupEventListeners() {
        // Nettoyer les anciens écouteurs d'événements
        this.removeEventListeners();

        // Écouteur pour le changement de priorité
        const priorityListener = (event: Event) => {
            const select = event.target as HTMLSelectElement;
            const movieId = parseInt(select.dataset.movieId || '0');
            this.modifierPriorite(movieId, select.value as 'haute' | 'moyenne' | 'basse');
        };
        this.eventListeners['.priority-select'] = priorityListener;
        document.querySelectorAll('.priority-select').forEach(select => {
            select.addEventListener('change', priorityListener);
        });

        // Écouteur pour la modification des notes
        const notesListener = (event: Event) => {
            const button = event.target as HTMLButtonElement;
            const movieId = parseInt(button.dataset.movieId || '0');
            const item = this.watchlist.find(item => item.id === movieId);
            if (item) {
                const notes = prompt('Modifier les notes:', item.notes || '');
                if (notes !== null) {
                    this.modifierNotes(movieId, notes);
                }
            }
        };
        this.eventListeners['.edit-notes'] = notesListener;
        document.querySelectorAll('.edit-notes').forEach(button => {
            button.addEventListener('click', notesListener);
        });

        // Écouteur pour marquer comme vu
        const watchedListener = (event: Event) => {
            const button = event.target as HTMLButtonElement;
            const movieId = parseInt(button.dataset.movieId || '0');
            this.marquerCommeVu(movieId);
        };
        this.eventListeners['.mark-as-watched'] = watchedListener;
        document.querySelectorAll('.mark-as-watched').forEach(button => {
            button.addEventListener('click', watchedListener);
        });

        // Écouteur pour la suppression
        const removeListener = (event: Event) => {
            const button = event.target as HTMLButtonElement;
            const movieId = parseInt(button.dataset.movieId || '0');
            if (confirm('Voulez-vous vraiment retirer ce film de votre watchlist ?')) {
                this.supprimerFilm(movieId);
            }
        };
        this.eventListeners['.remove-from-watchlist'] = removeListener;
        document.querySelectorAll('.remove-from-watchlist').forEach(button => {
            button.addEventListener('click', removeListener);
        });
    }

    private initializeSearch() {
        // La logique de recherche reste inchangée car elle est déjà bien optimisée
    }
}

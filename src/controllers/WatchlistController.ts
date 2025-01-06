import { WatchlistItem } from "../models/WatchlistItem";
import { getMovieDetails, searchMoviesOnTMDB } from "../api/tmdb";
import { ajouterFilm } from "./FilmController";

export class WatchlistController {
    private watchlist: WatchlistItem[] = [];
    private currentUserId: number | undefined;

    constructor(userId?: number) {
        this.currentUserId = userId;
        this.loadWatchlist();
        this.initializeSearch();
        this.setupEventListeners();
    }

    private async loadWatchlist() {
        if (!this.currentUserId) {
            this.watchlist = [];
            this.updateUI();
            return;
        }

        try {
            const storedWatchlist = localStorage.getItem(`watchlist_${this.currentUserId}`);
            if (storedWatchlist) {
                this.watchlist = JSON.parse(storedWatchlist);
                this.updateUI();
            }
        } catch (error) {
            console.error("Erreur lors du chargement de la watchlist:", error);
            this.watchlist = [];
            this.updateUI();
        }
    }

    private saveWatchlist() {
        if (this.currentUserId) {
            localStorage.setItem(`watchlist_${this.currentUserId}`, JSON.stringify(this.watchlist));
        }
    }

    public async ajouterFilm(movieId: number, priorite: 'haute' | 'moyenne' | 'basse' = 'moyenne', notes?: string) {
        try {
            const movieDetails = await getMovieDetails(movieId);
            
            // Récupérer le réalisateur depuis les crédits
            const director = movieDetails.credits?.crew?.find(person => person.job === 'Director')?.name || 'Non spécifié';
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

            this.watchlist.push(newItem);
            this.saveWatchlist();
            this.updateUI();

            // Émettre un événement pour notifier les autres composants
            document.dispatchEvent(new CustomEvent('watchlistUpdated', {
                detail: { watchlist: this.watchlist }
            }));

        } catch (error) {
            console.error("Erreur lors de l'ajout à la watchlist:", error);
        }
    }

    public supprimerFilm(movieId: number) {
        this.watchlist = this.watchlist.filter(item => item.id !== movieId);
        this.saveWatchlist();
        this.updateUI();

        // Émettre un événement pour notifier les autres composants
        document.dispatchEvent(new CustomEvent('watchlistUpdated', {
            detail: { watchlist: this.watchlist }
        }));
    }

    public modifierPriorite(movieId: number, nouvellePriorite: 'haute' | 'moyenne' | 'basse') {
        const item = this.watchlist.find(item => item.id === movieId);
        if (item) {
            item.priorite = nouvellePriorite;
            this.saveWatchlist();
            this.updateUI();
        }
    }

    public modifierNotes(movieId: number, notes: string) {
        const item = this.watchlist.find(item => item.id === movieId);
        if (item) {
            item.notes = notes;
            this.saveWatchlist();
            this.updateUI();
        }
    }

    public async marquerCommeVu(movieId: number) {
        try {
            // Trouver le film dans la watchlist
            const film = this.watchlist.find(item => item.id === movieId);
            if (!film) return;

            // Récupérer les détails complets du film depuis TMDB
            const movieDetails = await getMovieDetails(movieId);
            
            // Créer l'objet film pour l'ajout
            const nouveauFilm = {
                id: movieId,
                titre: film.titre,
                annee: film.annee,
                duree: movieDetails.runtime || 120,
                realisateur: film.realisateur,
                distribution: movieDetails.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || '',
                synopsis: movieDetails.overview || '',
                note: 0, // L'utilisateur pourra modifier la note plus tard
                dateVisionnage: new Date().toISOString().split('T')[0],
                plateforme: 'Autre',
                affiche: film.affiche,
                genres: movieDetails.genres?.map(g => g.name) || []
            };

            // Ajouter aux films vus
            await ajouterFilm(nouveauFilm);

            // Supprimer de la watchlist
            this.supprimerFilm(movieId);

            // Émettre un événement pour mettre à jour les statistiques
            document.dispatchEvent(new CustomEvent('filmsUpdated'));

        } catch (error) {
            console.error("Erreur lors du marquage comme vu:", error);
        }
    }

    private updateUI() {
        const watchlistContainer = document.querySelector('.watchlist-grid');
        if (!watchlistContainer) return;

        // Trier par priorité (haute > moyenne > basse) et date d'ajout
        const sortedWatchlist = [...this.watchlist].sort((a, b) => {
            const priorityOrder = { haute: 3, moyenne: 2, basse: 1 };
            if (priorityOrder[a.priorite] !== priorityOrder[b.priorite]) {
                return priorityOrder[b.priorite] - priorityOrder[a.priorite];
            }
            return new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime();
        });

        watchlistContainer.innerHTML = sortedWatchlist.map(item => `
            <div class="watchlist-card priority-${item.priorite}">
                <div class="watchlist-poster">
                    <img src="https://image.tmdb.org/t/p/w500${item.affiche}" alt="${item.titre}">
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
        `).join('');

        // Ajouter les écouteurs d'événements
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

    private setupEventListeners() {
        // Gérer les changements de priorité
        document.querySelectorAll('.priority-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                const movieId = parseInt(target.dataset.movieId || '0');
                this.modifierPriorite(movieId, target.value as 'haute' | 'moyenne' | 'basse');
            });
        });

        // Gérer la modification des notes
        document.querySelectorAll('.edit-notes').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const movieId = parseInt(target.closest('button')?.dataset.movieId || '0');
                const item = this.watchlist.find(item => item.id === movieId);
                if (item) {
                    const notes = prompt('Entrez vos notes pour ce film:', item.notes || '');
                    if (notes !== null) {
                        this.modifierNotes(movieId, notes);
                    }
                }
            });
        });

        // Gérer le marquage comme vu
        document.querySelectorAll('.mark-as-watched').forEach(button => {
            button.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                const movieId = parseInt(target.closest('button')?.dataset.movieId || '0');
                if (confirm('Voulez-vous marquer ce film comme vu ? Il sera ajouté à votre liste de films vus.')) {
                    await this.marquerCommeVu(movieId);
                }
            });
        });

        // Gérer la suppression
        document.querySelectorAll('.remove-from-watchlist').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const movieId = parseInt(target.closest('button')?.dataset.movieId || '0');
                if (confirm('Voulez-vous vraiment retirer ce film de votre watchlist ?')) {
                    this.supprimerFilm(movieId);
                }
            });
        });

        // Écouter les événements de connexion/déconnexion
        document.addEventListener('userLoggedIn', ((e: CustomEvent) => {
            this.currentUserId = e.detail.user.id;
            this.loadWatchlist();
        }) as EventListener);

        document.addEventListener('userLoggedOut', () => {
            this.currentUserId = undefined;
            this.watchlist = [];
            this.updateUI();
        });
    }

    private initializeSearch() {
        const searchInput = document.getElementById('watchlist-search') as HTMLInputElement;
        const suggestionsContainer = document.getElementById('watchlist-suggestions');
        let debounceTimeout: NodeJS.Timeout;

        if (searchInput && suggestionsContainer) {
            searchInput.addEventListener('input', async (e) => {
                const target = e.target as HTMLInputElement;
                const query = target.value.trim();

                // Clear previous timeout
                clearTimeout(debounceTimeout);

                // Clear suggestions if query is empty
                if (!query) {
                    suggestionsContainer.innerHTML = '';
                    suggestionsContainer.classList.remove('active');
                    return;
                }

                // Debounce search
                debounceTimeout = setTimeout(async () => {
                    try {
                        const movies = await searchMoviesOnTMDB(query);
                        this.showSuggestions(movies, suggestionsContainer);
                    } catch (error) {
                        console.error('Erreur lors de la recherche:', error);
                    }
                }, 300);
            });

            // Fermer les suggestions quand on clique en dehors
            document.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (!searchInput.contains(target) && !suggestionsContainer.contains(target)) {
                    suggestionsContainer.classList.remove('active');
                }
            });
        }
    }

    private showSuggestions(movies: any[], container: HTMLElement) {
        if (!movies.length) {
            container.innerHTML = '<div class="watchlist-suggestion">Aucun résultat trouvé</div>';
            container.classList.add('active');
            return;
        }

        const alreadyInWatchlist = new Set(this.watchlist.map(item => item.id));

        container.innerHTML = movies
            .slice(0, 5)
            .map(movie => {
                const isInWatchlist = alreadyInWatchlist.has(movie.id);
                return `
                    <div class="watchlist-suggestion">
                        <img src="https://image.tmdb.org/t/p/w92${movie.poster_path}" 
                             alt="${movie.title}"
                             onerror="this.src='path/to/placeholder.jpg'">
                        <div class="suggestion-info">
                            <div class="suggestion-title">${movie.title}</div>
                            <div class="suggestion-year">${movie.release_date ? new Date(movie.release_date).getFullYear() : 'Année inconnue'}</div>
                        </div>
                        ${isInWatchlist 
                            ? '<button class="add-to-watchlist" disabled>Déjà dans la liste</button>'
                            : `<button class="add-to-watchlist" data-movie-id="${movie.id}">Ajouter</button>`
                        }
                    </div>
                `;
            })
            .join('');

        container.classList.add('active');

        // Ajouter les écouteurs d'événements pour les boutons
        container.querySelectorAll('.add-to-watchlist:not([disabled])').forEach(button => {
            button.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                const movieId = parseInt(target.dataset.movieId || '0');
                await this.ajouterFilm(movieId);
                container.classList.remove('active');
                (document.getElementById('watchlist-search') as HTMLInputElement).value = '';
            });
        });
    }
}

import { WatchlistItem } from "../models/WatchlistItem";
import { getMovieDetails } from "../api/tmdb";

export class WatchlistController {
    private watchlist: WatchlistItem[] = [];
    private currentUserId: number | undefined;

    constructor(userId?: number) {
        this.currentUserId = userId;
        this.loadWatchlist();
    }

    private async loadWatchlist() {
        try {
            const storedWatchlist = localStorage.getItem(`watchlist_${this.currentUserId}`);
            if (storedWatchlist) {
                this.watchlist = JSON.parse(storedWatchlist);
                this.updateUI();
            }
        } catch (error) {
            console.error("Erreur lors du chargement de la watchlist:", error);
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
            
            const newItem: WatchlistItem = {
                id: movieId,
                titre: movieDetails.title,
                affiche: movieDetails.poster_path,
                annee: new Date(movieDetails.release_date).getFullYear(),
                realisateur: movieDetails.director || "Non spécifié",
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
                        <button class="edit-notes" data-movie-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="remove-from-watchlist" data-movie-id="${item.id}">
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
    }
}
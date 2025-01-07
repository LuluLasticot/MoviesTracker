import { Film } from "../models/Film";

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: number;
    category: 'collection' | 'genres' | 'special' | 'social' | 'secret';
}

export interface BadgeProgress {
    userId: number;
    badgeId: string;
    progress: number;
    completed: boolean;
    dateCompleted?: Date;
}

// Définition des badges
const collectionBadges: Badge[] = [
    {
        id: "first_movie",
        name: "Premier Pas",
        description: "Ajoutez votre premier film",
        icon: "🎬",
        requirement: 1,
        category: "collection"
    },
    {
        id: "movie_collector_bronze",
        name: "Collectionneur Bronze",
        description: "Ajoutez 25 films",
        icon: "🥉",
        requirement: 25,
        category: "collection"
    },
    {
        id: "movie_collector_silver",
        name: "Collectionneur Argent",
        description: "Ajoutez 50 films",
        icon: "🥈",
        requirement: 50,
        category: "collection"
    },
    {
        id: "movie_collector_gold",
        name: "Collectionneur Or",
        description: "Ajoutez 100 films",
        icon: "🥇",
        requirement: 100,
        category: "collection"
    }
];

const genreBadges: Badge[] = [
    {
        id: "horror_fan",
        name: "Amateur d'Horreur",
        description: "Regardez 10 films d'horreur",
        icon: "👻",
        requirement: 10,
        category: "genres"
    },
    {
        id: "action_hero",
        name: "Héros d'Action",
        description: "Regardez 20 films d'action",
        icon: "💪",
        requirement: 20,
        category: "genres"
    },
    {
        id: "romantic_soul",
        name: "Âme Romantique",
        description: "Regardez 15 films romantiques",
        icon: "❤️",
        requirement: 15,
        category: "genres"
    }
];

const specialBadges: Badge[] = [
    {
        id: "marathon_master",
        name: "Maître du Marathon",
        description: "Regardez 5 films en une journée",
        icon: "⚡",
        requirement: 5,
        category: "special"
    },
    {
        id: "night_owl",
        name: "Oiseau de Nuit",
        description: "Regardez un film après minuit",
        icon: "🦉",
        requirement: 1,
        category: "special"
    }
];

const socialBadges: Badge[] = [
    {
        id: "critic",
        name: "Critique en Herbe",
        description: "Écrivez 10 critiques de films",
        icon: "✍️",
        requirement: 10,
        category: "social"
    },
    {
        id: "influencer",
        name: "Influenceur Cinéphile",
        description: "Partagez 20 films sur les réseaux sociaux",
        icon: "📱",
        requirement: 20,
        category: "social"
    }
];

export class BadgeController {
    private static instance: BadgeController;
    private badges: Badge[];
    private userProgress: Map<string, BadgeProgress>;

    private constructor() {
        this.badges = [...collectionBadges, ...genreBadges, ...specialBadges, ...socialBadges];
        this.userProgress = new Map();
        this.loadProgress();
    }

    public static getInstance(): BadgeController {
        if (!BadgeController.instance) {
            BadgeController.instance = new BadgeController();
        }
        return BadgeController.instance;
    }

    private loadProgress() {
        const userId = localStorage.getItem('currentUserId');
        if (userId) {
            const progress = localStorage.getItem(`badges_${userId}`);
            if (progress) {
                const parsedProgress = JSON.parse(progress);
                parsedProgress.forEach((p: BadgeProgress) => {
                    this.userProgress.set(`${p.userId}_${p.badgeId}`, p);
                });
            }
        }
    }

    private saveProgress() {
        const userId = localStorage.getItem('currentUserId');
        if (userId) {
            const progress = Array.from(this.userProgress.values())
                .filter(p => p.userId === parseInt(userId));
            localStorage.setItem(`badges_${userId}`, JSON.stringify(progress));
        }
    }

    public checkAndUpdateBadges(userId: number, films: Film[]) {
        // Vérifier les badges de collection
        this.checkCollectionBadges(userId, films);
        // Vérifier les badges de genres
        this.checkGenreBadges(userId, films);
        // Sauvegarder les progrès
        this.saveProgress();
        // Mettre à jour l'affichage
        this.updateBadgesDisplay();
    }

    private checkCollectionBadges(userId: number, films: Film[]) {
        const totalFilms = films.length;
        collectionBadges.forEach(badge => {
            const progress = Math.min(totalFilms, badge.requirement);
            this.updateBadgeProgress(userId, badge.id, progress);
        });
    }

    private checkGenreBadges(userId: number, films: Film[]) {
        const genreCounts = new Map<string, number>();
        films.forEach(film => {
            film.genres.forEach(genre => {
                const count = genreCounts.get(genre) || 0;
                genreCounts.set(genre, count + 1);
            });
        });

        genreBadges.forEach(badge => {
            const genreCount = this.getGenreCountForBadge(badge.id, genreCounts);
            this.updateBadgeProgress(userId, badge.id, genreCount);
        });
    }

    private getGenreCountForBadge(badgeId: string, genreCounts: Map<string, number>): number {
        switch (badgeId) {
            case 'horror_fan':
                return genreCounts.get('Horreur') || 0;
            case 'action_hero':
                return genreCounts.get('Action') || 0;
            case 'romantic_soul':
                return genreCounts.get('Romance') || 0;
            default:
                return 0;
        }
    }

    private updateBadgeProgress(userId: number, badgeId: string, progress: number) {
        const key = `${userId}_${badgeId}`;
        const badge = this.badges.find(b => b.id === badgeId);
        if (!badge) return;

        const currentProgress = this.userProgress.get(key) || {
            userId,
            badgeId,
            progress: 0,
            completed: false
        };

        currentProgress.progress = progress;
        if (progress >= badge.requirement && !currentProgress.completed) {
            currentProgress.completed = true;
            currentProgress.dateCompleted = new Date();
            this.showBadgeUnlockedNotification(badge);
        }

        this.userProgress.set(key, currentProgress);
    }

    private showBadgeUnlockedNotification(badge: Badge) {
        const event = new CustomEvent('showNotification', {
            detail: {
                type: 'success',
                message: `Nouveau badge débloqué : ${badge.name}!`,
                icon: badge.icon
            }
        });
        document.dispatchEvent(event);
    }

    public updateBadgesDisplay() {
        const badgesGrid = document.querySelector('.badges-grid');
        if (!badgesGrid) return;

        // Vider la grille
        badgesGrid.innerHTML = '';

        // Récupérer l'utilisateur actuel
        const userId = parseInt(localStorage.getItem('currentUserId') || '0');
        if (!userId) return;

        // Afficher tous les badges, même ceux qui sont verrouillés
        this.badges.forEach(badge => {
            const progress = this.getBadgeProgress(userId, badge.id);
            const badgeElement = this.createBadgeElement(badge, progress || {
                userId,
                badgeId: badge.id,
                progress: 0,
                completed: false
            });
            badgesGrid.appendChild(badgeElement);
        });

        // Mettre à jour le compteur total
        this.updateTotalBadgesCount(userId);
    }

    private getBadgeProgress(userId: number, badgeId: string): BadgeProgress {
        return this.userProgress.get(`${userId}_${badgeId}`) || {
            userId,
            badgeId,
            progress: 0,
            completed: false
        };
    }

    private createBadgeElement(badge: Badge, progress: BadgeProgress): HTMLElement {
        const element = document.createElement('div');
        element.className = `badge ${progress.completed ? 'unlocked' : 'locked'} ${badge.category}`;
        
        element.innerHTML = `
            <div class="badge-icon">
                <i class="fas ${this.getIconForBadge(badge.id)}"></i>
            </div>
            <h3 class="badge-title">${badge.name}</h3>
            <p class="badge-description">${badge.description}</p>
            <div class="badge-progress">
                <div class="progress" style="width: ${(progress.progress / badge.requirement) * 100}%"></div>
            </div>
            <span class="progress-text">${progress.progress}/${badge.requirement}</span>
        `;

        return element;
    }

    private getIconForBadge(badgeId: string): string {
        const iconMap: { [key: string]: string } = {
            'first_movie': 'fa-film',
            'movie_collector_bronze': 'fa-trophy',
            'movie_collector_silver': 'fa-trophy',
            'movie_collector_gold': 'fa-trophy',
            'genre_action': 'fa-fire',
            'genre_comedy': 'fa-laugh',
            'genre_drama': 'fa-theater-masks',
            'genre_horror': 'fa-ghost',
            'genre_scifi': 'fa-rocket',
            'marathon': 'fa-running',
            'critic': 'fa-star',
            'social_butterfly': 'fa-users'
        };

        return iconMap[badgeId] || 'fa-award';
    }

    private updateTotalBadgesCount(userId: number) {
        const totalBadgesElement = document.querySelector('.total-badges strong');
        if (!totalBadgesElement) return;

        const completedBadges = Array.from(this.userProgress.values())
            .filter(p => p.userId === userId && p.completed)
            .length;

        totalBadgesElement.textContent = `${completedBadges}/${this.badges.length}`;
    }
}

// Initialisation des écouteurs d'événements
document.addEventListener('DOMContentLoaded', () => {
    const badgeController = BadgeController.getInstance();
    
    // Gestion des filtres de catégories
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const category = target.dataset.category || 'all';
            
            // Mise à jour des boutons actifs
            document.querySelectorAll('.category-btn').forEach(btn => 
                btn.classList.remove('active'));
            target.classList.add('active');
            
            // Filtrage des badges
            document.querySelectorAll('.badge').forEach(badge => {
                if (category === 'all' || badge.classList.contains(category)) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            });
        });
    });
});

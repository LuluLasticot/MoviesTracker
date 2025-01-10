import { Film } from "../models/Film";
import { debounce } from "../utils/debounce";

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

// Cache des templates HTML
const badgeTemplates: { [key: string]: string } = {};

// Définition des badges avec leurs icônes FontAwesome
const BADGE_ICONS: { [key: string]: string } = {
    'first_movie': 'fa-film',
    'movie_collector_bronze': 'fa-trophy',
    'movie_collector_silver': 'fa-trophy',
    'movie_collector_gold': 'fa-trophy',
    'horror_fan': 'fa-ghost',
    'action_hero': 'fa-fire',
    'romantic_soul': 'fa-heart',
    'marathon_master': 'fa-running',
    'night_owl': 'fa-moon',
    'critic': 'fa-star',
    'influencer': 'fa-share-alt'
};

// Définition des badges
const collectionBadges: Badge[] = [
    {
        id: "first_movie",
        name: "Premier Pas",
        description: "Ajoutez votre premier film",
        icon: "",
        requirement: 1,
        category: "collection"
    },
    {
        id: "movie_collector_bronze",
        name: "Collectionneur Bronze",
        description: "Ajoutez 25 films",
        icon: "",
        requirement: 25,
        category: "collection"
    },
    {
        id: "movie_collector_silver",
        name: "Collectionneur Argent",
        description: "Ajoutez 50 films",
        icon: "",
        requirement: 50,
        category: "collection"
    },
    {
        id: "movie_collector_gold",
        name: "Collectionneur Or",
        description: "Ajoutez 100 films",
        icon: "",
        requirement: 100,
        category: "collection"
    }
];

const genreBadges: Badge[] = [
    {
        id: "horror_fan",
        name: "Amateur d'Horreur",
        description: "Regardez 10 films d'horreur",
        icon: "",
        requirement: 10,
        category: "genres"
    },
    {
        id: "action_hero",
        name: "Héros d'Action",
        description: "Regardez 20 films d'action",
        icon: "",
        requirement: 20,
        category: "genres"
    },
    {
        id: "romantic_soul",
        name: "Âme Romantique",
        description: "Regardez 15 films romantiques",
        icon: "",
        requirement: 15,
        category: "genres"
    }
];

const specialBadges: Badge[] = [
    {
        id: "marathon_master",
        name: "Maître du Marathon",
        description: "Regardez 5 films en une journée",
        icon: "",
        requirement: 5,
        category: "special"
    },
    {
        id: "night_owl",
        name: "Oiseau de Nuit",
        description: "Regardez un film après minuit",
        icon: "",
        requirement: 1,
        category: "special"
    }
];

const socialBadges: Badge[] = [
    {
        id: "critic",
        name: "Critique en Herbe",
        description: "Écrivez 10 critiques de films",
        icon: "",
        requirement: 10,
        category: "social"
    },
    {
        id: "influencer",
        name: "Influenceur Cinéphile",
        description: "Partagez 20 films sur les réseaux sociaux",
        icon: "",
        requirement: 20,
        category: "social"
    }
];

export class BadgeController {
    private static instance: BadgeController;
    private badges: Badge[];
    private userProgress: Map<string, BadgeProgress>;
    private genreCountsCache: Map<number, Map<string, number>> = new Map();
    private debouncedUpdateDisplay: Function;
    private eventListeners: { [key: string]: (event: Event) => void } = {};

    private constructor() {
        this.badges = [...collectionBadges, ...genreBadges, ...specialBadges, ...socialBadges];
        this.userProgress = new Map();
        this.debouncedUpdateDisplay = debounce(this.updateBadgesDisplay.bind(this), 250);
        this.loadProgress();
        this.setupEventListeners();
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
            try {
                const progress = localStorage.getItem(`badges_${userId}`);
                if (progress) {
                    const parsedProgress = JSON.parse(progress);
                    parsedProgress.forEach((p: BadgeProgress) => {
                        this.userProgress.set(this.getProgressKey(p.userId, p.badgeId), p);
                    });
                }
            } catch (error) {
                console.error('Erreur lors du chargement des badges:', error);
            }
        }
    }

    private getProgressKey(userId: number, badgeId: string): string {
        return `${userId}_${badgeId}`;
    }

    private saveProgress() {
        const userId = localStorage.getItem('currentUserId');
        if (userId) {
            try {
                const progress = Array.from(this.userProgress.values())
                    .filter(p => p.userId === parseInt(userId));
                localStorage.setItem(`badges_${userId}`, JSON.stringify(progress));
            } catch (error) {
                console.error('Erreur lors de la sauvegarde des badges:', error);
            }
        }
    }

    public checkAndUpdateBadges(userId: number, films: Film[]) {
        this.updateGenreCountsCache(userId, films);
        this.checkCollectionBadges(userId, films);
        this.checkGenreBadges(userId);
        this.checkSpecialBadges(userId, films);
        this.saveProgress();
        this.debouncedUpdateDisplay();
    }

    private updateGenreCountsCache(userId: number, films: Film[]) {
        const genreCounts = new Map<string, number>();
        films.forEach(film => {
            film.genres.forEach(genre => {
                const count = genreCounts.get(genre) || 0;
                genreCounts.set(genre, count + 1);
            });
        });
        this.genreCountsCache.set(userId, genreCounts);
    }

    private checkCollectionBadges(userId: number, films: Film[]) {
        const totalFilms = films.length;
        collectionBadges.forEach(badge => {
            const progress = Math.min(totalFilms, badge.requirement);
            this.updateBadgeProgress(userId, badge.id, progress);
        });
    }

    private checkGenreBadges(userId: number) {
        const genreCounts = this.genreCountsCache.get(userId);
        if (!genreCounts) return;

        genreBadges.forEach(badge => {
            const genreCount = this.getGenreCountForBadge(badge.id, genreCounts);
            this.updateBadgeProgress(userId, badge.id, genreCount);
        });
    }

    private checkSpecialBadges(userId: number, films: Film[]) {
        // Vérifier le badge Marathon Master
        const today = new Date().toDateString();
        const filmsWatchedToday = films.filter(film => 
            new Date(film.dateDeVisionnage).toDateString() === today
        ).length;
        this.updateBadgeProgress(userId, 'marathon_master', filmsWatchedToday);

        // Vérifier le badge Night Owl
        const hasWatchedAfterMidnight = films.some(film => {
            const watchTime = new Date(film.dateDeVisionnage);
            return watchTime.getHours() >= 0 && watchTime.getHours() < 5;
        });
        this.updateBadgeProgress(userId, 'night_owl', hasWatchedAfterMidnight ? 1 : 0);
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
        const key = this.getProgressKey(userId, badgeId);
        const badge = this.badges.find(b => b.id === badgeId);
        if (!badge) return;

        const currentProgress = this.userProgress.get(key) || {
            userId,
            badgeId,
            progress: 0,
            completed: false
        };

        if (progress !== currentProgress.progress) {
            currentProgress.progress = progress;
            if (progress >= badge.requirement && !currentProgress.completed) {
                currentProgress.completed = true;
                currentProgress.dateCompleted = new Date();
                this.showBadgeUnlockedNotification(badge);
            }
            this.userProgress.set(key, currentProgress);
        }
    }

    private showBadgeUnlockedNotification(badge: Badge) {
        const event = new CustomEvent('showNotification', {
            detail: {
                type: 'success',
                message: `Nouveau badge débloqué : ${badge.name}!`,
                icon: badge.icon,
                duration: 5000
            }
        });
        document.dispatchEvent(event);
    }

    private getBadgeTemplate(badge: Badge, progress: BadgeProgress): string {
        const key = `${badge.id}_${progress.completed}`;
        if (!badgeTemplates[key]) {
            badgeTemplates[key] = `
                <div class="badge-icon">
                    <i class="fas ${BADGE_ICONS[badge.id] || 'fa-award'}"></i>
                </div>
                <h3 class="badge-title">${badge.name}</h3>
                <p class="badge-description">${badge.description}</p>
                <div class="badge-progress">
                    <div class="progress" style="width: ${(progress.progress / badge.requirement) * 100}%"></div>
                </div>
                <span class="progress-text">${progress.progress}/${badge.requirement}</span>
            `;
        }
        return badgeTemplates[key];
    }

    public updateBadgesDisplay() {
        const badgesGrid = document.querySelector('.badges-grid');
        if (!badgesGrid) return;

        const userId = parseInt(localStorage.getItem('currentUserId') || '0');
        if (!userId) return;

        const fragment = document.createDocumentFragment();
        this.badges.forEach(badge => {
            const progress = this.getBadgeProgress(userId, badge.id);
            const element = document.createElement('div');
            element.className = `badge ${progress.completed ? 'unlocked' : 'locked'} ${badge.category}`;
            element.innerHTML = this.getBadgeTemplate(badge, progress);
            fragment.appendChild(element);
        });

        badgesGrid.innerHTML = '';
        badgesGrid.appendChild(fragment);
        this.updateTotalBadgesCount(userId);
    }

    private getBadgeProgress(userId: number, badgeId: string): BadgeProgress {
        return this.userProgress.get(this.getProgressKey(userId, badgeId)) || {
            userId,
            badgeId,
            progress: 0,
            completed: false
        };
    }

    private updateTotalBadgesCount(userId: number) {
        const totalBadgesElement = document.querySelector('.total-badges strong');
        if (!totalBadgesElement) return;

        const completedBadges = Array.from(this.userProgress.values())
            .filter(p => p.userId === userId && p.completed)
            .length;

        totalBadgesElement.textContent = `${completedBadges}/${this.badges.length}`;
    }

    private removeEventListeners() {
        Object.entries(this.eventListeners).forEach(([selector, listener]) => {
            document.querySelectorAll(selector).forEach(element => {
                element.removeEventListener('click', listener);
            });
        });
        this.eventListeners = {};
    }

    private setupEventListeners() {
        this.removeEventListeners();

        const categoryListener = (event: Event) => {
            const target = event.target as HTMLElement;
            const category = target.dataset.category || 'all';
            
            document.querySelectorAll('.category-btn').forEach(btn => 
                btn.classList.remove('active'));
            target.classList.add('active');
            
            document.querySelectorAll('.badge').forEach(badge => {
                if (category === 'all' || badge.classList.contains(category)) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            });
        };

        this.eventListeners['.category-btn'] = categoryListener;
        document.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', categoryListener);
        });

        // Écouter les événements de connexion/déconnexion
        document.addEventListener('userLoggedIn', ((e: CustomEvent) => {
            const userId = e.detail.user.id;
            this.loadProgress();
            this.debouncedUpdateDisplay();
        }) as EventListener);

        document.addEventListener('userLoggedOut', () => {
            this.userProgress.clear();
            this.genreCountsCache.clear();
            this.debouncedUpdateDisplay();
        });
    }
}

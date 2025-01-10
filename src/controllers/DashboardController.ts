import { Film } from "../models/Film";
import { getPersonImage } from "../api/tmdb";
import { 
    DashboardStats, 
    DASHBOARD_SECTIONS, 
    STAT_LIMITS,
    FilmRecord 
} from "../types/DashboardTypes";
import { StatisticsUtils } from "../utils/StatisticsUtils";

export class DashboardController {
    private stats: DashboardStats;
    private currentSection: string = DASHBOARD_SECTIONS.OVERVIEW;
    private updateTimeout: NodeJS.Timeout | null = null;

    constructor() {
        this.stats = this.initializeEmptyStats();
        this.initializeEventListeners();
    }

    private initializeEventListeners() {
        // Écouter les mises à jour des films
        document.addEventListener('filmsUpdated', ((event: Event) => {
            const customEvent = event as CustomEvent<{ films: Film[] }>;
            this.debouncedUpdateStats(customEvent.detail.films);
        }) as EventListener);

        // Écouter les changements de section
        Object.values(DASHBOARD_SECTIONS).forEach(sectionId => {
            const button = document.querySelector(`[data-section="${sectionId}"]`);
            button?.addEventListener('click', () => this.switchSection(sectionId));
        });
    }

    private debouncedUpdateStats(films: Film[]) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            this.updateStats(films);
        }, 300);
    }

    private async updateStats(films: Film[]) {
        if (!films || films.length < STAT_LIMITS.MIN_FILMS_FOR_STATS) {
            this.showNoDataMessage();
            return;
        }

        // Mettre à jour les statistiques de base
        this.updateBasicStats(films);

        // Mettre à jour les statistiques qui nécessitent des calculs plus complexes
        await Promise.all([
            this.updatePeopleStats(films),
            this.updateCategoryStats(films)
        ]);

        // Mettre à jour l'interface
        this.updateUI();
    }

    private updateBasicStats(films: Film[]) {
        const memoizedCalculator = StatisticsUtils.memoize((films: Film[]) => ({
            averageRating: StatisticsUtils.calculateAverageRating(films),
            totalTime: StatisticsUtils.calculateTotalTime(films),
            yearlyStats: StatisticsUtils.calculateYearlyStats(films)
        }));

        const basicStats = memoizedCalculator(films);
        
        Object.assign(this.stats, {
            filmsCount: films.length,
            ...basicStats,
            topRatedFilms: [...films]
                .sort((a, b) => b.note - a.note)
                .slice(0, STAT_LIMITS.TOP_FILMS)
        });
    }

    private async updatePeopleStats(films: Film[]) {
        const topDirectors = StatisticsUtils.calculateTopPeople(
            films,
            film => [film.realisateur],
            STAT_LIMITS.TOP_PEOPLE
        );

        const topActors = StatisticsUtils.calculateTopPeople(
            films,
            film => film.acteurs,
            STAT_LIMITS.TOP_PEOPLE
        );

        // Ajouter les images en parallèle
        await Promise.all([
            ...topDirectors.map(async director => {
                director.image = await getPersonImage(director.name);
            }),
            ...topActors.map(async actor => {
                actor.image = await getPersonImage(actor.name);
            })
        ]);

        this.stats.topDirectors = topDirectors;
        this.stats.topActors = topActors;
    }

    private updateCategoryStats(films: Film[]) {
        this.stats.genreStats = StatisticsUtils.calculateCategoryStats(
            films,
            film => film.genres
        );

        this.stats.platformStats = StatisticsUtils.calculateCategoryStats(
            films,
            film => [film.plateforme]
        );
    }

    private switchSection(sectionId: string) {
        // Cacher toutes les sections
        Object.values(DASHBOARD_SECTIONS).forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });

        // Afficher la section sélectionnée
        document.getElementById(sectionId)?.classList.remove('hidden');
        
        // Mettre à jour le bouton actif
        document.querySelectorAll('.dashboard-nav button').forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-section') === sectionId);
        });

        this.currentSection = sectionId;
    }

    private updateUI() {
        this.updateOverviewSection();
        this.updateYearlySection();
        this.updatePeopleSection();
        this.updateCategoriesSection();
        this.updateRecordsSection();
    }

    private showNoDataMessage() {
        Object.values(DASHBOARD_SECTIONS).forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.innerHTML = '<p class="no-data">Pas assez de films pour générer des statistiques.</p>';
            }
        });
    }

    private initializeEmptyStats(): DashboardStats {
        const emptyFilm: FilmRecord = {
            titre: "Aucun film",
            duree: 0,
            id: 0,
            annee: 0,
            genres: [],
            realisateur: "",
            acteurs: [],
            note: 0,
            affiche: "",
            dateDeVisionnage: "",
            plateforme: ""
        };

        return {
            filmsCount: 0,
            totalTime: { hours: 0, days: 0 },
            averageRating: 0,
            yearlyStats: [],
            topDirectors: [],
            topActors: [],
            genreStats: [],
            platformStats: [],
            topRatedFilms: [],
            records: {
                shortest: emptyFilm,
                longest: emptyFilm
            },
            badges: []
        };
    }

    private updateOverviewSection() {
        const filmsValue = document.querySelector('.films-card .stat-value');
        const timeValue = document.querySelector('.time-card .stat-value');
        const timeSubtitle = document.querySelector('.time-card .stat-subtitle');
        const ratingValue = document.querySelector('.rating-card .stat-value');

        if (filmsValue) filmsValue.textContent = this.stats.filmsCount.toString();
        if (timeValue) timeValue.textContent = `${this.stats.totalTime.hours}h`;
        if (timeSubtitle) timeSubtitle.textContent = `≈ ${this.stats.totalTime.days} jours`;
        if (ratingValue) ratingValue.textContent = `${this.stats.averageRating}/10`;
    }

    private updateYearlySection() {
        const yearChart = document.querySelector('.year-chart');
        if (!yearChart) return;

        yearChart.innerHTML = this.stats.yearlyStats
            .map(stat => `
                <div class="year-bar">
                    <div class="bar-value">${stat.count}</div>
                    <div class="bar" style="height: ${stat.height}"></div>
                    <div class="year">${stat.year}</div>
                </div>
            `).join('');
    }

    private updatePeopleSection() {
        // Mise à jour des réalisateurs
        const topDirectorsContainer = document.querySelector('.top-directors');
        if (topDirectorsContainer) {
            topDirectorsContainer.innerHTML = this.stats.topDirectors
                .map(director => `
                    <div class="person-card">
                        <img src="${director.image || 'assets/images/default-person.jpg'}" alt="${director.name}" class="person-image">
                        <div class="person-info">
                            <span class="person-name">${director.name}</span>
                            <span class="person-count">${director.count} film${director.count > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                `).join('');
        }

        // Mise à jour des acteurs
        const topActorsContainer = document.querySelector('.top-actors');
        if (topActorsContainer) {
            topActorsContainer.innerHTML = this.stats.topActors
                .map(actor => `
                    <div class="person-card">
                        <img src="${actor.image || 'assets/images/default-person.jpg'}" alt="${actor.name}" class="person-image">
                        <div class="person-info">
                            <span class="person-name">${actor.name}</span>
                            <span class="person-count">${actor.count} film${actor.count > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                `).join('');
        }
    }

    private updateCategoriesSection() {
        // Mise à jour des genres
        const genresChart = document.querySelector('.genres-chart');
        if (genresChart) {
            genresChart.innerHTML = this.stats.genreStats
                .slice(0, 5)
                .map(genre => `
                    <div class="genre-item">
                        <span class="genre-name">${genre.name}</span>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${genre.percentage}%"></div>
                        </div>
                        <span class="genre-count">${genre.count} film${genre.count > 1 ? 's' : ''}</span>
                    </div>
                `).join('');
        }

        // Mise à jour des plateformes
        const platformsList = document.querySelector('.platforms-list');
        if (platformsList) {
            platformsList.innerHTML = this.stats.platformStats
                .map(platform => `
                    <div class="platform-item">
                        <span class="platform-name">${platform.name}</span>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${platform.percentage}%"></div>
                        </div>
                        <span class="platform-count">${platform.count} film${platform.count > 1 ? 's' : ''}</span>
                    </div>
                `).join('');
        }
    }

    private updateRecordsSection() {
        const recordsList = document.querySelector('.records-list');
        if (!recordsList) return;

        recordsList.innerHTML = `
            <div class="record-item">
                <div class="record-icon">
                    <i class="fas fa-hourglass-start"></i>
                </div>
                <div class="record-info">
                    <h4>Film le plus court</h4>
                    <p class="record-title">${this.stats.records.shortest.titre}</p>
                    <p class="record-details">
                        <span class="duration">${this.stats.records.shortest.duree} min</span>
                        <span class="year">${this.stats.records.shortest.annee}</span>
                    </p>
                    <div class="record-genres">
                        ${this.stats.records.shortest.genres.map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
            <div class="record-item">
                <div class="record-icon">
                    <i class="fas fa-hourglass-end"></i>
                </div>
                <div class="record-info">
                    <h4>Film le plus long</h4>
                    <p class="record-title">${this.stats.records.longest.titre}</p>
                    <p class="record-details">
                        <span class="duration">${this.stats.records.longest.duree} min</span>
                        <span class="year">${this.stats.records.longest.annee}</span>
                    </p>
                    <div class="record-genres">
                        ${this.stats.records.longest.genres.map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

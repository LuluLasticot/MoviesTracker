import { Film } from "../models/Film";
import { getPersonImage } from "../api/tmdb";

// Définir les types pour les statistiques
interface FilmRecord {
    titre: string;
    duree: number;
    id: number;
    annee: number;
    genres: string[];
    realisateur: string;
    acteurs: string[];
    note: number;
    affiche: string;
    dateDeVisionnage: string;
    plateforme: string;
}

interface DashboardStats {
    filmsCount: number;
    totalTime: { hours: number; days: number };
    averageRating: number;
    yearlyStats: Array<{ year: number; count: number; height: string }>;
    topDirectors: Array<{ name: string; count: number; image?: string }>;
    topActors: Array<{ name: string; count: number; image?: string }>;
    genreStats: Array<{ name: string; count: number; percentage: number }>;
    platformStats: Array<{ name: string; count: number; percentage: number }>;
    topRatedFilms: Film[];
    records: {
        shortest: FilmRecord;
        longest: FilmRecord;
    };
    badges: Array<{ name: string; icon: string; unlocked: boolean }>;
}

export class DashboardController {
    private stats: DashboardStats;

    constructor() {
        // Initialiser les statistiques vides
        this.stats = this.initializeEmptyStats();
        
        // Écouter les mises à jour des films
        document.addEventListener('filmsUpdated', ((event: Event) => {
            const customEvent = event as CustomEvent<{ films: Film[] }>;
            this.updateStats(customEvent.detail.films);
        }) as EventListener);
    }

    private async updateStats(films: Film[]) {
        if (!films || films.length === 0) {
            this.stats = this.initializeEmptyStats();
            this.updateUI();
            return;
        }

        // Statistiques de base
        this.calculateBasicStats(films);
        
        // Statistiques par année
        this.calculateYearlyStats(films);
        
        // Top réalisateurs et acteurs
        await Promise.all([
            this.calculateTopDirectors(films),
            this.calculateTopActors(films)
        ]);
        
        // Statistiques des genres
        this.calculateGenreStats(films);
        
        // Statistiques des plateformes
        this.calculatePlatformStats(films);
        
        // Top films
        this.calculateTopRatedFilms(films);
        
        // Records
        this.calculateRecords(films);

        // Mettre à jour l'interface
        this.updateUI();
    }

    private calculateBasicStats(films: Film[]) {
        this.stats.filmsCount = films.length;
        
        // Calculer le temps total et la note moyenne
        let totalMinutes = 0;
        let totalRating = 0;

        films.forEach(film => {
            totalMinutes += film.duree || 0;
            totalRating += film.note || 0;
        });

        // Convertir les minutes en heures et jours
        this.stats.totalTime = {
            hours: Math.round(totalMinutes / 60 * 10) / 10,
            days: Math.round(totalMinutes / (60 * 24) * 100) / 100
        };

        // Calculer la note moyenne
        this.stats.averageRating = Math.round((totalRating / films.length) * 10) / 10;
    }

    private updateUI() {
        // Mettre à jour les statistiques de base
        const filmsValue = document.querySelector('.films-card .stat-value');
        const timeValue = document.querySelector('.time-card .stat-value');
        const timeSubtitle = document.querySelector('.time-card .stat-subtitle');
        const ratingValue = document.querySelector('.rating-card .stat-value');

        if (filmsValue) filmsValue.textContent = this.stats.filmsCount.toString();
        if (timeValue) timeValue.textContent = `${this.stats.totalTime.hours}h`;
        if (timeSubtitle) timeSubtitle.textContent = `≈ ${this.stats.totalTime.days} jours`;
        if (ratingValue) ratingValue.textContent = `${this.stats.averageRating}/10`;

        // Mettre à jour le graphique par année
        const yearChart = document.querySelector('.year-chart');
        if (yearChart) {
            yearChart.innerHTML = this.stats.yearlyStats
                .map(stat => `
                    <div class="year-bar">
                        <div class="bar-value">${stat.count}</div>
                        <div class="bar" style="height: ${stat.height}"></div>
                        <div class="year">${stat.year}</div>
                    </div>
                `).join('');
        }

        // Mettre à jour les top réalisateurs
        const topDirectorsContainer = document.querySelector('.top-directors');
        if (topDirectorsContainer) {
            topDirectorsContainer.innerHTML = this.stats.topDirectors
                .map(director => `
                    <div class="person-card">
                        <img src="${director.image}" alt="${director.name}" class="person-image">
                        <div class="person-info">
                            <span class="person-name">${director.name}</span>
                            <span class="person-count">${director.count} film${director.count > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                `).join('');
        }

        // Mettre à jour les top acteurs
        const topActorsContainer = document.querySelector('.top-actors');
        if (topActorsContainer) {
            topActorsContainer.innerHTML = this.stats.topActors
                .map(actor => `
                    <div class="person-card">
                        <img src="${actor.image}" alt="${actor.name}" class="person-image">
                        <div class="person-info">
                            <span class="person-name">${actor.name}</span>
                            <span class="person-count">${actor.count} film${actor.count > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                `).join('');
        }

        // Mettre à jour les stats de genres
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

        // Mettre à jour les stats de plateformes
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

        // Mettre à jour le top 5 des films préférés
        const topRatedFilmsContainer = document.querySelector('.top-rated-films');
        if (topRatedFilmsContainer) {
            topRatedFilmsContainer.innerHTML = this.stats.topRatedFilms
                .map(film => `
                    <div class="movie-card">
                        <div class="movie-poster">
                            <img src="${film.affiche || 'https://via.placeholder.com/400x600?text=No+Poster'}" alt="${film.titre}">
                            <div class="movie-rating">${film.note}/10</div>
                        </div>
                        <div class="movie-info">
                            <h3 class="movie-title">${film.titre}</h3>
                            <p class="movie-year">${film.annee}</p>
                            <p class="movie-director">${film.realisateur}</p>
                            <div class="movie-genres">
                                ${film.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `).join('');
        }

        // Mettre à jour les records
        const recordsList = document.querySelector('.records-list');
        if (recordsList) {
            recordsList.innerHTML = `
                <div class="record-item">
                    <i class="fas fa-hourglass-start"></i>
                    <div class="record-info">
                        <h4>Film le plus court</h4>
                        <p>${this.stats.records.shortest.titre} (${this.stats.records.shortest.duree} min)</p>
                    </div>
                </div>
                <div class="record-item">
                    <i class="fas fa-hourglass-end"></i>
                    <div class="record-info">
                        <h4>Film le plus long</h4>
                        <p>${this.stats.records.longest.titre} (${this.stats.records.longest.duree} min)</p>
                    </div>
                </div>
            `;
        }
    }

    private calculateYearlyStats(films: Film[]) {
        // Obtenir l'année courante
        const currentYear = new Date().getFullYear();
        
        // Créer un Map pour compter les films par année de visionnage
        const yearCounts = new Map<number, number>();
        
        // Initialiser les 5 dernières années avec 0
        for (let year = currentYear; year > currentYear - 5; year--) {
            yearCounts.set(year, 0);
        }
        
        // Compter les films par année de visionnage
        films.forEach(film => {
            if (film.dateDeVisionnage) {
                const viewingYear = new Date(film.dateDeVisionnage).getFullYear();
                if (yearCounts.has(viewingYear)) {
                    yearCounts.set(viewingYear, (yearCounts.get(viewingYear) || 0) + 1);
                }
            }
        });
        
        // Trouver le maximum pour calculer les hauteurs relatives
        const maxCount = Math.max(...Array.from(yearCounts.values()));
        
        // Convertir en tableau trié par année décroissante
        this.stats.yearlyStats = Array.from(yearCounts.entries())
            .sort(([yearA], [yearB]) => yearB - yearA)
            .map(([year, count]) => ({
                year,
                count,
                height: maxCount > 0 ? `${(count / maxCount * 100)}%` : '0%'
            }));
    }

    private calculateGenreStats(films: Film[]) {
        const genreCounts = new Map<string, number>();
        
        // Compter les films par genre
        films.forEach(film => {
            film.genres.forEach(genre => {
                genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
            });
        });
        
        // Calculer le total pour les pourcentages
        const totalFilms = films.length;
        
        // Convertir en tableau et trier par nombre décroissant
        this.stats.genreStats = Array.from(genreCounts.entries())
            .map(([name, count]) => ({
                name,
                count,
                percentage: Math.round((count / totalFilms) * 100)
            }))
            .sort((a, b) => b.count - a.count);
    }

    private calculatePlatformStats(films: Film[]) {
        const platformCounts = new Map<string, number>();
        
        // Compter les films par plateforme
        films.forEach(film => {
            if (film.plateforme) {
                platformCounts.set(film.plateforme, (platformCounts.get(film.plateforme) || 0) + 1);
            }
        });
        
        // Calculer le total pour les pourcentages
        const totalFilms = films.length;
        
        // Convertir en tableau et trier par nombre décroissant
        this.stats.platformStats = Array.from(platformCounts.entries())
            .map(([name, count]) => ({
                name,
                count,
                percentage: Math.round((count / totalFilms) * 100)
            }))
            .sort((a, b) => b.count - a.count);
    }

    private calculateTopRatedFilms(films: Film[]) {
        this.stats.topRatedFilms = [...films]
            .sort((a, b) => (b.note || 0) - (a.note || 0))
            .slice(0, 5);
    }

    private calculateRecords(films: Film[]) {
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

        if (films.length === 0) {
            this.stats.records = {
                shortest: emptyFilm,
                longest: emptyFilm
            };
            return;
        }

        const validFilms = films.filter(film => film.duree && film.duree > 0);
        
        if (validFilms.length === 0) {
            this.stats.records = {
                shortest: emptyFilm,
                longest: emptyFilm
            };
            return;
        }

        this.stats.records = {
            shortest: validFilms.reduce((min, film) => 
                (film.duree < min.duree) ? film : min, validFilms[0]),
            longest: validFilms.reduce((max, film) => 
                (film.duree > max.duree) ? film : max, validFilms[0])
        };
    }

    private async calculateTopDirectors(films: Film[]) {
        const directorCounts = new Map<string, number>();
        films.forEach(film => {
            directorCounts.set(film.realisateur, (directorCounts.get(film.realisateur) || 0) + 1);
        });

        // Créer la liste des réalisateurs avec leurs compteurs
        const directors = Array.from(directorCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Récupérer les images pour chaque réalisateur
        this.stats.topDirectors = await Promise.all(
            directors.map(async (director) => ({
                ...director,
                image: await getPersonImage(director.name)
            }))
        );
    }

    private async calculateTopActors(films: Film[]) {
        const actorCounts = new Map<string, number>();
        films.forEach(film => {
            film.acteurs.forEach(actor => {
                actorCounts.set(actor, (actorCounts.get(actor) || 0) + 1);
            });
        });

        // Créer la liste des acteurs avec leurs compteurs
        const actors = Array.from(actorCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Récupérer les images pour chaque acteur
        this.stats.topActors = await Promise.all(
            actors.map(async (actor) => ({
                ...actor,
                image: await getPersonImage(actor.name)
            }))
        );
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
}

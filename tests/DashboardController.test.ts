import { DashboardController } from '../src/controllers/DashboardController';
import { Film } from '../src/models/Film';

describe('DashboardController', () => {
    let dashboardController: DashboardController;
    let testFilms: Film[];

    beforeEach(() => {
        dashboardController = new DashboardController();
        testFilms = [
            new Film({
                id: 1,
                titre: "Inception",
                annee: 2010,
                duree: 148,
                realisateur: "Christopher Nolan",
                acteurs: ["Leonardo DiCaprio", "Ellen Page"],
                genres: ["Science Fiction", "Action"],
                synopsis: "Test synopsis 1",
                note: 9,
                dateDeVisionnage: "2024-01-01",
                plateforme: "Netflix",
                affiche: "test1.jpg"
            }),
            new Film({
                id: 2,
                titre: "The Dark Knight",
                annee: 2008,
                duree: 152,
                realisateur: "Christopher Nolan",
                acteurs: ["Christian Bale", "Heath Ledger"],
                genres: ["Action", "Drame"],
                synopsis: "Test synopsis 2",
                note: 10,
                dateDeVisionnage: "2024-01-02",
                plateforme: "Amazon Prime",
                affiche: "test2.jpg"
            }),
            new Film({
                id: 3,
                titre: "Pulp Fiction",
                annee: 1994,
                duree: 154,
                realisateur: "Quentin Tarantino",
                acteurs: ["John Travolta", "Samuel L. Jackson"],
                genres: ["Crime", "Drame"],
                synopsis: "Test synopsis 3",
                note: 8,
                dateDeVisionnage: "2024-01-03",
                plateforme: "Netflix",
                affiche: "test3.jpg"
            })
        ];
    });

    test('should calculate basic stats correctly', () => {
        // Simuler l'événement de mise à jour des films
        const event = new CustomEvent('filmsUpdated', { 
            detail: { films: testFilms }
        });
        document.dispatchEvent(event);

        // Vérifier les statistiques de base
        const stats = dashboardController.getStats();
        expect(stats.filmsCount).toBe(3);
        expect(stats.totalTime.hours).toBe(7.6); // (148 + 152 + 154) / 60
        expect(stats.averageRating).toBe(9); // (9 + 10 + 8) / 3
    });

    test('should calculate top directors correctly', async () => {
        // Simuler l'événement de mise à jour des films
        const event = new CustomEvent('filmsUpdated', { 
            detail: { films: testFilms }
        });
        document.dispatchEvent(event);

        // Vérifier les top réalisateurs
        const stats = dashboardController.getStats();
        expect(stats.topDirectors[0].name).toBe("Christopher Nolan");
        expect(stats.topDirectors[0].count).toBe(2);
    });

    test('should calculate genre stats correctly', () => {
        // Simuler l'événement de mise à jour des films
        const event = new CustomEvent('filmsUpdated', { 
            detail: { films: testFilms }
        });
        document.dispatchEvent(event);

        // Vérifier les statistiques de genres
        const stats = dashboardController.getStats();
        const dramaStats = stats.genreStats
            .find(genre => genre.name === "Drame");
        expect(dramaStats?.count).toBe(2);
        expect(dramaStats?.percentage).toBe(67); // 2/3 * 100
    });

    test('should calculate platform stats correctly', () => {
        // Simuler l'événement de mise à jour des films
        const event = new CustomEvent('filmsUpdated', { 
            detail: { films: testFilms }
        });
        document.dispatchEvent(event);

        // Vérifier les statistiques de plateformes
        const stats = dashboardController.getStats();
        const netflixStats = stats.platformStats
            .find(platform => platform.name === "Netflix");
        expect(netflixStats?.count).toBe(2);
        expect(netflixStats?.percentage).toBe(67); // 2/3 * 100
    });

    test('should calculate top rated films correctly', () => {
        // Simuler l'événement de mise à jour des films
        const event = new CustomEvent('filmsUpdated', { 
            detail: { films: testFilms }
        });
        document.dispatchEvent(event);

        // Vérifier le top 5 des films
        const stats = dashboardController.getStats();
        expect(stats.topRatedFilms[0].titre).toBe("The Dark Knight");
        expect(stats.topRatedFilms[0].note).toBe(10);
    });

    test('should handle empty film list', () => {
        // Simuler l'événement de mise à jour sans films
        const event = new CustomEvent('filmsUpdated', { 
            detail: { films: [] }
        });
        document.dispatchEvent(event);

        // Vérifier que les statistiques sont à zéro
        const stats = dashboardController.getStats();
        expect(stats.filmsCount).toBe(0);
        expect(stats.totalTime.hours).toBe(0);
        expect(stats.averageRating).toBe(0);
        expect(stats.topRatedFilms).toHaveLength(0);
    });
});

import { FilterController } from '../src/controllers/FilterController';
import { Film } from '../src/models/Film';

describe('FilterController', () => {
    let filterController: FilterController;
    const testFilms: Film[] = [
        {
            id: 1,
            titre: 'Action Movie',
            annee: 2023,
            genres: ['Action'],
            duree: 120,
            realisateur: 'Director 1',
            acteurs: ['Actor 1', 'Actor 2'],
            synopsis: 'Test Overview 1',
            note: 8.5,
            dateDeVisionnage: '2023-01-01',
            plateforme: 'Netflix',
            affiche: '/poster1.jpg'
        },
        {
            id: 2,
            titre: 'Drama Movie',
            annee: 2022,
            genres: ['Drama'],
            duree: 90,
            realisateur: 'Director 2',
            acteurs: ['Actor 3', 'Actor 4'],
            synopsis: 'Test Overview 2',
            note: 7.5,
            dateDeVisionnage: '2022-01-01',
            plateforme: 'Amazon',
            affiche: '/poster2.jpg'
        }
    ];

    beforeEach(() => {
        jest.useFakeTimers();
        // Mock DOM elements
        document.body.innerHTML = `
            <div class="movies-grid"></div>
            <select id="sort-select">
                <option value="date-desc">Date (desc)</option>
                <option value="date-asc">Date (asc)</option>
            </select>
            <select id="platform-select">
                <option value="">Toutes les plateformes</option>
                <option value="Netflix">Netflix</option>
                <option value="Amazon">Amazon</option>
            </select>
            <select id="genre-select">
                <option value="">Tous les genres</option>
                <option value="Action">Action</option>
                <option value="Drama">Drama</option>
            </select>
            <input id="year-min" type="number" />
            <input id="year-max" type="number" />
            <button id="reset-filters">Réinitialiser</button>
        `;

        filterController = new FilterController();
        filterController.setFilms(testFilms);
    });

    test('should filter films by platform', () => {
        const platformSelect = document.getElementById('platform-select') as HTMLSelectElement;
        platformSelect.value = 'Netflix';
        platformSelect.dispatchEvent(new Event('change'));
        
        const movieCards = document.querySelectorAll('.movie-card');
        expect(movieCards.length).toBe(1);
        expect(movieCards[0].querySelector('h3')?.textContent).toBe('Action Movie');
    });

    test('should filter films by genre', () => {
        const genreSelect = document.getElementById('genre-select') as HTMLSelectElement;
        genreSelect.value = 'Drama';
        genreSelect.dispatchEvent(new Event('change'));
        
        const movieCards = document.querySelectorAll('.movie-card');
        expect(movieCards.length).toBe(1);
        expect(movieCards[0].querySelector('h3')?.textContent).toBe('Drama Movie');
    });

    test('should sort films by date descending', () => {
        const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
        sortSelect.value = 'date-desc';
        sortSelect.dispatchEvent(new Event('change'));
        
        const movieCards = document.querySelectorAll('.movie-card');
        expect(movieCards[0].querySelector('h3')?.textContent).toBe('Action Movie');
        expect(movieCards[1].querySelector('h3')?.textContent).toBe('Drama Movie');
    });

    test('should sort films by date ascending', () => {
        const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
        sortSelect.value = 'date-asc';
        sortSelect.dispatchEvent(new Event('change'));
        
        const movieCards = document.querySelectorAll('.movie-card');
        expect(movieCards[0].querySelector('h3')?.textContent).toBe('Drama Movie');
        expect(movieCards[1].querySelector('h3')?.textContent).toBe('Action Movie');
    });

    test('should combine multiple filters', () => {
        const platformSelect = document.getElementById('platform-select') as HTMLSelectElement;
        const genreSelect = document.getElementById('genre-select') as HTMLSelectElement;
        
        platformSelect.value = 'Netflix';
        genreSelect.value = 'Action';
        
        platformSelect.dispatchEvent(new Event('change'));
        genreSelect.dispatchEvent(new Event('change'));
        
        const movieCards = document.querySelectorAll('.movie-card');
        expect(movieCards.length).toBe(1);
        expect(movieCards[0].querySelector('h3')?.textContent).toBe('Action Movie');
    });

    test('should return all films when no filters are applied', () => {
        const movieCards = document.querySelectorAll('.movie-card');
        expect(movieCards.length).toBe(2);
    });

    test('should return empty array when no films match filters', () => {
        // Créer un nouveau contrôleur avec une liste vide
        filterController = new FilterController();
        filterController.setFilms([]);
        
        // Attendre que les films soient chargés
        jest.runAllTimers();

        const platformSelect = document.getElementById('platform-select') as HTMLSelectElement;
        platformSelect.value = 'NonExistent';
        platformSelect.dispatchEvent(new Event('change'));
        
        // Attendre que le DOM soit mis à jour
        jest.runAllTimers();
        
        const movieCards = document.querySelectorAll('.movie-card');
        expect(movieCards.length).toBe(0);
    });

    test('should reset filters', () => {
        const platformSelect = document.getElementById('platform-select') as HTMLSelectElement;
        platformSelect.value = 'Netflix';
        platformSelect.dispatchEvent(new Event('change'));
        
        // Reset filters
        const resetButton = document.getElementById('reset-filters') as HTMLButtonElement;
        resetButton.click();
        
        const movieCards = document.querySelectorAll('.movie-card');
        expect(movieCards.length).toBe(2);
    });
});

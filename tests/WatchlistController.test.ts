import { WatchlistController } from '../src/controllers/WatchlistController';
import { Film } from '../src/models/Film';

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
    removeItem: jest.fn(),
    length: 0,
    key: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock getMovieDetails
jest.mock('../src/api/tmdb', () => ({
    getMovieDetails: jest.fn().mockResolvedValue({
        id: 1,
        title: 'Test Movie',
        release_date: '2023-01-01',
        overview: 'Test Overview',
        poster_path: '/test-poster.jpg',
        runtime: 120,
        genres: [{ id: 1, name: 'Action' }],
        credits: {
            crew: [{ job: 'Director', name: 'Test Director' }],
            cast: [{ name: 'Actor 1' }, { name: 'Actor 2' }]
        }
    })
}));

describe('WatchlistController', () => {
    let watchlistController: WatchlistController;
    const testUserId = 123;
    const testMovieId = 1;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <div class="watchlist-grid"></div>
        `;
        
        // Clear localStorage mock
        mockLocalStorage.getItem.mockClear();
        mockLocalStorage.setItem.mockClear();
        mockLocalStorage.clear.mockClear();
        mockLocalStorage.removeItem.mockClear();
        
        // Mock empty watchlist
        mockLocalStorage.getItem.mockReturnValue(null);
        
        watchlistController = new WatchlistController(testUserId);
    });

    test('should add film to watchlist', async () => {
        await watchlistController.ajouterFilm(testMovieId);
        const watchlistElement = document.querySelector('.watchlist-card');
        expect(watchlistElement).toBeTruthy();
        expect(watchlistElement?.textContent).toContain('Test Movie');
    });

    test('should not add duplicate film to watchlist', async () => {
        // Mock existing watchlist with one film
        const existingWatchlist = [{
            id: testMovieId,
            titre: 'Test Movie',
            affiche: '/test-poster.jpg',
            annee: 2023,
            realisateur: 'Test Director',
            dateAjout: new Date().toISOString(),
            priorite: 'moyenne'
        }];
        
        // Créer un nouveau contrôleur avec la watchlist existante
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingWatchlist));
        watchlistController = new WatchlistController(testUserId);
        
        // Tenter d'ajouter le même film
        await watchlistController.ajouterFilm(testMovieId);
        
        // Vérifier que le film n'a pas été ajouté en double dans le DOM
        const watchlistItems = document.querySelectorAll('.watchlist-card');
        expect(watchlistItems.length).toBe(1);
        
        // Vérifier que localStorage n'a pas été modifié
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    test('should remove film from watchlist', async () => {
        await watchlistController.ajouterFilm(testMovieId);
        watchlistController.supprimerFilm(testMovieId);
        const watchlistItems = document.querySelectorAll('.watchlist-card');
        expect(watchlistItems.length).toBe(0);
    });

    test('should get empty watchlist for new user', () => {
        const watchlistItems = document.querySelectorAll('.watchlist-card');
        expect(watchlistItems.length).toBe(0);
    });

    test('should check if film exists in watchlist', async () => {
        await watchlistController.ajouterFilm(testMovieId);
        const watchlistElement = document.querySelector('.watchlist-card');
        expect(watchlistElement).toBeTruthy();
        expect(watchlistElement?.textContent).toContain('Test Movie');

        watchlistController.supprimerFilm(testMovieId);
        const watchlistElementAfterRemoval = document.querySelector('.watchlist-card');
        expect(watchlistElementAfterRemoval).toBeFalsy();
    });

    test('should handle watchlist storage errors', async () => {
        mockLocalStorage.setItem.mockImplementation(() => {
            throw new Error('Storage error');
        });

        await expect(watchlistController.ajouterFilm(testMovieId)).rejects.toThrow('Storage error');
    });

    test('should handle watchlist retrieval errors', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
            throw new Error('Storage error');
        });

        watchlistController = new WatchlistController(testUserId);
        const watchlistItems = document.querySelectorAll('.watchlist-card');
        expect(watchlistItems.length).toBe(0);
    });
});

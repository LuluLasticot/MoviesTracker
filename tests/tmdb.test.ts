import { searchMoviesOnTMDB, getMovieDetails, getPersonImage } from '../src/api/tmdb';
import { Film } from '../src/models/Film';

// Mock global fetch
let mockFetch: jest.Mock;

describe('TMDB API', () => {
    beforeEach(() => {
        // Reset fetch mock
        mockFetch = jest.fn();
        global.fetch = mockFetch;

        // Clear module cache to reset personImageCache
        jest.resetModules();
    });

    test('should search movies successfully', async () => {
        const mockResponse = {
            results: [{
                id: 1,
                title: 'Test Movie',
                release_date: '2023-01-01',
                overview: 'Test Overview',
                poster_path: '/test-path.jpg',
                runtime: 120,
                genres: [{ id: 1, name: 'Action' }],
                director: 'Test Director',
                cast: ['Actor 1', 'Actor 2']
            }]
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });

        const results = await searchMoviesOnTMDB('Test Movie');
        expect(results[0].title).toBe('Test Movie');
    });

    test('should handle search error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ status_message: 'Not found' })
        });

        await expect(searchMoviesOnTMDB('Test Movie')).rejects.toThrow('Erreur TMDB: 404');
    });

    test('should get movie details successfully', async () => {
        const mockResponse = {
            id: 1,
            title: 'Test Movie',
            release_date: '2023-01-01',
            overview: 'Test Overview',
            poster_path: '/test-path.jpg',
            runtime: 120,
            genres: [{ id: 1, name: 'Action' }],
            credits: {
                crew: [{ job: 'Director', name: 'Test Director' }],
                cast: [{ name: 'Actor 1' }, { name: 'Actor 2' }]
            }
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });

        const movie = await getMovieDetails(1);
        expect(movie.title).toBe('Test Movie');
        const director = movie.credits?.crew.find(person => person.job === 'Director');
        expect(director?.name).toBe('Test Director');
    });

    test('should handle movie details error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ status_message: 'Not found' })
        });

        await expect(getMovieDetails(1)).rejects.toThrow('Erreur TMDB: 404');
    });

    test('should get person image successfully', async () => {
        const mockSearchResponse = {
            results: [{
                id: 1,
                profile_path: '/test-path.jpg'
            }]
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockSearchResponse)
        });

        const imagePath = await getPersonImage('Test Person');
        expect(imagePath).toBe('https://image.tmdb.org/t/p/w200/test-path.jpg');
    });

    test('should handle person image error', async () => {
        // Mock de la recherche de personne en erreur
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ status_message: 'Not found' })
        });

        await expect(getPersonImage('Test Person')).rejects.toThrow('Erreur TMDB: 404');
    });

    test('should handle empty person search results', async () => {
        // Mock de la recherche de personne sans résultats
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                results: []
            })
        });

        const imagePath = await getPersonImage('Test Person');
        expect(imagePath).toBe('');
    });
});

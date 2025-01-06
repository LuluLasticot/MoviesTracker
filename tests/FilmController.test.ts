import { Film } from '../src/models/Film';
import { chargerFilms, ajouterFilm, modifierFilmUtilisateur, supprimerFilmUtilisateur } from '../src/controllers/FilmController';

// Mock localStorage
const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('FilmController', () => {
    const userId = 1;
    const testFilm = new Film({
        id: 1,
        titre: "Inception",
        annee: 2010,
        duree: 148,
        realisateur: "Christopher Nolan",
        acteurs: ["Leonardo DiCaprio", "Ellen Page"],
        genres: ["Science Fiction", "Action"],
        synopsis: "Dom Cobb est un voleur expérimenté...",
        note: 9,
        dateDeVisionnage: "2024-01-06",
        plateforme: "Netflix",
        affiche: "https://example.com/inception.jpg"
    });

    beforeEach(() => {
        localStorage.clear();
    });

    test('should load films for a user', async () => {
        // Arrange
        localStorage.setItem(`films_${userId}`, JSON.stringify([testFilm]));

        // Act
        const films = await chargerFilms(userId);

        // Assert
        expect(films).toHaveLength(1);
        expect(films[0].titre).toBe("Inception");
    });

    test('should add a film for a user', async () => {
        // Act
        await ajouterFilm(userId, testFilm);
        const films = await chargerFilms(userId);

        // Assert
        expect(films).toHaveLength(1);
        expect(films[0].titre).toBe("Inception");
    });

    test('should modify a film for a user', async () => {
        // Arrange
        await ajouterFilm(userId, testFilm);
        
        const modifiedFilm = { ...testFilm, note: 8, plateforme: "Amazon Prime" };

        // Act
        await modifierFilmUtilisateur(userId, modifiedFilm);
        const films = await chargerFilms(userId);

        // Assert
        expect(films[0].note).toBe(8);
        expect(films[0].plateforme).toBe("Amazon Prime");
    });

    test('should delete a film for a user', async () => {
        // Arrange
        await ajouterFilm(userId, testFilm);
        
        // Act
        await supprimerFilmUtilisateur(userId, testFilm.id);
        const films = await chargerFilms(userId);

        // Assert
        expect(films).toHaveLength(0);
    });

    test('should handle loading films when no films exist', async () => {
        // Act
        const films = await chargerFilms(userId);

        // Assert
        expect(films).toHaveLength(0);
    });

    test('should not modify non-existent film', async () => {
        // Arrange
        const nonExistentFilm = { ...testFilm, id: 999 };

        // Act & Assert
        await expect(modifierFilmUtilisateur(userId, nonExistentFilm))
            .rejects
            .toThrow("Film non trouvé");
    });

    test('should not delete non-existent film', async () => {
        // Act & Assert
        await expect(supprimerFilmUtilisateur(userId, 999))
            .rejects
            .toThrow("Film non trouvé");
    });
});

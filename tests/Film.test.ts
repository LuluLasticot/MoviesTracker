import { Film } from '../src/models/Film';

describe('Film', () => {
    let film: Film;

    beforeEach(() => {
        film = new Film({
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
    });

    test('should create a film with all properties', () => {
        expect(film.id).toBe(1);
        expect(film.titre).toBe("Inception");
        expect(film.annee).toBe(2010);
        expect(film.duree).toBe(148);
        expect(film.realisateur).toBe("Christopher Nolan");
        expect(film.acteurs).toEqual(["Leonardo DiCaprio", "Ellen Page"]);
        expect(film.genres).toEqual(["Science Fiction", "Action"]);
        expect(film.note).toBe(9);
        expect(film.dateDeVisionnage).toBe("2024-01-06");
        expect(film.plateforme).toBe("Netflix");
    });

    test('should handle missing optional properties', () => {
        const filmMinimal = new Film({
            id: 2,
            titre: "Test Film",
            annee: 2023,
            duree: 120,
            realisateur: "Test Director",
            acteurs: [],
            genres: [],
            synopsis: "",
            note: 0,
            dateDeVisionnage: "",
            plateforme: "",
            affiche: ""
        });

        expect(filmMinimal.id).toBe(2);
        expect(filmMinimal.acteurs).toEqual([]);
        expect(filmMinimal.genres).toEqual([]);
        expect(filmMinimal.synopsis).toBe("");
        expect(filmMinimal.affiche).toBe("");
    });

    test('should validate film duration is positive', () => {
        expect(() => {
            new Film({
                id: 3,
                titre: "Test Film",
                annee: 2023,
                duree: -120,  // Durée négative
                realisateur: "Test Director",
                acteurs: [],
                genres: [],
                synopsis: "",
                note: 0,
                dateDeVisionnage: "",
                plateforme: "",
                affiche: ""
            });
        }).toThrow("La durée du film doit être positive");
    });

    test('should validate film year is valid', () => {
        expect(() => {
            new Film({
                id: 4,
                titre: "Test Film",
                annee: 2025,  // Année future
                duree: 120,
                realisateur: "Test Director",
                acteurs: [],
                genres: [],
                synopsis: "",
                note: 0,
                dateDeVisionnage: "",
                plateforme: "",
                affiche: ""
            });
        }).toThrow("L'année du film ne peut pas être dans le futur");
    });

    test('should validate film rating is between 0 and 10', () => {
        expect(() => {
            new Film({
                id: 5,
                titre: "Test Film",
                annee: 2023,
                duree: 120,
                realisateur: "Test Director",
                acteurs: [],
                genres: [],
                synopsis: "",
                note: 11,  // Note supérieure à 10
                dateDeVisionnage: "",
                plateforme: "",
                affiche: ""
            });
        }).toThrow("La note doit être comprise entre 0 et 10");
    });

    test('should validate required fields are present', () => {
        expect(() => {
            new Film({
                id: 6,
                titre: "",  // Titre vide
                annee: 2023,
                duree: 120,
                realisateur: "Test Director",
                acteurs: [],
                genres: [],
                synopsis: "",
                note: 7,
                dateDeVisionnage: "",
                plateforme: "",
                affiche: ""
            });
        }).toThrow("Le titre est requis");
    });
});

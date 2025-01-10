import { getMovieDetails } from '../api/tmdb';
import Choices from 'choices.js';

export class FormService {
    private static instance: FormService;
    private genreChoices: Choices | null = null;

    private constructor() {}

    public static getInstance(): FormService {
        if (!FormService.instance) {
            FormService.instance = new FormService();
        }
        return FormService.instance;
    }

    public setGenreChoices(choices: Choices): void {
        this.genreChoices = choices;
    }

    public async fillFormWithTMDB(movieId: number): Promise<void> {
        const movieDetails = await getMovieDetails(movieId);
        if (!movieDetails) return;

        // Remplir les champs du formulaire avec les données TMDB
        (document.getElementById("film-title") as HTMLInputElement).value = movieDetails.title;
        (document.getElementById("annee") as HTMLSelectElement).value = new Date(movieDetails.release_date).getFullYear().toString();
        (document.getElementById("duree") as HTMLInputElement).value = movieDetails.runtime?.toString() || "";
        (document.getElementById("realisations") as HTMLInputElement).value = movieDetails.credits?.crew
            .filter(member => member.job === "Director")
            .map(director => director.name)
            .join(", ") || "";
        (document.getElementById("distribution") as HTMLInputElement).value = movieDetails.credits?.cast
            .slice(0, 5)
            .map(actor => actor.name)
            .join(", ") || "";
        (document.getElementById("synopsis") as HTMLTextAreaElement).value = movieDetails.overview || "";
        (document.getElementById("affiche") as HTMLInputElement).value = movieDetails.poster_path
            ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
            : "";

        // Gestion des genres
        if (this.genreChoices && movieDetails.genres) {
            const genreSelect = document.getElementById("genres") as HTMLSelectElement;
            const availableGenres = Array.from(genreSelect.options).map(opt => opt.value);
            
            // Mapper les genres TMDB vers nos genres locaux
            const genreMapping: { [key: string]: string } = {
                "Action": "Action",
                "Adventure": "Aventure",
                "Animation": "Animation",
                "Comedy": "Comédie",
                "Crime": "Policier",
                "Documentary": "Documentaire",
                "Drama": "Drame",
                "Family": "Famille",
                "Fantasy": "Fantastique",
                "History": "Historique",
                "Horror": "Horreur",
                "Music": "Comédie Musicale",
                "Mystery": "Mystère",
                "Romance": "Romance",
                "Science Fiction": "Science-fiction",
                "Thriller": "Thriller",
                "War": "Guerre",
                "Western": "Western"
            };

            // Sélectionner les genres correspondants
            const matchedGenres = movieDetails.genres
                .map(g => genreMapping[g.name])
                .filter(g => g && availableGenres.includes(g));

            this.genreChoices.removeActiveItems();
            this.genreChoices.setChoiceByValue(matchedGenres);
        }
    }
}

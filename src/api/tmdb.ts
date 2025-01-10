// src/api/tmdb.ts

import { TMDBMovieDetails, TMDBPersonDetails } from './types';
import TMDBService from './TMDBService';

const tmdbService = TMDBService.getInstance();

// Cache pour stocker les images des personnes
const personImageCache = new Map<string, string>();

// Cherche les films par titre (paramètre 'query')
export async function searchMoviesOnTMDB(query: string): Promise<any[]> {
    try {
        const response = await tmdbService.searchMovies(query);
        return response.results;
    } catch (error) {
        console.error('Erreur lors de la recherche de films:', error);
        return [];
    }
}

// Récupère les détails complets d'un film, y compris le casting et l'équipe
export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    try {
        return await tmdbService.getMovieDetails(movieId);
    } catch (error) {
        console.error(`Erreur lors de la récupération des détails du film ${movieId}:`, error);
        throw error;
    }
}

// Chercher une personne (acteur ou réalisateur)
export async function searchPerson(query: string): Promise<TMDBPersonDetails | null> {
    try {
        const response = await tmdbService.searchPerson(query);
        return response.results[0] || null;
    } catch (error) {
        console.error('Erreur lors de la recherche de la personne:', error);
        return null;
    }
}

// Obtenir les détails d'une personne par son ID
export async function getPersonDetails(personId: number): Promise<TMDBPersonDetails | null> {
    try {
        return await tmdbService.getPersonDetails(personId);
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de la personne:', error);
        return null;
    }
}

// Obtenir l'image d'une personne avec mise en cache
export async function getPersonImage(name: string): Promise<string> {
    // Vérifier si l'image est dans le cache
    if (personImageCache.has(name)) {
        return personImageCache.get(name)!;
    }

    try {
        const person = await searchPerson(name);
        if (person?.profile_path) {
            const imageUrl = tmdbService.getImageUrl(person.profile_path, 'w200');
            personImageCache.set(name, imageUrl);
            return imageUrl;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'image:', error);
    }

    return tmdbService.getImageUrl('', 'w200'); // Retourne l'image par défaut
}

// src/api/tmdb.ts

// Remplace "TA_CLE_ICI" par ta vraie clé d'API TMDB.
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "434dd1cd2aff12b462a7b229be1923a3";

export interface TMDBMovieDetails {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  runtime?: number;
  poster_path?: string;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path?: string;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
    }>;
  };
}

// Cherche les films par titre (paramètre 'query')
export async function searchMoviesOnTMDB(query: string): Promise<any[]> {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur TMDB: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

// Récupère les détails complets d'un film, y compris le casting et l'équipe
export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur TMDB: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Chercher une personne (acteur ou réalisateur)
export async function searchPerson(query: string): Promise<any> {
    const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results[0] || null;
    } catch (error) {
        console.error("Erreur lors de la recherche de la personne:", error);
        return null;
    }
}

// Obtenir les détails d'une personne par son ID
export async function getPersonDetails(personId: number): Promise<any> {
    const url = `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}&language=fr-FR`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des détails de la personne:", error);
        return null;
    }
}

// Cache pour stocker les images des personnes
const personImageCache = new Map<string, string>();

// Obtenir l'image d'une personne avec mise en cache
export async function getPersonImage(name: string): Promise<string> {
    // Vérifier si l'image est dans le cache
    if (personImageCache.has(name)) {
        return personImageCache.get(name)!;
    }

    try {
        const person = await searchPerson(name);
        if (person && person.profile_path) {
            const imageUrl = `https://image.tmdb.org/t/p/w200${person.profile_path}`;
            personImageCache.set(name, imageUrl);
            return imageUrl;
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de l'image:", error);
    }

    // Image par défaut si aucune image n'est trouvée
    return 'https://via.placeholder.com/200x300?text=No+Image';
}

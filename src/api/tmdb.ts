// src/api/tmdb.ts

// Remplace "TA_CLE_ICI" par ta vraie clé d'API TMDB.
const TMDB_API_KEY = "434dd1cd2aff12b462a7b229be1923a3";

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

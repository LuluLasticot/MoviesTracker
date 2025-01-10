import { TMDBMovieDetails, TMDBPersonDetails, TMDBSearchResponse, CacheItem } from './types';

class TMDBService {
    private static instance: TMDBService;
    private readonly API_KEY: string;
    private readonly BASE_URL = 'https://api.themoviedb.org/3';
    private readonly IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures
    private readonly RETRY_ATTEMPTS = 3;
    private readonly RETRY_DELAY = 1000; // 1 seconde

    private cache: Map<string, CacheItem<any>> = new Map();
    private pendingRequests: Map<string, Promise<any>> = new Map();

    private constructor() {
        this.API_KEY = import.meta.env.VITE_TMDB_API_KEY || "434dd1cd2aff12b462a7b229be1923a3";
    }

    public static getInstance(): TMDBService {
        if (!TMDBService.instance) {
            TMDBService.instance = new TMDBService();
        }
        return TMDBService.instance;
    }

    private getCacheKey(endpoint: string, params: Record<string, any> = {}): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return `${endpoint}?${sortedParams}`;
    }

    private async fetchWithRetry(url: string, options: RequestInit = {}, attempts = 1): Promise<Response> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers,
                }
            });

            if (!response.ok) {
                if (response.status === 429 && attempts < this.RETRY_ATTEMPTS) {
                    // Rate limit atteint, attendre et réessayer
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempts));
                    return this.fetchWithRetry(url, options, attempts + 1);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response;
        } catch (error) {
            if (attempts < this.RETRY_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempts));
                return this.fetchWithRetry(url, options, attempts + 1);
            }
            throw error;
        }
    }

    private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
        const cacheKey = this.getCacheKey(endpoint, params);
        
        // Vérifier le cache
        const cachedItem = this.cache.get(cacheKey);
        if (cachedItem && cachedItem.expiresAt > Date.now()) {
            return cachedItem.data;
        }

        // Vérifier si une requête est déjà en cours
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        // Construire l'URL
        const queryParams = new URLSearchParams({
            api_key: this.API_KEY,
            language: 'fr-FR',
            ...params
        });

        const url = `${this.BASE_URL}${endpoint}?${queryParams}`;

        // Créer et stocker la promesse
        const promise = this.fetchWithRetry(url)
            .then(response => response.json())
            .then(data => {
                // Mettre en cache le résultat
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + this.CACHE_DURATION
                });
                return data;
            })
            .finally(() => {
                // Nettoyer la requête en cours
                this.pendingRequests.delete(cacheKey);
            });

        this.pendingRequests.set(cacheKey, promise);
        return promise;
    }

    public async searchMovies(query: string): Promise<TMDBSearchResponse<TMDBMovieDetails>> {
        return this.request('/search/movie', { query });
    }

    public async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
        return this.request(`/movie/${movieId}`, { append_to_response: 'credits' });
    }

    public async searchPerson(query: string): Promise<TMDBSearchResponse<TMDBPersonDetails>> {
        return this.request('/search/person', { query });
    }

    public async getPersonDetails(personId: number): Promise<TMDBPersonDetails> {
        return this.request(`/person/${personId}`);
    }

    public getImageUrl(path: string, size: 'w200' | 'w500' | 'original' = 'w500'): string {
        if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
        return `${this.IMAGE_BASE_URL}/${size}${path}`;
    }

    public clearCache(): void {
        this.cache.clear();
    }

    public clearExpiredCache(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (item.expiresAt <= now) {
                this.cache.delete(key);
            }
        }
    }
}

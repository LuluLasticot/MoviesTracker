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

export interface TMDBPersonDetails {
    id: number;
    name: string;
    profile_path?: string;
    biography?: string;
    birthday?: string;
    place_of_birth?: string;
    known_for_department?: string;
}

export interface TMDBSearchResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

export interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

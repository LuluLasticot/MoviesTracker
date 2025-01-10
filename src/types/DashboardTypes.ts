import { Film } from "../models/Film";

export interface FilmRecord {
    titre: string;
    duree: number;
    id: number;
    annee: number;
    genres: string[];
    realisateur: string;
    acteurs: string[];
    note: number;
    affiche: string;
    dateDeVisionnage: string;
    plateforme: string;
}

export interface PersonStat {
    name: string;
    count: number;
    image?: string;
}

export interface CategoryStat {
    name: string;
    count: number;
    percentage: number;
}

export interface YearlyStat {
    year: number;
    count: number;
    height: string;
}

export interface DashboardStats {
    filmsCount: number;
    totalTime: { 
        hours: number; 
        days: number 
    };
    averageRating: number;
    yearlyStats: YearlyStat[];
    topDirectors: PersonStat[];
    topActors: PersonStat[];
    genreStats: CategoryStat[];
    platformStats: CategoryStat[];
    topRatedFilms: Film[];
    records: {
        shortest: FilmRecord;
        longest: FilmRecord;
    };
    badges: Array<{ 
        name: string; 
        icon: string; 
        unlocked: boolean 
    }>;
}

export const DASHBOARD_SECTIONS = {
    OVERVIEW: 'overview-section',
    YEARLY: 'yearly-section',
    PEOPLE: 'people-section',
    CATEGORIES: 'categories-section',
    RECORDS: 'records-section'
} as const;

export const STAT_LIMITS = {
    TOP_FILMS: 5,
    TOP_PEOPLE: 5,
    MIN_FILMS_FOR_STATS: 3
} as const;

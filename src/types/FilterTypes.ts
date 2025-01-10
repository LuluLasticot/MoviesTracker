export type SortValue = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc';

export interface FilterState {
    platform?: string;
    genre?: string;
    sort: SortValue;
}

export const FILTER_IDS = {
    SORT: 'sort-select',
    PLATFORM: 'platform-select',
    GENRE: 'genre-select'
} as const;

export const DEFAULT_SORT: SortValue = 'date-desc';

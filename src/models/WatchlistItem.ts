export interface WatchlistItem {
    id: number;
    titre: string;
    affiche: string;
    annee: number;
    realisateur: string;
    dateAjout: string;
    priorite: 'haute' | 'moyenne' | 'basse';
    notes?: string;
}

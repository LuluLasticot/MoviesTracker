import { Film } from "../models/Film";
import { CategoryStat, PersonStat, YearlyStat } from "../types/DashboardTypes";

export class StatisticsUtils {
    static calculateAverageRating(films: Film[]): number {
        if (!films.length) return 0;
        const sum = films.reduce((acc, film) => acc + film.note, 0);
        return Number((sum / films.length).toFixed(1));
    }

    static calculateTotalTime(films: Film[]): { hours: number; days: number } {
        const totalMinutes = films.reduce((acc, film) => acc + (film.duree || 0), 0);
        const hours = Math.floor(totalMinutes / 60);
        const days = Number((hours / 24).toFixed(1));
        return { hours, days };
    }

    static calculateYearlyStats(films: Film[]): YearlyStat[] {
        const yearCounts = new Map<number, number>();
        
        // Compter les films par année
        films.forEach(film => {
            const year = new Date(film.dateDeVisionnage).getFullYear();
            yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
        });

        // Convertir en tableau et trier
        const stats = Array.from(yearCounts.entries())
            .map(([year, count]) => ({
                year,
                count,
                height: '0%' // Sera calculé après
            }))
            .sort((a, b) => a.year - b.year);

        // Calculer les hauteurs relatives
        const maxCount = Math.max(...stats.map(s => s.count));
        stats.forEach(stat => {
            stat.height = `${(stat.count / maxCount * 100).toFixed(0)}%`;
        });

        return stats;
    }

    static calculateCategoryStats(films: Film[], categoryGetter: (film: Film) => string[]): CategoryStat[] {
        const counts = new Map<string, number>();
        let total = 0;

        // Compter les occurrences
        films.forEach(film => {
            const categories = categoryGetter(film);
            categories.forEach(category => {
                counts.set(category, (counts.get(category) || 0) + 1);
                total++;
            });
        });

        // Convertir en tableau et calculer les pourcentages
        return Array.from(counts.entries())
            .map(([name, count]) => ({
                name,
                count,
                percentage: Number(((count / total) * 100).toFixed(1))
            }))
            .sort((a, b) => b.count - a.count);
    }

    static calculateTopPeople(
        films: Film[], 
        peopleGetter: (film: Film) => string[],
        limit: number
    ): PersonStat[] {
        const counts = new Map<string, number>();

        // Compter les occurrences
        films.forEach(film => {
            const people = peopleGetter(film);
            people.forEach(person => {
                if (person) {
                    counts.set(person, (counts.get(person) || 0) + 1);
                }
            });
        });

        // Convertir en tableau et trier
        return Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    static memoize<T, R>(
        fn: (arg: T) => R,
        keyGenerator: (arg: T) => string = JSON.stringify
    ): (arg: T) => R {
        const cache = new Map<string, R>();
        
        return (arg: T): R => {
            const key = keyGenerator(arg);
            if (cache.has(key)) {
                return cache.get(key)!;
            }
            
            const result = fn(arg);
            cache.set(key, result);
            return result;
        };
    }
}

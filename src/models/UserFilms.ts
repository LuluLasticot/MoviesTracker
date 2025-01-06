import { Film } from './Film';

export interface UserFilms {
    userId: number;
    films: Film[];
}

export interface UserFilmsStorage {
    [userId: number]: Film[];
}

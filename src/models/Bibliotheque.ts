export class Bibliotheque {
  id: number;
  utilisateurId: number;
  filmsVus: number[];
  filmsAVoir: number[];
  likes: number[];

  constructor(id: number, utilisateurId: number, filmsVus: number[], filmsAVoir: number[], likes: number[]) {
    this.id = id;
    this.utilisateurId = utilisateurId;
    this.filmsVus = filmsVus;
    this.filmsAVoir = filmsAVoir;
    this.likes = likes;
  }

  ajouterFilmVu(filmId: number): void {
    if (!this.filmsVus.includes(filmId)) {
      this.filmsVus.push(filmId);
      this.filmsAVoir = this.filmsAVoir.filter(id => id !== filmId);
    }
  }

  ajouterFilmAVoir(filmId: number): void {
    if (!this.filmsAVoir.includes(filmId) && !this.filmsVus.includes(filmId)) {
      this.filmsAVoir.push(filmId);
    }
  }

  likerFilm(filmId: number): void {
    if (!this.likes.includes(filmId)) {
      this.likes.push(filmId);
    }
  }
}

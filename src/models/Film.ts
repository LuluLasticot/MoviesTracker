export interface FilmData {
  id: number;
  titre: string;
  annee: number;
  genres: string[];
  duree: number;
  realisateur: string;
  acteurs: string[];
  synopsis: string;
  note: number;
  dateDeVisionnage: string;
  plateforme: string;
  affiche: string;
}

export class Film implements FilmData {
  id: number;
  titre: string;
  annee: number;
  genres: string[];
  duree: number;
  realisateur: string;
  acteurs: string[];
  synopsis: string;
  note: number;
  dateDeVisionnage: string;
  plateforme: string;
  affiche: string;

  constructor(data: FilmData) {
      this.id = data.id;
      this.titre = data.titre;
      this.annee = data.annee;
      this.genres = data.genres;
      this.duree = data.duree;
      this.realisateur = data.realisateur;
      this.acteurs = data.acteurs;
      this.synopsis = data.synopsis;
      this.note = data.note;
      this.dateDeVisionnage = data.dateDeVisionnage;
      this.plateforme = data.plateforme;
      this.affiche = data.affiche;
  }
}
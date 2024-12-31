export class Film {
    id: number;
    titre: string;
    annee: number;
    genres: string[];
    note: number;
  
    constructor(id: number, titre: string, annee: number, genres: string[], note: number) {
      this.id = id;
      this.titre = titre;
      this.annee = annee;
      this.genres = genres;
      this.note = note;
    }
  }
  
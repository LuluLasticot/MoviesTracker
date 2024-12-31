export class Bibliotheque {
    id: number;
    utilisateurId: number;
    filmsVus: number[];
    filmsAVoir: number[];
  
    constructor(id: number, utilisateurId: number, filmsVus: number[], filmsAVoir: number[]) {
      this.id = id;
      this.utilisateurId = utilisateurId;
      this.filmsVus = filmsVus;
      this.filmsAVoir = filmsAVoir;
    }
  }
  
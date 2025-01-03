export class Film {
  constructor(
    public id: number,
    public titre: string,
    public annee: number,
    public genres: string[],
    public duree: number,
    public realisateur: string,
    public acteurs: string[],
    public synopsis: string,
    public note: number,
    public dateDeVisionnage: string,
    public plateforme: string,
    public affiche: string
  ) {}
}

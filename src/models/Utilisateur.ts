export class Utilisateur {
    id: number;
    nom: string;
    email: string;
    bibliothequeId: number;
  
    constructor(id: number, nom: string, email: string, bibliothequeId: number) {
      this.id = id;
      this.nom = nom;
      this.email = email;
      this.bibliothequeId = bibliothequeId;
    }
  }
  
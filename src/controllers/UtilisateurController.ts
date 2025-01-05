// src/controllers/UtilisateurController.ts
import { Utilisateur } from "../models/Utilisateur";
import { fetchData } from "../utils/fetchData";

// Tableau en mémoire + synchro possible avec localStorage
let utilisateurs: Utilisateur[] = [];

/**
 * Charge la liste d'utilisateurs depuis users.json
 * + eventuel chargement depuis localStorage.
 */
export async function chargerUtilisateurs(): Promise<Utilisateur[]> {
  try {
    // 1. Charger depuis users.json
    const data = await fetchData<Utilisateur[]>("./src/data/users.json");
    utilisateurs = data;

    // 2. Si on veut fusionner avec ce qu'il y a dans localStorage :
    const localUsersStr = localStorage.getItem("utilisateurs");
    if (localUsersStr) {
      const localUsers = JSON.parse(localUsersStr) as Utilisateur[];
      // On fusionne (optionnel). Ici, on suppose que localStorage peut contenir des nouveaux users
      localUsers.forEach((u) => {
        if (!utilisateurs.find((usr) => usr.email === u.email)) {
          utilisateurs.push(u);
        }
      });
    }

    return utilisateurs;
  } catch (error) {
    console.error("Erreur lors du chargement des utilisateurs :", error);
    return [];
  }
}

/**
 * Retourne le tableau en mémoire d'utilisateurs
 */
export function getUtilisateurs(): Utilisateur[] {
  return utilisateurs;
}

/**
 * Ajoute un nouvel utilisateur en mémoire et dans localStorage
 */
export function inscrireUtilisateur(pseudo: string, email: string, password: string): Utilisateur {
  const maxId = utilisateurs.length > 0 ? Math.max(...utilisateurs.map(u => u.id)) : 0;
  const newId = maxId + 1;

  const newUser = new Utilisateur(newId, pseudo, email, password);
  utilisateurs.push(newUser);

  // Mettre à jour localStorage
  localStorage.setItem("utilisateurs", JSON.stringify(utilisateurs));

  return newUser;
}

/**
 * Vérifie les identifiants de l'utilisateur (email + password)
 * Renvoie l'utilisateur si trouvé, sinon null.
 */
export function connecterUtilisateur(email: string, password: string): Utilisateur | null {
  const user = utilisateurs.find(u => u.email === email && u.password === password);
  return user ?? null;
}

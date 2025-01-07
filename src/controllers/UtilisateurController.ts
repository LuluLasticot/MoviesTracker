// src/controllers/UtilisateurController.ts
import { Utilisateur } from "../models/Utilisateur";
import { fetchData } from "../utils/fetchData";

// Tableau en mémoire + synchro possible avec localStorage
let utilisateurs: Utilisateur[] = [];

// Utilisateurs par défaut pour la démo
const defaultUsers: Utilisateur[] = [
    new Utilisateur(1, "Demo User", "demo@example.com", "demo123"),
    new Utilisateur(2, "Test User", "test@example.com", "test123")
];

/**
 * Charge la liste d'utilisateurs depuis la mémoire locale
 * ou utilise les utilisateurs par défaut
 */
export async function chargerUtilisateurs(): Promise<Utilisateur[]> {
    try {
        // Charger depuis localStorage
        const localUsersStr = localStorage.getItem("utilisateurs");
        if (localUsersStr) {
            utilisateurs = JSON.parse(localUsersStr) as Utilisateur[];
        } else {
            // Si pas d'utilisateurs en local, utiliser les utilisateurs par défaut
            utilisateurs = defaultUsers;
            // Sauvegarder dans localStorage
            localStorage.setItem("utilisateurs", JSON.stringify(utilisateurs));
        }

        return utilisateurs;
    } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs :", error);
        return defaultUsers;
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
    
    // Sauvegarder dans localStorage
    localStorage.setItem("utilisateurs", JSON.stringify(utilisateurs));
    
    return newUser;
}

/**
 * Vérifie les identifiants de l'utilisateur (email + password)
 * Renvoie l'utilisateur si trouvé, sinon null
 */
export async function connecterUtilisateur(email: string, password: string): Promise<Utilisateur | null> {
    // S'assurer que les utilisateurs sont chargés
    if (utilisateurs.length === 0) {
        await chargerUtilisateurs();
    }

    const user = utilisateurs.find(
        (u) => u.email === email && u.password === password
    );

    if (user) {
        // Stocker l'ID de l'utilisateur connecté
        localStorage.setItem("currentUserId", user.id.toString());
        return user;
    }

    return null;
}

/**
 * Déconnecte l'utilisateur
 */
export function deconnecterUtilisateur(): void {
    localStorage.removeItem("currentUserId");
}

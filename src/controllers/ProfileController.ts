import { Film } from "../models/Film";
import { md5 } from "../utils/md5";

export class ProfileController {
    private currentUserId?: number;
    private currentUserData: any;

    constructor() {
        // Récupérer l'utilisateur actuel du localStorage au démarrage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            this.currentUserId = user.id;
            this.currentUserData = user;
            this.loadUserProfile();
        }

        // Écouter les événements de connexion/déconnexion
        document.addEventListener('userLoggedIn', ((e: CustomEvent) => {
            this.currentUserId = e.detail.user.id;
            this.currentUserData = e.detail.user;
            this.loadUserProfile();
        }) as EventListener);

        document.addEventListener('userLoggedOut', () => {
            this.currentUserId = undefined;
            this.currentUserData = null;
            this.resetProfile();
        });

        // Écouter les mises à jour des films pour rafraîchir les statistiques
        document.addEventListener('filmsUpdated', () => {
            if (this.currentUserId) {
                this.updateStatistics();
            }
        });

        // Gérer la soumission du formulaire de profil
        const profileForm = document.getElementById('profile-form');
        profileForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        // Mettre à jour les statistiques initiales si un utilisateur est connecté
        if (this.currentUserId) {
            this.updateStatistics();
        }
    }

    private loadUserProfile() {
        if (!this.currentUserData) return;

        // Mettre à jour les champs du formulaire
        const pseudoInput = document.getElementById('profile-pseudo') as HTMLInputElement;
        const emailInput = document.getElementById('profile-email') as HTMLInputElement;
        
        if (pseudoInput) pseudoInput.value = this.currentUserData.pseudo;
        if (emailInput) {
            emailInput.value = this.currentUserData.email;
            // Mettre à jour l'avatar Gravatar
            const gravatarUrl = this.getGravatarUrl(this.currentUserData.email);
            const avatarImg = document.getElementById('profile-avatar') as HTMLImageElement;
            if (avatarImg) avatarImg.src = gravatarUrl;
        }

        // Mettre à jour les statistiques
        this.updateStatistics();
    }

    private async updateProfile() {
        if (!this.currentUserId) return;

        const pseudoInput = document.getElementById('profile-pseudo') as HTMLInputElement;
        const emailInput = document.getElementById('profile-email') as HTMLInputElement;
        const passwordInput = document.getElementById('profile-password') as HTMLInputElement;

        const updatedUser = {
            ...this.currentUserData,
            pseudo: pseudoInput.value,
            email: emailInput.value
        };

        if (passwordInput.value) {
            updatedUser.password = passwordInput.value;
        }

        try {
            // Mettre à jour les données utilisateur dans le stockage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex((u: any) => u.id === this.currentUserId);
            
            if (userIndex !== -1) {
                users[userIndex] = updatedUser;
                localStorage.setItem('users', JSON.stringify(users));
                this.currentUserData = updatedUser;

                // Mettre à jour l'avatar si l'email a changé
                const gravatarUrl = this.getGravatarUrl(updatedUser.email);
                const avatarImg = document.getElementById('profile-avatar') as HTMLImageElement;
                if (avatarImg) avatarImg.src = gravatarUrl;

                alert('Profil mis à jour avec succès !');
                passwordInput.value = ''; // Réinitialiser le champ mot de passe
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            alert('Erreur lors de la mise à jour du profil');
        }
    }

    public async updateStatistics() {
        if (!this.currentUserId) return;

        try {
            const userFilmsStorage = localStorage.getItem(`films_${this.currentUserId}`);
            if (!userFilmsStorage) return;

            const userFilms = JSON.parse(userFilmsStorage) as Film[];

            // 1. Temps total de visionnage
            const totalMinutes = userFilms.reduce((acc: number, film: Film) => {
                return acc + (film.duree || 0);
            }, 0);
            const totalHours = Math.floor(totalMinutes / 60);
            const element = document.getElementById('total-watch-time');
            if (element) {
                element.textContent = `${totalHours} heures`;
            }

            // 2. Genre préféré
            const genreCounts: { [key: string]: number } = {};
            userFilms.forEach((film: Film) => {
                if (Array.isArray(film.genres)) {
                    film.genres.forEach((genre: string) => {
                        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                    });
                }
            });
            const favoriteGenre = Object.entries(genreCounts)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || '-';
            const genreElement = document.getElementById('favorite-genre');
            if (genreElement) {
                genreElement.textContent = favoriteGenre;
            }

            // 3. Réalisateur le plus regardé
            const directorCounts: { [key: string]: number } = {};
            userFilms.forEach((film: Film) => {
                if (film.realisateur) {
                    directorCounts[film.realisateur] = (directorCounts[film.realisateur] || 0) + 1;
                }
            });
            const favoriteDirector = Object.entries(directorCounts)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || '-';
            const directorElement = document.getElementById('favorite-director');
            if (directorElement) {
                directorElement.textContent = favoriteDirector;
            }

            // 4. Films vus cette année
            const currentYear = new Date().getFullYear();
            const yearElement = document.getElementById('current-year');
            if (yearElement) {
                yearElement.textContent = currentYear.toString();
            }
            
            const moviesThisYear = userFilms.filter((film: Film) => {
                const filmYear = new Date(film.dateDeVisionnage).getFullYear();
                return filmYear === currentYear;
            }).length;
            const moviesElement = document.getElementById('movies-this-year');
            if (moviesElement) {
                moviesElement.textContent = `${moviesThisYear} films`;
            }

        } catch (error) {
            console.error('Erreur lors de la mise à jour des statistiques:', error);
        }
    }

    private resetProfile() {
        // Réinitialiser les champs du formulaire
        const form = document.getElementById('profile-form') as HTMLFormElement;
        if (form) form.reset();

        // Réinitialiser l'avatar
        const avatarImg = document.getElementById('profile-avatar') as HTMLImageElement;
        if (avatarImg) avatarImg.src = 'https://www.gravatar.com/avatar/default?s=200';

        // Réinitialiser les statistiques
        document.getElementById('total-watch-time')!.textContent = '0 heures';
        document.getElementById('favorite-genre')!.textContent = '-';
        document.getElementById('favorite-director')!.textContent = '-';
        document.getElementById('current-year')!.textContent = new Date().getFullYear().toString();
        document.getElementById('movies-this-year')!.textContent = '0 films';
    }

    private getGravatarUrl(email: string): string {
        const hash = md5(email.toLowerCase().trim());
        return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
    }
}

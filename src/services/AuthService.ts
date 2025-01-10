import { StateManager } from '../utils/StateManager';
import { chargerFilms } from '../controllers/FilmController';
import { connecterUtilisateur, inscrireUtilisateur } from '../controllers/UtilisateurController';

interface AuthState {
    currentUserId: number;
    isAuthenticated: boolean;
    userEmail?: string;
}

export class AuthService {
    private static instance: AuthService;
    private state: StateManager<AuthState>;
    private readonly STORAGE_KEY = 'currentUserId';

    private constructor() {
        const storedUserId = localStorage.getItem(this.STORAGE_KEY);
        this.state = new StateManager<AuthState>({
            currentUserId: storedUserId ? parseInt(storedUserId) : 0,
            isAuthenticated: !!storedUserId,
            userEmail: undefined
        });

        this.state.subscribe(this.handleStateChange.bind(this));
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private handleStateChange(newState: AuthState): void {
        // Mettre à jour le localStorage
        if (newState.currentUserId) {
            localStorage.setItem(this.STORAGE_KEY, newState.currentUserId.toString());
        } else {
            localStorage.removeItem(this.STORAGE_KEY);
        }

        // Mettre à jour l'interface utilisateur
        this.updateUI(newState);

        // Déclencher un événement personnalisé pour informer les autres composants
        document.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { userId: newState.currentUserId, isAuthenticated: newState.isAuthenticated }
        }));
    }

    private updateUI(state: AuthState): void {
        const loginBtn = document.querySelector('.login-btn');
        const signupBtn = document.querySelector('.signup-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userInfo = document.getElementById('user-info');

        if (state.isAuthenticated) {
            loginBtn?.classList.add('hidden');
            signupBtn?.classList.add('hidden');
            logoutBtn?.classList.remove('hidden');
            if (userInfo && state.userEmail) {
                userInfo.textContent = state.userEmail;
                userInfo.classList.remove('hidden');
            }
        } else {
            loginBtn?.classList.remove('hidden');
            signupBtn?.classList.remove('hidden');
            logoutBtn?.classList.add('hidden');
            if (userInfo) {
                userInfo.classList.add('hidden');
            }
        }
    }

    public async login(email: string, password: string): Promise<boolean> {
        try {
            const user = await connecterUtilisateur(email, password);
            if (user) {
                this.state.setState({
                    currentUserId: user.id,
                    isAuthenticated: true,
                    userEmail: email
                });

                // Charger les films de l'utilisateur
                await chargerFilms(user.id);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return false;
        }
    }

    public async register(pseudo: string, email: string, password: string): Promise<boolean> {
        try {
            const newUser = await inscrireUtilisateur(pseudo, email, password);
            if (newUser) {
                this.state.setState({
                    currentUserId: newUser.id,
                    isAuthenticated: true,
                    userEmail: email
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            return false;
        }
    }

    public logout(): void {
        this.state.setState({
            currentUserId: 0,
            isAuthenticated: false,
            userEmail: undefined
        });
    }

    public getCurrentUserId(): number {
        return this.state.getState().currentUserId;
    }

    public isAuthenticated(): boolean {
        return this.state.getState().isAuthenticated;
    }

    public async checkAuthState(): Promise<void> {
        const storedUserId = localStorage.getItem(this.STORAGE_KEY);
        if (storedUserId) {
            const userId = parseInt(storedUserId);
            // Ici, vous pourriez ajouter une vérification supplémentaire avec le backend
            this.state.setState({
                currentUserId: userId,
                isAuthenticated: true
            });
            await chargerFilms(userId);
        }
    }
}

import { StateManager } from '../utils/StateManager';

export type Route = 'films' | 'dashboard' | 'watchlist' | 'profile';

interface NavigationState {
    currentRoute: Route;
    isMenuOpen: boolean;
    previousRoute?: Route;
}

export class NavigationService {
    private static instance: NavigationService;
    private state: StateManager<NavigationState>;
    private routes: Map<Route, HTMLElement>;
    private activeClass = 'active';
    private hiddenClass = 'hidden';

    private constructor() {
        this.state = new StateManager<NavigationState>({
            currentRoute: 'films',
            isMenuOpen: false
        });
        this.routes = new Map();
        this.initializeRoutes();
        this.setupEventListeners();
    }

    public static getInstance(): NavigationService {
        if (!NavigationService.instance) {
            NavigationService.instance = new NavigationService();
        }
        return NavigationService.instance;
    }

    private initializeRoutes(): void {
        const sections = ['films', 'dashboard', 'watchlist', 'profile'] as Route[];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                this.routes.set(section, element);
            }
        });
    }

    private setupEventListeners(): void {
        // Écouter les changements d'état
        this.state.subscribe(this.handleStateChange.bind(this));

        // Configurer les liens de navigation
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('data-route') as Route;
                if (route) {
                    this.navigate(route);
                }
            });
        });

        // Configurer le menu mobile
        this.setupMobileMenu();
    }

    private setupMobileMenu(): void {
        const burgerMenu = document.getElementById('burger-menu');
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('mobile-menu-overlay');

        if (burgerMenu && mobileMenu && overlay) {
            burgerMenu.addEventListener('click', () => this.toggleMenu());
            overlay.addEventListener('click', () => this.closeMenu());

            const mobileLinks = mobileMenu.querySelectorAll('.nav-links a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });
        }
    }

    private handleStateChange(newState: NavigationState): void {
        // Mettre à jour l'affichage des sections
        this.routes.forEach((element, route) => {
            if (route === newState.currentRoute) {
                element.classList.remove(this.hiddenClass);
            } else {
                element.classList.add(this.hiddenClass);
            }
        });

        // Mettre à jour les liens actifs
        this.updateActiveLinks(newState.currentRoute);

        // Gérer l'état du menu mobile
        this.updateMobileMenuState(newState.isMenuOpen);
    }

    private updateActiveLinks(currentRoute: Route): void {
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === currentRoute) {
                link.classList.add(this.activeClass);
                this.handleNavUnderline(link);
            } else {
                link.classList.remove(this.activeClass);
            }
        });
    }

    private handleNavUnderline(link: Element): void {
        const navUnderline = document.querySelector('.nav-underline') as HTMLElement;
        if (navUnderline && link) {
            const linkRect = link.getBoundingClientRect();
            const navRect = link.parentElement?.getBoundingClientRect();
            if (navRect) {
                navUnderline.style.width = `${linkRect.width}px`;
                navUnderline.style.transform = `translateX(${linkRect.left - navRect.left}px)`;
            }
        }
    }

    private updateMobileMenuState(isOpen: boolean): void {
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('mobile-menu-overlay');

        if (mobileMenu && overlay) {
            if (isOpen) {
                mobileMenu.classList.remove('translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                mobileMenu.classList.add('translate-x-full');
                overlay.classList.add('hidden');
            }
        }
    }

    public navigate(route: Route): void {
        const currentState = this.state.getState();
        this.state.setState({
            ...currentState,
            previousRoute: currentState.currentRoute,
            currentRoute: route
        });
    }

    public toggleMenu(): void {
        const currentState = this.state.getState();
        this.state.setState({
            ...currentState,
            isMenuOpen: !currentState.isMenuOpen
        });
    }

    public closeMenu(): void {
        const currentState = this.state.getState();
        if (currentState.isMenuOpen) {
            this.state.setState({
                ...currentState,
                isMenuOpen: false
            });
        }
    }

    public getCurrentRoute(): Route {
        return this.state.getState().currentRoute;
    }

    public getPreviousRoute(): Route | undefined {
        return this.state.getState().previousRoute;
    }
}

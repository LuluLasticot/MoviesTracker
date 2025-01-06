# 🎬 MoviesTracker

## 📝 Description
MoviesTracker est une application web moderne permettant aux utilisateurs de suivre et gérer leur collection de films visionnés. Développée avec TypeScript et suivant l'architecture MVC, elle offre une interface intuitive et des fonctionnalités avancées de suivi et d'analyse.

## ✨ Fonctionnalités Principales

### 🎯 Gestion des Films
- Ajout de films avec auto-complétion via l'API TMDB
- Modification des informations personnelles (note, date de visionnage, plateforme)
- Suppression de films
- Recherche et filtrage avancés

### 📊 Tableau de Bord
- Statistiques détaillées sur les habitudes de visionnage
- Top 5 des films préférés
- Distribution par genre et plateforme
- Temps total de visionnage
- Graphique des films par année

### 👤 Gestion des Utilisateurs
- Création de compte
- Connexion/Déconnexion
- Données personnalisées par utilisateur

### 🎨 Interface Utilisateur
- Design moderne et responsive
- Thème clair/sombre
- Animations fluides
- Interface intuitive

## 🛠️ Technologies Utilisées
- **Frontend** : TypeScript, HTML5, CSS3
- **Architecture** : Modèle-Vue-Contrôleur (MVC)
- **API** : TMDB (The Movie Database)
- **Tests** : Jest
- **Gestion de versions** : Git
- **Build** : Vite

## 📁 Structure du Projet
```
MoviesTracker/
├── src/
│   ├── controllers/    # Contrôleurs MVC
│   ├── models/        # Modèles de données
│   ├── data/         # Fichiers JSON
│   └── api/          # Intégration API TMDB
├── tests/           # Tests unitaires
├── assets/         # Ressources statiques
│   ├── styles/    # Fichiers CSS
│   └── images/    # Images et icônes
├── dist/          # Build de production
└── node_modules/  # Dépendances
```

## 🚀 Installation

### Prérequis
- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)

### Étapes d'installation
1. Cloner le dépôt
```bash
git clone https://github.com/votre-username/MoviesTracker.git
cd MoviesTracker
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
- Créer un fichier `.env` à la racine du projet
- Ajouter votre clé API TMDB :
```env
TMDB_API_KEY=votre_clé_api
```

## 💻 Développement

### Lancer le serveur de développement
```bash
npm run dev
```
L'application sera accessible à l'adresse : `http://localhost:5173`

### Compiler pour la production
```bash
npm run build
```

## 🧪 Tests
### Exécuter les tests unitaires
```bash
npm test
```

### Exécuter les tests avec couverture
```bash
npm run test:coverage
```

## 📝 Guide de Contribution
1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📚 Documentation
Pour plus de détails sur l'utilisation de l'API TMDB :
- [Documentation TMDB](https://developers.themoviedb.org/3)

## 🔑 Fonctionnalités à venir
- [ ] Mode hors ligne avec synchronisation
- [ ] Partage de listes de films
- [ ] Recommandations personnalisées
- [ ] Import/Export des données
- [ ] Application mobile

## 👥 Auteur
- **Lucas Souton** - [GitHub](https://github.com/LuluLasticot)

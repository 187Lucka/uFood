# 🍽️ UFood - Application de Découverte de Restaurants

Application web moderne de découverte et de gestion de restaurants avec système de visites, favoris et profils utilisateurs.

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)
- [Architecture](#architecture)
- [API](#api)
- [Auteurs](#auteurs)

---

## 🎯 Aperçu

UFood est une application web qui permet aux utilisateurs de :
- Découvrir des restaurants à proximité avec système de filtres avancés
- Marquer des restaurants comme visités et noter leur expérience
- Créer et gérer des listes de favoris personnalisées
- Suivre d'autres utilisateurs et consulter leurs profils
- Visualiser les restaurants sur une carte interactive

L'application utilise **React/Preact** avec **TypeScript** pour une expérience utilisateur moderne et réactive.

---

## ✨ Fonctionnalités

### 🏠 Page d'accueil
- Liste complète des restaurants avec pagination
- Barre de recherche en temps réel (nom, adresse, cuisine)
- Filtres avancés :
  - Type de cuisine (multiples)
  - Fourchette de prix ($ à $$$$)
  - Note minimum (1 à 5 étoiles)
- Vue liste et vue carte interchangeable
- Affichage responsive sur tous les appareils

### 🍴 Page restaurant
- Informations détaillées (adresse, téléphone, horaires)
- Galerie de photos
- Position GPS et directions Google Maps
- Bouton pour ajouter à une liste de favoris
- Système de visites avec notes et commentaires
- Indicateur de visite (✓ Visited)

### 👤 Profil utilisateur
- Affichage du score utilisateur (système d'étoiles)
- Liste des restaurants visités avec pagination (10/page)
- Création et gestion de listes de favoris
- Modification et suppression de listes
- Compteurs de followers/following
- Système de follow/unfollow

### 📝 Modale de visite
- Enregistrement de visites avec :
  - Date de visite (validation : pas dans le futur)
  - Note sur 5 étoiles (obligatoire)
  - Commentaire détaillé (obligatoire)
- Validation complète des formulaires
- Mode lecture seule pour consulter les visites existantes
- Lien vers les détails du restaurant

### 🔍 Recherche et navigation
- Recherche d'utilisateurs par nom
- Navigation fluide entre les pages
- URLs propres et partageables
- Historique de navigation

---

## 🛠️ Technologies utilisées

### Frontend
- **Preact** 10.x - Alternative légère à React
- **TypeScript** - Typage statique
- **Vite** - Build tool moderne et rapide
- **React Router** - Navigation côté client

### Styling
- **CSS3** avec variables CSS
- Design responsive (mobile-first)
- Animations et transitions fluides
- Gradient et effets modernes

### State Management
- **Context API** - Gestion d'état global
  - `VisitContext` - Gestion des visites
  - `FavoritesContext` - Gestion des favoris

### API & Data
- **Fetch API** - Appels HTTP
- **REST API** - Architecture RESTful
- Gestion des tokens JWT
- LocalStorage pour la persistence

### Outils
- **React Icons** - Icônes vectorielles
- **Leaflet** (probablement) - Cartes interactives

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 16.x
- **npm** >= 8.x ou **yarn** >= 1.22.x
- Un navigateur moderne (Chrome, Firefox, Safari, Edge)

---

## 🚀 Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd ufood-frontend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```
   ou
   ```bash
   yarn install
   ```

3. **Configurer les variables d'environnement** (voir section suivante)

4. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   ```

5. **Ouvrir l'application**
   
   Naviguer vers [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
VITE_API_URL=https://api.ufood.example.com

# Optionnel : autres configurations
VITE_APP_NAME=UFood
VITE_APP_VERSION=1.0.0
```

**⚠️ Important** : 
- Ne jamais commiter le fichier `.env` (déjà dans `.gitignore`)
- L'URL de l'API doit pointer vers un serveur UFood API fonctionnel
- Toutes les variables doivent commencer par `VITE_` pour être accessibles

### Exemple de fichier `.env.example`
```env
VITE_API_URL=https://your-api-url.com
```

---

## 📜 Scripts disponibles

```bash
# Démarrer le serveur de développement
npm run dev

# Compiler pour la production
npm run build

# Prévisualiser la version de production localement
npm run preview

# Linter (si configuré)
npm run lint
```

---

## 📁 Structure du projet

```
src/
├── api/                    # Services API
│   ├── auth.ts            # Authentification (login, signup, logout)
│   ├── restaurant.ts      # Restaurants (get, getById, pagination)
│   ├── visits.ts          # Visites (CRUD operations)
│   ├── favorites.ts       # Favoris (listes CRUD)
│   ├── users.ts           # Utilisateurs (search, follow, profile)
│   └── service.ts         # Service générique
│
├── components/            # Composants réutilisables
│   ├── header/           # En-tête avec navigation et recherche
│   ├── loading/          # Indicateur de chargement
│   ├── map/              # Carte interactive (MapView + map)
│   ├── restaurantCard/   # Carte de restaurant
│   ├── restaurantCarousel/ # Carrousel de restaurants
│   ├── restaurantPageFooter/ # Pagination
│   ├── searchResult/     # Résultats de recherche utilisateurs
│   └── visitModal/       # Modale de visite
│
├── context/              # Contextes React
│   ├── FavoritesContext.tsx  # État global des favoris
│   └── VisitContext.tsx      # État global des visites
│
├── interface/            # Types TypeScript
│   └── restaurant.ts     # Interfaces Restaurant, ApiRestaurant, etc.
│
├── pages/                # Pages principales
│   ├── Home/            # Page d'accueil (liste restaurants)
│   ├── List/            # Page détail d'une liste de favoris
│   ├── Login/           # Page de connexion/inscription
│   ├── Maintenance/     # Page de maintenance
│   ├── PublicProfile/   # Profil public d'un utilisateur
│   ├── RestaurantDetails/ # Page détail d'un restaurant
│   └── User/            # Profil utilisateur connecté
│
├── app.tsx              # Composant racine
├── main.tsx             # Point d'entrée
└── users.ts             # Types utilisateur

public/                   # Assets statiques
├── favicon.ico
└── ...

```

---

## 🏗️ Architecture

### Gestion d'état avec Context API

#### VisitContext
Gère toutes les visites de l'utilisateur :
- Chargement depuis l'API avec pagination complète
- Cache local des visites
- Fonctions helper : `hasVisited()`, `getVisitByRestaurantId()`
- Rechargement automatique après modification

#### FavoritesContext
Gère les listes de favoris :
- Chargement des listes utilisateur
- CRUD sur les listes
- Synchronisation avec l'API

### Flux de données
```
API ← → Services (api/*) ← → Context ← → Components/Pages
                                    ↓
                              LocalStorage (token, userData)
```

### Séparation des responsabilités
- **API Layer** : Communication avec le backend
- **Context Layer** : État global et logique métier
- **Component Layer** : UI et interaction utilisateur
- **Page Layer** : Composition de composants

---

## 🔌 API

L'application communique avec une API REST UFood.

### Endpoints principaux

#### Authentification
- `POST /login` - Connexion
- `POST /signup` - Inscription
- `POST /logout` - Déconnexion

#### Restaurants
- `GET /restaurants` - Liste paginée
- `GET /restaurants/:id` - Détail d'un restaurant

#### Visites
- `GET /users/:userId/restaurants/visits` - Liste des visites
- `POST /users/:userId/restaurants/visits` - Créer une visite
- `PUT /users/:userId/restaurants/visits/:visitId` - Modifier
- `DELETE /users/:userId/restaurants/visits/:visitId` - Supprimer

#### Favoris
- `GET /users/:userId/favorites` - Listes de favoris
- `POST /favorites` - Créer une liste
- `PUT /favorites/:listId` - Modifier
- `DELETE /favorites/:listId` - Supprimer
- `POST /favorites/:listId/restaurants` - Ajouter restaurant
- `DELETE /favorites/:listId/restaurants/:restaurantId` - Retirer

#### Utilisateurs
- `GET /users?q=:query` - Rechercher
- `GET /users/:userId` - Profil utilisateur
- `POST /follow` - Suivre un utilisateur
- `DELETE /follow/:userId` - Ne plus suivre

### Authentification
Toutes les requêtes (sauf login/signup) nécessitent un header :
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 👥 Auteurs

- **Équipe** - Steven Deffontaine / Lucas Dangremont / Lucka Valtiani / Matthias Soual / Alexandre Chouteau

---

## 📄 Licence

Ce projet a été développé dans le cadre du cours **Développement d'applications Web (GLO3102)** à l'**Université Laval**.

---

## 🙏 Remerciements

- Équipe enseignante
- API UFood
- Communauté React/Preact

---

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : Novembre 2025

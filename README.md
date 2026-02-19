# Réservation de Salle de Réunion

Application fullstack de réservation d'une salle de réunion unique (12 places), avec authentification JWT, planning hebdomadaire et gestion des réservations.

## Stack Technique

### Backend (`/backend`)
- Node.js (v18+)
- Express.js
- MySQL 8 (requêtes SQL natives, sans ORM)
- JWT (authentification)
- bcrypt (hash mots de passe)
- CORS (`http://localhost:5173`)

### Frontend (`/frontend`)
- React + Vite
- React Router
- TailwindCSS
- Axios

---

## Fonctionnalités

### Authentification
- Inscription (`/register`)
- Connexion (`/login`)
- Déconnexion
- Routes frontend protégées via `PrivateRoute`
- Token JWT stocké côté client (`localStorage`)

### Planning
- Vue hebdomadaire (Lundi → Vendredi)
- Grille horaire (08:00 → 19:00)
- Affichage des créneaux occupés
  - Bleu : mes réservations
  - Rouge : réservations des autres utilisateurs
- Création d'une réservation depuis une case libre (modale pré-remplie)

### Profil
- Liste de mes réservations triées par date
- Modification d'une réservation
- Annulation d'une réservation avec confirmation JS

---

## Règles Métier (strictes)

Les validations sont appliquées côté backend lors de la création/modification :

- Réservations autorisées **du lundi au vendredi** uniquement
- Horaires autorisés : **08:00 à 19:00**
- Durée minimale d'un créneau : **1 heure**
- Interdiction de réserver dans le passé
- Aucun chevauchement autorisé (`debut < finDemandée AND fin > debutDemandé`)
- Modification/Suppression autorisées uniquement pour l'auteur de la réservation

---

## Structure du Projet

```text
reservation-salles/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── reservation.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   └── reservation.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── reservation.routes.js
│   ├── schema.sql
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── Header.jsx
        │   ├── Footer.jsx
        │   ├── PrivateRoute.jsx
        │   └── ReservationModal.jsx
        ├── contexts/
        │   └── AuthContext.jsx
        ├── hooks/
        │   └── useAuth.js
        ├── layouts/
        │   ├── AuthLayout.jsx
        │   └── MainLayout.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx   (vue Planning)
        │   └── Profile.jsx
        ├── services/
        │   └── api.js
        ├── App.jsx
        └── main.jsx
```

---

## Base de Données

Script SQL : `backend/schema.sql`

Tables :

- `users (id, email, password, created_at)`
- `reservations (id, titre, description, debut, fin, user_id, created_at)`

Relation :
- `reservations.user_id` → `users.id` (`ON DELETE CASCADE`)

---

## Variables d'Environnement

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=reservation_salles

JWT_SECRET=reservation_salles_dev_jwt_secret_2026
JWT_EXPIRES_IN=7d
```

> Note : l'application génère actuellement les tokens avec une expiration de 24h dans le contrôleur d'authentification.

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Lancement

## 1) Cloner le projet

```bash
git clone <url-du-repo>
cd reservation-salles
```

## 2) Installer les dépendances

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 3) Créer la base et les tables

Si la base `reservation_salles` existe déjà, exécuter quand même le script pour garantir les tables.

```bash
cd backend
mysql -u root -p reservation_salles < schema.sql
```

## 4) Démarrer les serveurs

Terminal 1 :

```bash
cd backend
npm run dev
```

Terminal 2 :

```bash
cd frontend
npm run dev
```

Accès :

- Frontend : `http://localhost:5173`
- Backend : `http://localhost:5000`

---

## Routes Frontend

- `/` : accueil
- `/login` : connexion
- `/register` : inscription
- `/planning` : planning (protégé)
- `/profile` : profil utilisateur (protégé)

---

## API Endpoints

Base URL : `http://localhost:5000/api`

### Auth

| Méthode | Endpoint | Description | Protection |
|---|---|---|---|
| POST | `/auth/register` | Inscription utilisateur | Public |
| POST | `/auth/login` | Connexion utilisateur | Public |

### Réservations

| Méthode | Endpoint | Description | Protection |
|---|---|---|---|
| GET | `/reservations` | Lister toutes les réservations | JWT |
| POST | `/reservations` | Créer une réservation | JWT |
| PUT | `/reservations/:id` | Modifier sa réservation | JWT |
| DELETE | `/reservations/:id` | Supprimer sa réservation | JWT |

Headers requis pour routes protégées :

```http
Authorization: Bearer <token>
```

---

## Scripts Disponibles

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

---

## Tests Manuels Recommandés

1. Inscription d'un nouvel utilisateur
2. Connexion avec le compte créé
3. Création d'une réservation valide (jour ouvré, 08:00-19:00, durée >= 1h)
4. Tentative de réservation dans le passé (doit échouer)
5. Tentative de réservation le week-end (doit échouer)
6. Tentative de réservation hors plage horaire (doit échouer)
7. Tentative de réservation chevauchante (doit échouer)
8. Modification de sa propre réservation
9. Suppression de sa propre réservation
10. Tentative de modification/suppression d'une réservation d'un autre utilisateur (doit échouer)

---

## Notes

- Le projet est en JavaScript ES Modules (`"type": "module"`).
- Le backend expose une route de santé : `GET /`.
- Le frontend consomme l'API via Axios avec intercepteur JWT.

# FlavorCritic — Restaurant Review Portal

FlavorCritic is a full-stack web application for discovering restaurants, reading reviews, and managing user-generated content. It supports public browsing, registered user accounts, company representative responses, and a comprehensive admin moderation panel.

The project is split into a **React** frontend and an **Express + MongoDB** backend, communicating over a REST API.

For step-by-step instructions aimed at end users, company representatives, and administrators, see **[USER_GUIDE.md](./USER_GUIDE.md)**.

---

## Features

### Public (no login required)

- Browse and search restaurants by name, cuisine, location, price range, dietary tags, and minimum rating
- View restaurant profiles: description, address, opening hours, photos, menu items, and approved reviews
- See **trending** restaurants on the homepage and a dedicated **Top Rated** page
- Search for dishes across all restaurants

### Registered users

- Register and log in with email and password (JWT authentication)
- Submit structured reviews with ratings across five categories (food quality, customer service, ambience/cleanliness, value for money, booking experience) plus an optional miscellaneous rating
- Optionally link a review to a specific menu item
- Comment on approved reviews
- Edit or delete own reviews and comments (edits return content to pending moderation)
- Report reviews or comments for abuse
- Receive in-app notifications when content is moderated
- View submission history and notification inbox in **My Account**

### Company representatives

- Users with the `company_rep` role can post official responses to reviews for their assigned restaurant
- Responses go through the same moderation workflow as user content

### Administrators

- Secure admin login (separate from user accounts)
- **Dashboard** — review volumes, moderation SLA, content counts, and audit trail
- **Restaurants** — create, update, delete; manage photo galleries (URL-based)
- **Menu items** — CRUD, availability toggles, retire items without deleting history
- **Moderation** — approve, reject, soft-remove, or escalate reviews, comments, and company responses (with reason codes)
- **Reports** — review and resolve user-submitted content reports
- **Users** — view accounts, apply strikes, flag or ban users
- **Tags & cuisines** — manage taxonomy used for filtering
- **Settings** — configure category weights, ranking thresholds, recency decay, and escalation rules
- **Admin management** — super admins can create and manage other admin accounts

---

## Tech stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, React Router 6, Axios, Create React App |
| Backend | Node.js, Express 4, Mongoose 7 |
| Database | MongoDB (Atlas or local) |
| Auth | JWT (`jsonwebtoken`), bcrypt password hashing |
| Testing | Jest, Supertest, mongodb-memory-server |

---

## Project structure

```
MSCITM_03/
├── backend/
│   ├── server.js              # Express entry point
│   ├── routes/
│   │   ├── public.js          # Public + authenticated public API
│   │   ├── user.js            # User registration, profile, submissions
│   │   └── admin.js           # Admin-only management API
│   ├── controllers/           # Request handlers
│   ├── models/                # Mongoose schemas
│   ├── middleware/            # JWT auth (user, admin, anyAuth)
│   ├── utils/                 # DB connection, scoring, moderation helpers
│   ├── test/                  # Test app factory and helpers
│   └── __tests__/             # Unit, model, controller, integration tests
├── frontend/
│   └── src/
│       ├── App.js             # Routes
│       ├── api.js             # API base URL and auth header helpers
│       └── components/        # Pages and admin/user UI
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** — a connection string (MongoDB Atlas is supported)

---

## Setup and run locally

### 1. Backend

```powershell
cd backend
npm install
```

Create `backend/.env` (this file is gitignored):

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
PORT=5002
```

Start the API server:

```powershell
npm run dev
```

On first startup with an empty database, a default super admin is created automatically:

| Email | Password |
|-------|----------|
| `admin@example.com` | `admin123` |

Global ranking settings are also seeded if missing.

### 2. Frontend

```powershell
cd frontend
npm install
npm start
```

The React dev server runs at [http://localhost:3000](http://localhost:3000).

### 3. Connect frontend to backend

The frontend reads the API URL from `frontend/src/api.js`:

```javascript
export const API_BASE = 'http://13.51.79.132:5002/api';
```

For local development, change this to point at your backend, for example:

```javascript
export const API_BASE = 'http://localhost:5002/api';
```

The backend CORS configuration in `backend/server.js` currently allows a specific deployed origin. When developing locally, update the `origin` value to include `http://localhost:3000` or your dev URL.

---

## API overview

All routes are prefixed with `/api`.

### Public routes (`/api/...`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/restaurants` | List/search restaurants (query filters supported) |
| GET | `/restaurants/top-rated` | Top-rated restaurants |
| GET | `/restaurants/trending` | Trending restaurants |
| GET | `/restaurants/:id` | Restaurant detail with menu and reviews |
| GET | `/menu-items/search` | Search dishes |
| POST | `/reviews` | Submit review (user auth) |
| POST | `/reviews/:reviewId/comments` | Submit comment (user auth) |
| POST | `/reports` | Report content (user auth) |
| POST | `/reviews/:reviewId/responses` | Company/admin response |

### User routes (`/api/user/...`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register`, `/login` | Account creation and login |
| GET | `/profile` | Current user profile |
| GET | `/my-reviews`, `/my-comments` | User's submissions |
| PUT/DELETE | `/reviews/:id`, `/comments/:id` | Edit or delete own content |
| GET | `/notifications` | Notification inbox |
| PATCH | `/notifications/:id/read` | Mark notification read |

### Admin routes (`/api/admin/...`)

All admin routes except `/login` require a Bearer token from admin login.

Covers restaurant and menu CRUD, content moderation, reports, tags, settings, user management, analytics dashboard, and admin account management. See `backend/routes/admin.js` for the full list.

---

## Frontend routes

| Path | Page |
|------|------|
| `/` | Home — search, filters, trending |
| `/search` | Search results |
| `/restaurant/:id` | Restaurant detail, reviews, comments |
| `/top-rated` | Top-rated restaurants |
| `/user/login`, `/user/register` | User authentication |
| `/user/dashboard` | My reviews, comments, notifications |
| `/admin/login` | Admin authentication |
| `/admin/dashboard` | Admin panel (tabbed interface) |

---

## Rating and ranking

Restaurant scores are computed from **approved** reviews only:

1. Each review gets a **weighted average** across rating categories. Default weights (configurable by admins): food quality 30%, customer service 20%, value 20%, ambience 15%, booking 10%, miscellaneous 5%.
2. Restaurant aggregates apply **recency weighting** — newer reviews count more (exponential decay with a configurable half-life, default 180 days).
3. A restaurant must meet a minimum review count (default 3) to appear in top-rated rankings.
4. **Trending** restaurants are those with enough recent review activity within a configurable time window.

Logic lives in `backend/utils/scoring.js`.

---

## Content moderation

Reviews, comments, and company responses follow a shared lifecycle:

`pending` → `approved` | `rejected` | `soft_removed`

- User edits reset status to `pending` for re-moderation
- Moderators can escalate flagged content and assign reason codes
- Actions are logged in `ModerationLog` and trigger user notifications via `Notification`
- Repeated reports can auto-escalate content based on global settings

---

## Running tests

Backend tests use an in-memory MongoDB instance — no Atlas connection is required.

```powershell
cd backend
npm install
npm test                  # All tests (59 tests across 11 suites)
npm run test:unit         # Unit, model, and controller tests only
npm run test:integration  # API integration tests only
npm run test:watch        # Watch mode
```

Test categories:

- **Unit** — scoring, middleware, moderation utilities
- **Models** — schema validation
- **Controllers** — handler logic with mocks
- **Integration** — full HTTP requests against the Express app

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | API port (default `5002`) |

---

## Deployment notes

The codebase includes configuration aimed at an AWS deployment (load balancer URL in CORS and a public IP in the frontend API base). When deploying to a new environment, update:

1. `backend/server.js` — CORS `origin`
2. `frontend/src/api.js` — `API_BASE`
3. `backend/.env` — production `MONGO_URI` and a strong `JWT_SECRET`

Ensure your MongoDB Atlas cluster allows connections from the deployment server's IP (Network Access whitelist).

---

## License

Academic / project use — MSCITM module submission.

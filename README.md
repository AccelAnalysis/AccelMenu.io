# AccelMenu Signage

Monorepo containing a Vite-based React frontend and an Express + Prisma backend. Root-level npm scripts orchestrate both workspaces for local development, CI, and deployment.

## Structure
- `frontend/`: React SPA entrypoint using `App.jsx`. Tailwind-style class names remain in JSX; bring your own CSS or Tailwind pipeline as needed.
- `server/`: Express API with Prisma/SQLite persistence. Routes cover slides, screens, playlist ordering, and import/export flows.

### Workspace scripts (run from the repo root)
- `npm run dev` – start the frontend (Vite dev server).
- `npm run build` – build the frontend for production.
- `npm run dev:server` – start the backend with Nodemon/TypeScript.
- `npm run start:server` – run the compiled backend.
- `npm run lint` – lint frontend and backend sources.
- `npm run test` – run backend Vitest suite.
- `npm run prisma:generate` – generate the Prisma client inside `server/`.

## Environment
Backend configuration lives in `server/.env` (copy from `server/.env.example`):

- `PORT` – backend port (default: `4000`).
- `API_KEY` – required in the `x-api-key` header for non-GET requests.
- `FRONTEND_ORIGIN` – comma-separated list of allowed origins for CORS (e.g., `http://localhost:5173`).
- `DATABASE_URL` – SQLite connection string (e.g., `file:./dev.db`).

Frontend API base URL can be set with `VITE_API_BASE` (defaults to `/api`).

## Local setup
Package installation from npm may require registry access.

1) Install dependencies: `npm install` (from the repo root to install both workspaces).
2) Create backend env: `cp server/.env.example server/.env` and update values as needed.
3) Apply database schema: `cd server && npx prisma migrate dev` (or `npx prisma db push` for rapid prototyping).
4) Seed data (optional): `npx prisma db seed`.
5) Start backend: `npm run dev:server`.
6) Start frontend: `npm run dev` (uses Vite).

## Production build & serve
1) Build frontend assets: `npm run build` (outputs to `frontend/dist`).
2) Compile backend: `cd server && npm run build`.
3) Launch backend: `npm run start:server` (ensure `DATABASE_URL`, `API_KEY`, and `FRONTEND_ORIGIN` are set).
4) Configure your reverse proxy to serve `frontend/dist` (static) and proxy `/api` to the backend.

## Deployment
### Frontend (static)
- **GitHub Pages**: Build with `npm run build`, push `frontend/dist` via a Pages workflow (see example below). Set `VITE_API_BASE` to your backend URL.
- **Vercel/Netlify**: Set build command to `npm run build --workspace frontend` and publish directory to `frontend/dist`. Configure `VITE_API_BASE` in environment variables.

### Backend
- **Render/Fly.io/Heroku-like**: Deploy the `server/` workspace with `npm install`, `npm run build --workspace server`, and `npm run start:server`. Set `DATABASE_URL`, `API_KEY`, `FRONTEND_ORIGIN`, and any provider-specific variables.
- **Small VM**: Install Node.js and SQLite, clone the repo, run `npm install`, `npm run build --workspace server`, then `npm run start:server` under a process manager (pm2/systemd). Point `FRONTEND_ORIGIN` to your deployed frontend URL.

### Database migrations
Run `npx prisma migrate deploy` during deployments after setting `DATABASE_URL`. For prototyping SQLite setups, `npx prisma db push` is acceptable.

### GitHub Pages workflow example
```yaml
name: Deploy Frontend to Pages
on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm install
      - run: npm run build --workspace frontend
      - uses: actions/upload-pages-artifact@v3
        with:
          path: frontend/dist
      - uses: actions/deploy-pages@v4
```

## Continuous Integration
GitHub Actions (`.github/workflows/ci.yml`) runs linting, backend tests, Prisma client generation, and frontend builds with npm caching.

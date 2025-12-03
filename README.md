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

## Data migration
Use this section to move data from the legacy signage app into the new API and to keep a safety copy of your current content.

### Prerequisites
- Backend `.env` contains `API_KEY`, `DATABASE_URL`, `FRONTEND_ORIGIN`, and (optionally) a non-default `PORT`. Mutating routes require the `x-api-key` header to match `API_KEY`; reads (including `/api/export`) do not.【F:server/src/middleware/auth.ts†L1-L28】【F:server/src/app.ts†L1-L25】
- Frontend imports in the browser respect `VITE_API_BASE_URL` (defaults to same origin) and `VITE_API_KEY` for authenticated calls if set.【F:frontend/src/services/apiClient.js†L1-L37】
- API endpoints:
  - `POST /api/import` for new-format bundles (overwrites existing data).
  - `POST /api/import/legacy` for legacy exports (deduplicates by IDs and playlist positions).
  - `GET /api/export` for backups of the current database state.【F:server/src/routes/importExport.ts†L42-L116】【F:server/src/routes/importExport.ts†L121-L194】【F:server/src/routes/importExport.ts†L196-L276】

### Obtaining legacy JSON exports
- From the legacy system, export slides/screens/playlists as JSON. The importer expects arrays named `slides`, `screens`, and either `playlists` or `playlistEntries`. Typical fields include `title`/`name`, `duration` (ms), `mediaUrl`, `location`, and `slides` attached to screens or playlists.【F:server/src/lib/legacyImport.ts†L5-L214】
- Save the export as `legacy-export.json`. Keep files under 5MB so the UI upload validator accepts them.【F:frontend/src/components/ImportLegacySection.jsx†L31-L55】

### Running imports
**UI flow (Dashboard → Import legacy data)**
1. Start the backend (`npm run dev:server`) and frontend (`npm run dev`). Sign in to the dashboard.
2. In the Dashboard import card, choose your `legacy-export.json` and click **Import legacy data**. Success and error toasts appear in-page, and import warnings surface in the browser console if present.【F:frontend/src/views/Dashboard.jsx†L135-L203】【F:frontend/src/components/ImportLegacySection.jsx†L1-L68】

**CLI/API examples**
- New-format import (replaces all data):
  ```bash
  curl -X POST "$API_BASE/api/import" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{"slides":[{"title":"Promo","content":{},"duration":12000}],"screens":[{"name":"Lobby"}],"playlistEntries":[{"screenId":"<screen-id>","slideId":"<slide-id>","position":0}]}'
  ```
- Legacy import (adds missing items, skips duplicates):
  ```bash
  curl -X POST "$API_BASE/api/import/legacy" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    --data-binary @legacy-export.json
  ```

### Backing up or exporting current data
- Request a live export and redirect it to disk:
  ```bash
  curl "$API_BASE/api/export" -H "x-api-key: $API_KEY" -o backup.json
  ```
- The response includes `slides`, `screens`, and `playlistEntries` with timestamps so you can restore via `POST /api/import` later.【F:server/src/routes/importExport.ts†L42-L116】

### Troubleshooting
- **Validation failures**: `400` responses include `message: "Validation failed"` with field-level errors when payloads are missing required keys or types.【F:server/src/middleware/errorHandler.ts†L1-L26】
- **Duplicate handling**: Legacy imports skip records that match existing IDs or playlist positions and return counts plus `warnings` describing skipped items; duplicates in new-format imports are overwritten because the route truncates tables before inserting fresh data.【F:server/src/routes/importExport.ts†L121-L194】【F:server/src/routes/importExport.ts†L196-L276】
- **Logs**: HTTP access logs stream to stdout via Morgan, and legacy import warnings/summaries are emitted with `console.warn` / `console.info` in the server logs. Check your process output or hosting provider’s log console when debugging imports.【F:server/src/app.ts†L1-L25】【F:server/src/routes/importExport.ts†L196-L276】

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

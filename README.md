# AccelMenu Signage

This repository now separates the single-file React prototype into a frontend (Vite-based React) and a backend API powered by SQLite. The backend seeds data that matches the demo content previously baked into the JSX file.

## Structure
- `frontend/`: React SPA entrypoint using `App.jsx` (migrated from the original single file). Tailwind-style class names are preserved in JSX; add Tailwind or custom CSS as needed.
- `server/`: Express API with SQLite persistence (via `better-sqlite3`). Tables cover slides, screens, and playlist ordering and seed from `seedData.js` on first run.

### Frontend organization
- `src/context/`: React context for global signage data (locations, slides, selected view) to reduce prop drilling.
- `src/views/`: Screen-level pages (`Dashboard`, `SlideEditor`, `DisplayPlayer`) that own their respective workflows.
- `src/components/`: Reusable UI elements such as slide cards and renderable slide elements shared between editor/player.
- `src/hooks/`: Custom hooks like `useSlideRotation` that encapsulate timer/rotation behavior.
- `src/services/`: API/client utilities and helpers (e.g., ID generation placeholder).
- `src/styles/`: Global CSS entry that keeps Tailwind-compatible imports intact.

## Running locally
Package installation from npm may require network access. If available:

### Backend setup (Express + Prisma)
1) `cd server`
2) Copy `.env.example` to `.env` and fill in values for `DATABASE_URL`, `API_KEY`, and `PORT` (see comments in the example file).
3) `npm install`
4) `npx prisma migrate dev` to apply schema migrations to your local database.
5) `npx prisma db seed` to populate sample slides and playlists.
6) `npm run dev` to start the API server in watch mode.

The API reads `PORT` (default `4000`) from the environment. Send the configured `API_KEY` in an `x-api-key` header for all non-GET requests (POST, PUT, PATCH, DELETE). GET routes remain public for read-only access.

### Frontend setup (Vite React)
1) `cd frontend`
2) `npm install`
3) `npm run dev`

When running the frontend alongside the backend, point requests to the API with either `REACT_APP_API_BASE=http://localhost:4000` (for CRA-style tooling) or `VITE_API_BASE=http://localhost:4000` (for Vite). Update the port if you override `PORT` on the server.

## Testing
Each workspace includes simple commands:

```bash
cd frontend && npm run build   # builds the SPA
cd server && npm test          # runs sqlite seed smoke tests
```

If the environment blocks npm registry access, these commands will fail to install dependencies; see troubleshooting in your runtime.

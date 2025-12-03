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

```bash
cd frontend && npm install && npm run dev
cd ../server && npm install && npm run start
```

The API listens on port `3001`. Point the React app to the API endpoints to persist slides and screen playlists.

## Testing
Each workspace includes simple commands:

```bash
cd frontend && npm run build   # builds the SPA
cd server && npm test          # runs sqlite seed smoke tests
```

If the environment blocks npm registry access, these commands will fail to install dependencies; see troubleshooting in your runtime.

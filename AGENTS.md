# Repository Guidelines

## Project Structure & Module Organization
- Frontend (Vite + React + TS): `src/`
  - Components: `src/components/**` (e.g., `src/components/Map/LeafletMap.tsx`)
  - Pages: `src/pages/**` (e.g., `src/pages/MapPage.tsx`)
  - Navigation: `src/navigation/routes.tsx`
  - Utilities/Services: `src/utils/**` (e.g., `poiService.ts`, `userUtils.ts`)
  - Hooks/Helpers: `src/hooks/**`, `src/helpers/**`
- Public assets: `public/`
- Backend (Node/Express + Supabase): `backend/` (API, `src/index.js`, `database/schema.sql`)
- Docs: `docs/`; Builds: `dist/`

## Build, Test, and Development Commands
- Frontend dev (HTTP): `npm run dev`
- Frontend dev (HTTPS): `npm run dev:https` (uses mkcert)
- Frontend build: `npm run build`
- Frontend preview: `npm run preview`
- Lint check/fix: `npm run lint` / `npm run lint:fix`
- Backend dev: `cd backend && npm install && npm run dev`
- Backend start: `cd backend && npm run start`
- Docker (full stack): `docker compose up --build`
- Deploy to GitHub Pages: `npm run deploy` (builds to `dist/` then publishes)

## Coding Style & Naming Conventions
- Language: TypeScript (frontend), modern JS (backend).
- Indentation: 2 spaces; prefer functional React components.
- Naming: Components in PascalCase (`LocationSearch.tsx`), hooks `useX.ts`, utilities in camelCase (`userUtils.ts`).
- Linting: ESLint with `@typescript-eslint` and React plugins (`eslint.config.js`). Fix issues before PRs.
- Styling: Tailwind CSS; keep utility classes readable and co-locate minor styles near components.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Place tests alongside sources as `*.test.ts(x)` and target critical utilities and component logic.
- Aim for meaningful coverage of services (e.g., `src/utils/poiService.ts`).

## Commit & Pull Request Guidelines
- Current history mixes styles (e.g., "fix:", plain sentences). Adopt Conventional Commits going forward: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- PRs should include: scope/intent, linked issues, setup notes (.env changes), screenshots for UI, and test plan or manual steps.

## Security & Configuration Tips
- Never commit secrets. Use `.env`/`.env.example` (root and `backend/`).
- For Telegram/Supabase keys, prefer runtime env injection; avoid hardcoding.
- Use `npm run dev:https` for Mini App testing that requires HTTPS.

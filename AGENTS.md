# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` Vite + React mini app; UI lives in `src/components`, `pages`, `hooks`, and `utils`.
- `backend/` Express bot API; entry `src/index.js`, shared clients in `lib/`, SQL schema under `database/`.
- `docs/` stores API and deployment references expected during reviews.
- `docker/` orchestrates the local stack; `.github/` maintains workflows and issue templates.

## Build, Test, and Development Commands
- `docker compose up --build` (repo root) boots Postgres, backend, frontend, and Nginx with hot reload.
- `cd frontend && npm install && npm run dev:https` launches the HTTPS dev server; fall back to `npm run dev` only for plain HTTP debugging.
- `cd frontend && npm run build && npm run preview` audits production bundles before deploys (including Vercel).
- `cd frontend && npm run lint` or `lint:fix` enforces TypeScript/React/Tailwind rules; `cd backend && npm install && npm run dev` runs the webhook API (`npm run start` for production).

## Coding Style & Naming Conventions
- TypeScript + ES modules throughout; keep indentation at two spaces.
- React components and providers use PascalCase filenames; hooks and utilities stay camelCase with named exports.
- Compose UI with Tailwind classes beside the owning component; limit global overrides to `frontend/src/index.css` and run ESLint before committing.

## Testing Guidelines
- Automated tests are not configured yet, so linting and manual verification are mandatory.
- After backend changes, hit `curl http://localhost:3000/health` and exercise routes documented in `docs/API.md`.
- For frontend work, test flows in the Telegram WebView and the desktop mock (`npm run dev`), noting device quirks in the pull request; co-locate future `.test.ts(x)` files with the module they cover.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `docs:`) with focused scopes.
- Summarise changes, link issues, and attach screenshots or recordings for UI updates.
- Record manual checks (lint, backend health, core map flows) in the PR template so reviewers can reproduce them.
- Update README or docs when behaviour or configuration shifts, and keep secrets confined to `.env` files.

## Security & Configuration Tips
- Copy `.env.example` in both `frontend/` and `backend/` before running the stack; never commit real tokens or Supabase keys.
- Rotate Supabase credentials and Telegram webhook URLs if exposed, and avoid logging them.
- Consult `docs/DEPLOYMENT.md` before changing Docker or Vercel settings so environments stay aligned.

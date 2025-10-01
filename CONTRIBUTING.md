# Contributing

Thanks for helping improve the OpenFreeMap Telegram Mini App! This guide explains how to get a local environment running, how we review changes, and where to start if you are new to the project.

## Local Development Options

We support two main workflows. Pick the one that matches the tools you already have.

### Option A – Docker-backed local Supabase
1. Install Docker Desktop (or Docker Engine) and Docker Compose.
2. From the repo root copy the backend environment template: `cp backend/.env.example backend/.env`.
   - You only *must* set `BOT_TOKEN` (a Telegram bot token) and `FRONTEND_URL` (usually `https://<your-ngrok-or-localtunnel>` for Mini App testing).
   - When you just want to exercise the HTTP API, you can set `BOT_TOKEN=000000:dev-placeholder` and ignore bot errors; the REST endpoints will still work.
3. Start the database and PostgREST proxy:
   ```bash
   docker compose up --build
   ```
   This launches Postgres + PostgREST + an Nginx proxy on `http://localhost:8000/rest/v1`.
4. In another terminal install dependencies and run the backend against the Docker stack:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   The backend automatically falls back to `LOCAL_SUPABASE_URL=http://localhost:8000` when hosted Supabase credentials are missing.
5. In a third terminal install and start the frontend:
   ```bash
   npm install
   npm run dev:https
   ```
   The HTTPS dev server is required for Telegram Mini App testing. Use `npm run dev` if you only need a local browser preview.

### Option B – Hosted Supabase + Node
1. Create a Supabase project and obtain your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
2. Run the schema found at `backend/database/schema.sql` in the Supabase SQL editor.
3. Configure backend environment variables (`backend/.env`):
   ```env
   BOT_TOKEN=your_telegram_bot_token
   FRONTEND_URL=https://your-miniapp-host
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_public_key
   ```
4. Start the backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
5. Start the frontend in the project root:
   ```bash
   npm install
   npm run dev:https
   ```
6. (Optional) If you need an HTTP dev server use `npm run dev`. For production builds run `npm run build` followed by `npm run preview`.

### Shared Tips
- The frontend loads configuration from environment variables exposed via Vite. Consult `README.md` for additional flags.
- Tailwind classes are co-located with components. Prefer composing utility classes rather than adding new global CSS.
- When developing UI flows without Telegram, open `https://localhost:5173` directly in your browser and use the mocked data utilities.

## Development Workflow
- Fork the repository or create a feature branch.
- Keep commits small and descriptive; we follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat: add poi clustering`).
- Run `npm run lint` from the project root before opening a pull request. Please fix any reported issues (`npm run lint:fix`).
- If you touch backend code, run the backend locally and exercise the `/health` endpoint to ensure there are no runtime errors.
- Update documentation (README, docs, or this file) when behaviour or setup changes.
- Include screenshots or recordings for UI changes in your pull request description.

## Pull Request Checklist
- [ ] Feature branch or fork created
- [ ] Linting passes (`npm run lint`)
- [ ] Relevant documentation updated
- [ ] Manual verification notes provided (backend endpoints tested, UI flows exercised)
- [ ] For bot changes: describe how you validated Telegram interactions

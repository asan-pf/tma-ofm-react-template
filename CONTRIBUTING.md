# Contributing

Thanks for helping improve the OpenFreeMap Telegram Mini App! This guide explains how to get a local environment running, how we review changes, and where to start if you are new to the project.

## Local Development Options

We support two main workflows. Pick the one that matches the tools you already have.

### Option A – Docker-based Local Development (Recommended)

This setup runs the entire stack (Frontend, Backend, Database, PostgREST) locally using Docker.

1. **Install Prerequisites:**
   - Docker Desktop (or Docker Engine + Docker Compose)
   - ngrok (sign up at https://ngrok.com and configure your authtoken)
   - Get a Telegram Bot Token from [@BotFather](https://t.me/BotFather)

2. **Start ngrok:**
   Start ngrok to expose your local frontend (port 80) via HTTPS. This is required for Telegram Mini Apps.
   ```bash
   ngrok http 80
   ```
   Copy the HTTPS URL (e.g., `https://abc1234.ngrok-free.app`).
   
   > **Tip:** If you have a static domain, use:
   > ```bash
   > ngrok http --domain=your-domain.ngrok-free.app 80
   > ```

3. **Configure Environment:**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env`:
   - Set `BOT_TOKEN` to your Telegram Bot Token.
   - Set `FRONTEND_URL` to the ngrok URL you copied in step 2.

4. **Start Docker Services:**
   ```bash
   docker compose up -d --build
   ```
   This starts:
   - Frontend (Nginx) on port 80
   - Backend (Node.js) on port 3000
   - PostgreSQL (5432)
   - PostgREST (8000)

5. **Test your setup:**
   - Open your Telegram bot and send `/start`.
   - Click "Open Map". It should load the Mini App via the ngrok URL.
   - The Mini App will communicate with the backend via the same ngrok URL (proxied by Nginx).
   - View logs: `docker compose logs -f`

### Option B – Hosted Supabase + Node

If you prefer not to use Docker:

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
- Unsure about scope? [Open an issue](https://github.com/Telegram-Mini-Apps/tma-ofm-react-template/issues) so we can help refine the work before you code.
- Keep commits small and descriptive; we follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat: add poi clustering`).
- Run `npm run lint` from the project root before opening a pull request. Please fix any reported issues (`npm run lint:fix`).
- If you touch backend code, run the backend locally and exercise the `/health` endpoint to ensure there are no runtime errors.
- Update documentation (README, docs, or this file) when behaviour or setup changes.
- Include screenshots or recordings for UI changes in your pull request description.

## License
Contributions are released under the project MIT License (`LICENSE`). By submitting a pull request you confirm you have the right to license your code under these terms.

## Pull Request Checklist
- [ ] Feature branch or fork created
- [ ] Linting passes (`npm run lint`)
- [ ] Relevant documentation updated
- [ ] Manual verification notes provided (backend endpoints tested, UI flows exercised)
- [ ] For bot changes: describe how you validated Telegram interactions

## Contact us
If you want to contribute to this project as a QA manager or have questions you are welcome to contact us, my telegram nickname: `@AcademMisfit`
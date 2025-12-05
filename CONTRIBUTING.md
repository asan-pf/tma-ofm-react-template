# Contributing

Thanks for helping improve the OpenFreeMap Telegram Mini App! This guide explains how to get a local environment running, how we review changes, and where to start if you are new to the project.

## Local Development Options

We support two main workflows. Pick the one that matches the tools you already have.

### Option A – Docker + Ngrok + JWT (Recommended)

This is the easiest way to run the full stack (Frontend, Backend, Database, PostgREST, Ngrok) locally.

1.  **Prerequisites**:
    *   Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
    *   Create an account on [Ngrok](https://ngrok.com/) and get your Authtoken.

2.  **Setup Environment**:
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Create a `frontend/.env` file:
        ```bash
        echo "VITE_BACKEND_URL=https://your-ngrok-domain.ngrok-free.dev" > frontend/.env
        ```

3.  **Generate JWT Token**:
    You need a secure JWT token for `SUPABASE_ANON_KEY`. Run this command in your terminal (Node.js required) to generate one:
    ```bash
    node -e "const crypto = require('crypto'); const secret = 'super-secret-jwt-token-for-local-dev-at-least-32-chars'; const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64url'); const payload = Buffer.from(JSON.stringify({role: 'anon', iss: 'supabase', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 3600*24*365})).toString('base64url'); const signature = crypto.createHmac('sha256', secret).update(header + '.' + payload).digest('base64url'); console.log(header + '.' + payload + '.' + signature);"
    ```
    *Copy the output token.*

4.  **Configure `.env`**:
    Open `.env` and fill in the following:
    *   `SUPABASE_ANON_KEY`: Paste the JWT token you just generated.
    *   `BOT_TOKEN`: Your Telegram Bot Token (from @BotFather).
    *   `NGROK_AUTH_TOKEN`: Your Ngrok Authtoken.
    *   `FRONTEND_URL`: Your Ngrok domain (e.g., `https://your-domain.ngrok-free.dev`).

5.  **Run the App**:
    Start all services:
    ```bash
    docker-compose up --build
    ```

6.  **Access**:
    *   **Frontend**: Open your Ngrok URL (e.g., `https://your-domain.ngrok-free.dev`).
    *   **Backend API**: Accessible at `https://your-domain.ngrok-free.dev/api/`.
    *   **Telegram**: Use the Ngrok URL to configure your Bot's Web App or Webhook.

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
# Telegram - OpenFreeMap template

A **Telegram Mini App** - **OpenFreeMap** integration. Share your favorite locations with friends, discover new places ! 🗺️ ✈️ 🍜

## Learn more about

- [TelegramMiniApps](https://github.com/Telegram-Mini-Apps)
- [OpenStreetMap](https://www.openstreetmap.org)
- [OpenFreeMap](https://openfreemap.org)

## Features

- Interactive fullscreen map interface
- Location discovery and management
- User favorites system  
- Profile management
- Real-time location services

## Tech Stack

**Frontend:**
- React with TypeScript
- Leaflet for maps
- Telegram UI components
- Tailwind CSS
- Vite build system

**Backend:**
- Node.js API
- Supabase PostgreSQL
- Telegram Bot integration

## Local Database via Docker (no Supabase required)

If `SUPABASE_URL` and `SUPABASE_ANON_KEY` are not provided, the backend can talk to a local Postgres through PostgREST that mimics the Supabase REST endpoint.

Quick start:

- From the repo root: `docker compose up --build`
- This launches Postgres + PostgREST + a tiny proxy on `http://localhost:8000/rest/v1`.
- The backend auto-falls back to `LOCAL_SUPABASE_URL=http://localhost:8000` with a dev key.
- First-run initializes tables from `backend/database/schema.sql`.

To force local mode, or customize:

```env
# backend/.env
LOCAL_SUPABASE_URL=http://localhost:8000
LOCAL_SUPABASE_ANON_KEY=dev-local-noauth
```

## Quick Start

### Prerequisites
- Node.js 18+
- Telegram Bot Token
- Supabase account

### Frontend Setup

```bash
npm install
npm run dev:https
```

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables (use hosted Supabase or rely on Docker local DB)
npm run dev
```

### Environment Variables

Create `.env` in `backend/`:

```env
BOT_TOKEN=your_telegram_bot_token
FRONTEND_URL=https://your-frontend-url
BACKEND_URL=https://your-backend-url
# Hosted Supabase (preferred when available)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_key

# Local fallback (used automatically when SUPABASE_* are not set)
LOCAL_SUPABASE_URL=http://localhost:8000
LOCAL_SUPABASE_ANON_KEY=dev-local-noauth
```

### Database Schema

- Hosted Supabase: Run the SQL schema in `backend/database/schema.sql` in your Supabase project.
- Local Docker: The schema is applied automatically on first run.

## Deployment

**Frontend:** Deploy to Vercel, Netlify, or GitHub Pages  
**Backend:** Deploy to Railway, Heroku, or Vercel

## Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

[MIT License](https://opensource.org/licenses/MIT)

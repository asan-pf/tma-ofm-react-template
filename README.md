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

## 🚀 Local Development Setup

**New contributors**: We've created an automated setup process! See the **[Local Development Guide](docs/LOCAL_DEVELOPMENT.md)** for detailed instructions.

### Quick Start (Automated)

**Windows (PowerShell):**
```powershell
.\start-dev.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

This will automatically:
- ✅ Start Docker Compose (PostgreSQL + Backend)
- ✅ Start ngrok tunnel
- ✅ Update Telegram webhook
- ✅ Display all service URLs

### Prerequisites
- Docker Desktop
- ngrok (with authtoken configured)
- Telegram Bot Token
- Frontend deployed to Vercel (optional for backend testing)

For detailed setup instructions, troubleshooting, and manual setup options, see **[docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)**.

## Alternative: Hosted Setup

If you prefer not to use Docker locally:

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
# Configure environment variables with hosted Supabase
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

## Add Locations via API

1. Start the backend (`npm run dev` or `docker compose up`).
2. Create a place with:
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cafe 58",
    "description": "Sunny patio",
    "latitude": 40.715,
    "longitude": -74.0,
    "category": "restaurant-bar",
    "userId": 1
  }'
```
3. Verify with `GET http://localhost:3000/api/locations`.

## License

[MIT License](https://opensource.org/licenses/MIT)

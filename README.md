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
# Configure environment variables
npm run dev
```

### Environment Variables

Create `.env` in `bot-backend/`:

```env
BOT_TOKEN=your_telegram_bot_token
FRONTEND_URL=https://your-frontend-url
BACKEND_URL=https://your-backend-url
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_key
```

### Database Schema

Run the SQL schema in `bot-backend/database/schema.sql` in your Supabase project.

## Deployment

**Frontend:** Deploy to Vercel, Netlify, or GitHub Pages  
**Backend:** Deploy to Railway, Heroku, or Vercel

## Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

[MIT License](https://opensource.org/licenses/MIT)

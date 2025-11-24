# Local Development Setup Guide

This guide will help you set up the backend for local development using Docker Compose and ngrok.

## Overview

The setup consists of:
- **PostgreSQL Database** - Running in Docker
- **PostgREST API** - Provides REST API to PostgreSQL (mimics Supabase)
- **Backend (Node.js)** - Express server with Telegram bot
- **ngrok** - Tunnels localhost to public HTTPS URL for Telegram webhook

## Prerequisites

Before you begin, make sure you have:

1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download: https://www.docker.com/products/docker-desktop
   - Verify: `docker --version` and `docker compose version`

2. **ngrok** - For exposing localhost to the internet
   - Download: https://ngrok.com/download
   - Sign up for free account: https://dashboard.ngrok.com/signup
   - Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
   - Configure: `ngrok config add-authtoken YOUR_AUTHTOKEN`

3. **Telegram Bot Token**
   - Talk to [@BotFather](https://t.me/BotFather) on Telegram
   - Create a new bot with `/newbot`
   - Save the bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

4. **Frontend Deployed** (optional for now)
   - Deploy the `frontend` folder to Vercel or another platform
   - Get the public URL (e.g., `https://your-app.vercel.app`)

## Quick Start

### Option 1: Automated Setup (Recommended)

We provide scripts that automate the entire process:

#### Windows (PowerShell)
```powershell
# Make sure you're in the project root directory
.\start-dev.ps1
```

#### Linux/Mac (Bash)
```bash
# Make the script executable
chmod +x start-dev.sh

# Run the script
./start-dev.sh
```

The script will:
1. ✅ Check all prerequisites
2. ✅ Load environment variables from `backend/.env`
3. ✅ Start Docker Compose (database + backend)
4. ✅ Wait for services to be healthy
5. ✅ Start ngrok tunnel
6. ✅ Update Telegram webhook automatically

### Option 2: Manual Setup

If you prefer to run commands manually:

#### Step 1: Configure Environment Variables

```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit backend/.env with your credentials
# Required:
#   BOT_TOKEN=your_telegram_bot_token
#   FRONTEND_URL=https://your-frontend.vercel.app
```

#### Step 2: Start Docker Services

```bash
# From the project root directory
docker compose up -d --build
```

This will start:
- PostgreSQL on `localhost:5432`
- PostgREST on `localhost:8000`
- Backend API on `localhost:3000`

#### Step 3: Verify Services are Running

```bash
# Check if all containers are healthy
docker ps

# Test the health endpoint
curl http://localhost:3000/health
# Should return: {"status":"OK","timestamp":"..."}
```

#### Step 4: Start ngrok

```bash
# In a new terminal window
ngrok http 3000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`).

#### Step 5: Update Telegram Webhook

Replace `YOUR_BOT_TOKEN` and `YOUR_NGROK_URL` with your actual values:

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"YOUR_NGROK_URL/webhook"}'
```

Example:
```bash
curl -X POST "https://api.telegram.org/bot123456789:ABCdefGHI/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://abc123.ngrok.io/webhook"}'
```

## Testing the Setup

### 1. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"OK","timestamp":"2024-01-01T12:00:00.000Z"}
```

### 2. Test Database Connection

```bash
# Get all locations
curl http://localhost:3000/api/locations
```

### 3. Test Adding a Location

```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Cafe",
    "description": "A nice place",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "category": "restaurant-bar",
    "type": "permanent"
  }'
```

### 4. Test Telegram Bot

1. Open Telegram and find your bot
2. Send `/start` command
3. You should see the welcome message with buttons

## Useful Commands

### Docker Commands

```bash
# View logs from all services
docker compose logs -f

# View logs from specific service
docker compose logs -f backend

# Restart a service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove all data (including database)
docker compose down -v

# Rebuild and restart
docker compose up -d --build
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it ofm_db psql -U postgres -d ofm

# Inside psql:
\dt              # List tables
\d users         # Describe users table
SELECT * FROM users;
\q               # Quit
```

### ngrok Commands

```bash
# Start ngrok
ngrok http 3000

# View ngrok dashboard (while ngrok is running)
# Open in browser: http://localhost:4040

# Get current ngrok URL via API
curl http://localhost:4040/api/tunnels
```

## Troubleshooting

### Services won't start

```bash
# Check if ports are already in use
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Linux/Mac:
lsof -i :3000
lsof -i :5432

# Stop any conflicting services or change ports in docker-compose.yml
```

### Backend can't connect to database

```bash
# Check if database is healthy
docker inspect ofm_db --format='{{.State.Health.Status}}'

# View database logs
docker compose logs db

# Try restarting the database
docker compose restart db
```

### ngrok URL changes every time

This is expected with the free ngrok plan. Each time you restart ngrok, you get a new URL. You'll need to:
1. Update `BACKEND_URL` in `backend/.env`
2. Update the Telegram webhook

**Solution**: Use the automated scripts (`start-dev.ps1` or `start-dev.sh`) which handle this automatically.

### Telegram webhook not working

```bash
# Check current webhook status
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"

# Delete webhook
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/deleteWebhook"

# Set webhook again
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"YOUR_NGROK_URL/webhook"}'
```

### Database schema not initialized

```bash
# Stop everything
docker compose down -v

# Start fresh (this will reinitialize the database)
docker compose up -d --build
```

## Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `BOT_TOKEN` | Telegram bot token from BotFather | `123456:ABC-DEF...` | ✅ Yes |
| `FRONTEND_URL` | Public URL of deployed frontend | `https://app.vercel.app` | ✅ Yes |
| `BACKEND_URL` | Public URL of backend (ngrok) | `https://abc.ngrok.io` | ⚠️ Auto-set |
| `POSTGRES_USER` | PostgreSQL username | `postgres` | ⚠️ Default: postgres |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` | ⚠️ Default: postgres |
| `POSTGRES_DB` | PostgreSQL database name | `ofm` | ⚠️ Default: ofm |
| `SUPABASE_URL` | Hosted Supabase URL (optional) | `https://xxx.supabase.co` | ❌ No |
| `SUPABASE_ANON_KEY` | Hosted Supabase key (optional) | `eyJ...` | ❌ No |

## Architecture

```
┌─────────────────┐
│   Telegram      │
│   (webhook)     │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│     ngrok       │  (Public HTTPS tunnel)
│  abc.ngrok.io   │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Backend API   │  (Node.js + Express + Telegraf)
│  localhost:3000 │  (Running in Docker)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgREST     │  (REST API to PostgreSQL)
│  localhost:8000 │  (Running in Docker)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │  (Database)
│  localhost:5432 │  (Running in Docker)
└─────────────────┘
```

## Next Steps

After you have the backend running locally:

1. **Deploy Frontend to Vercel**
   - See `docs/DEPLOYMENT.md` for instructions
   - Update `FRONTEND_URL` in `backend/.env`

2. **Test the Full Flow**
   - Open your Telegram bot
   - Click "Open Map" button
   - Verify the frontend loads
   - Test adding locations

3. **Make Changes**
   - Backend code changes will auto-reload (hot-reload enabled)
   - Database schema changes: edit `backend/database/schema.sql` and restart

4. **Prepare for Production**
   - Deploy backend to Railway or similar
   - Use hosted Supabase or managed PostgreSQL
   - Update webhook to production URL

## Contributing

When you're ready to contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test locally using this setup
5. Commit: `git commit -m "feat: your feature"`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

See `CONTRIBUTING.md` for more details.

## Support

If you run into issues:
- Check the [Troubleshooting](#troubleshooting) section
- Review logs: `docker compose logs -f`
- Open an issue on GitHub
- Contact: [@AcademMisfit](https://t.me/AcademMisfit) on Telegram

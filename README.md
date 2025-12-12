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
- [Telegram UI components](https://github.com/telegram-mini-apps-dev/TelegramUI)
- Vite - React - Express.js
- Supabase PostgreSQL

## Local setup via Docker

1. Install Docker and [Docker Compose](https://docs.docker.com/compose/)
2. Install [Ngrok](https://ngrok.com/)
3. Create [Supabase](https://supabase.com/) account and project
- in the project go to SQL Editor paste the content of `backend/database/schema.sql` and tap 'Run' button; it will create needed tables
4. Set up telegram bot with `@BotFather`
5. Start ngrok at port 8000 
```bash
ngrok http 8000
```
5. Set environment variables
```env
   # backend/.env
   BOT_TOKEN=your_telegram_bot_token
   FRONTEND_URL=https://xxx.ngrok-free.app
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_public_key
   ```
  and in frontend folder:
```env
  VITE_BACKEND_URL=https://xxx.ngrok-free.app
```
6. Launch docker compose with command:
```bash
docker compose up --build
```
7. Set url provided by ngrok as your telegram bot button URL using `@BotFather`   

## Automated docker setup with bash script 
Before running script for a first time you will need to:
1. set `BOT_TOKEN` in the `backend/.env` file (take your telegram bot token using `@BotFather`)
2. make sure you have installed Ngrok and **jq** (utility to read json files)
3. build docker compose images with `docker compose build` command
To run script execute following commands in the CLI: 
`chmod +x ./start-tma.sh`
`./start-tma.sh`
The script does following: 
1. reads `BOT_TOKEN` from `backend/.env` file
2. starts Ngrok at port 8000
3. gets Ngrok url using `jq` utility
4. calls telegram API using `curl` to set tma button url (button that user taps to launch your app)
5. starts docker compose containers using `docker compose up` command 
The line `set -euo pipefail` enables script mode, that will stop script execution if any of the stages fails.
\* the script is tested on **Linux Ubuntu**

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

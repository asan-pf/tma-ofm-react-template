# Vercel Deployment Guide

This guide covers how to deploy the Telegram Mini App to Vercel using the web interface.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Database Setup](#database-setup)
- [Domain Configuration](#domain-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:
- A [Vercel account](https://vercel.com/signup) (free tier available)
- A [GitHub account](https://github.com/join) with your project repository
- Telegram Bot Token from [@BotFather](https://t.me/botfather)
- A [Supabase account](https://supabase.com) for the database
- Basic understanding of environment variables

## Environment Variables

You'll need to configure environment variables for both frontend and backend deployments:

### Frontend Environment Variables
```env
VITE_APP_API_URL=https://your-backend-domain.vercel.app
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
```

### Backend Environment Variables
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
BOT_TOKEN=your_telegram_bot_token
NODE_ENV=production
```

## Frontend Deployment

Deploy your React frontend to Vercel using the web interface.

### Step 1: Connect Your Repository

1. Visit [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **"New Project"** on your dashboard
3. Import your GitHub repository by clicking **"Import"** next to it
4. Vercel will automatically detect it's a Vite React project

### Step 2: Configure Build Settings

1. **Framework Preset**: Vercel should auto-detect "Vite"
2. **Root Directory**: Leave as `./` (root)
3. **Build Command**: Should be `npm run build` (auto-detected)
4. **Output Directory**: Should be `dist` (auto-detected)
5. **Install Command**: Should be `npm ci` (auto-detected)

### Step 3: Add Environment Variables

1. Before deploying, click **"Environment Variables"**
2. Add the following variables:
   - **Name**: `VITE_APP_API_URL`, **Value**: `https://your-backend-domain.vercel.app`
   - **Name**: `VITE_TELEGRAM_BOT_USERNAME`, **Value**: `your_bot_username`
3. Click **"Add"** for each variable

### Step 4: Deploy

1. Click **"Deploy"** to start the deployment
2. Wait for the build to complete (usually 1-2 minutes)
3. Your frontend will be available at `https://your-project-name.vercel.app`

## Backend Deployment

Deploy your backend API to Vercel as serverless functions.

### Step 1: Prepare Backend Repository

If your backend is in a separate repository:
1. Go to [vercel.com](https://vercel.com) and click **"New Project"**
2. Import your backend repository

If backend is in the same repository (monorepo):
1. Click **"New Project"** 
2. Import the same repository again
3. Set **Root Directory** to `backend/` or wherever your backend code is located

### Step 2: Configure Backend Build Settings

1. **Framework Preset**: Select "Other"
2. **Root Directory**: Set to `backend/` (or your backend folder)
3. **Build Command**: `npm ci` or leave empty
4. **Output Directory**: Leave empty (not needed for serverless functions)
5. **Install Command**: `npm ci`

### Step 3: Add Backend Environment Variables

1. Click **"Environment Variables"** before deploying
2. Add the following variables:
   - **Name**: `SUPABASE_URL`, **Value**: `https://your-project.supabase.co`
   - **Name**: `SUPABASE_ANON_KEY`, **Value**: `your_supabase_anon_key`
   - **Name**: `BOT_TOKEN`, **Value**: `your_telegram_bot_token`
   - **Name**: `NODE_ENV`, **Value**: `production`

### Step 4: Deploy Backend

1. Click **"Deploy"** to start the deployment
2. Your API will be available at `https://your-backend-project.vercel.app`
3. Update your frontend's `VITE_APP_API_URL` to point to this URL

### Step 5: Update Frontend Environment Variables

1. Go back to your frontend project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Update `VITE_APP_API_URL` to your deployed backend URL
4. Click **"Save"**
5. Go to **Deployments** and click **"Redeploy"** on the latest deployment



## Database Setup

### Supabase Setup

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com) and sign in
   - Click **"New Project"**
   - Choose your organization and enter project details
   - Wait for the project to be created (1-2 minutes)

2. **Get Database Credentials**
   - Go to **Settings** → **API**
   - Copy your **Project URL** (starts with `https://`)
   - Copy your **anon public** key
   - Save these for your Vercel environment variables

3. **Set Up Database Schema**
   - Navigate to **SQL Editor** in your Supabase dashboard
   - Copy the content from `backend/database/schema.sql` in your project
   - Paste and run the SQL schema in the editor
   - Your database tables will be created automatically

4. **Configure Row Level Security (Optional)**
   - Go to **Authentication** → **Policies**
   - Set up policies for your tables as needed
   - This adds an extra layer of security to your data

## Monitoring and Debugging

### Vercel Logs

1. **View Function Logs**
   - Go to your project in Vercel dashboard
   - Navigate to **Functions** tab
   - Click on any function to see its logs and performance metrics

2. **Runtime Logs**
   - Go to **Deployments** tab
   - Click on any deployment to see build and runtime logs
   - Use this to debug deployment issues

3. **Real-time Function Logs**
   - Visit your deployed application
   - Open Vercel dashboard in another tab
   - Navigate to **Functions** → **View Function Logs**
   - See real-time logs as you interact with your app

## Troubleshooting

### Common Issues

1. **Build Failures**
   - **Environment Variables**: Ensure all required environment variables are set in Vercel dashboard
   - **Node Version**: Vercel uses Node.js 18 by default. Add `"engines": {"node": "18.x"}` to package.json if needed
   - **Build Command**: Verify the build command is correct (`npm run build` for Vite projects)
   - **Dependencies**: Check that all dependencies are properly listed in package.json

2. **Function Timeout Errors**
   - Vercel has a 10-second timeout limit for serverless functions on free tier
   - Optimize your API endpoints to respond faster
   - Consider breaking down complex operations into smaller chunks

3. **Environment Variable Issues**
   - **Frontend**: Remember to prefix with `VITE_` for environment variables
   - **Case Sensitivity**: Variable names are case-sensitive
   - **Redeploy**: After changing environment variables, trigger a new deployment

4. **CORS Errors**
   - Ensure your backend CORS configuration includes your frontend domain
   - Check that both frontend and backend are deployed and accessible
   - Verify the `VITE_APP_API_URL` points to the correct backend URL

5. **Database Connection Issues**
   - Verify Supabase URL and anon key are correct
   - Check that database schema has been applied
   - Ensure Supabase project is not paused (happens on free tier after inactivity)

6. **404 Errors on Refresh**
   - Add `vercel.json` to your frontend root with SPA routing configuration:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```


This guide covers deploying your Telegram Mini App to Vercel using the web interface. The platform handles most infrastructure concerns automatically, letting you focus on building your application.

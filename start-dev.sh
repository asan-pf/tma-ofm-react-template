#!/bin/bash
# Startup script for local development
# This script:
# 1. Starts Docker Compose (backend + database)
# 2. Waits for services to be healthy
# 3. Starts ngrok tunnel
# 4. Updates Telegram bot webhook with the ngrok URL

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${CYAN}ℹ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Parse arguments
SKIP_WEBHOOK=false
BOT_TOKEN="${BOT_TOKEN:-}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-webhook)
            SKIP_WEBHOOK=true
            shift
            ;;
        --bot-token)
            BOT_TOKEN="$2"
            shift 2
            ;;
        --help)
            cat << EOF
Usage: ./start-dev.sh [OPTIONS]

Options:
  --bot-token <token>    Telegram bot token (or set BOT_TOKEN env var)
  --skip-webhook         Skip updating the Telegram webhook
  --help                 Show this help message

Example:
  ./start-dev.sh --bot-token "123456:ABC-DEF..."
  ./start-dev.sh --skip-webhook
EOF
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

info "🚀 Starting OpenFreeMap Backend Development Environment"
info "=================================================="

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    warning "backend/.env file not found!"
    info "Creating from .env.example..."
    cp backend/.env.example backend/.env
    warning "Please edit backend/.env with your credentials and run this script again."
    exit 1
fi

# Load environment variables from .env
info "Loading environment variables from backend/.env..."
export $(grep -v '^#' backend/.env | xargs)

# Use BOT_TOKEN from .env if not provided as argument
if [ -z "$BOT_TOKEN" ] && [ -n "${BOT_TOKEN:-}" ]; then
    BOT_TOKEN="${BOT_TOKEN}"
fi

# Check prerequisites
info "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker is not installed or not in PATH"
    info "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi
success "Docker found"

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    error "Docker Compose is not available"
    info "Please install Docker Compose"
    exit 1
fi
success "Docker Compose available"

# Check ngrok
if ! command -v ngrok &> /dev/null; then
    error "ngrok is not installed or not in PATH"
    info "Please install ngrok from: https://ngrok.com/download"
    info "After installation, run: ngrok config add-authtoken <your-token>"
    exit 1
fi
success "ngrok found"

# Check bot token
if [ -z "$BOT_TOKEN" ] && [ "$SKIP_WEBHOOK" = false ]; then
    error "BOT_TOKEN not found in environment or .env file"
    info "Please set BOT_TOKEN in backend/.env or pass it with --bot-token parameter"
    exit 1
fi

# Step 1: Start Docker Compose
info ""
info "📦 Starting Docker Compose services..."
$DOCKER_COMPOSE_CMD up -d --build

# Step 2: Wait for services to be healthy
info ""
info "⏳ Waiting for services to be healthy..."
MAX_WAIT=60
WAITED=0
HEALTHY=false

while [ $WAITED -lt $MAX_WAIT ]; do
    sleep 2
    WAITED=$((WAITED + 2))
    
    BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ofm_backend 2>/dev/null || echo "starting")
    
    if [ "$BACKEND_HEALTH" = "healthy" ]; then
        HEALTHY=true
        break
    fi
    
    echo -n "."
done

echo ""

if [ "$HEALTHY" = false ]; then
    warning "Services did not become healthy within ${MAX_WAIT}s"
    info "Checking logs..."
    $DOCKER_COMPOSE_CMD logs --tail=50
    warning "You may need to check the services manually"
else
    success "All services are healthy!"
fi

# Step 3: Start ngrok
info ""
info "🌐 Starting ngrok tunnel on port 3000..."

# Kill any existing ngrok processes
pkill -f ngrok || true

# Start ngrok in background
ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start and get the URL
info "Waiting for ngrok to initialize..."
sleep 3

# Get ngrok URL from API
MAX_RETRIES=10
RETRY_COUNT=0
NGROK_URL=""

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ -z "$NGROK_URL" ]; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4 || echo "")
    
    if [ -n "$NGROK_URL" ]; then
        break
    fi
    
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ -z "$NGROK_URL" ]; then
    error "Failed to get ngrok URL"
    info "Please check if ngrok is running: http://localhost:4040"
    exit 1
fi

success "ngrok tunnel established: $NGROK_URL"

# Step 4: Update Telegram webhook (optional)
if [ "$SKIP_WEBHOOK" = false ] && [ -n "$BOT_TOKEN" ]; then
    info ""
    info "🤖 Updating Telegram bot webhook..."
    
    WEBHOOK_URL="$NGROK_URL/webhook"
    TELEGRAM_API_URL="https://api.telegram.org/bot$BOT_TOKEN/setWebhook"
    
    RESPONSE=$(curl -s -X POST "$TELEGRAM_API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$WEBHOOK_URL\"}")
    
    if echo "$RESPONSE" | grep -q '"ok":true'; then
        success "Webhook updated successfully!"
        info "Webhook URL: $WEBHOOK_URL"
    else
        warning "Failed to update webhook"
        echo "$RESPONSE"
    fi
fi

# Display summary
info ""
info "=================================================="
success "🎉 Development environment is ready!"
info "=================================================="
info ""
info "📍 Service URLs:"
info "   Backend API:     http://localhost:3000"
info "   PostgreSQL:      localhost:5432"
info "   PostgREST:       http://localhost:8000"
info "   ngrok Public:    $NGROK_URL"
info "   ngrok Dashboard: http://localhost:4040"
info ""
info "🔧 Useful commands:"
info "   View logs:       $DOCKER_COMPOSE_CMD logs -f"
info "   Stop services:   $DOCKER_COMPOSE_CMD down"
info "   Restart backend: $DOCKER_COMPOSE_CMD restart backend"
info "   Stop ngrok:      kill $NGROK_PID"
info ""
info "📝 Test the API:"
info "   curl http://localhost:3000/health"
info ""
warning "⚠️  Note: ngrok URL changes on each restart!"
warning "    You'll need to update the webhook each time."
info ""
info "Press Ctrl+C to stop (this will leave services running)"
info "To stop everything, run: $DOCKER_COMPOSE_CMD down"

# Cleanup function
cleanup() {
    info ""
    info "Cleaning up..."
    kill $NGROK_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

# Keep script running
while true; do
    sleep 1
done

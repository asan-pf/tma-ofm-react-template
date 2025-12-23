#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load env variables from .env file
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
  echo "File .env is missing in backend/ folder!"
  exit 1
else
  echo "Scanning .env file ..."
  export $(grep -v '^#' $SCRIPT_DIR/backend/.env | xargs)
fi

if [ -z "${BOT_TOKEN:-}" ]; then
  echo "❌ BOT_TOKEN is missing or empty in .env"
  exit 1
fi

NGROK_API="http://127.0.0.1:4040/api/tunnels"
echo "Starting ngrok..."
if curl -s $NGROK_API >/dev/null 2>&1; then
    echo "ngrok is already running"
else
    ngrok http 8000 --log=stdout > /tmp/ngrok.log 2>&1 &
    NGROK_PID=$!
    echo "NGROK_PID : ${NGROK_PID}"
fi


if ! command -v jq >/dev/null 2>&1; then
  echo "❌ 'jq' is required but not installed. Please install jq and try again."
  exit 1
fi

# Wait for ngrok API to be ready
echo "Getting ngrok url..."
for i in {1..10}; do
  if curl -s "$NGROK_API" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

PUBLIC_URL=$(
  curl -s "$NGROK_API" \
  | jq -r '.tunnels[] | select(.proto=="https") | .public_url' \
  | head -n 1
)

if [ -z "${PUBLIC_URL:-}" ]; then
    echo "❌ PUBLIC_URL is empty — ngrok probably not running!"
    exit 1
fi
export PUBLIC_URL
echo "PUBLIC_URL : $PUBLIC_URL"
echo "Setting Telegram Mini App menu button URL to ${PUBLIC_URL}..."

curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "menu_button": {
    "type": "web_app",
    "text": "Open App",
    "web_app": {
      "url": "${PUBLIC_URL}"
    }
  }
}
EOF

echo ""
echo "✅ Telegram setChatMenuButton call sent."
echo "Starting docker compose containers..."
docker compose up
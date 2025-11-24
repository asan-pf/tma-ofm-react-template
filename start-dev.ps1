#!/usr/bin/env pwsh
# Startup script for local development v2

Write-Host "Starting script v2..." -ForegroundColor DarkGray

param(
    [string]$BotToken = $env:BOT_TOKEN,
    [switch]$SkipWebhook = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host @"
Usage: .\start-dev-v2.ps1 [OPTIONS]

Options:
  -BotToken <token>    Telegram bot token (or set BOT_TOKEN env var)
  -SkipWebhook         Skip updating the Telegram webhook
  -Help                Show this help message

Example:
  .\start-dev-v2.ps1 -BotToken "123456:ABC-DEF..."
  .\start-dev-v2.ps1 -SkipWebhook
"@
    exit 0
}

Write-Host "ℹ 🚀 Starting OpenFreeMap Backend Development Environment" -ForegroundColor Cyan
Write-Host "ℹ ==================================================" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠ backend\.env file not found!" -ForegroundColor Yellow
    Write-Host "ℹ Creating from .env.example..." -ForegroundColor Cyan
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠ Please edit backend\.env with your credentials and run this script again." -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env
Write-Host "ℹ Loading environment variables from backend\.env..." -ForegroundColor Cyan
Get-Content "backend\.env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
        if ($key -eq "BOT_TOKEN" -and -not $BotToken) {
            $BotToken = $value
        }
    }
}

# Check prerequisites
Write-Host "ℹ Checking prerequisites..." -ForegroundColor Cyan

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "ℹ Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    exit 1
}
Write-Host "✓ Docker found" -ForegroundColor Green

# Check Docker Compose
$dockerComposeCmd = "docker-compose"
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "⚠ docker-compose command not found, trying 'docker compose'..." -ForegroundColor Yellow
    $dockerComposeCmd = "docker"
}
Write-Host "✓ Docker Compose available" -ForegroundColor Green

# Check ngrok
$ngrokCmd = "ngrok"
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    # Try to find ngrok in common locations
    $localAppData = [Environment]::GetFolderPath("LocalApplicationData")
    $possiblePaths = @(
        "$localAppData\Microsoft\WinGet\Links\ngrok.exe",
        "$localAppData\Microsoft\WinGet\Packages\ngrok.ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe",
        "C:\Program Files\ngrok\ngrok.exe"
    )
    
    $found = $false
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $ngrokCmd = $path
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "✗ ngrok is not installed or not in PATH" -ForegroundColor Red
        Write-Host "ℹ Please install ngrok from: https://ngrok.com/download" -ForegroundColor Cyan
        Write-Host "ℹ After installation, run: ngrok config add-authtoken <your-token>" -ForegroundColor Cyan
        exit 1
    }
}
Write-Host "✓ ngrok found" -ForegroundColor Green

# Check bot token
if (-not $BotToken -and -not $SkipWebhook) {
    Write-Host "✗ BOT_TOKEN not found in environment or .env file" -ForegroundColor Red
    Write-Host "ℹ Please set BOT_TOKEN in backend\.env or pass it with -BotToken parameter" -ForegroundColor Cyan
    exit 1
}

# Step 1: Start Docker Compose
Write-Host "`nℹ 📦 Starting Docker Compose services..." -ForegroundColor Cyan

if ($dockerComposeCmd -eq "docker") {
    docker compose up -d --build
}
if ($dockerComposeCmd -eq "docker-compose") {
    docker-compose up -d --build
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start Docker Compose" -ForegroundColor Red
    exit 1
}

# Step 2: Wait for services to be healthy
Write-Host "`nℹ ⏳ Waiting for services to be healthy..." -ForegroundColor Cyan
$maxWait = 60
$waited = 0
$healthy = $false

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 2
    $waited += 2
    
    $backendHealth = docker inspect --format='{{.State.Health.Status}}' ofm_backend 2>$null
    
    if ($backendHealth -eq "healthy") {
        $healthy = $true
        break
    }
    
    Write-Host "." -NoNewline
}

Write-Host ""

if (-not $healthy) {
    Write-Host "⚠ Services did not become healthy within ${maxWait}s" -ForegroundColor Yellow
    Write-Host "ℹ Checking logs..." -ForegroundColor Cyan
    if ($dockerComposeCmd -eq "docker") {
        docker compose logs --tail=50
    }
    if ($dockerComposeCmd -eq "docker-compose") {
        docker-compose logs --tail=50
    }
    Write-Host "⚠ You may need to check the services manually" -ForegroundColor Yellow
}
if ($healthy) {
    Write-Host "✓ All services are healthy!" -ForegroundColor Green
}

# Step 3: Start ngrok
Write-Host "`nℹ 🌐 Starting ngrok tunnel on port 3000..." -ForegroundColor Cyan

# Kill any existing ngrok processes
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

# Start ngrok in background
$ngrokJob = Start-Job -ScriptBlock {
    param($cmd)
    & $cmd http 3000 --log=stdout
} -ArgumentList $ngrokCmd

# Wait for ngrok to start and get the URL
Write-Host "ℹ Waiting for ngrok to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Get ngrok URL from API
$maxRetries = 10
$retryCount = 0
$ngrokUrl = $null

while ($retryCount -lt $maxRetries -and -not $ngrokUrl) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $ngrokUrl = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1 -ExpandProperty public_url
        
        if ($ngrokUrl) {
            break
        }
    } catch {
        # ngrok API not ready yet
    }
    
    Start-Sleep -Seconds 1
    $retryCount++
}

if (-not $ngrokUrl) {
    Write-Host "✗ Failed to get ngrok URL" -ForegroundColor Red
    Write-Host "ℹ Please check if ngrok is running: http://localhost:4040" -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ ngrok tunnel established: $ngrokUrl" -ForegroundColor Green

# Step 4: Update Telegram webhook (optional)
if (-not $SkipWebhook -and $BotToken) {
    Write-Host "`nℹ 🤖 Updating Telegram bot webhook..." -ForegroundColor Cyan
    
    $webhookUrl = "$ngrokUrl/webhook"
    $telegramApiUrl = "https://api.telegram.org/bot$BotToken/setWebhook"
    
    try {
        $body = @{
            url = $webhookUrl
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $telegramApiUrl -Method Post -Body $body -ContentType "application/json"
        
        if ($response.ok) {
            Write-Host "✓ Webhook updated successfully!" -ForegroundColor Green
            Write-Host "ℹ Webhook URL: $webhookUrl" -ForegroundColor Cyan
        } else {
            Write-Host "⚠ Failed to update webhook: $($response.description)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Error updating webhook: $_" -ForegroundColor Red
    }
}

# Display summary
Write-Host "`nℹ ==================================================" -ForegroundColor Cyan
Write-Host "✓ 🎉 Development environment is ready!" -ForegroundColor Green
Write-Host "ℹ ==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ℹ 📍 Service URLs:" -ForegroundColor Cyan
Write-Host "ℹ    Backend API:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "ℹ    PostgreSQL:      localhost:5432" -ForegroundColor Cyan
Write-Host "ℹ    PostgREST:       http://localhost:8000" -ForegroundColor Cyan
Write-Host "ℹ    ngrok Public:    $ngrokUrl" -ForegroundColor Cyan
Write-Host "ℹ    ngrok Dashboard: http://localhost:4040" -ForegroundColor Cyan
Write-Host ""
Write-Host "ℹ 🔧 Useful commands:" -ForegroundColor Cyan
if ($dockerComposeCmd -eq "docker") {
    Write-Host "ℹ    View logs:       docker compose logs -f" -ForegroundColor Cyan
    Write-Host "ℹ    Stop services:   docker compose down" -ForegroundColor Cyan
    Write-Host "ℹ    Restart backend: docker compose restart backend" -ForegroundColor Cyan
}
if ($dockerComposeCmd -eq "docker-compose") {
    Write-Host "ℹ    View logs:       docker-compose logs -f" -ForegroundColor Cyan
    Write-Host "ℹ    Stop services:   docker-compose down" -ForegroundColor Cyan
    Write-Host "ℹ    Restart backend: docker-compose restart backend" -ForegroundColor Cyan
}
Write-Host "ℹ    Stop ngrok:      Stop-Job $($ngrokJob.Id)" -ForegroundColor Cyan
Write-Host ""
Write-Host "ℹ 📝 Test the API:" -ForegroundColor Cyan
Write-Host "ℹ    curl http://localhost:3000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠  Note: ngrok URL changes on each restart!" -ForegroundColor Yellow
Write-Host "⚠     You'll need to update the webhook each time." -ForegroundColor Yellow
Write-Host ""
Write-Host "ℹ Press Ctrl+C to stop (this will leave services running)" -ForegroundColor Cyan
if ($dockerComposeCmd -eq "docker") {
    Write-Host "ℹ To stop everything, run: docker compose down" -ForegroundColor Cyan
}
if ($dockerComposeCmd -eq "docker-compose") {
    Write-Host "ℹ To stop everything, run: docker-compose down" -ForegroundColor Cyan
}

# Keep script running to show ngrok output
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nℹ Cleaning up..." -ForegroundColor Cyan
}

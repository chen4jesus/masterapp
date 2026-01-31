# =============================================================================
# FaithConnect App Manager - PowerShell Version for Windows
# =============================================================================
# Manage individual apps without affecting the main infrastructure
# Usage: .\manage.ps1 <command> [app]
# =============================================================================

param(
    [Parameter(Position = 0)]
    [string]$Command,
    
    [Parameter(Position = 1)]
    [string]$App
)

# App definitions: name -> directory
$Apps = @{
    "bookstack"        = "bookstack"
    "commandcenter"    = "commandcenter"
    "listenfaithfully" = "listenfaithfully"
    "reformed-blog"    = "reformedblog"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Print colored output
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Blue }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

# Show usage
function Show-Usage {
    Write-Host "FaithConnect App Manager (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\manage.ps1 <command> [app]"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  infra-up       Start the infrastructure (Caddy + network)"
    Write-Host "  infra-down     Stop the infrastructure"
    Write-Host "  infra-logs     View Caddy logs"
    Write-Host ""
    Write-Host "  start <app>    Start a specific app"
    Write-Host "  stop <app>     Stop a specific app"
    Write-Host "  restart <app>  Restart a specific app"
    Write-Host "  logs <app>     View logs for a specific app"
    Write-Host "  status <app>   Check status of a specific app"
    Write-Host ""
    Write-Host "  start-all      Start all apps"
    Write-Host "  stop-all       Stop all apps"
    Write-Host "  status-all     Show status of all apps"
    Write-Host ""
    Write-Host "  reload-caddy   Reload Caddy configuration"
    Write-Host ""
    Write-Host "Available apps:" -ForegroundColor Yellow
    foreach ($app in $Apps.Keys) {
        Write-Host "  - $app"
    }
    Write-Host ""
    Write-Host "Local Development:" -ForegroundColor Yellow
    Write-Host "  Use 'infra-up-local' to start with localhost ports (8001-8005)"
    Write-Host ""
}

# Check if network exists
function Test-Network {
    $network = docker network inspect faithconnect 2>$null
    if (-not $?) {
        Write-Error "Network 'faithconnect' not found. Start infrastructure first: .\manage.ps1 infra-up"
        exit 1
    }
}

# Get app directory
function Get-AppDir {
    param($AppName)
    
    if (-not $Apps.ContainsKey($AppName)) {
        Write-Error "Unknown app: $AppName"
        Write-Host "Available apps: $($Apps.Keys -join ', ')"
        exit 1
    }
    
    return Join-Path $ScriptDir $Apps[$AppName]
}

# Infrastructure commands
function Start-Infra {
    param([switch]$Local)
    
    Write-Info "Starting infrastructure (Caddy + network)..."
    Push-Location $ScriptDir
    
    $composeFile = "docker-compose.yml"
    if ($Local -or (Test-Path "docker-compose.local.yml")) {
        $composeFile = "docker-compose.local.yml"
        Write-Info "Using local infrastructure configuration (docker-compose.local.yml)"
    }

    docker compose -f $composeFile up -d
    
    if ($composeFile -eq "docker-compose.local.yml") {
        Write-Success "Local infrastructure started!"
        Write-Host ""
        Write-Host "Access your apps at:" -ForegroundColor Cyan
        Write-Host "  Dashboard:         http://localhost"
        Write-Host "  Command Center:    http://localhost:8001"
        Write-Host "  BookStack:         http://localhost:8002"
        Write-Host "  Listen Faithfully: http://localhost:8003"
        Write-Host "  Reformed Blog:     http://localhost:8004"
    }
    else {
        Write-Success "Infrastructure started!"
        Write-Info "Caddy is now running at ports 80/443"
    }
    
    Pop-Location
}

function Stop-Infra {
    param([switch]$Local)
    
    Write-Warning "Stopping infrastructure..."
    Push-Location $ScriptDir
    
    $composeFile = "docker-compose.yml"
    if ($Local -or (Test-Path "docker-compose.local.yml")) {
        $composeFile = "docker-compose.local.yml"
    }

    docker compose -f $composeFile down
    
    Write-Success "Infrastructure stopped"
    Pop-Location
}

function Show-InfraLogs {
    Push-Location $ScriptDir
    docker compose logs -f caddy
    Pop-Location
}

# App commands
function Start-App {
    param($AppName)
    
    $appDir = Get-AppDir $AppName
    Test-Network
    
    Write-Info "Starting $AppName..."
    Push-Location $appDir
    
    $composeFile = "docker-compose.app.yml"
    if (Test-Path "docker-compose.local.yml") {
        $composeFile = "docker-compose.local.yml"
        Write-Info "Using local configuration (docker-compose.local.yml)"
    }
    
    $rootEnv = Join-Path $ScriptDir ".env"
    if (Test-Path $rootEnv) {
        Write-Info "Loading root .env file"
        docker compose --env-file "$rootEnv" -f $composeFile up -d --build
    }
    else {
        docker compose -f $composeFile up -d --build
    }

    Pop-Location
    Write-Success "$AppName started!"
}

function Stop-App {
    param($AppName)
    
    $appDir = Get-AppDir $AppName
    
    Write-Info "Stopping $AppName..."
    Push-Location $appDir

    $composeFile = "docker-compose.app.yml"
    if (Test-Path "docker-compose.local.yml") {
        $composeFile = "docker-compose.local.yml"
    }

    $rootEnv = Join-Path $ScriptDir ".env"
    if (Test-Path $rootEnv) {
        docker compose --env-file "$rootEnv" -f $composeFile down
    }
    else {
        docker compose -f $composeFile down
    }

    Pop-Location
    Write-Success "$AppName stopped"
}

function Restart-App {
    param($AppName)
    Stop-App $AppName
    Start-App $AppName
}

function Show-AppLogs {
    param($AppName)
    
    $appDir = Get-AppDir $AppName
    Push-Location $appDir
    
    $composeFile = "docker-compose.app.yml"
    if (Test-Path "docker-compose.local.yml") { $composeFile = "docker-compose.local.yml" }
    elseif (Test-Path "docker-compose.app.yml") { $composeFile = "docker-compose.app.yml" }

    docker compose -f $composeFile logs -f
    Pop-Location
}

function Show-AppStatus {
    param($AppName)
    
    $appDir = Get-AppDir $AppName
    Write-Host "=== $AppName ===" -ForegroundColor Cyan
    Push-Location $appDir

    $composeFile = "docker-compose.app.yml"
    if (Test-Path "docker-compose.local.yml") { $composeFile = "docker-compose.local.yml" }

    docker compose -f $composeFile ps
    Pop-Location
}

# Bulk commands
function Start-AllApps {
    Test-Network
    Write-Info "Starting all apps..."
    foreach ($app in $Apps.Keys) {
        Start-App $app
    }
    Write-Success "All apps started!"
}

function Stop-AllApps {
    Write-Info "Stopping all apps..."
    foreach ($app in $Apps.Keys) {
        Stop-App $app
    }
    Write-Success "All apps stopped"
}

function Show-AllStatus {
    Write-Host "=== Infrastructure ===" -ForegroundColor Cyan
    Push-Location $ScriptDir
    docker compose ps
    Pop-Location
    Write-Host ""
    
    foreach ($app in $Apps.Keys) {
        Show-AppStatus $app
        Write-Host ""
    }
}

# Reload Caddy
function Update-Caddy {
    Write-Info "Reloading Caddy configuration..."
    docker exec faithconnect-caddy caddy reload --config /etc/caddy/Caddyfile
    Write-Success "Caddy configuration reloaded!"
}

# Main
switch ($Command) {
    "infra-up" { Start-Infra }
    "infra-up-local" { Start-Infra -Local }
    "infra-down" { Stop-Infra }
    "infra-down-local" { Stop-Infra -Local }
    "infra-logs" { Show-InfraLogs }
    
    "start" {
        if (-not $App) { Write-Error "App name required"; Show-Usage; exit 1 }
        Start-App $App
    }
    "stop" {
        if (-not $App) { Write-Error "App name required"; Show-Usage; exit 1 }
        Stop-App $App
    }
    "restart" {
        if (-not $App) { Write-Error "App name required"; Show-Usage; exit 1 }
        Restart-App $App
    }
    "logs" {
        if (-not $App) { Write-Error "App name required"; Show-Usage; exit 1 }
        Show-AppLogs $App
    }
    "status" {
        if (-not $App) { Write-Error "App name required"; Show-Usage; exit 1 }
        Show-AppStatus $App
    }
    
    "start-all" { Start-AllApps }
    "stop-all" { Stop-AllApps }
    "status-all" { Show-AllStatus }
    
    "reload-caddy" { Update-Caddy }
    
    default { Show-Usage; exit 1 }
}

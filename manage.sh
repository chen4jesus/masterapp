#!/bin/bash
# =============================================================================
# FaithConnect App Manager
# =============================================================================
# Manage individual apps without affecting the main infrastructure
# Usage: ./manage.sh <command> [app]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# App definitions: name -> directory
declare -A APPS=(
    ["bookstack"]="bookstack"
    ["commandcenter"]="commandcenter"
    ["listenfaithfully"]="listenfaithfully"
    ["reformed-blog"]="reformedblog"
)

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print colored output
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Show usage
usage() {
    echo "FaithConnect App Manager"
    echo ""
    echo "Usage: $0 <command> [app]"
    echo ""
    echo "Commands:"
    echo "  infra-up       Start the infrastructure (Caddy + network)"
    echo "  infra-down     Stop the infrastructure"
    echo "  infra-logs     View Caddy logs"
    echo ""
    echo "  start <app>    Start a specific app"
    echo "  stop <app>     Stop a specific app"
    echo "  restart <app>  Restart a specific app"
    echo "  logs <app>     View logs for a specific app"
    echo "  status <app>   Check status of a specific app"
    echo ""
    echo "  start-all      Start all apps"
    echo "  stop-all       Stop all apps"
    echo "  status-all     Show status of all apps"
    echo ""
    echo "  reload-caddy   Reload Caddy configuration"
    echo ""
    echo "Available apps:"
    for app in "${!APPS[@]}"; do
        echo "  - $app"
    done
    echo ""
}

# Check if network exists
check_network() {
    if ! docker network inspect faithconnect &>/dev/null; then
        print_error "Network 'faithconnect' not found. Start infrastructure first: $0 infra-up"
        exit 1
    fi
}

# Get app directory
get_app_dir() {
    local app=$1
    if [[ -z "${APPS[$app]}" ]]; then
        print_error "Unknown app: $app"
        echo "Available apps: ${!APPS[*]}"
        exit 1
    fi
    echo "${SCRIPT_DIR}/${APPS[$app]}"
}

# Get appropriate compose file
get_compose_file() {
    if [[ -f "docker-compose.app.yml" ]]; then
        echo "docker-compose.app.yml"
    else
        echo "docker-compose.yml"
    fi
}

# Infrastructure commands
infra_up() {
    print_info "Starting infrastructure (Caddy + network)..."
    cd "$SCRIPT_DIR"
    docker compose up -d
    print_success "Infrastructure started!"
    print_info "Caddy is now running at ports 80/443"
}

infra_down() {
    print_warning "Stopping infrastructure..."
    cd "$SCRIPT_DIR"
    docker compose down
    print_success "Infrastructure stopped"
}

infra_logs() {
    cd "$SCRIPT_DIR"
    docker compose logs -f caddy
}

# App commands
start_app() {
    local app=$1
    local app_dir=$(get_app_dir "$app")
    
    check_network
    
    print_info "Starting $app..."
    cd "$app_dir"
    
    local compose_file=$(get_compose_file)
    print_info "Using configuration: $compose_file"
    
    local env_arg=""
    if [[ -f "$SCRIPT_DIR/.env" ]]; then
        env_arg="--env-file $SCRIPT_DIR/.env"
        print_info "Loading root .env file"
    fi
    
    docker compose $env_arg -f "$compose_file" up -d --build
    print_success "$app started!"
}

stop_app() {
    local app=$1
    local app_dir=$(get_app_dir "$app")
    
    print_info "Stopping $app..."
    cd "$app_dir"
    
    local compose_file=$(get_compose_file)
    
    local env_arg=""
    if [[ -f "$SCRIPT_DIR/.env" ]]; then
        env_arg="--env-file $SCRIPT_DIR/.env"
    fi
    
    docker compose $env_arg -f "$compose_file" down
    print_success "$app stopped"
}

restart_app() {
    local app=$1
    stop_app "$app"
    start_app "$app"
}

logs_app() {
    local app=$1
    local app_dir=$(get_app_dir "$app")
    
    cd "$app_dir"
    
    local compose_file=$(get_compose_file)
    
    docker compose -f "$compose_file" logs -f
}

status_app() {
    local app=$1
    local app_dir=$(get_app_dir "$app")
    
    echo "=== $app ==="
    cd "$app_dir"
    
    local compose_file=$(get_compose_file)
    
    docker compose -f "$compose_file" ps
}

# Bulk commands
start_all() {
    check_network
    print_info "Starting all apps..."
    for app in "${!APPS[@]}"; do
        start_app "$app"
    done
    print_success "All apps started!"
}

stop_all() {
    print_info "Stopping all apps..."
    for app in "${!APPS[@]}"; do
        stop_app "$app"
    done
    print_success "All apps stopped"
}

status_all() {
    echo "=== Infrastructure ==="
    cd "$SCRIPT_DIR"
    docker compose ps
    echo ""
    
    for app in "${!APPS[@]}"; do
        status_app "$app"
        echo ""
    done
}

# Reload Caddy
reload_caddy() {
    print_info "Reloading Caddy configuration..."
    docker exec faithconnect-caddy caddy reload --config /etc/caddy/Caddyfile
    print_success "Caddy configuration reloaded!"
}

# Main
case "${1:-}" in
    infra-up)
        infra_up
        ;;
    infra-down)
        infra_down
        ;;
    infra-logs)
        infra_logs
        ;;
    start)
        [[ -z "${2:-}" ]] && { print_error "App name required"; usage; exit 1; }
        start_app "$2"
        ;;
    stop)
        [[ -z "${2:-}" ]] && { print_error "App name required"; usage; exit 1; }
        stop_app "$2"
        ;;
    restart)
        [[ -z "${2:-}" ]] && { print_error "App name required"; usage; exit 1; }
        restart_app "$2"
        ;;
    logs)
        [[ -z "${2:-}" ]] && { print_error "App name required"; usage; exit 1; }
        logs_app "$2"
        ;;
    status)
        [[ -z "${2:-}" ]] && { print_error "App name required"; usage; exit 1; }
        status_app "$2"
        ;;
    start-all)
        start_all
        ;;
    stop-all)
        stop_all
        ;;
    status-all)
        status_all
        ;;
    reload-caddy)
        reload_caddy
        ;;
    *)
        usage
        exit 1
        ;;
esac

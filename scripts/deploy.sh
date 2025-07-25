#!/bin/bash

# AI Toolkit Deployment Script
# This script handles deployment of the AI Toolkit with Ollama integration

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-development}"
COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment for: $ENVIRONMENT"
    
    # Create necessary directories
    mkdir -p "$PROJECT_ROOT/data/input"
    mkdir -p "$PROJECT_ROOT/data/output"
    mkdir -p "$PROJECT_ROOT/logs"
    mkdir -p "$PROJECT_ROOT/config"
    
    # Copy environment-specific configuration
    if [ -f "$PROJECT_ROOT/config/$ENVIRONMENT.json" ]; then
        cp "$PROJECT_ROOT/config/$ENVIRONMENT.json" "$PROJECT_ROOT/config/config.json"
        log_success "Configuration copied for $ENVIRONMENT environment"
    else
        log_warning "No specific configuration found for $ENVIRONMENT, using defaults"
    fi
    
    # Set appropriate permissions
    chmod -R 755 "$PROJECT_ROOT/data"
    chmod -R 755 "$PROJECT_ROOT/logs"
    
    log_success "Environment setup completed"
}

# Build application
build_application() {
    log_info "Building AI Toolkit application..."
    
    cd "$PROJECT_ROOT"
    
    # Build Docker images
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" build --no-cache
    else
        docker-compose -f "$COMPOSE_FILE" build
    fi
    
    log_success "Application build completed"
}

# Deploy services
deploy_services() {
    log_info "Deploying services..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start services
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" --profile production up -d
    else
        docker-compose -f "$COMPOSE_FILE" up -d
    fi
    
    log_success "Services deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        # Check AI Toolkit health
        if curl -f http://localhost:3000/health &> /dev/null; then
            log_success "AI Toolkit is healthy"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Services failed to become healthy within timeout"
            docker-compose -f "$COMPOSE_FILE" logs
            exit 1
        fi
        
        sleep 10
        ((attempt++))
    done
}

# Setup Ollama models
setup_ollama_models() {
    log_info "Setting up Ollama models..."
    
    # Wait for Ollama to be ready
    local max_attempts=20
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:11434/api/tags &> /dev/null; then
            log_success "Ollama is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Ollama failed to start within timeout"
            exit 1
        fi
        
        sleep 5
        ((attempt++))
    done
    
    # Pull recommended models
    log_info "Pulling recommended Ollama models..."
    docker exec ai-toolkit-ollama ollama pull llama2:7b
    docker exec ai-toolkit-ollama ollama pull codellama:7b
    docker exec ai-toolkit-ollama ollama pull mistral:7b
    
    log_success "Ollama models setup completed"
}

# Display deployment status
show_status() {
    log_info "Deployment Status:"
    echo
    docker-compose -f "$COMPOSE_FILE" ps
    echo
    log_info "Service URLs:"
    echo "  - AI Toolkit API: http://localhost:3000"
    echo "  - Web Dashboard: http://localhost:8080"
    echo "  - Ollama API: http://localhost:11434"
    echo "  - Redis: localhost:6379"
    echo
    log_info "Logs can be viewed with: docker-compose logs -f"
}

# Main deployment function
main() {
    log_info "Starting AI Toolkit deployment..."
    log_info "Environment: $ENVIRONMENT"
    echo
    
    check_prerequisites
    setup_environment
    build_application
    deploy_services
    wait_for_services
    setup_ollama_models
    show_status
    
    log_success "AI Toolkit deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "development"|"staging"|"production")
        main
        ;;
    "stop")
        log_info "Stopping AI Toolkit services..."
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting AI Toolkit services..."
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" restart
        log_success "Services restarted"
        ;;
    "logs")
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" logs -f
        ;;
    "status")
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps
        ;;
    *)
        echo "Usage: $0 {development|staging|production|stop|restart|logs|status}"
        echo
        echo "Commands:"
        echo "  development  - Deploy in development mode"
        echo "  staging      - Deploy in staging mode"
        echo "  production   - Deploy in production mode"
        echo "  stop         - Stop all services"
        echo "  restart      - Restart all services"
        echo "  logs         - Show service logs"
        echo "  status       - Show service status"
        exit 1
        ;;
esac
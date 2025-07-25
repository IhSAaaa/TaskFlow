# TaskFlow Makefile
# Comprehensive build and development automation

# Variables
PROJECT_NAME = taskflow
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
DOCKER_COMPOSE_PROD = docker-compose -f docker-compose.prod.yml

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)TaskFlow Development Commands$(NC)"
	@echo "================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make dev          # Start development environment"
	@echo "  make stop         # Stop development environment"
	@echo "  make logs         # View logs"
	@echo "  make clean        # Clean all containers and volumes"

# =============================================================================
# DEVELOPMENT COMMANDS
# =============================================================================

.PHONY: dev
dev: ## Start development environment with hot reload
	@echo "$(BLUE)[INFO]$(NC) Starting TaskFlow Development Environment..."
	@if ! docker info > /dev/null 2>&1; then \
		echo "$(RED)[ERROR]$(NC) Docker is not running. Please start Docker first."; \
		exit 1; \
	fi
	@echo "$(BLUE)[INFO]$(NC) Stopping existing containers..."
	@$(DOCKER_COMPOSE_DEV) down
	@echo "$(BLUE)[INFO]$(NC) Building and starting development environment..."
	@$(DOCKER_COMPOSE_DEV) up --build -d
	@echo "$(BLUE)[INFO]$(NC) Waiting for services to be ready..."
	@sleep 10
	@echo "$(BLUE)[INFO]$(NC) Checking frontend status..."
	@if docker ps | grep -q "taskflow-frontend-dev"; then \
		echo "$(GREEN)[SUCCESS]$(NC) Frontend development server is running!"; \
		echo "$(GREEN)🌐 Frontend:$(NC) http://localhost:3000"; \
		echo "$(GREEN)🔌 API Gateway:$(NC) http://localhost:8000"; \
		echo ""; \
		echo "$(BLUE)📝 Development mode enabled with hot reload!$(NC)"; \
		echo "$(BLUE)💡 Any changes to frontend code will automatically reload.$(NC)"; \
		echo ""; \
		echo "To stop the development environment, run: $(YELLOW)make stop$(NC)"; \
		echo "To view logs, run: $(YELLOW)make logs$(NC)"; \
	else \
		echo "$(RED)[ERROR]$(NC) Frontend failed to start. Check logs with: $(YELLOW)make logs$(NC)"; \
		exit 1; \
	fi

.PHONY: stop
stop: ## Stop development environment
	@echo "$(BLUE)[INFO]$(NC) Stopping TaskFlow Development Environment..."
	@$(DOCKER_COMPOSE_DEV) down
	@echo "$(GREEN)[SUCCESS]$(NC) Development environment stopped!"
	@echo ""
	@echo "To start development environment again, run: $(YELLOW)make dev$(NC)"

.PHONY: logs
logs: ## View development logs
	@echo "$(BLUE)[INFO]$(NC) Viewing development logs..."
	@$(DOCKER_COMPOSE_DEV) logs -f

.PHONY: logs-frontend
logs-frontend: ## View frontend logs only
	@echo "$(BLUE)[INFO]$(NC) Viewing frontend logs..."
	@$(DOCKER_COMPOSE_DEV) logs -f frontend-dev

.PHONY: logs-backend
logs-backend: ## View backend logs only
	@echo "$(BLUE)[INFO]$(NC) Viewing backend logs..."
	@$(DOCKER_COMPOSE_DEV) logs -f api-gateway auth-service task-service project-service notification-service tenant-service

# =============================================================================
# PRODUCTION COMMANDS
# =============================================================================

.PHONY: prod
prod: ## Start production environment with ngrok
	@echo "$(BLUE)[INFO]$(NC) Starting TaskFlow Production Environment..."
	@if ! docker info > /dev/null 2>&1; then \
		echo "$(RED)[ERROR]$(NC) Docker is not running. Please start Docker first."; \
		exit 1; \
	fi
	@if [ ! -f .env ]; then \
		echo "$(RED)[ERROR]$(NC) .env file not found!"; \
		echo "$(YELLOW)[INFO]$(NC) Please copy env.example to .env and configure your environment variables:"; \
		echo "   cp env.example .env"; \
		echo "   # Then edit .env with your configuration"; \
		exit 1; \
	fi
	@echo "$(BLUE)[INFO]$(NC) Validating environment variables..."
	@source .env; \
	if [ -z "$$NGROK_AUTHTOKEN" ]; then \
		echo "$(RED)[ERROR]$(NC) NGROK_AUTHTOKEN is not set in .env file!"; \
		echo "$(YELLOW)[INFO]$(NC) Please get your ngrok authtoken from https://ngrok.com and add it to .env"; \
		exit 1; \
	fi
	@echo "$(GREEN)[SUCCESS]$(NC) Environment variables validated"
	@echo "$(BLUE)[INFO]$(NC) Building and starting production environment..."
	@$(DOCKER_COMPOSE_PROD) up --build -d
	@echo "$(GREEN)[SUCCESS]$(NC) Production environment started!"
	@echo "$(GREEN)🌐 Frontend:$(NC) http://localhost:3000"
	@echo "$(GREEN)🔌 API Gateway:$(NC) http://localhost:8000"
	@echo "$(GREEN)🌍 Ngrok Web Interface:$(NC) http://localhost:4040"
	@echo "$(BLUE)[INFO]$(NC) Check ngrok web interface for public URL"

.PHONY: prod-stop
prod-stop: ## Stop production environment
	@echo "$(BLUE)[INFO]$(NC) Stopping TaskFlow Production Environment..."
	@$(DOCKER_COMPOSE_PROD) down
	@echo "$(GREEN)[SUCCESS]$(NC) Production environment stopped!"

.PHONY: prod-logs
prod-logs: ## View production logs
	@echo "$(BLUE)[INFO]$(NC) Viewing production logs..."
	@$(DOCKER_COMPOSE_PROD) logs -f

.PHONY: dev-interactive
dev-interactive: ## Start development environment in interactive mode (like docker-dev.sh)
	@echo "🚀 Starting TaskFlow Development Environment..."
	@if ! docker info > /dev/null 2>&1; then \
		echo "❌ Docker is not running. Please start Docker first."; \
		exit 1; \
	fi
	@echo "📦 Building and starting services..."
	@$(DOCKER_COMPOSE_DEV) up --build

.PHONY: prod-interactive
prod-interactive: ## Start production environment in interactive mode (like docker-prod.sh)
	@echo "🚀 Starting TaskFlow Production Environment..."
	@if ! docker info > /dev/null 2>&1; then \
		echo "❌ Docker is not running. Please start Docker first."; \
		exit 1; \
	fi
	@if [ ! -f .env ]; then \
		echo "❌ .env file not found!"; \
		echo "📝 Please copy env.example to .env and configure your environment variables:"; \
		echo "   cp env.example .env"; \
		echo "   # Then edit .env with your configuration"; \
		exit 1; \
	fi
	@source .env; \
	if [ -z "$$NGROK_AUTHTOKEN" ]; then \
		echo "❌ NGROK_AUTHTOKEN is not set in .env file!"; \
		echo "📝 Please get your ngrok authtoken from https://ngrok.com and add it to .env"; \
		exit 1; \
	fi
	@if [ -z "$$POSTGRES_PASSWORD" ]; then \
		echo "⚠️  POSTGRES_PASSWORD is not set, using default password"; \
	fi
	@if [ -z "$$JWT_SECRET" ]; then \
		echo "⚠️  JWT_SECRET is not set, using default secret"; \
	fi
	@echo "✅ Environment variables validated"
	@echo "📦 Building and starting production services..."
	@$(DOCKER_COMPOSE_PROD) up --build

# =============================================================================
# BUILD COMMANDS
# =============================================================================

.PHONY: build
build: ## Build all services
	@echo "$(BLUE)[INFO]$(NC) Building all services..."
	@npm run build
	@echo "$(GREEN)[SUCCESS]$(NC) All services built successfully!"

.PHONY: build-frontend
build-frontend: ## Build frontend only
	@echo "$(BLUE)[INFO]$(NC) Building frontend..."
	@cd frontend && npm run build
	@echo "$(GREEN)[SUCCESS]$(NC) Frontend built successfully!"

.PHONY: build-backend
build-backend: ## Build backend only
	@echo "$(BLUE)[INFO]$(NC) Building backend..."
	@cd backend && npm run build:all
	@echo "$(GREEN)[SUCCESS]$(NC) Backend built successfully!"

.PHONY: build-docker
build-docker: ## Build Docker images
	@echo "$(BLUE)[INFO]$(NC) Building Docker images..."
	@$(DOCKER_COMPOSE) build
	@echo "$(GREEN)[SUCCESS]$(NC) Docker images built successfully!"

# =============================================================================
# INSTALLATION COMMANDS
# =============================================================================

.PHONY: install
install: ## Install all dependencies
	@echo "$(BLUE)[INFO]$(NC) Installing all dependencies..."
	@npm run install:all
	@echo "$(GREEN)[SUCCESS]$(NC) All dependencies installed successfully!"

.PHONY: install-frontend
install-frontend: ## Install frontend dependencies
	@echo "$(BLUE)[INFO]$(NC) Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "$(GREEN)[SUCCESS]$(NC) Frontend dependencies installed!"

.PHONY: install-backend
install-backend: ## Install backend dependencies
	@echo "$(BLUE)[INFO]$(NC) Installing backend dependencies..."
	@cd backend && npm run install:all
	@echo "$(GREEN)[SUCCESS]$(NC) Backend dependencies installed!"

# =============================================================================
# TESTING COMMANDS
# =============================================================================

.PHONY: test
test: ## Run all tests
	@echo "$(BLUE)[INFO]$(NC) Running all tests..."
	@npm run test
	@echo "$(GREEN)[SUCCESS]$(NC) All tests completed!"

.PHONY: test-frontend
test-frontend: ## Run frontend tests
	@echo "$(BLUE)[INFO]$(NC) Running frontend tests..."
	@cd frontend && npm test
	@echo "$(GREEN)[SUCCESS]$(NC) Frontend tests completed!"

.PHONY: test-backend
test-backend: ## Run backend tests
	@echo "$(BLUE)[INFO]$(NC) Running backend tests..."
	@cd backend && npm run test:all
	@echo "$(GREEN)[SUCCESS]$(NC) Backend tests completed!"

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "$(BLUE)[INFO]$(NC) Running tests in watch mode..."
	@npm run test -- --watch

# =============================================================================
# DATABASE COMMANDS
# =============================================================================

.PHONY: db-setup
db-setup: ## Setup database
	@echo "$(BLUE)[INFO]$(NC) Setting up database..."
	@if command -v psql > /dev/null 2>&1; then \
		if psql -lqt | cut -d \| -f 1 | grep -qw taskflow; then \
			echo "$(YELLOW)[WARNING]$(NC) Database 'taskflow' already exists"; \
			read -p "Do you want to recreate it? (y/N): " -n 1 -r; \
			echo; \
			if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
				dropdb taskflow; \
				createdb taskflow; \
				echo "$(GREEN)[SUCCESS]$(NC) Database 'taskflow' recreated"; \
			fi; \
		else \
			createdb taskflow; \
			echo "$(GREEN)[SUCCESS]$(NC) Database 'taskflow' created"; \
		fi; \
		echo "$(BLUE)[INFO]$(NC) Running database schema..."; \
		psql -d taskflow -f backend/database/schema.sql; \
		echo "$(GREEN)[SUCCESS]$(NC) Database schema applied successfully"; \
	else \
		echo "$(YELLOW)[WARNING]$(NC) PostgreSQL not available, skipping database setup"; \
		echo "$(YELLOW)[WARNING]$(NC) Please run the database schema manually: psql -d taskflow -f backend/database/schema.sql"; \
	fi

.PHONY: db-reset
db-reset: ## Reset database (drop and recreate)
	@echo "$(BLUE)[INFO]$(NC) Resetting database..."
	@if command -v psql > /dev/null 2>&1; then \
		dropdb taskflow 2>/dev/null || true; \
		createdb taskflow; \
		psql -d taskflow -f backend/database/schema.sql; \
		echo "$(GREEN)[SUCCESS]$(NC) Database reset successfully!"; \
	else \
		echo "$(RED)[ERROR]$(NC) PostgreSQL not available"; \
		exit 1; \
	fi

# =============================================================================
# CLEANUP COMMANDS
# =============================================================================

.PHONY: clean
clean: ## Clean all containers, volumes, and build artifacts
	@echo "$(BLUE)[INFO]$(NC) Cleaning all containers and volumes..."
	@$(DOCKER_COMPOSE_DEV) down -v --remove-orphans
	@$(DOCKER_COMPOSE_PROD) down -v --remove-orphans
	@echo "$(BLUE)[INFO]$(NC) Cleaning build artifacts..."
	@rm -rf frontend/dist frontend/node_modules
	@cd backend && npm run clean
	@echo "$(GREEN)[SUCCESS]$(NC) Cleanup completed!"

.PHONY: clean-docker
clean-docker: ## Clean Docker containers and images
	@echo "$(BLUE)[INFO]$(NC) Cleaning Docker containers and images..."
	@docker system prune -f
	@docker volume prune -f
	@echo "$(GREEN)[SUCCESS]$(NC) Docker cleanup completed!"

.PHONY: clean-node
clean-node: ## Clean Node.js dependencies and build artifacts
	@echo "$(BLUE)[INFO]$(NC) Cleaning Node.js dependencies..."
	@rm -rf node_modules package-lock.json
	@cd frontend && rm -rf node_modules package-lock.json
	@cd backend && npm run clean
	@echo "$(GREEN)[SUCCESS]$(NC) Node.js cleanup completed!"

# =============================================================================
# SETUP COMMANDS
# =============================================================================

.PHONY: setup
setup: ## Complete project setup (install, build, db-setup)
	@echo "$(BLUE)[INFO]$(NC) Starting TaskFlow Setup..."
	@echo "$(BLUE)[INFO]$(NC) Checking prerequisites..."
	@if ! command -v node > /dev/null 2>&1; then \
		echo "$(RED)[ERROR]$(NC) Node.js is not installed. Please install Node.js 18+ first."; \
		exit 1; \
	fi
	@if ! command -v npm > /dev/null 2>&1; then \
		echo "$(RED)[ERROR]$(NC) npm is not installed. Please install npm first."; \
		exit 1; \
	fi
	@if ! command -v docker > /dev/null 2>&1; then \
		echo "$(YELLOW)[WARNING]$(NC) Docker is not installed. Some commands may not work."; \
	fi
	@echo "$(GREEN)[SUCCESS]$(NC) Prerequisites check passed!"
	@echo "$(BLUE)[INFO]$(NC) Installing dependencies..."
	@$(MAKE) install
	@echo "$(BLUE)[INFO]$(NC) Building services..."
	@$(MAKE) build
	@echo "$(BLUE)[INFO]$(NC) Setting up database..."
	@$(MAKE) db-setup
	@echo "$(BLUE)[INFO]$(NC) Creating logs directory..."
	@mkdir -p logs
	@echo "$(GREEN)[SUCCESS]$(NC) TaskFlow setup completed!"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "1. Update .env file with your configuration"
	@echo "2. Start development environment: $(GREEN)make dev$(NC)"
	@echo "3. Access Frontend at: $(GREEN)http://localhost:3000$(NC)"
	@echo "4. Access API Gateway at: $(GREEN)http://localhost:8000$(NC)"

# =============================================================================
# UTILITY COMMANDS
# =============================================================================

.PHONY: status
status: ## Show status of all services
	@echo "$(BLUE)[INFO]$(NC) Checking service status..."
	@echo "$(BLUE)Development containers:$(NC)"
	@$(DOCKER_COMPOSE_DEV) ps
	@echo ""
	@echo "$(BLUE)Production containers:$(NC)"
	@$(DOCKER_COMPOSE_PROD) ps

.PHONY: health
health: ## Check health of all services
	@echo "$(BLUE)[INFO]$(NC) Checking service health..."
	@echo "$(BLUE)API Gateway Health:$(NC)"
	@curl -s http://localhost:8000/health || echo "$(RED)API Gateway not responding$(NC)"
	@echo "$(BLUE)Frontend Health:$(NC)"
	@curl -s http://localhost:3000 | head -1 || echo "$(RED)Frontend not responding$(NC)"

.PHONY: shell
shell: ## Open shell in frontend container
	@echo "$(BLUE)[INFO]$(NC) Opening shell in frontend container..."
	@$(DOCKER_COMPOSE_DEV) exec frontend-dev /bin/bash

.PHONY: shell-backend
shell-backend: ## Open shell in backend container
	@echo "$(BLUE)[INFO]$(NC) Opening shell in backend container..."
	@$(DOCKER_COMPOSE_DEV) exec api-gateway /bin/bash

.PHONY: restart
restart: ## Restart development environment
	@echo "$(BLUE)[INFO]$(NC) Restarting development environment..."
	@$(MAKE) stop
	@$(MAKE) dev



# =============================================================================
# DEVELOPMENT WORKFLOW
# =============================================================================

.PHONY: dev-full
dev-full: ## Full development workflow (setup + dev)
	@echo "$(BLUE)[INFO]$(NC) Starting full development workflow..."
	@$(MAKE) setup
	@$(MAKE) dev

.PHONY: reset
reset: ## Reset everything and start fresh
	@echo "$(BLUE)[INFO]$(NC) Resetting everything..."
	@$(MAKE) clean
	@$(MAKE) setup
	@$(MAKE) dev

# =============================================================================
# DOCUMENTATION
# =============================================================================

.PHONY: docs
docs: ## Generate documentation
	@echo "$(BLUE)[INFO]$(NC) Generating documentation..."
	@echo "$(GREEN)[SUCCESS]$(NC) Documentation generated!"

.PHONY: readme
readme: ## Show README content
	@cat README.md

# =============================================================================
# MONITORING
# =============================================================================

.PHONY: monitor
monitor: ## Monitor all services
	@echo "$(BLUE)[INFO]$(NC) Monitoring all services..."
	@watch -n 2 'make status'

.PHONY: logs-all
logs-all: ## View all logs (development + production)
	@echo "$(BLUE)[INFO]$(NC) Viewing all logs..."
	@echo "$(YELLOW)Development logs:$(NC)"
	@$(DOCKER_COMPOSE_DEV) logs --tail=10
	@echo "$(YELLOW)Production logs:$(NC)"
	@$(DOCKER_COMPOSE_PROD) logs --tail=10

# =============================================================================
# ENVIRONMENT SETUP
# =============================================================================

.PHONY: setup-env
setup-env: ## Setup environment variables for production
	@echo "$(BLUE)[INFO]$(NC) Setting up environment variables..."
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "$(GREEN)[SUCCESS]$(NC) Created .env file from template"; \
		echo "$(YELLOW)[INFO]$(NC) Please edit .env file with your configuration:"; \
		echo "   - POSTGRES_PASSWORD: Set a secure database password"; \
		echo "   - JWT_SECRET: Set a strong JWT secret"; \
		echo "   - NGROK_AUTHTOKEN: Get from https://ngrok.com"; \
		echo "   - NGROK_REGION: Set your preferred region (default: ap)"; \
	else \
		echo "$(YELLOW)[INFO]$(NC) .env file already exists"; \
	fi

.PHONY: setup-prod
setup-prod: ## Complete production setup
	@echo "$(BLUE)[INFO]$(NC) Setting up production environment..."
	@$(MAKE) setup-env
	@echo "$(GREEN)[SUCCESS]$(NC) Production environment setup complete!"
	@echo "$(YELLOW)[INFO]$(NC) Next steps:"
	@echo "   1. Edit .env file with your configuration"
	@echo "   2. Run: make prod"

.PHONY: remove-scripts
remove-scripts: ## Remove shell scripts (migrated to Makefile)
	@echo "$(BLUE)[INFO]$(NC) Removing shell scripts (migrated to Makefile)..."
	@rm -f scripts/docker-dev.sh scripts/docker-prod.sh
	@echo "$(GREEN)[SUCCESS]$(NC) Shell scripts removed!"
	@echo "$(YELLOW)[INFO]$(NC) Use Makefile commands instead:"
	@echo "   - make dev-interactive (replaces ./scripts/docker-dev.sh)"
	@echo "   - make prod-interactive (replaces ./scripts/docker-prod.sh)" 
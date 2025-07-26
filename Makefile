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
		echo "$(GREEN)🌐 Frontend:$(NC) http://localhost:23000"; \
		echo "$(GREEN)🔌 API Gateway:$(NC) http://localhost:28000"; \
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
	@$(DOCKER_COMPOSE_DEV) logs -f frontend

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
	@echo "$(BLUE)[INFO]$(NC) Stopping existing containers..."
	@$(DOCKER_COMPOSE_PROD) --profile ngrok down
	@echo "$(BLUE)[INFO]$(NC) Building and starting production environment..."
	@$(DOCKER_COMPOSE_PROD) --profile ngrok up --build -d
	@echo "$(BLUE)[INFO]$(NC) Waiting for services to be ready..."
	@sleep 15
	@echo "$(BLUE)[INFO]$(NC) Getting ngrok URL..."
	@if [ -f scripts/get-ngrok-url.sh ]; then \
		chmod +x scripts/get-ngrok-url.sh; \
		./scripts/get-ngrok-url.sh; \
	else \
		echo "$(YELLOW)[WARNING]$(NC) get-ngrok-url.sh script not found. Please manually check ngrok URL at http://localhost:24040"; \
	fi
	@echo "$(BLUE)[INFO]$(NC) Checking environment configuration..."
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)[INFO]$(NC) .env file not found, creating from template..."; \
		if [ -f env.example ]; then \
			cp env.example .env; \
			if [ -f .env ]; then \
				echo "$(GREEN)[SUCCESS]$(NC) Created .env file from template"; \
				echo "$(YELLOW)[WARNING]$(NC) Using default values. For production, please edit .env file with your configuration:"; \
				echo "   - POSTGRES_PASSWORD: Set a secure database password"; \
				echo "   - JWT_SECRET: Set a strong JWT secret"; \
				echo "   - NGROK_AUTHTOKEN: Get from https://ngrok.com"; \
				echo "   - NGROK_REGION: Set your preferred region (us, eu, ap, au, sa, jp, in)"; \
				echo "     For Indonesia, use 'ap' (Asia Pacific) for best performance"; \
				echo ""; \
				echo "$(BLUE)[INFO]$(NC) Starting with default configuration..."; \
			else \
				echo "$(RED)[ERROR]$(NC) Failed to create .env file from template"; \
				exit 1; \
			fi; \
		else \
			echo "$(RED)[ERROR]$(NC) env.example file not found!"; \
			echo "$(YELLOW)[INFO]$(NC) Please create env.example file first"; \
			exit 1; \
		fi; \
	fi
	@echo "$(BLUE)[INFO]$(NC) Validating environment variables..."
	@if [ -f .env ] && [ -r .env ]; then \
		echo "$(BLUE)[INFO]$(NC) Loading environment variables from .env file..."; \
		export $$(cat .env | grep -v '^#' | grep -v '^$$' | xargs); \
		if [ -z "$$NGROK_AUTHTOKEN" ]; then \
			echo "$(YELLOW)[WARNING]$(NC) NGROK_AUTHTOKEN is not set, ngrok will not work"; \
			echo "$(YELLOW)[INFO]$(NC) To enable ngrok, get your authtoken from https://ngrok.com and add it to .env"; \
			echo "$(BLUE)[INFO]$(NC) Continuing without ngrok..."; \
		fi; \
		if [ -z "$$POSTGRES_PASSWORD" ]; then \
			echo "$(YELLOW)[WARNING]$(NC) POSTGRES_PASSWORD is not set, using default password"; \
		fi; \
		if [ -z "$$JWT_SECRET" ]; then \
			echo "$(YELLOW)[WARNING]$(NC) JWT_SECRET is not set, using default secret"; \
		fi; \
	else \
		echo "$(RED)[ERROR]$(NC) .env file not found or not readable!"; \
		echo "$(BLUE)[INFO]$(NC) Checking file status..."; \
		ls -la .env 2>/dev/null || echo "$(YELLOW)[INFO]$(NC) .env file does not exist"; \
		exit 1; \
	fi
	@echo "$(GREEN)[SUCCESS]$(NC) Environment configuration validated"
	@echo "$(BLUE)[INFO]$(NC) Building and starting production environment..."
	@$(DOCKER_COMPOSE_PROD) up --build -d
	@echo "$(GREEN)[SUCCESS]$(NC) Production environment started!"
	@echo "$(GREEN)🌐 Frontend:$(NC) http://localhost:23000"
	@echo "$(GREEN)🔌 API Gateway:$(NC) http://localhost:28000"
	@if [ -f .env ] && [ -r .env ]; then \
		export $$(cat .env | grep -v '^#' | grep -v '^$$' | xargs); \
		if [ -n "$$NGROK_AUTHTOKEN" ]; then \
			echo "$(BLUE)[INFO]$(NC) Starting ngrok with authtoken..."; \
			$(DOCKER_COMPOSE_PROD) --profile ngrok up -d ngrok; \
			echo "$(GREEN)🌍 Ngrok Web Interface:$(NC) http://localhost:24040"; \
			echo "$(BLUE)[INFO]$(NC) Check ngrok web interface for public URL"; \
		else \
			echo "$(YELLOW)[INFO]$(NC) Ngrok not configured. To enable, add NGROK_AUTHTOKEN to .env file"; \
			echo "$(YELLOW)[INFO]$(NC) Then run: make prod-ngrok"; \
		fi; \
	else \
		echo "$(YELLOW)[INFO]$(NC) Ngrok not configured. To enable, add NGROK_AUTHTOKEN to .env file"; \
		echo "$(YELLOW)[INFO]$(NC) Then run: make prod-ngrok"; \
	fi

.PHONY: prod-stop
prod-stop: ## Stop production environment including ngrok
	@echo "$(BLUE)[INFO]$(NC) Stopping TaskFlow Production Environment..."
	@echo "$(BLUE)[INFO]$(NC) Stopping all production services including ngrok..."
	@$(DOCKER_COMPOSE_PROD) --profile ngrok down
	@echo "$(GREEN)[SUCCESS]$(NC) Production environment stopped!"
	@echo "$(BLUE)[INFO]$(NC) All containers including ngrok have been stopped."

.PHONY: ngrok-stop
ngrok-stop: ## Stop only ngrok tunnel
	@echo "$(BLUE)[INFO]$(NC) Stopping ngrok tunnel..."
	@$(DOCKER_COMPOSE_PROD) stop ngrok
	@echo "$(GREEN)[SUCCESS]$(NC) Ngrok tunnel stopped!"
	@echo "$(BLUE)[INFO]$(NC) Other production services are still running."

.PHONY: prod-logs
prod-logs: ## View production logs
	@echo "$(BLUE)[INFO]$(NC) Viewing production logs..."
	@$(DOCKER_COMPOSE_PROD) logs -f

.PHONY: prod-ngrok
prod-ngrok: ## Start ngrok for production environment
	@echo "$(BLUE)[INFO]$(NC) Starting ngrok for production environment..."
	@if [ ! -f .env ]; then \
		echo "$(RED)[ERROR]$(NC) .env file not found. Run 'make prod' first."; \
		exit 1; \
	fi
	@if [ -f .env ] && [ -r .env ]; then \
		export $$(cat .env | grep -v '^#' | grep -v '^$$' | xargs); \
		if [ -z "$$NGROK_AUTHTOKEN" ]; then \
			echo "$(RED)[ERROR]$(NC) NGROK_AUTHTOKEN is not set in .env file!"; \
			echo "$(YELLOW)[INFO]$(NC) Please get your ngrok authtoken from https://ngrok.com and add it to .env"; \
			exit 1; \
		fi; \
	else \
		echo "$(RED)[ERROR]$(NC) .env file not found or not readable!"; \
		echo "$(BLUE)[INFO]$(NC) Checking file status..."; \
		ls -la .env 2>/dev/null || echo "$(YELLOW)[INFO]$(NC) .env file does not exist"; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE_PROD) --profile ngrok up -d ngrok
	@echo "$(GREEN)[SUCCESS]$(NC) Ngrok started!"
	@echo "$(GREEN)🌍 Ngrok Web Interface:$(NC) http://localhost:24040"
	@echo "$(BLUE)[INFO]$(NC) Check ngrok web interface for public URL"
	@echo "$(BLUE)[INFO]$(NC) Run 'make ngrok-url' to get the public URL and update frontend"

.PHONY: dev-interactive
dev-interactive: ## Start development environment in interactive mode
	@echo "🚀 Starting TaskFlow Development Environment..."
	@if ! docker info > /dev/null 2>&1; then \
		echo "❌ Docker is not running. Please start Docker first."; \
		exit 1; \
	fi
	@echo "📦 Building and starting services..."
	@$(DOCKER_COMPOSE_DEV) up --build

.PHONY: prod-setup
prod-setup: ## Complete production setup with ngrok integration
	@echo "$(BLUE)[INFO]$(NC) Setting up complete production environment..."
	@echo "$(BLUE)[INFO]$(NC) 1. Starting production services..."
	@$(DOCKER_COMPOSE_PROD) up -d
	@echo "$(BLUE)[INFO]$(NC) 2. Starting ngrok tunnel..."
	@$(MAKE) prod-ngrok
	@echo "$(BLUE)[INFO]$(NC) 3. Getting ngrok URL and updating frontend..."
	@sleep 15
	@$(MAKE) ngrok-url
	@echo "$(GREEN)[SUCCESS]$(NC) Production environment is ready!"
	@echo "$(GREEN)🎉 Your application is now accessible via ngrok tunnel$(NC)"

.PHONY: prod-restart
prod-restart: ## Restart production environment and update ngrok URL
	@echo "$(BLUE)[INFO]$(NC) Restarting production environment..."
	@echo "$(BLUE)[INFO]$(NC) Stopping all services including ngrok..."
	@$(DOCKER_COMPOSE_PROD) --profile ngrok down
	@echo "$(BLUE)[INFO]$(NC) Starting all services including ngrok..."
	@$(DOCKER_COMPOSE_PROD) --profile ngrok up -d
	@echo "$(BLUE)[INFO]$(NC) Waiting for services to be ready..."
	@sleep 15
	@echo "$(BLUE)[INFO]$(NC) Updating ngrok URL..."
	@$(MAKE) ngrok-url
	@echo "$(GREEN)[SUCCESS]$(NC) Production environment restarted!"

.PHONY: prod-status
prod-status: ## Show production environment status
	@echo "$(BLUE)[INFO]$(NC) Production Environment Status:"
	@echo "================================"
	@echo "$(BLUE)📦 Container Status:$(NC)"
	@$(DOCKER_COMPOSE_PROD) ps
	@echo ""
	@echo "$(BLUE)🌐 Ngrok Status:$(NC)"
	@if curl -s http://localhost:24040/api/tunnels > /dev/null 2>&1; then \
		NGROK_URL=$$(curl -s http://localhost:24040/api/tunnels | jq -r '.tunnels[0].public_url'); \
		if [ "$$NGROK_URL" != "null" ] && [ -n "$$NGROK_URL" ]; then \
			echo "$(GREEN)✅ Ngrok is running$(NC)"; \
			echo "$(GREEN)🌍 Public URL: $$NGROK_URL$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Ngrok is running but no tunnel found$(NC)"; \
		fi; \
	else \
		echo "$(RED)❌ Ngrok is not running$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)🔗 Service URLs:$(NC)"
	@echo "$(GREEN)Frontend:$(NC) http://localhost:23000"
	@echo "$(GREEN)API Gateway:$(NC) http://localhost:28000"
	@echo "$(GREEN)Ngrok Web Interface:$(NC) http://localhost:24040"

.PHONY: ngrok-url
ngrok-url: ## Get ngrok URL and update frontend environment
	@echo "$(BLUE)[INFO]$(NC) Getting ngrok URL and updating frontend..."
	@if ! curl -s http://localhost:24040/api/tunnels > /dev/null 2>&1; then \
		echo "$(RED)[ERROR]$(NC) Ngrok is not running. Please start ngrok first with: $(YELLOW)make prod-ngrok$(NC)"; \
		exit 1; \
	fi
	@NGROK_URL=$$(curl -s http://localhost:24040/api/tunnels | jq -r '.tunnels[0].public_url'); \
	if [ "$$NGROK_URL" != "null" ] && [ -n "$$NGROK_URL" ]; then \
		echo "$(GREEN)[SUCCESS]$(NC) Ngrok URL: $$NGROK_URL"; \
		if [ -f .env ]; then \
			sed -i "s|NGROK_URL=.*|NGROK_URL=$$NGROK_URL|g" .env; \
			echo "$(GREEN)[SUCCESS]$(NC) Updated .env file with NGROK_URL=$$NGROK_URL"; \
			echo "$(BLUE)[INFO]$(NC) Restarting frontend container..."; \
			$(DOCKER_COMPOSE_PROD) restart frontend; \
			echo "$(GREEN)[SUCCESS]$(NC) Frontend restarted with new NGROK_URL"; \
			echo "$(GREEN)🌐 Your application is available at: $$NGROK_URL$(NC)"; \
		else \
			echo "$(RED)[ERROR]$(NC) .env file not found"; \
			exit 1; \
		fi; \
	else \
		echo "$(RED)[ERROR]$(NC) Failed to get ngrok URL"; \
		exit 1; \
	fi

.PHONY: prod-interactive
prod-interactive: ## Start production environment in interactive mode
	@echo "🚀 Starting TaskFlow Production Environment..."
	@if ! docker info > /dev/null 2>&1; then \
		echo "❌ Docker is not running. Please start Docker first."; \
		exit 1; \
	fi
	@echo "📝 Checking environment configuration..."
	@if [ ! -f .env ]; then \
		echo "📝 .env file not found, creating from template..."; \
		if [ -f env.example ]; then \
			cp env.example .env; \
			if [ -f .env ]; then \
				echo "✅ Created .env file from template"; \
				echo "⚠️  Using default values. For production, please edit .env file with your configuration:"; \
				echo "   - POSTGRES_PASSWORD: Set a secure database password"; \
				echo "   - JWT_SECRET: Set a strong JWT secret"; \
				echo "   - NGROK_AUTHTOKEN: Get from https://ngrok.com"; \
				echo "   - NGROK_REGION: Set your preferred region (us, eu, ap, au, sa, jp, in)"; \
				echo "     For Indonesia, use 'ap' (Asia Pacific) for best performance"; \
				echo ""; \
				echo "📦 Starting with default configuration..."; \
			else \
				echo "❌ Failed to create .env file from template"; \
				exit 1; \
			fi; \
		else \
			echo "❌ env.example file not found!"; \
			echo "📝 Please create env.example file first"; \
			exit 1; \
		fi; \
	fi
	@if [ -f .env ] && [ -r .env ]; then \
		echo "📝 Loading environment variables from .env file..."; \
		export $$(cat .env | grep -v '^#' | grep -v '^$$' | xargs); \
		if [ -z "$$NGROK_AUTHTOKEN" ]; then \
			echo "⚠️  NGROK_AUTHTOKEN is not set, ngrok will not work"; \
			echo "📝 To enable ngrok, get your authtoken from https://ngrok.com and add it to .env"; \
			echo "📦 Continuing without ngrok..."; \
		fi; \
		if [ -z "$$POSTGRES_PASSWORD" ]; then \
			echo "⚠️  POSTGRES_PASSWORD is not set, using default password"; \
		fi; \
		if [ -z "$$JWT_SECRET" ]; then \
			echo "⚠️  JWT_SECRET is not set, using default secret"; \
		fi; \
	else \
		echo "❌ .env file not found or not readable!"; \
		echo "📝 Checking file status..."; \
		ls -la .env 2>/dev/null || echo "📝 .env file does not exist"; \
		exit 1; \
	fi
	@echo "✅ Environment configuration validated"
	@echo "📦 Building and starting production services..."
	@$(DOCKER_COMPOSE_PROD) up --build
	@if [ -f .env ] && . .env && [ -n "$$NGROK_AUTHTOKEN" ]; then \
		echo "🌍 Ngrok will be available at: http://localhost:24040"; \
	else \
		echo "📝 Ngrok not configured. To enable, add NGROK_AUTHTOKEN to .env file"; \
	fi

# =============================================================================
# BUILD COMMANDS
# =============================================================================

.PHONY: build
build: ## Build all services using Docker
	@echo "$(BLUE)[INFO]$(NC) Building all services using Docker..."
	@$(DOCKER_COMPOSE_DEV) build
	@echo "$(GREEN)[SUCCESS]$(NC) All services built successfully!"

.PHONY: build-frontend
build-frontend: ## Build frontend using Docker
	@echo "$(BLUE)[INFO]$(NC) Building frontend using Docker..."
	@$(DOCKER_COMPOSE_DEV) build frontend-dev
	@echo "$(GREEN)[SUCCESS]$(NC) Frontend built successfully!"

.PHONY: build-backend
build-backend: ## Build backend using Docker
	@echo "$(BLUE)[INFO]$(NC) Building backend using Docker..."
	@$(DOCKER_COMPOSE_DEV) build api-gateway auth-service user-service task-service project-service notification-service tenant-service
	@echo "$(GREEN)[SUCCESS]$(NC) Backend built successfully!"

.PHONY: install
install: ## Install dependencies (rebuild with no cache)
	@echo "$(BLUE)[INFO]$(NC) Installing dependencies using Docker..."
	@$(DOCKER_COMPOSE_DEV) build --no-cache
	@echo "$(GREEN)[SUCCESS]$(NC) All dependencies installed successfully!"

# =============================================================================
# DATABASE COMMANDS
# =============================================================================

.PHONY: db-setup
db-setup: ## Setup database using Docker
	@echo "$(BLUE)[INFO]$(NC) Setting up database using Docker..."
	@$(DOCKER_COMPOSE_DEV) up -d postgres
	@echo "$(BLUE)[INFO]$(NC) Waiting for database to be ready..."
	@sleep 10
	@echo "$(BLUE)[INFO]$(NC) Database should be auto-initialized with schema and seed data"
	@echo "$(GREEN)[SUCCESS]$(NC) Database setup completed!"

.PHONY: db-reset
db-reset: ## Reset database using Docker
	@echo "$(BLUE)[INFO]$(NC) Resetting database using Docker..."
	@$(DOCKER_COMPOSE_DEV) down postgres
	@$(DOCKER_COMPOSE_DEV) volume rm new_postgres_data 2>/dev/null || true
	@$(DOCKER_COMPOSE_DEV) up -d postgres
	@echo "$(BLUE)[INFO]$(NC) Waiting for database to be reinitialized..."
	@sleep 15
	@echo "$(GREEN)[SUCCESS]$(NC) Database reset successfully!"

.PHONY: db-check
db-check: ## Check database status and tables
	@echo "$(BLUE)[INFO]$(NC) Checking database status..."
	@$(DOCKER_COMPOSE_DEV) exec postgres psql -U postgres -d taskflow -c "\dt" || \
		echo "$(RED)[ERROR]$(NC) Database not accessible or tables not found"
	@echo "$(BLUE)[INFO]$(NC) Checking users table..."
	@$(DOCKER_COMPOSE_DEV) exec postgres psql -U postgres -d taskflow -c "SELECT COUNT(*) as user_count FROM users;" || \
		echo "$(RED)[ERROR]$(NC) Users table not found"
	@echo "$(BLUE)[INFO]$(NC) Checking tenants table..."
	@$(DOCKER_COMPOSE_DEV) exec postgres psql -U postgres -d taskflow -c "SELECT COUNT(*) as tenant_count FROM tenants;" || \
		echo "$(RED)[ERROR]$(NC) Tenants table not found"

.PHONY: db-migrate
db-migrate: ## Run database migrations using Docker
	@echo "$(BLUE)[INFO]$(NC) Running database migrations using Docker..."
	@$(DOCKER_COMPOSE_DEV) exec postgres psql -U postgres -d taskflow -f /docker-entrypoint-initdb.d/migrations.sql
	@echo "$(GREEN)[SUCCESS]$(NC) Database migrations completed!"

# =============================================================================
# CLEANUP COMMANDS
# =============================================================================

.PHONY: clean
clean: ## Clean all containers, volumes, and build artifacts
	@echo "$(BLUE)[INFO]$(NC) Cleaning all containers and volumes..."
	@$(DOCKER_COMPOSE_DEV) down -v --remove-orphans
	@$(DOCKER_COMPOSE_PROD) down -v --remove-orphans
	@echo "$(BLUE)[INFO]$(NC) Cleaning build artifacts..."
	@docker system prune -f
	@docker volume prune -f
	@echo "$(GREEN)[SUCCESS]$(NC) Cleanup completed!"

# =============================================================================
# SETUP COMMANDS
# =============================================================================

.PHONY: setup
setup: ## Complete project setup using Docker
	@echo "$(BLUE)[INFO]$(NC) Starting TaskFlow Setup..."
	@echo "$(BLUE)[INFO]$(NC) Checking prerequisites..."
	@if ! command -v docker > /dev/null 2>&1; then \
		echo "$(RED)[ERROR]$(NC) Docker is not installed. Please install Docker first."; \
		exit 1; \
	fi
	@if ! docker info > /dev/null 2>&1; then \
		echo "$(RED)[ERROR]$(NC) Docker is not running. Please start Docker first."; \
		exit 1; \
	fi
	@echo "$(GREEN)[SUCCESS]$(NC) Prerequisites check passed!"
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
	@echo "3. Access Frontend at: $(GREEN)http://localhost:23000$(NC)"
	@echo "4. Access API Gateway at: $(GREEN)http://localhost:28000$(NC)"

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
		echo "   - NGROK_REGION: Set your preferred region (us, eu, ap, au, sa, jp, in)"; \
		echo "     For Indonesia, use 'ap' (Asia Pacific) for best performance"; \
	else \
		echo "$(YELLOW)[INFO]$(NC) .env file already exists"; \
	fi

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
health: ## Check health of all services using Docker
	@echo "$(BLUE)[INFO]$(NC) Checking service health..."
	@echo "$(BLUE)API Gateway Health:$(NC)"
	@$(DOCKER_COMPOSE_DEV) exec api-gateway curl -s http://localhost:8000/health 2>/dev/null || echo "$(RED)API Gateway not responding$(NC)"
	@echo "$(BLUE)Frontend Health:$(NC)"
	@$(DOCKER_COMPOSE_DEV) exec frontend-dev curl -s http://localhost:3000 2>/dev/null | head -1 || echo "$(RED)Frontend not responding$(NC)"

.PHONY: shell
shell: ## Open shell in frontend container
	@echo "$(BLUE)[INFO]$(NC) Opening shell in frontend container..."
	@$(DOCKER_COMPOSE_DEV) exec frontend-dev /bin/bash

.PHONY: shell-backend
shell-backend: ## Open shell in backend container
	@echo "$(BLUE)[INFO]$(NC) Opening shell in backend container..."
	@$(DOCKER_COMPOSE_DEV) exec api-gateway /bin/bash

.PHONY: shell-db
shell-db: ## Open shell in database container
	@echo "$(BLUE)[INFO]$(NC) Opening shell in database container..."
	@$(DOCKER_COMPOSE_DEV) exec postgres psql -U postgres -d taskflow

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
# MONITORING
# =============================================================================

.PHONY: logs-all
logs-all: ## View all logs (development + production)
	@echo "$(BLUE)[INFO]$(NC) Viewing all logs..."
	@echo "$(YELLOW)Development logs:$(NC)"
	@$(DOCKER_COMPOSE_DEV) logs --tail=10
	@echo "$(YELLOW)Production logs:$(NC)"
	@$(DOCKER_COMPOSE_PROD) logs --tail=10

# =============================================================================
# CODE QUALITY COMMANDS
# =============================================================================

.PHONY: type-check
type-check: ## Run TypeScript type checking in containers
	@echo "$(BLUE)[INFO]$(NC) Running TypeScript type checking in containers..."
	@$(DOCKER_COMPOSE_DEV) run --rm frontend-dev npm run build
	@$(DOCKER_COMPOSE_DEV) run --rm api-gateway npm run build
	@echo "$(GREEN)[SUCCESS]$(NC) Type checking completed!"

.PHONY: readme
readme: ## Show README content
	@cat README.md 
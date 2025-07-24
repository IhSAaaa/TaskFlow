#!/bin/bash

# TaskFlow Microservices Setup Script
# This script will set up all the necessary components for the TaskFlow backend

set -e

echo "🚀 Starting TaskFlow Microservices Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm $(npm -v) is installed"
}

# Check if PostgreSQL is installed
check_postgresql() {
    print_status "Checking PostgreSQL installation..."
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL is not installed. Please install PostgreSQL 14+ first."
        print_warning "You can install it using: sudo apt-get install postgresql postgresql-contrib"
        read -p "Do you want to continue without PostgreSQL? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "PostgreSQL is installed"
    fi
}

# Setup environment file
setup_env() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        print_success "Created .env file from template"
        print_warning "Please update .env file with your configuration"
    else
        print_warning ".env file already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies for all services..."
    
    # Install root dependencies
    npm install
    
    # Install shared dependencies first
    print_status "Installing shared dependencies..."
    cd shared && npm install && npm run build && cd ..
    
    # Install testing dependencies
    print_status "Installing testing dependencies..."
    npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
    
    # Install all service dependencies
    print_status "Installing service dependencies..."
    npm run install:all
    
    print_success "All dependencies installed successfully"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if command -v psql &> /dev/null; then
        # Check if database exists
        if psql -lqt | cut -d \| -f 1 | grep -qw taskflow; then
            print_warning "Database 'taskflow' already exists"
            read -p "Do you want to recreate it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                dropdb taskflow
                createdb taskflow
                print_success "Database 'taskflow' recreated"
            fi
        else
            createdb taskflow
            print_success "Database 'taskflow' created"
        fi
        
        # Run schema
        print_status "Running database schema..."
        psql -d taskflow -f database/schema.sql
        print_success "Database schema applied successfully"
    else
        print_warning "PostgreSQL not available, skipping database setup"
        print_warning "Please run the database schema manually: psql -d taskflow -f database/schema.sql"
    fi
}

# Build all services
build_services() {
    print_status "Building all services..."
    npm run build:all
    print_success "All services built successfully"
}

# Create logs directory
create_logs() {
    print_status "Creating logs directory..."
    mkdir -p logs
    print_success "Logs directory created"
}

# Show next steps
show_next_steps() {
    echo
    echo "🎉 TaskFlow Microservices Setup Complete!"
    echo
    echo "Next steps:"
    echo "1. Update .env file with your configuration"
    echo "2. Start all services: npm run dev:all"
    echo "3. Access API Gateway at: http://localhost:8000"
    echo "4. Check health endpoint: http://localhost:8000/health"
    echo
    echo "Available commands:"
    echo "  npm run dev:all          - Start all services in development mode"
    echo "  npm run build:all        - Build all services"
    echo "  npm run start:all        - Start all services in production mode"
    echo "  npm run test:all         - Run tests for all services"
    echo
    echo "Individual service commands:"
    echo "  npm run dev:gateway      - Start API Gateway only"
    echo "  npm run dev:task         - Start Task Service only"
    echo "  npm run dev:project      - Start Project Service only"
    echo "  npm run dev:notification - Start Notification Service only"
    echo "  npm run dev:tenant       - Start Tenant Service only"
    echo
    echo "Documentation: README.md"
}

# Main setup function
main() {
    echo "TaskFlow Microservices Setup"
    echo "============================"
    echo
    
    check_nodejs
    check_npm
    check_postgresql
    setup_env
    install_dependencies
    setup_database
    build_services
    create_logs
    show_next_steps
}

# Run main function
main "$@" 
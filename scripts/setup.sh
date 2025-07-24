#!/bin/bash

# TaskFlow Project Setup Script
echo "🚀 Setting up TaskFlow project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Some features may not work."
else
    print_status "Docker is installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose is not installed. Some features may not work."
else
    print_status "Docker Compose is installed"
fi

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install backend shared dependencies
print_status "Installing backend shared dependencies..."
cd backend/shared
npm install
cd ../..

# Install auth service dependencies
print_status "Installing auth service dependencies..."
cd backend/auth-service
npm install
cd ../..

# Create environment files
print_status "Creating environment files..."

# Backend auth service .env
cat > backend/auth-service/.env << EOF
NODE_ENV=development
AUTH_SERVICE_PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow
DB_USER=postgres
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EOF

# Frontend .env
cat > frontend/.env << EOF
VITE_API_URL=http://localhost:8000
EOF

print_status "Environment files created"

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Set up database (if Docker is available)
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_status "Starting PostgreSQL and Redis with Docker..."
    docker-compose up postgres redis -d
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
else
    print_warning "Docker not available. Please start PostgreSQL and Redis manually."
fi

# Build shared package
print_status "Building shared package..."
cd backend/shared
npm run build
cd ../..

print_status "Setup completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "1. Start the development servers: npm run dev"
echo "2. Access the application at: http://localhost:3000"
echo "3. API Gateway will be available at: http://localhost:8000"
echo ""
echo "For more information, see docs/development.md" 
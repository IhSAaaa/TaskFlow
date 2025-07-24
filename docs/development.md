# Development Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (optional - Docker will provide this)
- Redis (optional - Docker will provide this)
- Git

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd taskflow
```

### 2. Quick Start with Docker (Recommended)

The easiest way to get started is using Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker ps

# Access the application
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8000
# Health Check: http://localhost:8000/health
```

### 3. Manual Development Setup

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run the automated setup script
chmod +x setup.sh
./setup.sh

# This script will:
# - Check prerequisites (Node.js, npm, PostgreSQL)
# - Install all dependencies
# - Setup database schema
# - Build all services
# - Create necessary directories

# Start all services in development mode
npm run dev:all

# Or start individual services
npm run dev:gateway      # API Gateway
npm run dev:auth         # Auth Service
npm run dev:user         # User Service
npm run dev:task         # Task Service
npm run dev:project      # Project Service
npm run dev:notification # Notification Service
npm run dev:tenant       # Tenant Service
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Access frontend at http://localhost:3000
```

### 4. Environment Configuration

The setup script will create a `.env` file, but you can customize it:

#### Backend Environment Variables
```bash
# backend/.env
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Service Ports
GATEWAY_PORT=8000
AUTH_SERVICE_PORT=3001
USER_SERVICE_PORT=3002
TASK_SERVICE_PORT=3003
PROJECT_SERVICE_PORT=3004
NOTIFICATION_SERVICE_PORT=3005
TENANT_SERVICE_PORT=3006
```

#### Frontend Environment Variables
```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```

## Development Workflow

### Backend Development

#### Service Structure
Each microservice follows the same structure:
```
service-name/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── index.ts         # Service entry point
├── package.json
├── tsconfig.json
└── Dockerfile
```

#### Shared Code
Common utilities are in `backend/shared/`:
```
shared/
├── src/
│   ├── utils/           # Utility functions
│   ├── middleware/      # Shared middleware
│   ├── types/           # TypeScript types
│   └── config/          # Configuration
├── package.json
└── tsconfig.json
```

#### Development Commands
```bash
# Install dependencies for all services
npm run install:all

# Build all services
npm run build:all

# Start all services in development
npm run dev:all

# Run tests for all services
npm run test:all

# Clean all services
npm run clean
```

### Frontend Development

#### Component Structure
```
frontend/src/
├── components/          # Reusable components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── ProtectedRoute.tsx
│   └── NotificationCenter.tsx
├── pages/              # Page components
│   ├── DashboardPage.tsx
│   ├── TasksPage.tsx
│   ├── ProjectsPage.tsx
│   ├── ProfilePage.tsx
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   └── TenantContext.tsx
├── services/           # API calls
├── hooks/              # Custom React hooks
├── types/              # TypeScript types
└── utils/              # Utility functions
```

#### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run linting
npm run lint
```

## API Development

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <token>
```

### Multi-Tenancy

Each request must include tenant information:
```bash
# Via header (recommended)
X-Tenant-ID: <tenant-id>
X-User-ID: <user-id>

# Example API call
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440001" \
  -d '{"title":"Sample Task","project_id":"project-uuid"}'
```

### Error Handling

Standard error response format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Health Checks

All services provide health check endpoints:
- API Gateway: `http://localhost:8000/health`
- Auth Service: `http://localhost:3001/health`
- User Service: `http://localhost:3002/health`
- Task Service: `http://localhost:3003/health`
- Project Service: `http://localhost:3004/health`
- Notification Service: `http://localhost:3005/health`
- Tenant Service: `http://localhost:3006/health`

## Testing

### Backend Testing

```bash
# Run all tests
npm run test:all

# Run specific service tests
npm run test:gateway
npm run test:auth
npm run test:user
npm run test:task
npm run test:project
npm run test:notification
npm run test:tenant
```

### Frontend Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### API Testing

```bash
# Test health endpoints
curl http://localhost:8000/health

# Test task creation
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440001" \
  -d '{"title":"Test Task","project_id":"project-uuid"}'

# Test project listing
curl http://localhost:8000/api/projects \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000"
```

## Docker Development

### Build Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build auth-service
docker-compose build frontend
```

### Run with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f auth-service

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Docker Commands

```bash
# Check service health
docker ps

# Execute commands in containers
docker exec -it taskflow-auth-service sh
docker exec -it taskflow-frontend sh

# View container logs
docker logs taskflow-api-gateway
docker logs taskflow-frontend
```

## Code Quality

### Linting

```bash
# Backend (individual services)
cd backend/auth-service && npm run lint
cd backend/task-service && npm run lint

# Frontend
cd frontend && npm run lint
```

### Formatting

```bash
# Backend (individual services)
cd backend/auth-service && npm run format
cd backend/task-service && npm run format

# Frontend
cd frontend && npm run format
```

### Type Checking

```bash
# Backend (individual services)
cd backend/auth-service && npm run type-check
cd backend/task-service && npm run type-check

# Frontend
cd frontend && npm run type-check
```

## Debugging

### Backend Debugging

1. **VS Code Debugger**: Use the provided launch configurations
2. **Console Logging**: Use the Winston logger
   ```typescript
   logger.debug('Debug message');
   logger.info('Info message');
   logger.warn('Warning message');
   logger.error('Error message');
   ```
3. **Add Debugger Statements**: Use `debugger;` in your code

### Frontend Debugging

1. **React DevTools**: Install React Developer Tools browser extension
2. **Browser Dev Tools**: Use browser's developer tools
3. **Console Logging**: Use `console.log`, `console.warn`, `console.error`
4. **React Query DevTools**: Available in development mode

### Database Debugging

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d taskflow

# View tables
\dt

# Query data
SELECT * FROM users LIMIT 5;
SELECT * FROM tasks LIMIT 5;
```

## Common Issues

### Port Conflicts

If ports are already in use:

```bash
# Find process using port
lsof -i :3000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different ports in .env
```

### Database Connection Issues

1. **Check if PostgreSQL is running**:
   ```bash
   docker-compose ps postgres
   ```

2. **Verify connection details** in `.env`

3. **Reset database**:
   ```bash
   docker-compose down -v
   docker-compose up -d postgres
   ```

### Docker Issues

1. **Clean up containers**:
   ```bash
   docker-compose down -v
   docker system prune -a
   ```

2. **Rebuild images**:
   ```bash
   docker-compose build --no-cache
   ```

3. **Check Docker logs**:
   ```bash
   docker-compose logs <service>
   ```

### Health Check Issues

If services show as "unhealthy":

1. **Check if curl is available** in containers
2. **Verify health check endpoints** are responding
3. **Check service logs** for errors
4. **Restart services**:
   ```bash
   docker-compose restart <service>
   ```

## Performance Optimization

### Backend Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Connection Pooling**: Configure database connection pools
3. **Caching**: Use Redis for caching frequently accessed data
4. **Query Optimization**: Monitor slow queries and optimize them

### Frontend Optimization

1. **Code Splitting**: Use React.lazy for route-based code splitting
2. **Bundle Analysis**: Analyze bundle size with `npm run build:analyze`
3. **Image Optimization**: Optimize images and use appropriate formats
4. **Caching**: Implement proper caching strategies

## Deployment

### Development Deployment

```bash
# Build and start with Docker
docker-compose up -d

# Check health
docker ps
```

### Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy with Kubernetes
kubectl apply -f k8s/
```

## Contributing

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** and test thoroughly

3. **Run tests**:
   ```bash
   npm run test:all
   ```

4. **Commit your changes**:
   ```bash
   git commit -m 'Add amazing feature'
   ```

5. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

## Resources

- [Architecture Documentation](./architecture.md)
- [Security Documentation](./SECURITY.md)
- [API Documentation](../backend/README.md)
- [Implementation Summary](../backend/IMPLEMENTATION_SUMMARY.md)
- [Docker Documentation](https://docs.docker.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/) 
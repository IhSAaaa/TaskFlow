# TaskFlow Backend Microservices

## Overview

TaskFlow is a modern, multi-tenant task management and collaboration platform built with microservices architecture. The backend consists of 7 independent services that work together to provide comprehensive project and task management capabilities with real-time collaboration features.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Microservices │
│   (React 18)    │◄──►│   (Port 8000)   │◄──►│   (Port 3001-6) │
│   (Port 3000)   │    │   (Express)     │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Auth Service │ │User Service │ │Task Service│
        │   (Port 3001)│ │  (Port 3002)│ │ (Port 3003)│
        └──────────────┘ └─────────────┘ └────────────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │Project Service│ │Notification │ │Tenant Service│
        │  (Port 3004) │ │  (Port 3005)│ │ (Port 3006)│
        └──────────────┘ └─────────────┘ └────────────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                        ┌───────▼──────┐
                        │  PostgreSQL  │
                        │   Database   │
                        │ (Multi-tenant│
                        │   Schema)    │
                        └──────────────┘
                                │
                        ┌───────▼──────┐
                        │    Redis     │
                        │   Cache      │
                        │ (Sessions &  │
                        │  Real-time)  │
                        └──────────────┘
```

## Services

### 1. API Gateway (Port 8000)
- **Location**: `backend/api-gateway/`
- **Purpose**: Single entry point for all client requests with comprehensive routing and security
- **Features**:
  - Request routing to appropriate services
  - Authentication and authorization validation
  - Rate limiting and DDoS protection
  - Error handling and fallback
  - Health check aggregation
  - CORS configuration
  - Request/response logging

### 2. Auth Service (Port 3001)
- **Location**: `backend/auth-service/`
- **Purpose**: Handle user authentication and authorization with JWT management
- **Features**:
  - User registration and login
  - JWT token generation and validation
  - Password hashing and verification
  - Session management
  - Token refresh mechanism
  - Multi-tenant authentication

### 3. User Service (Port 3002)
- **Location**: `backend/user-service/`
- **Purpose**: Manage user profiles and user-related operations
- **Features**:
  - User profile management
  - User search and discovery
  - User preferences and settings
  - User activity tracking
  - Avatar management
  - Multi-tenant user isolation

### 4. Task Service (Port 3003)
- **Location**: `backend/task-service/`
- **Purpose**: Handle comprehensive task-related operations with advanced features
- **Features**:
  - Task CRUD operations
  - Task assignment and reassignment
  - Task status management (Todo, In Progress, Review, Done, Cancelled)
  - Task filtering and search
  - Subtask management
  - Priority management (Low, Medium, High, Urgent)
  - Due date tracking
  - Task comments (structure ready)

### 5. Project Service (Port 3004)
- **Location**: `backend/project-service/`
- **Purpose**: Manage projects and team collaboration with role-based access
- **Features**:
  - Project CRUD operations
  - Team member management
  - Project roles and permissions (Owner, Admin, Member, Viewer)
  - Project progress tracking
  - Project settings management
  - Project analytics and reporting

### 6. Notification Service (Port 3005)
- **Location**: `backend/notification-service/`
- **Purpose**: Handle real-time notifications with Socket.io integration
- **Features**:
  - Real-time notifications via Socket.io
  - Notification preferences management
  - Bulk notifications
  - Notification history
  - Multiple notification types
  - Read/unread status management
  - Email notifications (structure ready)

### 7. Tenant Service (Port 3006)
- **Location**: `backend/tenant-service/`
- **Purpose**: Manage multi-tenancy with comprehensive tenant settings
- **Features**:
  - Tenant creation and management
  - Tenant settings and configuration
  - Plan management (Free, Basic, Professional, Enterprise)
  - Usage tracking and analytics
  - Tenant activation/suspension
  - Plan upgrade/downgrade
  - Customizable features per plan

## API Endpoints

### Auth Service
```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
POST   /api/auth/refresh           - Token refresh
POST   /api/auth/logout            - User logout
GET    /api/auth/validate          - Token validation
```

### User Service
```
GET    /api/users/profile          - Get user profile
PUT    /api/users/profile          - Update user profile
GET    /api/users/search           - Search users
GET    /api/users/:id              - Get user by ID
PUT    /api/users/avatar           - Update avatar
```

### Task Service
```
POST   /api/tasks                  - Create task
GET    /api/tasks                  - Get tasks with filters
GET    /api/tasks/:taskId          - Get specific task
PUT    /api/tasks/:taskId          - Update task
DELETE /api/tasks/:taskId          - Delete task
POST   /api/tasks/:taskId/assign   - Assign task
GET    /api/tasks/project/:projectId - Get tasks by project
GET    /api/tasks/assignee/:assigneeId - Get tasks by assignee
GET    /api/tasks/:taskId/subtasks - Get subtasks
```

### Project Service
```
POST   /api/projects               - Create project
GET    /api/projects               - Get projects with filters
GET    /api/projects/:projectId    - Get specific project
PUT    /api/projects/:projectId    - Update project
DELETE /api/projects/:projectId    - Delete project
GET    /api/projects/:projectId/members - Get project members
POST   /api/projects/:projectId/members - Add project member
PUT    /api/projects/:projectId/members/:memberId - Update member
DELETE /api/projects/:projectId/members/:memberId - Remove member
```

### Notification Service
```
POST   /api/notifications          - Create notification
GET    /api/notifications          - Get notifications
GET    /api/notifications/unread-count - Get unread count
GET    /api/notifications/:id      - Get specific notification
PUT    /api/notifications/:id/read - Mark as read
PUT    /api/notifications/mark-all-read - Mark all as read
DELETE /api/notifications/:id      - Delete notification
GET    /api/notifications/preferences - Get preferences
PUT    /api/notifications/preferences - Update preferences
POST   /api/notifications/bulk     - Send bulk notification
```

### Tenant Service
```
POST   /api/tenants                - Create tenant
GET    /api/tenants                - Get tenants with filters
GET    /api/tenants/domain/:domain - Get tenant by domain
GET    /api/tenants/:id            - Get specific tenant
PUT    /api/tenants/:id            - Update tenant
DELETE /api/tenants/:id            - Delete tenant
GET    /api/tenants/:id/usage      - Get tenant usage
PUT    /api/tenants/:id/settings   - Update tenant settings
PUT    /api/tenants/:id/activate   - Activate tenant
PUT    /api/tenants/:id/suspend    - Suspend tenant
PUT    /api/tenants/:id/upgrade-plan - Upgrade plan
```

## Database Schema

### Core Tables
1. **tenants** - Tenant information, settings, and plan details
2. **users** - User accounts, authentication, and profiles
3. **projects** - Project definitions and metadata
4. **project_members** - Project team members and roles
5. **tasks** - Task definitions, status, and assignments
6. **task_assignments** - Task assignment history
7. **notifications** - User notifications and preferences
8. **notification_preferences** - User notification settings
9. **task_comments** - Task comments (ready for implementation)
10. **files** - File uploads (ready for file service)

### Multi-Tenancy Implementation
- **Tenant Isolation**: All tables include `tenant_id` foreign key
- **Row-Level Security**: Database-level tenant isolation
- **Tenant-Aware Queries**: All queries filter by tenant
- **Tenant Settings**: JSONB field for flexible configuration
- **Plan-Based Features**: Feature flags based on tenant plan

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis
- Docker & Docker Compose (optional)

### Quick Start

```bash
# Navigate to backend directory
cd backend

# Run automated setup
make setup

# Start all services
make dev
```

### Manual Setup

```bash
# Install dependencies for all services
npm run install:all

# Setup database
createdb taskflow
psql -d taskflow -f database/schema.sql

# Configure environment
cp env.example .env
# Edit .env file with your configuration

# Build all services
npm run build:all

# Start all services
npm run dev:all
```

### Individual Services

```bash
# Start specific services
npm run dev:gateway      # API Gateway
npm run dev:auth         # Auth Service
npm run dev:user         # User Service
npm run dev:task         # Task Service
npm run dev:project      # Project Service
npm run dev:notification # Notification Service
npm run dev:tenant       # Tenant Service
```

## Available Scripts

### Development
```bash
npm run dev:all          # Start all services in development
npm run dev:gateway      # Start API Gateway
npm run dev:auth         # Start Auth Service
npm run dev:user         # Start User Service
npm run dev:task         # Start Task Service
npm run dev:project      # Start Project Service
npm run dev:notification # Start Notification Service
npm run dev:tenant       # Start Tenant Service
```

### Building
```bash
npm run build:all        # Build all services
npm run build:gateway    # Build API Gateway
npm run build:auth       # Build Auth Service
npm run build:user       # Build User Service
npm run build:task       # Build Task Service
npm run build:project    # Build Project Service
npm run build:notification # Build Notification Service
npm run build:tenant     # Build Tenant Service
```

### Production
```bash
npm run start:all        # Start all services in production
npm run start:gateway    # Start API Gateway in production
npm run start:auth       # Start Auth Service in production
npm run start:user       # Start User Service in production
npm run start:task       # Start Task Service in production
npm run start:project    # Start Project Service in production
npm run start:notification # Start Notification Service in production
npm run start:tenant     # Start Tenant Service in production
```

### Testing
```bash
npm run test:all         # Run tests for all services
npm run test:gateway     # Test API Gateway
npm run test:auth        # Test Auth Service
npm run test:user        # Test User Service
npm run test:task        # Test Task Service
npm run test:project     # Test Project Service
npm run test:notification # Test Notification Service
npm run test:tenant      # Test Tenant Service
```

### Utilities
```bash
npm run install:all      # Install dependencies for all services
npm run clean            # Clean all services (remove dist and node_modules)
```

## Environment Configuration

### Required Environment Variables

```bash
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

# Service URLs (for Docker networking)
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
TASK_SERVICE_URL=http://task-service:3003
PROJECT_SERVICE_URL=http://project-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005
TENANT_SERVICE_URL=http://tenant-service:3006
```

## Health Checks

All services provide health check endpoints:

- **API Gateway**: `http://localhost:8000/health`
- **Auth Service**: `http://localhost:3001/health`
- **User Service**: `http://localhost:3002/health`
- **Task Service**: `http://localhost:3003/health`
- **Project Service**: `http://localhost:3004/health`
- **Notification Service**: `http://localhost:3005/health`
- **Tenant Service**: `http://localhost:3006/health`

## Testing

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

### Unit Testing

```bash
# Run all tests
npm run test:all

# Run specific service tests
npm run test:task
npm run test:project
```

## Docker Deployment

### Build Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build auth-service
docker-compose build task-service
```

### Run with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Security Features

- **JWT Authentication** with secure token management
- **Multi-tenant isolation** with strict data separation
- **Role-based access control** with granular permissions
- **Rate limiting** and DDoS protection
- **Input validation** and sanitization with Joi
- **Security headers** and CORS configuration
- **Audit logging** for security monitoring

## Performance Optimization

- **Database indexing** on frequently queried columns
- **Connection pooling** for database connections
- **Redis caching** for frequently accessed data
- **Query optimization** with proper SQL practices
- **Health monitoring** for all services

## Current Implementation Status

### ✅ Completed Features
- **All 7 Microservices**: Fully implemented and tested
- **Database Schema**: Comprehensive multi-tenant schema
- **Real-time Features**: Socket.io integration
- **Docker Containerization**: Full containerization with health checks
- **API Gateway**: Complete routing and load balancing
- **Security Implementation**: Comprehensive security measures
- **Health Monitoring**: All services with health checks

### 🔄 In Progress
- Advanced analytics and reporting
- File upload service
- Email integration
- Mobile application

### 📋 Planned Features
- **Advanced Search**: Elasticsearch integration
- **Message Queue**: RabbitMQ for async processing
- **Payment Integration**: Stripe integration
- **Advanced Workflows**: Custom workflow automation
- **Third-party Integrations**: API integrations

## Troubleshooting

### Common Issues

#### Service Not Starting
```bash
# Check if ports are available
lsof -i :3001
lsof -i :8000

# Check service logs
npm run dev:auth
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U postgres -d taskflow
```

#### Health Check Issues
```bash
# Test health endpoints
curl http://localhost:8000/health
curl http://localhost:3001/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Documentation

- [Architecture Documentation](../docs/architecture.md)
- [Development Guide](../docs/development.md)
- [Security Documentation](../docs/SECURITY.md)
- [Deployment Guide](../docs/deployment.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

## Support

For support and questions:
- Check the documentation
- Review the implementation summary
- Open an issue on GitHub

---

**TaskFlow Backend** - Empowering teams with modern microservices architecture. 🚀 
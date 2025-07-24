# TaskFlow Architecture Documentation

## Overview

TaskFlow is a modern, multi-tenant task management and collaboration platform built with microservices architecture. The system is designed to be scalable, maintainable, and production-ready with comprehensive real-time collaboration features.

## Architecture Principles

### 1. Microservices Architecture
- **Service Independence**: Each service can be developed, deployed, and scaled independently
- **Technology Consistency**: All services use Node.js/TypeScript for consistency
- **Fault Isolation**: Failure in one service doesn't bring down the entire system
- **Team Autonomy**: Different teams can work on different services
- **Health Monitoring**: Each service has comprehensive health checks

### 2. Multi-Tenancy
- **Data Isolation**: Each tenant's data is completely isolated at the database level
- **Tenant-Aware Routing**: Requests are routed based on tenant information in headers
- **Customizable Settings**: Each tenant can have different configurations and plans
- **Scalable Billing**: Easy to implement per-tenant billing with usage tracking

### 3. Real-Time Communication
- **Socket.io Integration**: Real-time notifications and updates
- **Event-Driven Architecture**: Services communicate through events
- **Room Management**: Project-based rooms for targeted notifications
- **Presence Tracking**: User online/offline status

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Load Balancer │
│   (React 18)    │◄──►│   (Port 8000)   │◄──►│   (Nginx)       │
│   (Port 3000)   │    │   (Express)     │    │   (Production)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Auth Service │ │User Service │ │Task Service│
        │   (Port 3001)│ │  (Port 3002)│ │ (Port 3003)│
        │   (JWT)      │ │  (Profiles) │ │ (CRUD)     │
        └──────────────┘ └─────────────┘ └────────────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │Project Service│ │Notification │ │Tenant Service│
        │  (Port 3004) │ │  (Port 3005)│ │ (Port 3006)│
        │  (Teams)     │ │ (Socket.io) │ │ (Settings) │
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

## Service Details

### 1. API Gateway (Port 8000)
**Purpose**: Single entry point for all client requests with comprehensive routing and security
**Responsibilities**:
- Request routing to appropriate services
- Authentication and authorization validation
- Rate limiting and DDoS protection
- Request/response transformation
- Error handling and fallback
- Health check aggregation
- CORS configuration

**Technologies**:
- Express.js with TypeScript
- http-proxy-middleware for service routing
- Rate limiting middleware
- Helmet for security headers
- Winston for logging

**Health Check**: `GET /health`

### 2. Auth Service (Port 3001)
**Purpose**: Handle user authentication and authorization with JWT management
**Responsibilities**:
- User registration and login
- JWT token generation and validation
- Password hashing and verification
- Session management
- Token refresh mechanism
- Multi-tenant authentication

**Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/validate` - Token validation

**Health Check**: `GET /health`

### 3. User Service (Port 3002)
**Purpose**: Manage user profiles and user-related operations
**Responsibilities**:
- User profile management
- User search and discovery
- User preferences and settings
- User activity tracking
- Avatar management
- Multi-tenant user isolation

**Endpoints**:
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/avatar` - Update avatar

**Health Check**: `GET /health`

### 4. Task Service (Port 3003)
**Purpose**: Handle comprehensive task-related operations with advanced features
**Responsibilities**:
- Task CRUD operations
- Task assignment and reassignment
- Task status management (Todo, In Progress, Review, Done, Cancelled)
- Task filtering and search
- Subtask management
- Priority management (Low, Medium, High, Urgent)
- Due date tracking
- Task comments (structure ready)

**Endpoints**:
- `GET /api/tasks` - List tasks with filters
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assign` - Assign task
- `GET /api/tasks/project/:projectId` - Get tasks by project
- `GET /api/tasks/assignee/:assigneeId` - Get tasks by assignee
- `GET /api/tasks/:id/subtasks` - Get subtasks

**Health Check**: `GET /health`

### 5. Project Service (Port 3004)
**Purpose**: Manage projects and team collaboration with role-based access
**Responsibilities**:
- Project CRUD operations
- Team member management
- Project roles and permissions (Owner, Admin, Member, Viewer)
- Project progress tracking
- Project settings management
- Project analytics and reporting

**Endpoints**:
- `GET /api/projects` - List projects with filters
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/members` - Get project members
- `POST /api/projects/:id/members` - Add project member
- `PUT /api/projects/:id/members/:memberId` - Update member
- `DELETE /api/projects/:id/members/:memberId` - Remove member

**Health Check**: `GET /health`

### 6. Notification Service (Port 3005)
**Purpose**: Handle real-time notifications with Socket.io integration
**Responsibilities**:
- Real-time notifications via Socket.io
- Notification preferences management
- Bulk notifications
- Notification history
- Multiple notification types
- Read/unread status management
- Email notifications (structure ready)

**Technologies**:
- Socket.io for real-time communication
- Express.js for REST API
- Redis for session management
- Email service integration (ready)

**Endpoints**:
- `POST /api/notifications` - Create notification
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `GET /api/notifications/:id` - Get specific notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences
- `POST /api/notifications/bulk` - Send bulk notification

**Socket.io Events**:
- `authenticate` - User authentication
- `join-project` - Join project room
- `leave-project` - Leave project room
- `notification` - Receive real-time notifications

**Health Check**: `GET /health`

### 7. Tenant Service (Port 3006)
**Purpose**: Manage multi-tenancy with comprehensive tenant settings
**Responsibilities**:
- Tenant creation and management
- Tenant settings and configuration
- Plan management (Free, Basic, Professional, Enterprise)
- Usage tracking and analytics
- Tenant activation/suspension
- Plan upgrade/downgrade
- Customizable features per plan

**Endpoints**:
- `POST /api/tenants` - Create tenant
- `GET /api/tenants` - Get tenants with filters
- `GET /api/tenants/domain/:domain` - Get tenant by domain
- `GET /api/tenants/:id` - Get specific tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant
- `GET /api/tenants/:id/usage` - Get tenant usage
- `PUT /api/tenants/:id/settings` - Update tenant settings
- `PUT /api/tenants/:id/activate` - Activate tenant
- `PUT /api/tenants/:id/suspend` - Suspend tenant
- `PUT /api/tenants/:id/upgrade-plan` - Upgrade plan

**Health Check**: `GET /health`

## Data Architecture

### Database Design

#### Core Tables
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

#### Multi-Tenancy Implementation
- **Tenant Isolation**: All tables include `tenant_id` foreign key
- **Row-Level Security**: Database-level tenant isolation
- **Tenant-Aware Queries**: All queries filter by tenant
- **Tenant Settings**: JSONB field for flexible configuration
- **Plan-Based Features**: Feature flags based on tenant plan

### Caching Strategy
- **Redis**: Session storage, caching, and real-time data
- **Query Caching**: Frequently accessed data caching
- **Session Management**: JWT token storage and validation
- **Real-time Data**: Socket.io room management
- **Rate Limiting**: Request rate limiting storage

## Security Architecture

### Authentication
- **JWT Tokens**: Stateless authentication with secure token management
- **Refresh Tokens**: Secure token renewal mechanism
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: Configurable expiration times
- **Multi-tenant Tokens**: Tokens include tenant information

### Authorization
- **Role-Based Access Control (RBAC)**: User roles and permissions
- **Resource-Level Permissions**: Fine-grained access control
- **Tenant Isolation**: Cross-tenant access prevention
- **API Rate Limiting**: Prevent abuse and DDoS attacks

### Data Protection
- **HTTPS**: All communications encrypted
- **Input Validation**: Comprehensive input sanitization with Joi
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **Security Headers**: Helmet configuration

## Deployment Architecture

### Development Environment
- **Docker Compose**: Local development setup with all services
- **Hot Reloading**: Development server with auto-restart
- **Local Database**: PostgreSQL and Redis containers
- **Environment Variables**: Configuration management
- **Health Checks**: Service health monitoring

### Production Environment
- **Kubernetes**: Container orchestration (manifests ready)
- **Load Balancing**: Nginx ingress controller
- **Auto-scaling**: Horizontal Pod Autoscaler
- **Health Checks**: Liveness and readiness probes
- **Monitoring**: Prometheus and Grafana ready

### Monitoring and Logging
- **Centralized Logging**: Winston logger with file rotation
- **Health Monitoring**: Service health endpoints
- **Metrics Collection**: Performance monitoring
- **Error Tracking**: Error reporting and alerting
- **Audit Logging**: Security event logging

## API Design

### RESTful Principles
- **Resource-Based URLs**: Clear resource identification
- **HTTP Methods**: Proper use of GET, POST, PUT, DELETE
- **Status Codes**: Appropriate HTTP status codes
- **Response Format**: Consistent JSON response structure
- **Error Handling**: Standardized error responses

### API Versioning
- **URL Versioning**: `/api/v1/` prefix (ready for implementation)
- **Backward Compatibility**: Maintain API compatibility
- **Deprecation Strategy**: Clear deprecation timeline

### Multi-Tenant API Design
- **Tenant Headers**: `x-tenant-id` header for tenant identification
- **User Headers**: `x-user-id` header for user context
- **Tenant Validation**: All requests validated against tenant membership
- **Cross-Tenant Prevention**: Strict tenant isolation

## Performance Considerations

### Scalability
- **Horizontal Scaling**: Stateless services ready for scaling
- **Database Optimization**: Proper indexing and query optimization
- **Caching Strategy**: Multi-level caching with Redis
- **CDN Integration**: Static asset delivery ready
- **Load Balancing**: API Gateway with load balancing

### Performance Monitoring
- **Response Time Tracking**: API performance metrics
- **Database Query Optimization**: Slow query identification
- **Resource Utilization**: CPU and memory monitoring
- **User Experience Metrics**: Frontend performance tracking

## Frontend Architecture

### React Application
- **React 18**: Latest React with concurrent features
- **TypeScript**: Type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **React Query**: Server state management
- **Socket.io Client**: Real-time communication

### Component Structure
- **Pages**: Main application pages (Dashboard, Tasks, Projects, Profile)
- **Components**: Reusable UI components
- **Contexts**: React contexts for state management
- **Hooks**: Custom React hooks
- **Services**: API service layer
- **Types**: TypeScript type definitions

## Current Implementation Status

### ✅ Completed Features
- **Backend Microservices**: All 7 services fully implemented
- **Frontend Application**: Complete React application
- **Database Schema**: Comprehensive multi-tenant schema
- **Real-time Features**: Socket.io integration
- **Docker Containerization**: Full containerization
- **Health Checks**: All services with health monitoring
- **Security Implementation**: Comprehensive security measures
- **API Gateway**: Complete routing and load balancing

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
- **Machine Learning**: Intelligent task suggestions

## Future Enhancements

### Technical Improvements
- **Event Sourcing**: Event-driven architecture
- **CQRS**: Command Query Responsibility Segregation
- **GraphQL**: Flexible data querying
- **Service Mesh**: Advanced service communication
- **Machine Learning**: Intelligent task suggestions
- **Micro-frontends**: Frontend microservices

### Business Features
- **Advanced Analytics**: Project and team insights
- **Time Tracking**: Built-in time tracking
- **File Management**: Document and file sharing
- **Mobile Applications**: Native mobile apps
- **Advanced Reporting**: Custom reports and dashboards
- **Workflow Automation**: Custom workflow rules 
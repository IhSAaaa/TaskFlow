# TaskFlow - Task Management & Collaboration Platform

A modern, multi-tenant task management and collaboration platform built with microservices architecture. TaskFlow provides comprehensive project and task management capabilities with real-time collaboration features.

## 🚀 Features

### Core Features
- **Multi-Tenancy**: Isolated workspaces for different organizations with tenant-specific settings
- **Task Management**: Create, assign, track, and manage tasks with advanced filtering and search
- **Project Organization**: Organize tasks into projects with team member management
- **Real-time Collaboration**: Live updates, notifications, and team communication via Socket.io
- **User Management**: Role-based access control with tenant isolation
- **Advanced Filtering**: Search and filter tasks by status, priority, assignee, project, and more

### Technical Features
- **Microservices Architecture**: Scalable and maintainable backend with 7 independent services
- **Modern Frontend**: Beautiful React 18 application with TypeScript and Tailwind CSS
- **Real-time Notifications**: Socket.io integration for instant updates
- **Health Monitoring**: Comprehensive health checks for all services
- **Docker Containerization**: Full containerization with Docker Compose
- **Database Optimization**: PostgreSQL with proper indexing and multi-tenant isolation

## 🏗️ Architecture

### Microservices
- **API Gateway** (Port 8000): Single entry point with routing, rate limiting, and health checks
- **Auth Service** (Port 3001): User authentication, JWT management, and session handling
- **User Service** (Port 3002): User profile management and user-related operations
- **Task Service** (Port 3003): Task CRUD operations, assignment, filtering, and status management
- **Project Service** (Port 3004): Project management, team collaboration, and member roles
- **Notification Service** (Port 3005): Real-time notifications with Socket.io integration
- **Tenant Service** (Port 3006): Multi-tenancy management, tenant settings, and plan management

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive styling
- **React Router** for client-side navigation
- **React Query** for efficient server state management
- **Socket.io Client** for real-time features
- **React Hook Form** for form handling
- **Lucide React** for beautiful icons

### Infrastructure
- **Docker & Docker Compose** for containerization and orchestration
- **PostgreSQL** for data persistence with multi-tenant schema
- **Redis** for caching, sessions, and real-time data
- **Health Checks** with curl integration for service monitoring
- **Kubernetes** manifests ready for production deployment

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── api-gateway/          # API Gateway service
│   ├── auth-service/         # Authentication service
│   ├── user-service/         # User management service
│   ├── task-service/         # Task management service
│   ├── project-service/      # Project management service
│   ├── notification-service/ # Real-time notifications
│   ├── tenant-service/       # Multi-tenancy service
│   ├── shared/              # Shared utilities and middleware
│   ├── database/            # Database schema and migrations
│   └── package.json         # Backend workspace configuration
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── k8s/                    # Kubernetes deployment manifests
├── docs/                   # Project documentation
├── docker-compose.yml      # Docker Compose configuration
└── README.md              # This file
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone and setup**
```bash
git clone <repository>
cd taskflow
```

2. **Start with Docker Compose (Recommended)**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker ps
```

3. **Manual Development Setup**
```bash
# Backend setup
cd backend
chmod +x setup.sh
./setup.sh
npm run dev:all

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000
- Health Check: http://localhost:8000/health

## 📚 Documentation

- [Architecture Guide](./docs/architecture.md) - Detailed system architecture
- [Development Guide](./docs/development.md) - Development setup and workflow
- [Security Documentation](./docs/SECURITY.md) - Security measures and best practices
- [API Documentation](./backend/README.md) - Backend API documentation
- [Implementation Summary](./backend/IMPLEMENTATION_SUMMARY.md) - Feature implementation status

## 🔧 Available Scripts

### Backend Scripts
```bash
npm run dev:all          # Start all services in development
npm run build:all        # Build all services
npm run start:all        # Start all services in production
npm run test:all         # Run tests for all services
npm run install:all      # Install dependencies for all services
```

### Frontend Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests
npm run lint             # Run linting
```

### Docker Scripts
```bash
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
docker-compose build     # Rebuild images
```

## 🧪 Testing

### Health Checks
All services provide health check endpoints:
- API Gateway: `http://localhost:8000/health`
- Auth Service: `http://localhost:3001/health`
- User Service: `http://localhost:3002/health`
- Task Service: `http://localhost:3003/health`
- Project Service: `http://localhost:3004/health`
- Notification Service: `http://localhost:3005/health`
- Tenant Service: `http://localhost:3006/health`

### Sample API Calls
```bash
# Create a task
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440001" \
  -d '{"title":"Sample Task","project_id":"project-uuid"}'

# Get projects
curl http://localhost:8000/api/projects \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000"
```

## 🚀 Deployment

### Docker Deployment
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Multi-tenant isolation** with strict data separation
- **Role-based access control** (Owner, Admin, Member, Viewer)
- **Rate limiting** and DDoS protection
- **Input validation** and sanitization
- **Security headers** and CORS configuration
- **Audit logging** for security monitoring

## 📊 Current Status

### ✅ Completed Features
- **Backend Microservices**: All 7 services implemented and tested
- **Frontend Application**: Complete React application with all major pages
- **Database Schema**: Comprehensive multi-tenant schema with proper indexing
- **Real-time Features**: Socket.io integration for notifications
- **Docker Containerization**: Full containerization with health checks
- **API Gateway**: Complete routing and load balancing
- **Security Implementation**: Comprehensive security measures
- **Documentation**: Complete documentation suite

### 🔄 In Progress
- Advanced analytics and reporting
- File upload service
- Email integration
- Mobile application

### 📋 Planned Features
- Advanced search with Elasticsearch
- Message queue with RabbitMQ
- Payment integration
- Advanced workflows
- Third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](./docs/)
- Review the [implementation summary](./backend/IMPLEMENTATION_SUMMARY.md)
- Open an issue on GitHub

---

**TaskFlow** - Empowering teams with modern task management and collaboration tools. 🚀 
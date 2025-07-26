# TaskFlow Database Setup & Management

## Overview

TaskFlow uses PostgreSQL as its primary database with automatic initialization and management. The database is automatically set up when the PostgreSQL container starts, including schema creation and seed data insertion.

## Architecture

### Database Schema
- **Multi-tenant architecture** with tenant isolation
- **UUID-based primary keys** for all entities
- **Comprehensive indexing** for optimal performance
- **JSONB fields** for flexible data storage
- **Automatic timestamps** with triggers

### Tables Structure
```
├── users                    # User accounts and profiles
├── tenants                  # Multi-tenant organizations
├── projects                 # Project management
├── project_members          # Project team members
├── tasks                    # Task management
├── task_assignments         # Task assignment history
├── notifications            # User notifications
├── notification_preferences # User notification settings
├── task_comments            # Task comments and discussions
└── files                    # File attachments
```

## Automatic Initialization

### How It Works
1. **Container Start**: PostgreSQL container starts
2. **Volume Mount**: Database files are mounted from `./backend/database`
3. **Auto-Execution**: Files in `/docker-entrypoint-initdb.d/` are executed automatically
4. **Schema Creation**: `schema.sql` creates all tables and indexes
5. **Seed Data**: `seed.sql` inserts initial test data

### Initialization Files
- `schema.sql` - Database schema and structure
- `seed.sql` - Initial test data and users
- `migrations.sql` - Database migrations (future use)

## Commands

### Development Commands
```bash
# Setup database (auto-initialization)
make db-setup

# Reset database (clean slate)
make db-reset

# Check database status
make db-check

# Run migrations
make db-migrate
```

### Manual Database Access
```bash
# Connect to database
docker exec -it taskflow-postgres-dev psql -U postgres -d taskflow

# List tables
\dt

# Check users
SELECT * FROM users;

# Check tenants
SELECT * FROM tenants;
```

## Test Data

### Default Users
| Email | Username | Password | Role |
|-------|----------|----------|------|
| admin@taskflow.local | admin | password | Admin |
| user@taskflow.local | user | password | User |

### Default Tenant
- **Name**: TaskFlow Demo
- **Domain**: taskflow.local
- **Subdomain**: demo
- **Plan**: Premium
- **Max Users**: 100
- **Max Projects**: 50

### Sample Data
- 1 Demo Project
- 3 Sample Tasks
- 2 Project Members
- Notification preferences
- Sample notifications

## Health Checks

### Database Health
```bash
# Check if database is accessible
curl http://localhost:28000/health

# Check individual service health
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3003/health  # Task Service
```

### Health Check Response
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "responseTime": 16
  },
  "services": {},
  "timestamp": "2024-01-XXTXX:XX:XX.XXXZ"
}
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs taskflow-postgres-dev

# Restart PostgreSQL
docker restart taskflow-postgres-dev
```

#### 2. Tables Not Found
```bash
# Reset database completely
make db-reset

# Check database status
make db-check
```

#### 3. Login Fails with "relation users does not exist"
```bash
# This indicates schema not initialized
make db-reset

# Or manually initialize
docker exec -i taskflow-postgres-dev psql -U postgres -d taskflow < backend/database/schema.sql
docker exec -i taskflow-postgres-dev psql -U postgres -d taskflow < backend/database/seed.sql
```

### Reset Procedures

#### Complete Reset
```bash
# Stop all services
make stop

# Remove database volume
docker volume rm new_postgres_data

# Restart services
make dev
```

#### Database Only Reset
```bash
# Reset database with fresh data
make db-reset
```

## Production Considerations

### Security
- Use strong passwords in production
- Enable SSL connections
- Regular backups
- Access control and firewalls

### Performance
- Proper indexing (already configured)
- Connection pooling (configured in services)
- Regular maintenance
- Monitoring and alerting

### Backup Strategy
```bash
# Create backup
docker exec taskflow-postgres-prod pg_dump -U postgres taskflow > backup.sql

# Restore backup
docker exec -i taskflow-postgres-prod psql -U postgres taskflow < backup.sql
```

## Migration Strategy

### Adding New Tables
1. Add table definition to `schema.sql`
2. Add indexes if needed
3. Update seed data if required
4. Test with `make db-reset`

### Schema Changes
1. Create migration in `migrations.sql`
2. Test migration with `make db-migrate`
3. Update schema.sql for new deployments

## Monitoring

### Database Metrics
- Connection count
- Query performance
- Table sizes
- Index usage

### Health Monitoring
- Automated health checks
- Service status monitoring
- Error logging and alerting

## Best Practices

1. **Always use migrations** for schema changes
2. **Test database changes** in development first
3. **Regular backups** in production
4. **Monitor performance** and optimize queries
5. **Use connection pooling** for better performance
6. **Implement proper error handling** in applications 
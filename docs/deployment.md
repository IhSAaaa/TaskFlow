# Deployment Guide

## Overview

This guide covers the deployment of TaskFlow microservices platform in various environments, from development to production.

## Prerequisites

- Docker & Docker Compose
- Kubernetes cluster (for production)
- PostgreSQL database
- Redis instance
- Domain name and SSL certificates (for production)

## Development Deployment

### Docker Compose Deployment

The easiest way to deploy TaskFlow for development:

```bash
# Clone the repository
git clone <repository-url>
cd taskflow

# Build and start all services
docker-compose up -d

# Check service health
docker ps

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8000
```

### Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=taskflow
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Service URLs (for Docker networking)
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
TASK_SERVICE_URL=http://task-service:3003
PROJECT_SERVICE_URL=http://project-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005
TENANT_SERVICE_URL=http://tenant-service:3006

# Frontend
VITE_API_URL=http://localhost:8000
```

### Health Checks

Verify all services are healthy:

```bash
# Check Docker health status
docker ps

# Test health endpoints
curl http://localhost:8000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
```

## Staging Deployment

### Docker Compose with Production Settings

```bash
# Use production Docker Compose file
docker-compose -f docker-compose.staging.yml up -d

# Or build with production settings
docker-compose -f docker-compose.staging.yml build --no-cache
docker-compose -f docker-compose.staging.yml up -d
```

### Environment Variables for Staging

```bash
# Staging environment
NODE_ENV=staging

# Database (use staging database)
DB_HOST=staging-db.example.com
DB_PORT=5432
DB_NAME=taskflow_staging
DB_USER=taskflow_staging
DB_PASSWORD=secure_password

# Redis (use staging Redis)
REDIS_HOST=staging-redis.example.com
REDIS_PORT=6379

# JWT (use strong secret)
JWT_SECRET=your-very-secure-jwt-secret-for-staging

# Service URLs (use staging domain)
AUTH_SERVICE_URL=https://auth.staging.taskflow.com
USER_SERVICE_URL=https://user.staging.taskflow.com
TASK_SERVICE_URL=https://task.staging.taskflow.com
PROJECT_SERVICE_URL=https://project.staging.taskflow.com
NOTIFICATION_SERVICE_URL=https://notification.staging.taskflow.com
TENANT_SERVICE_URL=https://tenant.staging.taskflow.com

# Frontend
VITE_API_URL=https://api.staging.taskflow.com
```

## Production Deployment

### Kubernetes Deployment

#### 1. Create Namespace

```bash
# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Verify namespace
kubectl get namespace taskflow
```

#### 2. Deploy Database

```bash
# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml

# Verify deployment
kubectl get pods -n taskflow -l app=postgres
```

#### 3. Deploy Services

```bash
# Deploy all services
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/task-service.yaml
kubectl apply -f k8s/project-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/tenant-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/frontend.yaml

# Verify deployments
kubectl get deployments -n taskflow
kubectl get pods -n taskflow
```

#### 4. Deploy Ingress

```bash
# Deploy ingress controller
kubectl apply -f k8s/ingress.yaml

# Verify ingress
kubectl get ingress -n taskflow
```

### Production Environment Variables

Create Kubernetes secrets for sensitive data:

```bash
# Create database secret
kubectl create secret generic taskflow-db-secret \
  --from-literal=DB_HOST=production-db.example.com \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_NAME=taskflow_production \
  --from-literal=DB_USER=taskflow_production \
  --from-literal=DB_PASSWORD=very_secure_password \
  -n taskflow

# Create JWT secret
kubectl create secret generic taskflow-jwt-secret \
  --from-literal=JWT_SECRET=your-production-jwt-secret \
  -n taskflow

# Create Redis secret
kubectl create secret generic taskflow-redis-secret \
  --from-literal=REDIS_HOST=production-redis.example.com \
  --from-literal=REDIS_PORT=6379 \
  -n taskflow
```

### Production Configuration

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: taskflow-config
  namespace: taskflow
data:
  NODE_ENV: "production"
  AUTH_SERVICE_URL: "http://auth-service:3001"
  USER_SERVICE_URL: "http://user-service:3002"
  TASK_SERVICE_URL: "http://task-service:3003"
  PROJECT_SERVICE_URL: "http://project-service:3004"
  NOTIFICATION_SERVICE_URL: "http://notification-service:3005"
  TENANT_SERVICE_URL: "http://tenant-service:3006"
  VITE_API_URL: "https://api.taskflow.com"
```

### SSL/TLS Configuration

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Create certificate
kubectl apply -f k8s/certificate.yaml
```

## Monitoring and Logging

### Health Monitoring

```bash
# Check service health
kubectl get pods -n taskflow

# Check service logs
kubectl logs -f deployment/auth-service -n taskflow
kubectl logs -f deployment/api-gateway -n taskflow

# Check service endpoints
kubectl get endpoints -n taskflow
```

### Prometheus Monitoring

```yaml
# k8s/monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: taskflow-monitor
  namespace: taskflow
spec:
  selector:
    matchLabels:
      app: taskflow
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

### Logging with ELK Stack

```bash
# Deploy Elasticsearch
kubectl apply -f k8s/elasticsearch.yaml

# Deploy Logstash
kubectl apply -f k8s/logstash.yaml

# Deploy Kibana
kubectl apply -f k8s/kibana.yaml
```

## Scaling

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: taskflow-hpa
  namespace: taskflow
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

```bash
# Scale PostgreSQL
kubectl scale deployment postgres --replicas=3 -n taskflow

# Configure read replicas
kubectl apply -f k8s/postgres-read-replicas.yaml
```

## Backup and Recovery

### Database Backup

```bash
# Create backup job
kubectl apply -f k8s/backup-job.yaml

# Manual backup
kubectl exec -it postgres-0 -n taskflow -- pg_dump -U postgres taskflow > backup.sql

# Restore from backup
kubectl exec -i postgres-0 -n taskflow -- psql -U postgres taskflow < backup.sql
```

### Volume Snapshots

```bash
# Create volume snapshot
kubectl apply -f k8s/volume-snapshot.yaml

# Restore from snapshot
kubectl apply -f k8s/volume-restore.yaml
```

## Security

### Network Policies

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: taskflow-network-policy
  namespace: taskflow
spec:
  podSelector:
    matchLabels:
      app: taskflow
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: taskflow
    ports:
    - protocol: TCP
      port: 5432
```

### RBAC Configuration

```yaml
# k8s/rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: taskflow
  name: taskflow-role
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: taskflow-role-binding
  namespace: taskflow
subjects:
- kind: ServiceAccount
  name: taskflow-service-account
  namespace: taskflow
roleRef:
  kind: Role
  name: taskflow-role
  apiGroup: rbac.authorization.k8s.io
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker images
      run: |
        docker build -t taskflow/api-gateway:latest ./backend
        docker build -t taskflow/frontend:latest ./frontend
    
    - name: Push to registry
      run: |
        docker push taskflow/api-gateway:latest
        docker push taskflow/frontend:latest
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/api-gateway api-gateway=taskflow/api-gateway:latest -n taskflow
        kubectl set image deployment/frontend frontend=taskflow/frontend:latest -n taskflow
```

### ArgoCD

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: taskflow
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/taskflow
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: taskflow
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Troubleshooting

### Common Issues

#### Service Not Starting

```bash
# Check pod status
kubectl get pods -n taskflow

# Check pod logs
kubectl logs <pod-name> -n taskflow

# Check pod events
kubectl describe pod <pod-name> -n taskflow
```

#### Database Connection Issues

```bash
# Check database pod
kubectl get pods -n taskflow -l app=postgres

# Check database logs
kubectl logs -f deployment/postgres -n taskflow

# Test database connection
kubectl exec -it postgres-0 -n taskflow -- psql -U postgres -d taskflow
```

#### Network Issues

```bash
# Check services
kubectl get services -n taskflow

# Check endpoints
kubectl get endpoints -n taskflow

# Test service connectivity
kubectl exec -it <pod-name> -n taskflow -- curl http://auth-service:3001/health
```

### Performance Issues

```bash
# Check resource usage
kubectl top pods -n taskflow

# Check node resources
kubectl top nodes

# Check HPA status
kubectl get hpa -n taskflow
```

## Rollback Procedures

### Rollback Deployment

```bash
# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n taskflow

# Check rollback status
kubectl rollout status deployment/api-gateway -n taskflow

# View rollback history
kubectl rollout history deployment/api-gateway -n taskflow
```

### Emergency Rollback

```bash
# Scale down to zero
kubectl scale deployment api-gateway --replicas=0 -n taskflow

# Deploy previous version
kubectl apply -f k8s/previous-version/api-gateway.yaml

# Scale back up
kubectl scale deployment api-gateway --replicas=3 -n taskflow
```

## Maintenance

### Regular Maintenance Tasks

```bash
# Update images
kubectl set image deployment/api-gateway api-gateway=taskflow/api-gateway:latest -n taskflow

# Restart deployments
kubectl rollout restart deployment/api-gateway -n taskflow

# Clean up old images
docker system prune -a

# Update certificates
kubectl apply -f k8s/certificate.yaml
```

### Database Maintenance

```bash
# Vacuum database
kubectl exec -it postgres-0 -n taskflow -- psql -U postgres -d taskflow -c "VACUUM ANALYZE;"

# Update statistics
kubectl exec -it postgres-0 -n taskflow -- psql -U postgres -d taskflow -c "ANALYZE;"
```

## Support and Documentation

For deployment support:
- Check the [Architecture Documentation](./architecture.md)
- Review the [Development Guide](./development.md)
- Check Kubernetes logs and events
- Contact the DevOps team

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Helm Documentation](https://helm.sh/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/) 
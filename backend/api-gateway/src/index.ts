import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Pool } from 'pg';
import { logger } from '../shared/src/utils/logger';
import { createRateLimiter } from '../shared/src/middleware/rateLimit';
import { 
  securityHeaders, 
  sanitizeInput, 
  requestLogger, 
  errorHandler, 
  notFoundHandler 
} from '../shared/src/middleware/security';
import { HealthChecker } from '../shared/src/utils/healthCheck';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 8000;

// Initialize database pool for health checks
const dbPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'taskflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Initialize health checker
const healthChecker = new HealthChecker(dbPool);

// Rate limiting
const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(requestLogger);
app.use(globalRateLimiter);

// Health check
app.get('/health', async (req, res) => {
  const healthStatus = await healthChecker.checkHealth();
  res.json(healthStatus);
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'API Gateway is working' });
});

// Auth service proxy
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  timeout: 30000, // 30 seconds timeout
  proxyTimeout: 30000, // 30 seconds proxy timeout
  onError: (err, req, res) => {
    logger.error('Auth service proxy error:', err);
    res.status(503).json({
      success: false,
      error: 'Auth service unavailable'
    });
  }
}));

app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    logger.error('User service proxy error:', err);
    res.status(503).json({
      success: false,
      error: 'User service unavailable'
    });
  }
}));

app.use('/api/tasks', createProxyMiddleware({
  target: process.env.TASK_SERVICE_URL || 'http://task-service:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/tasks': '/api/tasks'
  },
  onError: (err, req, res) => {
    logger.error('Task service proxy error:', err);
    res.status(503).json({
      success: false,
      error: 'Task service unavailable'
    });
  }
}));

app.use('/api/projects', createProxyMiddleware({
  target: process.env.PROJECT_SERVICE_URL || 'http://project-service:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/projects': '/api/projects'
  },
  onError: (err, req, res) => {
    logger.error('Project service proxy error:', err);
    res.status(503).json({
      success: false,
      error: 'Project service unavailable'
    });
  }
}));

app.use('/api/notifications', createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  },
  onError: (err, req, res) => {
    logger.error('Notification service proxy error:', err);
    res.status(503).json({
      success: false,
      error: 'Notification service unavailable'
    });
  }
}));

app.use('/api/tenants', createProxyMiddleware({
  target: process.env.TENANT_SERVICE_URL || 'http://tenant-service:3006',
  changeOrigin: true,
  pathRewrite: {
    '^/api/tenants': '/api/tenants'
  },
  onError: (err, req, res) => {
    logger.error('Tenant service proxy error:', err);
    res.status(503).json({
      success: false,
      error: 'Tenant service unavailable'
    });
  }
}));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use(notFoundHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

export default app; 
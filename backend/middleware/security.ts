import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { sanitize } from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import { validateToken } from '../utils/jwt';
import { logger } from '../utils/logger';

// Rate limiting configuration
export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use tenant ID + IP for multi-tenant rate limiting
      const tenantId = req.headers['x-tenant-id'] as string;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return `${tenantId || 'anonymous'}:${ip}`;
    }
  });
};

// Specific rate limiters for different endpoints
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
export const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 1000); // 1000 requests per 15 minutes
export const uploadRateLimiter = createRateLimiter(60 * 60 * 1000, 10); // 10 uploads per hour

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-tenant-id',
    'x-user-id'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Helmet configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Input validation and sanitization middleware
export const inputSanitization = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize MongoDB query operators
    sanitize.sanitize(req.body, {
      dryRun: false,
      onSanitize: ({ key, value }) => {
        logger.warn(`Sanitized MongoDB operator: ${key} = ${value}`);
      }
    });

    // Sanitize query parameters
    sanitize.sanitize(req.query, {
      dryRun: false,
      onSanitize: ({ key, value }) => {
        logger.warn(`Sanitized query parameter: ${key} = ${value}`);
      }
    });

    next();
  } catch (error) {
    logger.error('Input sanitization error:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }
};

// XSS protection middleware
export const xssProtection = xss();

// HTTP Parameter Pollution protection
export const hppProtection = hpp({
  whitelist: ['tags', 'categories'] // Allow arrays for these fields
});

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: 'Request entity too large'
    });
  }

  next();
};

// JWT token validation middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = await validateToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token validation error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Multi-tenant access control middleware
export const tenantAccessControl = (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userTenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }

    if (userTenantId && userTenantId !== tenantId) {
      logger.warn(`Tenant access violation: User ${req.user?.id} tried to access tenant ${tenantId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied to this tenant'
      });
    }

    req.tenantId = tenantId;
    next();
  } catch (error) {
    logger.error('Tenant access control error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole || !roles.includes(userRole)) {
        logger.warn(`Role access violation: User ${req.user?.id} with role ${userRole} tried to access ${req.path}`);
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      logger.error('Role-based access control error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

// Resource ownership validation middleware
export const validateResourceOwnership = (resourceType: string, idParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params[idParam];
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Admin and owner roles can access all resources
      if (userRole === 'admin' || userRole === 'owner') {
        return next();
      }

      // For other roles, check resource ownership
      // This would typically involve a database query
      // For now, we'll implement a basic check
      const isOwner = await checkResourceOwnership(resourceType, resourceId, userId);
      
      if (!isOwner) {
        logger.warn(`Resource ownership violation: User ${userId} tried to access ${resourceType} ${resourceId}`);
        return res.status(403).json({
          success: false,
          error: 'Access denied to this resource'
        });
      }

      next();
    } catch (error) {
      logger.error('Resource ownership validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

// Audit logging middleware
export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      const auditData = {
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        tenantId: req.tenantId,
        action,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        requestBody: req.body,
        responseData: data
      };

      logger.info('Audit log:', auditData);
      
      return originalSend.call(this, data);
    };

    next();
  };
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      tenantId: req.tenantId
    });
  });

  next();
};

// Error handling middleware
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', error);

  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: isProduction ? undefined : error.message
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  if (error.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: isProduction ? 'Internal server error' : error.message
  });
};

// Helper function to check resource ownership
async function checkResourceOwnership(resourceType: string, resourceId: string, userId: string): Promise<boolean> {
  // This would typically involve a database query
  // For now, return true as a placeholder
  return true;
}

// Export all middleware as a single object for easy import
export const securityMiddleware = {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  corsOptions,
  helmetConfig,
  inputSanitization,
  xssProtection,
  hppProtection,
  requestSizeLimit,
  authenticateToken,
  tenantAccessControl,
  requireRole,
  validateResourceOwnership,
  auditLog,
  securityHeaders,
  requestLogger,
  errorHandler
}; 
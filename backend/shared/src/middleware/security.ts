import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../utils/logger';

// Enhanced security configuration
export const securityConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  
  // HSTS configuration
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // XSS Protection
  xssFilter: true,
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Hide powered by header
  hidePoweredBy: true,
  
  // Frame options
  frameguard: {
    action: 'deny'
  }
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Sanitize object recursively
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  
  return sanitized;
}

// Sanitize string input
function sanitizeString(input: any): any {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// CORS configuration
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-user-id'],
  exposedHeaders: ['x-total-count', 'x-page', 'x-limit']
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      tenantId,
      userId,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    tenantId: req.headers['x-tenant-id']
  });
  
  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message
    });
    return;
  }
  
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
    return;
  }
  
  if (err.name === 'ForbiddenError') {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access denied'
    });
    return;
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: isProduction ? 'Something went wrong' : err.message
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Request size limiter
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const maxSize = parseInt(process.env.MAX_REQUEST_SIZE || '1048576'); // 1MB default
  
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > maxSize) {
      logger.warn(`Request size limit exceeded: ${size} bytes`);
      res.status(413).json({
        success: false,
        error: 'Request Entity Too Large',
        message: 'Request size exceeds the limit'
      });
      return;
    }
  });
  
  next();
}; 
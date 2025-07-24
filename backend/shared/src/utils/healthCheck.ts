import { Pool } from 'pg';
import { logger } from './logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime?: number;
    error?: string;
  };
  services: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
  version: string;
  environment: string;
}

export class HealthChecker {
  private pool: Pool;
  private startTime: number;
  private serviceChecks: Map<string, () => Promise<boolean>> = new Map();

  constructor(pool: Pool) {
    this.pool = pool;
    this.startTime = Date.now();
  }

  // Add custom service health check
  addServiceCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.serviceChecks.set(name, checkFn);
  }

  // Check database connectivity
  private async checkDatabase(): Promise<{ status: 'connected' | 'disconnected' | 'error'; responseTime?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const result = await this.pool.query('SELECT NOW()');
      const responseTime = Date.now() - startTime;
      
      if (result.rows.length > 0) {
        return {
          status: 'connected',
          responseTime
        };
      } else {
        return {
          status: 'error',
          error: 'Database query returned no results'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  // Check memory usage
  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    const memUsage = process.memoryUsage();
    const used = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
    const total = Math.round(memUsage.heapTotal / 1024 / 1024); // MB
    const percentage = Math.round((used / total) * 100);

    return { used, total, percentage };
  }

  // Check custom services
  private async checkServices(): Promise<{ [key: string]: { status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string } }> {
    const results: { [key: string]: { status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string } } = {};

    for (const [name, checkFn] of this.serviceChecks) {
      const startTime = Date.now();
      
      try {
        const isHealthy = await checkFn();
        const responseTime = Date.now() - startTime;
        
        results[name] = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime
        };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }

  // Determine overall health status
  private determineOverallStatus(healthStatus: HealthStatus): 'healthy' | 'unhealthy' | 'degraded' {
    const { database, services } = healthStatus;
    
    // Check if database is healthy
    if (database.status !== 'connected') {
      return 'unhealthy';
    }
    
    // Check if any services are unhealthy
    const serviceStatuses = Object.values(services);
    const unhealthyServices = serviceStatuses.filter(s => s.status === 'unhealthy');
    
    if (unhealthyServices.length > 0) {
      return unhealthyServices.length === serviceStatuses.length ? 'unhealthy' : 'degraded';
    }
    
    return 'healthy';
  }

  // Perform comprehensive health check
  async checkHealth(): Promise<HealthStatus> {
    const [databaseStatus, servicesStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkServices()
    ]);

    const memoryUsage = this.getMemoryUsage();
    const uptime = Date.now() - this.startTime;

    const healthStatus: HealthStatus = {
      status: 'healthy', // Will be determined below
      timestamp: new Date().toISOString(),
      uptime,
      memory: memoryUsage,
      database: databaseStatus,
      services: servicesStatus,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Determine overall status
    healthStatus.status = this.determineOverallStatus(healthStatus);

    // Log health status
    if (healthStatus.status === 'unhealthy') {
      logger.error('Health check failed:', healthStatus);
    } else if (healthStatus.status === 'degraded') {
      logger.warn('Health check degraded:', healthStatus);
    } else {
      logger.info('Health check passed');
    }

    return healthStatus;
  }

  // Quick health check for load balancers
  async quickHealthCheck(): Promise<boolean> {
    try {
      const healthStatus = await this.checkHealth();
      return healthStatus.status === 'healthy';
    } catch (error) {
      logger.error('Quick health check failed:', error);
      return false;
    }
  }

  // Get detailed health metrics
  async getMetrics(): Promise<{
    requests: { total: number; successful: number; failed: number };
    responseTime: { average: number; p95: number; p99: number };
    errors: { count: number; types: { [key: string]: number } };
  }> {
    // This would typically integrate with a metrics collection system
    // For now, return basic metrics
    return {
      requests: {
        total: 0,
        successful: 0,
        failed: 0
      },
      responseTime: {
        average: 0,
        p95: 0,
        p99: 0
      },
      errors: {
        count: 0,
        types: {}
      }
    };
  }
}

// Express middleware for health check endpoint
export const healthCheckMiddleware = (healthChecker: HealthChecker) => {
  return async (req: any, res: any) => {
    try {
      const healthStatus = await healthChecker.checkHealth();
      
      const statusCode = healthStatus.status === 'healthy' ? 200 : 
                        healthStatus.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      logger.error('Health check middleware error:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  };
};

// Express middleware for readiness check
export const readinessCheckMiddleware = (healthChecker: HealthChecker) => {
  return async (req: any, res: any) => {
    try {
      const isReady = await healthChecker.quickHealthCheck();
      
      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Readiness check middleware error:', error);
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed'
      });
    }
  };
};

// Express middleware for liveness check
export const livenessCheckMiddleware = () => {
  return (req: any, res: any) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  };
}; 
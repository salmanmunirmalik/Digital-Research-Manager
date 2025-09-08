import { Request, Response } from 'express';
import { dbService } from './databaseService';
import { cacheService } from './cacheService';
import { loggerService } from './loggerService';
import { performanceMonitor } from './performanceMonitor';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: ComponentHealth;
    cache: ComponentHealth;
    memory: ComponentHealth;
    disk: ComponentHealth;
    performance: ComponentHealth;
  };
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
  };
}

interface ComponentHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  message?: string;
  details?: any;
}

class HealthCheckService {
  private static instance: HealthCheckService;
  private startTime: number = Date.now();

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  // Main health check endpoint
  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    // Run all health checks in parallel
    const [
      databaseHealth,
      cacheHealth,
      memoryHealth,
      diskHealth,
      performanceHealth
    ] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkPerformance()
    ]);

    // Extract results
    const checks = {
      database: this.extractResult(databaseHealth),
      cache: this.extractResult(cacheHealth),
      memory: this.extractResult(memoryHealth),
      disk: this.extractResult(diskHealth),
      performance: this.extractResult(performanceHealth)
    };

    // Determine overall status
    const overallStatus = this.determineOverallStatus(checks);

    // Get performance metrics
    const metrics = await this.getMetrics();

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      metrics
    };

    // Log health check result
    loggerService.healthCheck('overall', overallStatus, result);

    return result;
  }

  // Database health check
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const health = await dbService.healthCheck();
      const responseTime = Date.now() - startTime;

      return {
        status: health.status === 'healthy' ? 'healthy' : 'unhealthy',
        responseTime,
        message: health.status === 'healthy' ? 'Database connection successful' : 'Database connection failed',
        details: {
          poolStats: health.poolStats,
          responseTime: health.responseTime
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        message: 'Database health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Cache health check
  private async checkCache(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const stats = await cacheService.getStats();
      const responseTime = Date.now() - startTime;

      if (stats && stats.connected) {
        return {
          status: 'healthy',
          responseTime,
          message: 'Cache connection successful',
          details: stats
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          message: 'Cache not available (fallback to database)',
          details: stats
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'degraded',
        responseTime,
        message: 'Cache health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Memory health check
  private async checkMemory(): Promise<ComponentHealth> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let message = 'Memory usage normal';

    if (memoryUsagePercent > 90 || heapUsedPercent > 90) {
      status = 'unhealthy';
      message = 'Memory usage critical';
    } else if (memoryUsagePercent > 80 || heapUsedPercent > 80) {
      status = 'degraded';
      message = 'Memory usage high';
    }

    return {
      status,
      message,
      details: {
        systemMemory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          usagePercent: memoryUsagePercent
        },
        heapMemory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          usagePercent: heapUsedPercent
        },
        external: memoryUsage.external,
        rss: memoryUsage.rss
      }
    };
  }

  // Disk health check
  private async checkDisk(): Promise<ComponentHealth> {
    try {
      const fs = require('fs').promises;
      const stats = await fs.stat('.');
      
      // Simple disk check - in production, you'd want more sophisticated checks
      return {
        status: 'healthy',
        message: 'Disk access normal',
        details: {
          accessible: true,
          timestamp: stats.mtime
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Disk access failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Performance health check
  private async checkPerformance(): Promise<ComponentHealth> {
    try {
      const stats = performanceMonitor.getStats();
      
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      let message = 'Performance metrics normal';

      if (stats.errorRate > 10) {
        status = 'unhealthy';
        message = 'High error rate detected';
      } else if (stats.errorRate > 5) {
        status = 'degraded';
        message = 'Elevated error rate';
      } else if (stats.averageResponseTime > 2000) {
        status = 'unhealthy';
        message = 'Slow response times';
      } else if (stats.averageResponseTime > 1000) {
        status = 'degraded';
        message = 'Elevated response times';
      }

      return {
        status,
        message,
        details: stats
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: 'Performance monitoring unavailable',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Get system metrics
  private async getMetrics(): Promise<any> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const performanceStats = performanceMonitor.getStats();

    return {
      totalRequests: performanceStats.totalRequests,
      averageResponseTime: performanceStats.averageResponseTime,
      errorRate: performanceStats.errorRate,
      memoryUsage,
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    };
  }

  // Extract result from Promise.allSettled
  private extractResult(result: PromiseSettledResult<ComponentHealth>): ComponentHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        message: 'Health check failed',
        details: { error: result.reason }
      };
    }
  }

  // Determine overall system status
  private determineOverallStatus(checks: any): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checks).map((check: any) => check.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    } else if (statuses.includes('degraded')) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  // Liveness probe (simple check)
  async livenessCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString()
    };
  }

  // Readiness probe (detailed check)
  async readinessCheck(): Promise<HealthCheckResult> {
    return this.performHealthCheck();
  }
}

// Singleton instance
export const healthCheckService = HealthCheckService.getInstance();

// Express middleware for health checks
export const healthCheckMiddleware = (req: Request, res: Response) => {
  const path = req.path;
  
  if (path === '/health/live') {
    healthCheckService.livenessCheck()
      .then(result => res.json(result))
      .catch(() => res.status(500).json({ status: 'dead' }));
  } else if (path === '/health/ready') {
    healthCheckService.readinessCheck()
      .then(result => {
        const statusCode = result.status === 'healthy' ? 200 : 
                          result.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(result);
      })
      .catch(() => res.status(503).json({ status: 'unhealthy' }));
  } else if (path === '/health') {
    healthCheckService.performHealthCheck()
      .then(result => {
        const statusCode = result.status === 'healthy' ? 200 : 
                          result.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(result);
      })
      .catch(() => res.status(503).json({ status: 'unhealthy' }));
  }
};

export default healthCheckService;

import { Request, Response } from 'express';
import { dbService } from './databaseService';
import { cacheService } from './cacheService';
import { performanceMonitor } from './performanceMonitor';
import { loggerService } from './loggerService';
import { healthCheckService } from './healthCheckService';

interface MonitoringDashboard {
  timestamp: string;
  system: {
    uptime: number;
    version: string;
    environment: string;
    nodeVersion: string;
    platform: string;
  };
  performance: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    slowestOperations: any[];
    fastestOperations: any[];
  };
  database: {
    connectionPool: {
      total: number;
      idle: number;
      waiting: number;
    };
    queryStats: any;
    healthStatus: string;
  };
  cache: {
    connected: boolean;
    memory: any;
    keyspace: any;
    hitRate?: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    usagePercent: number;
  };
  logs: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
    recentErrors: any[];
  };
  alerts: {
    active: number;
    resolved: number;
    critical: number;
    warnings: any[];
  };
}

class MonitoringDashboardService {
  private static instance: MonitoringDashboardService;
  private alertThresholds = {
    errorRate: 5, // 5%
    responseTime: 1000, // 1 second
    memoryUsage: 80, // 80%
    cpuUsage: 80, // 80%
  };

  static getInstance(): MonitoringDashboardService {
    if (!MonitoringDashboardService.instance) {
      MonitoringDashboardService.instance = new MonitoringDashboardService();
    }
    return MonitoringDashboardService.instance;
  }

  // Get comprehensive monitoring dashboard
  async getDashboard(): Promise<MonitoringDashboard> {
    const timestamp = new Date().toISOString();
    
    // Gather all monitoring data in parallel
    const [
      performanceStats,
      databaseStats,
      cacheStats,
      memoryStats,
      logStats,
      alerts
    ] = await Promise.allSettled([
      this.getPerformanceStats(),
      this.getDatabaseStats(),
      this.getCacheStats(),
      this.getMemoryStats(),
      this.getLogStats(),
      this.getAlerts()
    ]);

    return {
      timestamp,
      system: this.getSystemInfo(),
      performance: this.extractResult(performanceStats) || this.getDefaultPerformanceStats(),
      database: this.extractResult(databaseStats) || this.getDefaultDatabaseStats(),
      cache: this.extractResult(cacheStats) || this.getDefaultCacheStats(),
      memory: this.extractResult(memoryStats) || this.getDefaultMemoryStats(),
      logs: this.extractResult(logStats) || this.getDefaultLogStats(),
      alerts: this.extractResult(alerts) || this.getDefaultAlerts()
    };
  }

  // Get performance statistics
  private async getPerformanceStats(): Promise<any> {
    const stats = performanceMonitor.getStats();
    const detailedReport = performanceMonitor.getDetailedReport();

    return {
      totalRequests: stats.totalRequests,
      averageResponseTime: stats.averageResponseTime,
      errorRate: stats.errorRate,
      throughput: stats.throughput,
      slowestOperations: stats.slowestRequests.slice(0, 5),
      fastestOperations: stats.fastestRequests.slice(0, 5),
      byOperation: detailedReport.byOperation
    };
  }

  // Get database statistics
  private async getDatabaseStats(): Promise<any> {
    try {
      const queryStats = dbService.getQueryStats();
      const healthCheck = await dbService.healthCheck();

      return {
        connectionPool: {
          total: queryStats.poolStats.totalCount,
          idle: queryStats.poolStats.idleCount,
          waiting: queryStats.poolStats.waitingCount
        },
        queryStats: {
          totalQueries: queryStats.totalQueries,
          queries: queryStats.queries.slice(0, 10) // Top 10 slowest queries
        },
        healthStatus: healthCheck.status
      };
    } catch (error) {
      loggerService.error('Failed to get database stats', error);
      throw error;
    }
  }

  // Get cache statistics
  private async getCacheStats(): Promise<any> {
    try {
      const stats = await cacheService.getStats();
      
      if (!stats) {
        return {
          connected: false,
          memory: null,
          keyspace: null,
          hitRate: 0
        };
      }

      return {
        connected: stats.connected,
        memory: stats.memory,
        keyspace: stats.keyspace,
        hitRate: this.calculateCacheHitRate(stats)
      };
    } catch (error) {
      loggerService.error('Failed to get cache stats', error);
      return {
        connected: false,
        memory: null,
        keyspace: null,
        hitRate: 0
      };
    }
  }

  // Get memory statistics
  private async getMemoryStats(): Promise<any> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercent = (usedMemory / totalMemory) * 100;

    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      usagePercent: Math.round(usagePercent * 100) / 100
    };
  }

  // Get log statistics
  private async getLogStats(): Promise<any> {
    // In a real implementation, you'd query your log storage
    // For now, we'll return mock data
    return {
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      recentErrors: []
    };
  }

  // Get system alerts
  private async getAlerts(): Promise<any> {
    const alerts = [];
    const warnings = [];

    // Check performance metrics
    const performanceStats = performanceMonitor.getStats();
    
    if (performanceStats.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error',
        message: `High error rate: ${performanceStats.errorRate.toFixed(2)}%`,
        timestamp: new Date().toISOString()
      });
    }

    if (performanceStats.averageResponseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'warning',
        message: `Slow response time: ${performanceStats.averageResponseTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    }

    // Check memory usage
    const memoryStats = await this.getMemoryStats();
    if (memoryStats.usagePercent > this.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'warning',
        message: `High memory usage: ${memoryStats.usagePercent.toFixed(2)}%`,
        timestamp: new Date().toISOString()
      });
    }

    return {
      active: alerts.length,
      resolved: 0, // Would track resolved alerts in a real system
      critical: alerts.filter(a => a.type === 'error').length,
      warnings: alerts
    };
  }

  // Get system information
  private getSystemInfo(): any {
    return {
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  // Calculate cache hit rate (mock implementation)
  private calculateCacheHitRate(stats: any): number {
    // In a real implementation, you'd calculate this from actual cache statistics
    return Math.random() * 100; // Mock hit rate
  }

  // Extract result from Promise.allSettled
  private extractResult(result: PromiseSettledResult<any>): any {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return null;
  }

  // Default values for failed checks
  private getDefaultPerformanceStats(): any {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      slowestOperations: [],
      fastestOperations: []
    };
  }

  private getDefaultDatabaseStats(): any {
    return {
      connectionPool: { total: 0, idle: 0, waiting: 0 },
      queryStats: { totalQueries: 0, queries: [] },
      healthStatus: 'unknown'
    };
  }

  private getDefaultCacheStats(): any {
    return {
      connected: false,
      memory: null,
      keyspace: null,
      hitRate: 0
    };
  }

  private getDefaultMemoryStats(): any {
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
      usagePercent: 0
    };
  }

  private getDefaultLogStats(): any {
    return {
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      recentErrors: []
    };
  }

  private getDefaultAlerts(): any {
    return {
      active: 0,
      resolved: 0,
      critical: 0,
      warnings: []
    };
  }

  // Get real-time metrics for WebSocket updates
  async getRealTimeMetrics(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      performance: await this.getPerformanceStats(),
      memory: await this.getMemoryStats(),
      alerts: await this.getAlerts()
    };
  }
}

// Singleton instance
export const monitoringDashboard = MonitoringDashboardService.getInstance();

// Express middleware for monitoring dashboard
export const monitoringMiddleware = (req: Request, res: Response) => {
  const path = req.path;
  
  if (path === '/api/monitoring/dashboard') {
    monitoringDashboard.getDashboard()
      .then(dashboard => res.json(dashboard))
      .catch(error => {
        loggerService.error('Failed to get monitoring dashboard', error);
        res.status(500).json({ error: 'Failed to get monitoring data' });
      });
  } else if (path === '/api/monitoring/metrics') {
    monitoringDashboard.getRealTimeMetrics()
      .then(metrics => res.json(metrics))
      .catch(error => {
        loggerService.error('Failed to get real-time metrics', error);
        res.status(500).json({ error: 'Failed to get metrics' });
      });
  }
};

export default monitoringDashboard;

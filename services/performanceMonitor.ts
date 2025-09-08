import { performance } from 'perf_hooks';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: any;
}

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  slowestRequests: PerformanceMetric[];
  fastestRequests: PerformanceMetric[];
  errorRate: number;
  throughput: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeMetrics: Map<string, PerformanceMetric> = new Map();
  private stats: PerformanceStats = {
    totalRequests: 0,
    averageResponseTime: 0,
    slowestRequests: [],
    fastestRequests: [],
    errorRate: 0,
    throughput: 0
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing a performance metric
  startTiming(name: string, metadata?: any): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.activeMetrics.set(id, metric);
    return id;
  }

  // End timing a performance metric
  endTiming(id: string, metadata?: any): PerformanceMetric | null {
    const metric = this.activeMetrics.get(id);
    if (!metric) {
      console.warn(`Performance metric not found: ${id}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata };
    }

    // Store the completed metric
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    this.metrics.get(metric.name)!.push(metric);

    // Remove from active metrics
    this.activeMetrics.delete(id);

    // Update stats
    this.updateStats();

    // Log slow operations
    if (metric.duration > 1000) { // More than 1 second
      console.warn(`🐌 Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }

    return metric;
  }

  // Measure a function execution
  async measureFunction<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: any
  ): Promise<T> {
    const id = this.startTiming(name, metadata);
    try {
      const result = await fn();
      this.endTiming(id, { success: true });
      return result;
    } catch (error) {
      this.endTiming(id, { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  // Get metrics for a specific operation
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  // Get performance statistics
  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  // Get detailed performance report
  getDetailedReport(): any {
    const report: any = {
      timestamp: new Date().toISOString(),
      overall: this.stats,
      byOperation: {}
    };

    for (const [operationName, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;

      const durations = metrics.map(m => m.duration || 0);
      const successful = metrics.filter(m => m.metadata?.success !== false);
      const failed = metrics.filter(m => m.metadata?.success === false);

      report.byOperation[operationName] = {
        totalCalls: metrics.length,
        successfulCalls: successful.length,
        failedCalls: failed.length,
        successRate: (successful.length / metrics.length) * 100,
        averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        p50Duration: this.percentile(durations, 50),
        p95Duration: this.percentile(durations, 95),
        p99Duration: this.percentile(durations, 99),
        recentMetrics: metrics.slice(-10) // Last 10 metrics
      };
    }

    return report;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
    this.activeMetrics.clear();
    this.stats = {
      totalRequests: 0,
      averageResponseTime: 0,
      slowestRequests: [],
      fastestRequests: [],
      errorRate: 0,
      throughput: 0
    };
  }

  // Update internal statistics
  private updateStats(): void {
    const allMetrics: PerformanceMetric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }

    if (allMetrics.length === 0) return;

    this.stats.totalRequests = allMetrics.length;
    
    const durations = allMetrics.map(m => m.duration || 0);
    this.stats.averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    const successful = allMetrics.filter(m => m.metadata?.success !== false);
    this.stats.errorRate = ((allMetrics.length - successful.length) / allMetrics.length) * 100;
    
    // Sort by duration
    const sortedByDuration = [...allMetrics].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    this.stats.slowestRequests = sortedByDuration.slice(0, 10);
    this.stats.fastestRequests = sortedByDuration.slice(-10).reverse();
    
    // Calculate throughput (requests per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentMetrics = allMetrics.filter(m => m.startTime >= oneMinuteAgo);
    this.stats.throughput = recentMetrics.length;
  }

  // Calculate percentile
  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Express middleware for performance monitoring
export const performanceMiddleware = (req: any, res: any, next: any) => {
  const startTime = performance.now();
  const metricId = performanceMonitor.startTiming('http_request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.on('finish', () => {
    performanceMonitor.endTiming(metricId, {
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length'),
      success: res.statusCode < 400
    });
  });

  next();
};

// Database query performance monitoring
export const dbPerformanceWrapper = async <T>(
  queryName: string,
  queryFn: () => Promise<T>,
  metadata?: any
): Promise<T> => {
  return performanceMonitor.measureFunction(`db_query_${queryName}`, queryFn, metadata);
};

// API endpoint performance monitoring
export const apiPerformanceWrapper = async <T>(
  endpointName: string,
  handler: () => Promise<T>,
  metadata?: any
): Promise<T> => {
  return performanceMonitor.measureFunction(`api_${endpointName}`, handler, metadata);
};

export default performanceMonitor;

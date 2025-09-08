# Monitoring & Observability Guide - Digital Research Manager

This guide covers the comprehensive monitoring and observability implementation for the Digital Research Manager application.

## 🔍 Monitoring Infrastructure Implemented

### 1. **Structured Logging System**
- ✅ **Winston Logger** with multiple transports (console, file, error logs)
- ✅ **Structured Logging** with JSON format for production
- ✅ **Log Levels** (error, warn, info, http, debug) with color coding
- ✅ **Log Rotation** with size and file count limits
- ✅ **Contextual Logging** for different operations (auth, database, security)

### 2. **Performance Monitoring**
- ✅ **Real-time Metrics** collection for all operations
- ✅ **Performance Tracking** with detailed timing information
- ✅ **Slow Operation Detection** with configurable thresholds
- ✅ **Statistical Analysis** with percentiles (P50, P95, P99)
- ✅ **Performance Reporting** with detailed breakdowns

### 3. **Health Check System**
- ✅ **Comprehensive Health Checks** for all system components
- ✅ **Database Health** monitoring with connection pool stats
- ✅ **Cache Health** monitoring with Redis connection status
- ✅ **Memory Health** monitoring with usage thresholds
- ✅ **Disk Health** monitoring for storage availability

### 4. **Monitoring Dashboard**
- ✅ **Real-time Dashboard** with system metrics
- ✅ **Performance Metrics** visualization
- ✅ **Alert Management** with severity levels
- ✅ **System Information** display
- ✅ **Historical Data** tracking

### 5. **Error Tracking & Alerting**
- ✅ **Structured Error Logging** with stack traces
- ✅ **Alert Thresholds** for critical metrics
- ✅ **Security Event Logging** with severity levels
- ✅ **Business Event Tracking** for audit trails
- ✅ **Exception Handling** with proper error boundaries

## 📊 Monitoring Endpoints

### Health Check Endpoints
- **`GET /health`** - Comprehensive health check
- **`GET /health/live`** - Liveness probe (simple alive check)
- **`GET /health/ready`** - Readiness probe (detailed readiness check)

### Monitoring Endpoints
- **`GET /api/monitoring/dashboard`** - Complete monitoring dashboard
- **`GET /api/monitoring/metrics`** - Real-time metrics
- **`GET /api/performance/stats`** - Performance statistics

### Log Endpoints
- **`GET /api/logs/errors`** - Recent error logs
- **`GET /api/logs/performance`** - Performance logs
- **`GET /api/logs/security`** - Security event logs

## 🎯 Monitoring Metrics

### Performance Metrics
- **Response Time**: Average, P50, P95, P99 percentiles
- **Throughput**: Requests per minute
- **Error Rate**: Percentage of failed requests
- **Slow Operations**: Operations taking > 1 second
- **Database Query Performance**: Query execution times

### System Metrics
- **Memory Usage**: Heap, RSS, external memory
- **CPU Usage**: User and system CPU time
- **Disk Usage**: Available disk space
- **Network**: Connection counts and latency

### Business Metrics
- **User Activity**: Login/logout events
- **Feature Usage**: Protocol creation, inventory updates
- **Security Events**: Failed logins, suspicious activity
- **Data Operations**: CRUD operation counts

## 🛠️ Implementation Examples

### 1. Using Logger Service
```typescript
import { loggerService } from '@/services/loggerService';

// Application logs
loggerService.info('User logged in', { userId: '123', ip: '192.168.1.1' });
loggerService.warn('High memory usage detected', { usage: '85%' });
loggerService.error('Database connection failed', error, { query: 'SELECT * FROM users' });

// HTTP request logs
loggerService.httpRequest(req, res, responseTime);

// Database operation logs
loggerService.dbQuery('SELECT * FROM users', [], 150, true);

// Security event logs
loggerService.securityEvent('Failed login attempt', 'medium', {
  email: 'test@example.com',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Performance logs
loggerService.performanceEvent('user_authentication', 250, {
  userId: '123',
  method: 'jwt'
});
```

### 2. Using Performance Monitoring
```typescript
import { performanceMonitor, apiPerformanceWrapper } from '@/services/performanceMonitor';

// Monitor API endpoints
app.get('/api/dashboard/stats', async (req, res) => {
  const stats = await apiPerformanceWrapper('dashboard_stats', async () => {
    return await dbService.query('SELECT * FROM dashboard_stats');
  });
  res.json(stats);
});

// Monitor database queries
const users = await dbPerformanceWrapper('get_users', async () => {
  return await dbService.query('SELECT * FROM users');
});

// Get performance statistics
const stats = performanceMonitor.getStats();
const detailedReport = performanceMonitor.getDetailedReport();
```

### 3. Using Health Checks
```typescript
import { healthCheckService } from '@/services/healthCheckService';

// Perform comprehensive health check
const healthStatus = await healthCheckService.performHealthCheck();

// Simple liveness check
const liveness = await healthCheckService.livenessCheck();

// Detailed readiness check
const readiness = await healthCheckService.readinessCheck();
```

### 4. Using Monitoring Dashboard
```typescript
import { monitoringDashboard } from '@/services/monitoringDashboard';

// Get complete monitoring dashboard
const dashboard = await monitoringDashboard.getDashboard();

// Get real-time metrics
const metrics = await monitoringDashboard.getRealTimeMetrics();
```

## 📈 Monitoring Configuration

### Log Configuration
```typescript
// Log levels and formats
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log rotation settings
const logRotation = {
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  datePattern: 'YYYY-MM-DD'
};
```

### Alert Thresholds
```typescript
const alertThresholds = {
  errorRate: 5,        // 5%
  responseTime: 1000,  // 1 second
  memoryUsage: 80,     // 80%
  cpuUsage: 80,        // 80%
};
```

### Health Check Intervals
```typescript
// Health check intervals
const healthCheckIntervals = {
  database: 30000,     // 30 seconds
  cache: 30000,        // 30 seconds
  memory: 60000,       // 1 minute
  disk: 300000,        // 5 minutes
};
```

## 🔔 Alerting System

### Alert Types
1. **Critical Alerts**: System failures, security breaches
2. **Warning Alerts**: Performance degradation, resource usage
3. **Info Alerts**: Business events, user activities

### Alert Channels
- **Log Files**: Structured logging for alert persistence
- **Console Output**: Real-time alert display
- **API Endpoints**: Programmatic alert access
- **WebSocket**: Real-time alert streaming (future)

### Alert Examples
```typescript
// High error rate alert
if (errorRate > 5) {
  loggerService.error('High error rate detected', {
    errorRate: errorRate,
    threshold: 5,
    timestamp: new Date().toISOString()
  });
}

// Memory usage alert
if (memoryUsage > 80) {
  loggerService.warn('High memory usage', {
    usage: memoryUsage,
    threshold: 80,
    timestamp: new Date().toISOString()
  });
}

// Security event alert
loggerService.securityEvent('Suspicious login pattern', 'high', {
  userId: userId,
  ip: ip,
  attempts: failedAttempts,
  timestamp: new Date().toISOString()
});
```

## 📊 Monitoring Dashboard Features

### Real-time Metrics
- **System Status**: Overall health status
- **Performance Metrics**: Response times, throughput, error rates
- **Resource Usage**: Memory, CPU, disk usage
- **Database Stats**: Connection pool, query performance
- **Cache Stats**: Hit rates, memory usage

### Historical Data
- **Performance Trends**: Response time trends over time
- **Error Patterns**: Error rate patterns and spikes
- **Resource Usage**: Memory and CPU usage trends
- **User Activity**: Login patterns and feature usage

### Alert Management
- **Active Alerts**: Currently active alerts
- **Alert History**: Resolved alerts and their resolution times
- **Alert Severity**: Critical, warning, and info alerts
- **Alert Details**: Detailed information about each alert

## 🚨 Troubleshooting Guide

### Common Monitoring Issues

#### 1. **High Error Rate**
```bash
# Check recent errors
tail -f logs/error.log

# Check performance metrics
curl http://localhost:5001/api/performance/stats

# Check database health
curl http://localhost:5001/health
```

#### 2. **Slow Response Times**
```bash
# Check slow operations
curl http://localhost:5001/api/performance/stats | jq '.slowestRequests'

# Check database query performance
curl http://localhost:5001/api/monitoring/dashboard | jq '.database.queryStats'

# Check memory usage
curl http://localhost:5001/api/monitoring/dashboard | jq '.memory'
```

#### 3. **Memory Issues**
```bash
# Check memory usage
curl http://localhost:5001/api/monitoring/dashboard | jq '.memory'

# Check for memory leaks
node --inspect scripts/monitor-memory.js

# Clear cache if needed
redis-cli FLUSHALL
```

#### 4. **Database Issues**
```bash
# Check database health
curl http://localhost:5001/health | jq '.checks.database'

# Check connection pool
curl http://localhost:5001/api/monitoring/dashboard | jq '.database.connectionPool'

# Check slow queries
curl http://localhost:5001/api/monitoring/dashboard | jq '.database.queryStats.queries'
```

## 📚 Best Practices

### 1. **Logging Best Practices**
- Use structured logging with consistent fields
- Include relevant context in log messages
- Use appropriate log levels
- Avoid logging sensitive information
- Implement log rotation and retention policies

### 2. **Performance Monitoring Best Practices**
- Monitor all critical operations
- Set appropriate performance thresholds
- Track both success and failure metrics
- Use percentiles for response time analysis
- Monitor resource usage patterns

### 3. **Health Check Best Practices**
- Check all critical dependencies
- Use appropriate health check intervals
- Provide meaningful health status messages
- Implement graceful degradation
- Monitor health check performance

### 4. **Alerting Best Practices**
- Set appropriate alert thresholds
- Avoid alert fatigue with proper filtering
- Include relevant context in alerts
- Implement alert escalation procedures
- Test alerting systems regularly

## 🎉 Monitoring Checklist

### Pre-Deployment
- [ ] Logging configured with appropriate levels
- [ ] Performance monitoring implemented
- [ ] Health checks configured
- [ ] Alert thresholds set
- [ ] Monitoring dashboard accessible
- [ ] Log rotation configured
- [ ] Error tracking implemented

### Post-Deployment
- [ ] Monitor system health regularly
- [ ] Check performance metrics
- [ ] Review error logs
- [ ] Monitor resource usage
- [ ] Track business metrics
- [ ] Review alert effectiveness
- [ ] Update monitoring configuration

---

**Comprehensive monitoring is essential for maintaining system reliability and performance! 🔍📊**

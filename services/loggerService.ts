import winston from 'winston';
import path from 'path';

// Log levels configuration
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Custom log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileFormat,
  defaultMeta: {
    service: 'digital-research-manager',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Error log file
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // HTTP requests log file
    new winston.transports.File({
      filename: path.join('logs', 'http.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  ],

  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log'),
    }),
  ],

  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log'),
    }),
  ],
});

// Create logs directory if it doesn't exist
import { promises as fs } from 'fs';
fs.mkdir('logs', { recursive: true }).catch(() => {
  // Ignore error if directory already exists
});

// Structured logging methods
class LoggerService {
  private static instance: LoggerService;

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  // Application logs
  info(message: string, meta?: any): void {
    logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    logger.warn(message, meta);
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const errorMeta = {
      ...meta,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };
    logger.error(message, errorMeta);
  }

  debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }

  // HTTP request logs
  httpRequest(req: any, res: any, responseTime: number): void {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      contentLength: res.get('Content-Length'),
    };

    logger.http('HTTP Request', logData);
  }

  // Database operation logs
  dbQuery(query: string, params: any[], executionTime: number, success: boolean): void {
    const logData = {
      query: query.substring(0, 200), // Truncate long queries
      params: params?.length > 0 ? params : undefined,
      executionTime: `${executionTime}ms`,
      success,
    };

    if (success) {
      logger.debug('Database Query', logData);
    } else {
      logger.error('Database Query Failed', logData);
    }
  }

  // Authentication logs
  authEvent(event: string, userId?: string, ip?: string, meta?: any): void {
    const logData = {
      event,
      userId,
      ip,
      ...meta,
    };

    logger.info(`Auth Event: ${event}`, logData);
  }

  // Security logs
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any): void {
    const logData = {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    switch (severity) {
      case 'critical':
      case 'high':
        logger.error(`Security Event: ${event}`, logData);
        break;
      case 'medium':
        logger.warn(`Security Event: ${event}`, logData);
        break;
      case 'low':
        logger.info(`Security Event: ${event}`, logData);
        break;
    }
  }

  // Performance logs
  performanceEvent(operation: string, duration: number, meta?: any): void {
    const logData = {
      operation,
      duration: `${duration}ms`,
      ...meta,
    };

    if (duration > 1000) {
      logger.warn(`Slow Operation: ${operation}`, logData);
    } else {
      logger.debug(`Performance: ${operation}`, logData);
    }
  }

  // Business logic logs
  businessEvent(event: string, userId?: string, meta?: any): void {
    const logData = {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    logger.info(`Business Event: ${event}`, logData);
  }

  // System health logs
  healthCheck(component: string, status: 'healthy' | 'unhealthy', details?: any): void {
    const logData = {
      component,
      status,
      timestamp: new Date().toISOString(),
      ...details,
    };

    if (status === 'healthy') {
      logger.debug(`Health Check: ${component}`, logData);
    } else {
      logger.error(`Health Check Failed: ${component}`, logData);
    }
  }

  // Get logger instance for custom usage
  getLogger(): winston.Logger {
    return logger;
  }
}

// Singleton instance
export const loggerService = LoggerService.getInstance();

// Express middleware for HTTP logging
export const httpLoggingMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    loggerService.httpRequest(req, res, responseTime);
  });

  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (error: any, req: any, res: any, next: any) => {
  loggerService.error('Unhandled Error', error, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  next(error);
};

// Database logging wrapper
export const dbLoggingWrapper = async <T>(
  query: string,
  params: any[],
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const executionTime = Date.now() - startTime;
    loggerService.dbQuery(query, params, executionTime, true);
    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    loggerService.dbQuery(query, params, executionTime, false);
    throw error;
  }
};

export default loggerService;

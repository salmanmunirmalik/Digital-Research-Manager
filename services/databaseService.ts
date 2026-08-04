import mysql from 'mysql2/promise';
import { cacheService } from './cacheService';

// Enhanced database configuration with connection pooling
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DB || 'digital_research_manager',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  socketPath: process.env.MYSQL_SOCKET || undefined,
  
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '20'),
  queueLimit: 0,
  connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  
  // SSL configuration for production (optional, depending on MySQL host)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
};

const pool = mysql.createPool(dbConfig);

const normalizeQuery = (text: string) => text.replace(/\$\d+/g, '?');

// Query execution with caching and performance monitoring
class DatabaseService {
  private static instance: DatabaseService;
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Execute query with caching and performance monitoring
  async query(
    text: string, 
    params?: any[], 
    options?: { 
      cache?: boolean; 
      cacheKey?: string; 
      cacheTTL?: number;
      timeout?: number;
    }
  ): Promise<any> {
    const startTime = Date.now();
    const queryId = this.generateQueryId(text, params);
    
    try {
      // Check cache first if caching is enabled
      if (options?.cache && options?.cacheKey) {
        const cachedResult = await cacheService.get(options.cacheKey);
        if (cachedResult) {
          console.log(`📦 Cache HIT for query: ${queryId}`);
          return cachedResult;
        }
      }

      const client = await pool.getConnection();
      try {
        const [rows] = await client.query({
          sql: normalizeQuery(text),
          values: params
        });
        const result = { rows };

        const executionTime = Date.now() - startTime;
        
        // Update query statistics
        this.updateQueryStats(queryId, executionTime);
        
        // Cache result if caching is enabled
        if (options?.cache && options?.cacheKey && result.rows.length > 0) {
          await cacheService.set(options.cacheKey, result.rows, options.cacheTTL);
          console.log(`📦 Cache SET for query: ${queryId}`);
        }

        console.log(`✅ Query executed: ${queryId} (${executionTime}ms)`);
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Query failed: ${queryId} (${executionTime}ms)`, error);
      throw error;
    }
  }

  // Execute transaction
  async transaction<T>(callback: (client: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const client = await pool.getConnection();
    try {
      await client.query('START TRANSACTION');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Batch insert with performance optimization
  async batchInsert(
    table: string, 
    columns: string[], 
    values: any[][], 
    options?: { 
      batchSize?: number; 
      cache?: boolean; 
      cacheKey?: string; 
      cacheTTL?: number;
    }
  ): Promise<any> {
    const batchSize = options?.batchSize || 1000;
    const results = [];

    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      const placeholders = batch.map((_, index) => {
        const rowPlaceholders = columns.map((_, colIndex) => 
          `$${index * columns.length + colIndex + 1}`
        ).join(', ');
        return `(${rowPlaceholders})`;
      }).join(', ');

      const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES ${placeholders}
        RETURNING *
      `;

      const flatValues = batch.flat();
      const result = await this.query(query, flatValues, options);
      results.push(result);
    }

    return results;
  }

  // Get query statistics
  getQueryStats(): any {
    const stats = Array.from(this.queryStats.entries()).map(([queryId, stats]) => ({
      queryId,
      ...stats
    }));

    return {
      totalQueries: stats.length,
      queries: stats.sort((a, b) => b.avgTime - a.avgTime),
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  }

  // Health check
  async healthCheck(): Promise<any> {
    try {
      const startTime = Date.now();
      const result = await this.query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        poolStats: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        },
        queryStats: this.getQueryStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        poolStats: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        }
      };
    }
  }

  // Generate unique query ID for monitoring
  private generateQueryId(text: string, params?: any[]): string {
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    const paramsHash = params ? Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 8) : '';
    return `${normalizedText.slice(0, 50)}...${paramsHash}`;
  }

  // Update query statistics
  private updateQueryStats(queryId: string, executionTime: number): void {
    const existing = this.queryStats.get(queryId) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;
    this.queryStats.set(queryId, existing);
  }

  // Close all connections
  async close(): Promise<void> {
    await pool.end();
  }
}

// Singleton instance
export const dbService = DatabaseService.getInstance();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down database connections...');
  await dbService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down database connections...');
  await dbService.close();
  process.exit(0);
});

export default dbService;

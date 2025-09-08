import { createClient, RedisClientType } from 'redis';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.log('❌ Redis connection failed after 10 retries');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('🔄 Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to initialize Redis client:', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('❌ Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Redis EXISTS error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('❌ Redis FLUSH error:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace
      };
    } catch (error) {
      console.error('❌ Redis STATS error:', error);
      return null;
    }
  }

  // Cache key generators
  static generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  // Common cache keys
  static KEYS = {
    USER: (id: string) => `user:${id}`,
    USER_PROFILE: (id: string) => `user:profile:${id}`,
    PROTOCOL: (id: string) => `protocol:${id}`,
    PROTOCOLS_LIST: (labId: string, page: number) => `protocols:list:${labId}:${page}`,
    INVENTORY: (labId: string) => `inventory:${labId}`,
    INSTRUMENTS: (labId: string) => `instruments:${labId}`,
    DASHBOARD_STATS: (userId: string) => `dashboard:stats:${userId}`,
    DASHBOARD_TASKS: (userId: string) => `dashboard:tasks:${userId}`,
    DASHBOARD_EVENTS: (userId: string) => `dashboard:events:${userId}`,
    CALCULATOR_RESULT: (hash: string) => `calculator:result:${hash}`,
    SEARCH_RESULTS: (query: string, type: string) => `search:${type}:${Buffer.from(query).toString('base64')}`,
    API_RATE_LIMIT: (ip: string, endpoint: string) => `rate_limit:${endpoint}:${ip}`,
    SESSION: (token: string) => `session:${token}`,
  };

  // Cache TTL constants (in seconds)
  static TTL = {
    USER_PROFILE: 3600, // 1 hour
    PROTOCOLS_LIST: 1800, // 30 minutes
    INVENTORY: 900, // 15 minutes
    INSTRUMENTS: 900, // 15 minutes
    DASHBOARD_STATS: 300, // 5 minutes
    DASHBOARD_TASKS: 600, // 10 minutes
    DASHBOARD_EVENTS: 1800, // 30 minutes
    CALCULATOR_RESULT: 86400, // 24 hours
    SEARCH_RESULTS: 1800, // 30 minutes
    API_RATE_LIMIT: 900, // 15 minutes
    SESSION: 86400, // 24 hours
  };
}

// Singleton instance
export const cacheService = new CacheService();

// Cache middleware for Express
export const cacheMiddleware = (ttlSeconds: number, keyGenerator?: (req: any) => string) => {
  return async (req: any, res: any, next: any) => {
    try {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : `api:${req.method}:${req.originalUrl}`;
      
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        console.log(`📦 Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }
      
      // Store original res.json
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data: any) {
        // Cache the response
        cacheService.set(cacheKey, data, ttlSeconds);
        console.log(`📦 Cache SET: ${cacheKey}`);
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('❌ Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation helpers
export const invalidateUserCache = async (userId: string) => {
  const keys = [
    CacheService.KEYS.USER(userId),
    CacheService.KEYS.USER_PROFILE(userId),
    CacheService.KEYS.DASHBOARD_STATS(userId),
    CacheService.KEYS.DASHBOARD_TASKS(userId),
    CacheService.KEYS.DASHBOARD_EVENTS(userId),
  ];
  
  for (const key of keys) {
    await cacheService.del(key);
  }
};

export const invalidateLabCache = async (labId: string) => {
  const keys = [
    CacheService.KEYS.PROTOCOLS_LIST(labId, 1), // This will need to be more sophisticated
    CacheService.KEYS.INVENTORY(labId),
    CacheService.KEYS.INSTRUMENTS(labId),
  ];
  
  for (const key of keys) {
    await cacheService.del(key);
  }
};

export default cacheService;

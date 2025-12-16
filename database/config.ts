import { Pool, PoolConfig } from 'pg';

const DEFAULT_MAX_CLIENTS = Number(process.env.DB_POOL_MAX || 20);
const DEFAULT_IDLE_TIMEOUT = Number(process.env.DB_IDLE_TIMEOUT || 30_000);
const DEFAULT_CONNECTION_TIMEOUT = Number(process.env.DB_CONNECTION_TIMEOUT || 2_000);

function buildPoolConfig(): PoolConfig {
  if (process.env.DATABASE_URL) {
    const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
    
    // Use connectionString directly - pg library handles URL encoding automatically
    // This is the most reliable approach for passwords with special characters
    const config: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      max: DEFAULT_MAX_CLIENTS,
      idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT,
      connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT,
    };
    
    // Only add SSL if needed
    if (useSsl) {
      config.ssl = { rejectUnauthorized: false };
    }
    
    return config;
  }

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 5432);
  const database = process.env.DB_NAME || 'digital_research_manager';
  const user = process.env.DB_USER || process.env.USER || 'postgres';
  const password = process.env.DB_PASSWORD;

  const config: PoolConfig = {
    host,
    port,
    database,
    user,
    max: DEFAULT_MAX_CLIENTS,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT,
    connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT,
  };

  // PostgreSQL requires password to be a string, not undefined
  // Only set password if it's explicitly provided (non-empty)
  // If not provided, don't include it in config (PostgreSQL will use default auth)
  if (password !== undefined && password !== null && String(password).trim() !== '') {
    config.password = String(password);
  } else if (password === undefined || password === null) {
    // If password is not set, use empty string (PostgreSQL will use peer authentication)
    // This prevents the "client password must be a string" error
    config.password = '';
  }

  return config;
}

// Build config
const poolConfig = buildPoolConfig();

// When using connectionString, we don't need to check password
// When using individual fields, ensure password is a string
if (!poolConfig.connectionString && poolConfig.password !== undefined) {
  if (typeof poolConfig.password !== 'string') {
    poolConfig.password = String(poolConfig.password || '');
  }
}

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down database connections...');
  await pool.end();
  process.exit(0);
});

export default pool;

import { Pool, PoolConfig } from 'pg';

const DEFAULT_MAX_CLIENTS = Number(process.env.DB_POOL_MAX || 20);
const DEFAULT_IDLE_TIMEOUT = Number(process.env.DB_IDLE_TIMEOUT || 30_000);
const DEFAULT_CONNECTION_TIMEOUT = Number(process.env.DB_CONNECTION_TIMEOUT || 2_000);

function buildPoolConfig(): PoolConfig {
  if (process.env.DATABASE_URL) {
    const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: DEFAULT_MAX_CLIENTS,
      idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT,
      connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT,
    };
  }

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 5432);
  const database = process.env.DB_NAME || 'digital_research_manager';
  const user = process.env.DB_USER || process.env.USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';

  return {
    host,
    port,
    database,
    user,
    password,
    max: DEFAULT_MAX_CLIENTS,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT,
    connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT,
  };
}

const pool = new Pool(buildPoolConfig());

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

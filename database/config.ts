import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DEFAULT_POOL_MAX = Number(process.env.DB_POOL_MAX || 20);
const DEFAULT_IDLE_TIMEOUT = Number(process.env.DB_IDLE_TIMEOUT || 30_000);
const DEFAULT_CONNECTION_TIMEOUT = Number(process.env.DB_CONNECTION_TIMEOUT || 10_000);

const buildMysqlConfig = () => {
  if (process.env.MYSQL_URL) {
    return {
      uri: process.env.MYSQL_URL,
      connectionLimit: DEFAULT_POOL_MAX,
      connectTimeout: DEFAULT_CONNECTION_TIMEOUT
    };
  }

  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DB || 'digital_research_manager',
    user: process.env.MYSQL_USER || process.env.USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    socketPath: process.env.MYSQL_SOCKET || undefined,
    connectionLimit: DEFAULT_POOL_MAX,
    connectTimeout: DEFAULT_CONNECTION_TIMEOUT,
    idleTimeout: DEFAULT_IDLE_TIMEOUT
  };
};

const config = buildMysqlConfig();
const pool = config.uri
  ? mysql.createPool(config.uri)
  : mysql.createPool(config);

const normalizeQuery = (text: string) => text.replace(/\$\d+/g, '?');

const query = async (text: string, params: any[] = []): Promise<{ rows: any[] }> => {
  const [rows] = await pool.query(normalizeQuery(text), params);
  return { rows: rows as any[] };
};

const connect = async () => {
  const connection = await pool.getConnection();
  return {
    query: async (text: string, params: any[] = []): Promise<{ rows: any[] }> => {
      const [rows] = await connection.query(normalizeQuery(text), params);
      return { rows: rows as any[] };
    },
    release: () => connection.release()
  };
};

const end = async () => {
  await pool.end();
};

pool.on('connection', () => {
  console.log('✅ Connected to MySQL database');
});

export default {
  query,
  connect,
  end
};

import { Pool } from 'pg';
import { config } from './test-config';

let dbPool: Pool;

beforeAll(async () => {
  // Initialize database connection
  dbPool = new Pool({
    host: config.database.host,
    port: parseInt(config.database.port),
    database: config.database.database,
    user: config.database.username,
    password: config.database.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test database connection
  try {
    const client = await dbPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
});

afterAll(async () => {
  if (dbPool) {
    await dbPool.end();
  }
});

// Make database pool available to tests
global.dbPool = dbPool;

// Helper functions for CRUD testing
global.crudHelpers = {
  async executeQuery(query: string, params: any[] = []) {
    const client = await dbPool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  },

  async createTestRecord(table: string, data: Record<string, any>) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map((_, index) => `$${index + 1}`).join(', ');
    const values = Object.values(data);
    
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.executeQuery(query, values);
    return result.rows[0];
  },

  async readTestRecord(table: string, id: string | number) {
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    const result = await this.executeQuery(query, [id]);
    return result.rows[0];
  },

  async updateTestRecord(table: string, id: string | number, data: Record<string, any>) {
    const setClause = Object.keys(data).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(data);
    
    const query = `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`;
    const result = await this.executeQuery(query, [id, ...values]);
    return result.rows[0];
  },

  async deleteTestRecord(table: string, id: string | number) {
    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const result = await this.executeQuery(query, [id]);
    return result.rows[0];
  },

  async cleanupTestData(table: string, condition: string, params: any[] = []) {
    const query = `DELETE FROM ${table} WHERE ${condition}`;
    await this.executeQuery(query, params);
  },

  async getTableSchema(table: string) {
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `;
    const result = await this.executeQuery(query, [table]);
    return result.rows;
  },

  async getTableRowCount(table: string) {
    const query = `SELECT COUNT(*) as count FROM ${table}`;
    const result = await this.executeQuery(query);
    return parseInt(result.rows[0].count);
  },

  async resetTestData() {
    // Clean up test data from all tables
    const tables = [
      'lab_notebook_entries',
      'protocols',
      'data_results',
      'supplier_products',
      'journal_entries',
      'user_profiles',
      'experiments',
      'samples',
    ];

    for (const table of tables) {
      try {
        await this.executeQuery(`DELETE FROM ${table} WHERE created_at > NOW() - INTERVAL '1 hour'`);
      } catch (error) {
        // Table might not exist, continue
        console.log(`Note: Table ${table} not found or not accessible`);
      }
    }
  },
};

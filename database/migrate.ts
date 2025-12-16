import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Create a fresh pool for migrations to avoid cached config issues
function createMigrationPool(): Pool {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }
  
  return new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'digital_research_manager',
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });
}

const pool = createMigrationPool();

interface Migration {
  id: string;
  name: string;
  sql: string;
  executed_at?: Date;
}

class DatabaseMigrator {
  private migrationsTable = 'schema_migrations';

  async init() {
    try {
      // Create migrations table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Migrations table initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await pool.query(`SELECT id FROM ${this.migrationsTable}`);
      return result.rows.map(row => row.id);
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error);
      return [];
    }
  }

  async executeMigration(migration: Migration) {
    try {
      await pool.query('BEGIN');
      
      // Execute the migration SQL
      await pool.query(migration.sql);
      
      // Record the migration
      await pool.query(
        `INSERT INTO ${this.migrationsTable} (id, name) VALUES ($1, $2)`,
        [migration.id, migration.name]
      );
      
      await pool.query('COMMIT');
      console.log(`✅ Executed migration: ${migration.name}`);
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`❌ Failed to execute migration ${migration.name}:`, error);
      throw error;
    }
  }

  async runMigrations(migrationsDir: string = './database/migrations') {
    try {
      console.log('🚀 Starting migration process...');
      console.log('📁 Migrations directory:', path.resolve(migrationsDir));
      
      await this.init();
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = this.getMigrationFiles(migrationsDir);
      
      console.log(`📋 Found ${migrationFiles.length} migration files`);
      console.log(`📋 ${executedMigrations.length} migrations already executed`);
      
      if (migrationFiles.length === 0) {
        console.log('⚠️  No migration files found!');
        return;
      }
      
      for (const file of migrationFiles) {
        console.log(`📄 Processing file: ${file}`);
        const migrationId = path.basename(file, '.sql');
        console.log(`🆔 Migration ID: ${migrationId}`);
        
        if (!executedMigrations.includes(migrationId)) {
          console.log(`🔄 Running migration: ${migrationId}`);
          
          const sql = fs.readFileSync(file, 'utf8');
          console.log(`📝 SQL content length: ${sql.length} characters`);
          
          const migration: Migration = {
            id: migrationId,
            name: path.basename(file),
            sql
          };
          
          await this.executeMigration(migration);
        } else {
          console.log(`⏭️  Skipping already executed migration: ${migrationId}`);
        }
      }
      
      console.log('🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private getMigrationFiles(migrationsDir: string): string[] {
    try {
      if (!fs.existsSync(migrationsDir)) {
        return [];
      }
      
      return fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort() // Ensure migrations run in order
        .map(file => path.join(migrationsDir, file));
    } catch (error) {
      console.error('❌ Failed to read migrations directory:', error);
      return [];
    }
  }

  async close() {
    await pool.end();
  }
}

// CLI usage
const migrator = new DatabaseMigrator();

migrator.runMigrations()
  .then(() => {
    console.log('🚀 Migration script completed successfully');
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    pool.end();
    process.exit(1);
  });

export default DatabaseMigrator;

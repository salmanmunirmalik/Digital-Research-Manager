import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database;

export async function initializeDatabase() {
  const dbPath = join(__dirname, '../../data/researchlab.db');
  
  // Ensure data directory exists
  const dataDir = join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  // Create tables
  await createTables();
  
  // Insert initial data
  await insertInitialData();
  
  console.log('Database initialized at:', dbPath);
}

async function createTables() {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Research Assistant',
      avatar_url TEXT,
      status TEXT DEFAULT 'Offline',
      expertise TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Protocols table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS protocols (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      author_id TEXT NOT NULL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      version TEXT DEFAULT '1.0.0',
      access TEXT DEFAULT 'Lab Only',
      discussion_count INTEGER DEFAULT 0,
      video_url TEXT,
      forked_from TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users (id),
      FOREIGN KEY (forked_from) REFERENCES protocols (id)
    )
  `);

  // Protocol steps table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS protocol_steps (
      id TEXT PRIMARY KEY,
      protocol_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      description TEXT NOT NULL,
      details TEXT,
      safety_warning TEXT,
      materials TEXT,
      duration_minutes INTEGER,
      calculator_data TEXT,
      video_timestamp TEXT,
      conditional_data TEXT,
      FOREIGN KEY (protocol_id) REFERENCES protocols (id) ON DELETE CASCADE
    )
  `);

  // Protocol attachments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS protocol_attachments (
      id TEXT PRIMARY KEY,
      protocol_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      FOREIGN KEY (protocol_id) REFERENCES protocols (id) ON DELETE CASCADE
    )
  `);

  // Projects table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users (id)
    )
  `);

  // Experiments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      goal TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `);

  // Notebook entries table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notebook_entries (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      title TEXT NOT NULL,
      author_id TEXT NOT NULL,
      protocol_id TEXT,
      status TEXT DEFAULT 'In Progress',
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (experiment_id) REFERENCES experiments (id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users (id),
      FOREIGN KEY (protocol_id) REFERENCES protocols (id)
    )
  `);

  // Content blocks table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS content_blocks (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES notebook_entries (id) ON DELETE CASCADE
    )
  `);

  // Inventory items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      supplier TEXT,
      catalog_number TEXT,
      location TEXT,
      quantity_value REAL NOT NULL,
      quantity_unit TEXT NOT NULL,
      lot_number TEXT,
      expiration_date TEXT,
      low_stock_threshold REAL,
      sds_url TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Instruments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS instruments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT DEFAULT 'Operational',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bookings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      instrument_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instrument_id) REFERENCES instruments (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Results table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author_id TEXT NOT NULL,
      protocol_id TEXT,
      summary TEXT,
      tags TEXT,
      data_preview TEXT,
      source TEXT DEFAULT 'Manual',
      notebook_entry_id TEXT,
      insights TEXT,
      next_steps TEXT,
      pitfalls TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users (id),
      FOREIGN KEY (protocol_id) REFERENCES protocols (id),
      FOREIGN KEY (notebook_entry_id) REFERENCES notebook_entries (id)
    )
  `);

  // Help requests table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS help_requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author_id TEXT NOT NULL,
      protocol_id TEXT,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users (id),
      FOREIGN KEY (protocol_id) REFERENCES protocols (id)
    )
  `);

  // Scratchpad items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scratchpad_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      calculator_name TEXT NOT NULL,
      inputs TEXT NOT NULL,
      result TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  console.log('✅ All tables created successfully');
}

async function insertInitialData() {
  // Check if data already exists
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  
  if (userCount.count > 0) {
    console.log('✅ Initial data already exists, skipping...');
    return;
  }

      // Insert default admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('admin123', 10);
  
  await db.run(`
    INSERT INTO users (id, username, email, password_hash, role, expertise, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'admin-001',
    'admin',
    'admin@researchlab.com',
    hashedPassword,
    'Principal Investigator',
    'Molecular Biology, Biochemistry',
    'Online'
  ]);

  // Insert sample instruments
  await db.run(`
    INSERT INTO instruments (id, name, type, location, status)
    VALUES (?, ?, ?, ?, ?)
  `, ['inst-001', 'Confocal Microscope', 'Microscope', 'Room 101', 'Operational']);

  await db.run(`
    INSERT INTO instruments (id, name, type, location, status)
    VALUES (?, ?, ?, ?, ?)
  `, ['inst-002', 'PCR Machine', 'PCR Machine', 'Room 102', 'Operational']);

  // Insert sample inventory items
  await db.run(`
    INSERT INTO inventory_items (id, name, type, supplier, catalog_number, location, quantity_value, quantity_unit, lot_number, expiration_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'inv-001',
    'Taq DNA Polymerase',
    'Reagent',
    'Thermo Fisher',
    '10342020',
    'Freezer A1',
    100,
    'μL',
    'LOT123',
    '2025-12-31'
  ]);

  console.log('✅ Initial data inserted successfully');
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
  }
}

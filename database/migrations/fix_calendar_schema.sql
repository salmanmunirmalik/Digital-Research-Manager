-- Fix Calendar Events Schema Mismatch (SQLite)
-- Update column names to match API expectations

-- Note: SQLite doesn't support ALTER COLUMN directly
-- We need to recreate the table with correct column names

-- Step 1: Create new table with correct schema
CREATE TABLE IF NOT EXISTS calendar_events_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,  -- Changed from event_date
  end_time TEXT,              -- Changed from event_time
  event_type TEXT DEFAULT 'meeting',
  priority TEXT DEFAULT 'medium',
  color TEXT DEFAULT 'blue',
  all_day INTEGER DEFAULT 0,  -- Changed from is_all_day (SQLite uses INTEGER for boolean)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 2: Copy data from old table to new table
INSERT INTO calendar_events_new (id, user_id, title, description, start_time, end_time, event_type, priority, color, all_day, created_at, updated_at)
SELECT 
  id,
  user_id,
  title,
  description,
  event_date as start_time,  -- Map old column to new column
  event_time as end_time,     -- Map old column to new column
  event_type,
  priority,
  color,
  is_all_day as all_day,      -- Map old column to new column
  created_at,
  updated_at
FROM calendar_events;

-- Step 3: Drop old table
DROP TABLE IF EXISTS calendar_events;

-- Step 4: Rename new table
ALTER TABLE calendar_events_new RENAME TO calendar_events;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);

-- Step 6: Create trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_calendar_events_updated_at 
AFTER UPDATE ON calendar_events
BEGIN
  UPDATE calendar_events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

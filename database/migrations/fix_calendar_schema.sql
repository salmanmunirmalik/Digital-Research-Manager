-- Fix Calendar Events Schema for PostgreSQL
-- Update column names to match API expectations (if needed)
-- Note: This migration is optional - only runs if calendar_events table exists with old column names

DO $$
BEGIN
    -- Check if table exists with old column names
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'event_date'
    ) THEN
        -- Add new columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'calendar_events' 
            AND column_name = 'start_time'
        ) THEN
            ALTER TABLE calendar_events 
            ADD COLUMN start_time TIMESTAMP WITH TIME ZONE,
            ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
            
            -- Migrate data from old columns to new columns
            UPDATE calendar_events 
            SET start_time = (event_date + COALESCE(event_time, '00:00:00'::time))::timestamp with time zone,
                end_time = (event_date + COALESCE(event_time, '23:59:59'::time))::timestamp with time zone
            WHERE start_time IS NULL;
        END IF;
        
        -- Note: We keep the old columns for backward compatibility
        -- They can be dropped later if not needed
    END IF;
END $$;

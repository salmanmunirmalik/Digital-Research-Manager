-- Migration: Remove unused Lab Management tables
-- Date: 2025-01-28
-- Purpose: Clean up tables from deleted Lab Management page (features migrated to Lab Workspace)
-- 
-- Tables to drop:
-- - meetings: Lab management meetings (replaced by team_meetings in project management)
-- - issues: Lab management issue tracking (not used, protocol execution uses different issue tracking)
-- - achievements: Lab management achievements (not used)
--
-- Verification:
-- - All tables are empty (0 rows)
-- - No foreign key dependencies found
-- - team_meetings and meeting_action_items are DIFFERENT tables and remain untouched

BEGIN;

-- Drop achievements table (unused, empty)
DROP TABLE IF EXISTS achievements CASCADE;

-- Drop issues table (unused, empty, different from protocol execution issues)
DROP TABLE IF EXISTS issues CASCADE;

-- Drop meetings table (unused, empty, different from team_meetings)
DROP TABLE IF EXISTS meetings CASCADE;

-- Verify tables are dropped
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
        RAISE EXCEPTION 'Table achievements still exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issues') THEN
        RAISE EXCEPTION 'Table issues still exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
        RAISE EXCEPTION 'Table meetings still exists';
    END IF;
    
    RAISE NOTICE 'Successfully removed unused Lab Management tables';
END $$;

COMMIT;










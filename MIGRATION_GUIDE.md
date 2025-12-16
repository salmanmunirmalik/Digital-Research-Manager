# Database Migration Guide

## Running the User AI Content Migration

The migration creates three new tables:
- `user_ai_content` - Stores processed user content with embeddings
- `user_content_relationships` - Maps relationships between content
- `provider_capabilities` - Stores AI provider capabilities

### Option 1: Using psql (Recommended)

```bash
# If you have DATABASE_URL in .env
psql "$DATABASE_URL" -f database/migrations/20250125_user_ai_content_fallback.sql

# Or with explicit credentials
psql -h localhost -p 5432 -U postgres -d digital_research_manager \
  -f database/migrations/20250125_user_ai_content_fallback.sql
```

**Note:** The `_fallback` version uses JSONB for embeddings (works without pgvector extension).
If you have pgvector installed, you can use the original file:
```bash
psql "$DATABASE_URL" -f database/migrations/20250125_user_ai_content.sql
```

### Option 2: Using the Node.js Script

Update the database password in `.env` file, then run:

```bash
npx tsx scripts/run-migration.ts
```

### Option 3: Using Database GUI Tool

1. Open your PostgreSQL client (pgAdmin, DBeaver, TablePlus, etc.)
2. Connect to your database
3. Open and execute: `database/migrations/20250125_user_ai_content_fallback.sql`

### Verification

After running the migration, verify it worked:

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_ai_content', 'user_content_relationships', 'provider_capabilities');

-- Check provider capabilities were inserted
SELECT provider, provider_name FROM provider_capabilities;
```

You should see:
- ✅ user_ai_content
- ✅ user_content_relationships  
- ✅ provider_capabilities

And 4 provider records (OpenAI, Google Gemini, Anthropic Claude, Perplexity).

### Troubleshooting

**Password Authentication Failed:**
- Update `.env` file with correct `DB_PASSWORD`
- Or use `PGPASSWORD=yourpassword psql ...`

**pgvector Extension Not Found:**
- Use the `_fallback.sql` file (uses JSONB instead of VECTOR)
- Or install pgvector: `brew install pgvector` (macOS) or compile from source

**Connection Refused:**
- Ensure PostgreSQL is running: `brew services start postgresql` (macOS)
- Check port 5432 is not blocked


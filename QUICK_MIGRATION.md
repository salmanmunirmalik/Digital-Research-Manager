# Quick Migration Instructions

## Run the Migration

I've created a script that will prompt you for your database password:

```bash
./scripts/run-migration-with-password.sh
```

**OR** run directly with your password:

```bash
PGPASSWORD=your_actual_password psql -h localhost -p 5432 -U postgres -d digital_research_manager \
  -f database/migrations/20250125_user_ai_content_fallback.sql
```

**OR** if you know your DATABASE_URL works:

```bash
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/digital_research_manager" \
  -f database/migrations/20250125_user_ai_content_fallback.sql
```

## What the Migration Creates

1. **user_ai_content** - Stores processed user content with embeddings (JSONB format)
2. **user_content_relationships** - Maps relationships between content pieces
3. **provider_capabilities** - Stores AI provider capabilities (pre-loaded with 4 providers)

## Verify It Worked

After running, check:

```sql
-- See the tables
\dt user_ai_content
\dt user_content_relationships  
\dt provider_capabilities

-- See provider data
SELECT provider, provider_name FROM provider_capabilities;
```

You should see 3 tables and 4 provider records.


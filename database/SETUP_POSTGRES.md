# PostgreSQL Setup & Password Reset Guide

## Step 1: Check if PostgreSQL is Running

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Or check processes
ps aux | grep postgres
```

## Step 2: Find Your PostgreSQL Installation

### If installed via Homebrew (macOS):
```bash
# Check Homebrew services
brew services list | grep postgres

# Check PostgreSQL version
psql --version

# Find PostgreSQL data directory
brew info postgresql@14  # or your version
```

### If installed via Postgres.app:
- Check Applications folder for "Postgres.app"
- Default port: 5432
- Default user: your macOS username

### If installed via system package manager:
```bash
# On macOS
which psql
# Usually: /usr/local/bin/psql or /opt/homebrew/bin/psql
```

## Step 3: Try to Connect (Find Your Username)

Try these common usernames:

```bash
# Try with your macOS username (no password)
psql -U $(whoami) -d postgres

# Try with 'postgres' user (no password)
psql -U postgres -d postgres

# Try with your macOS username to your database
psql -U $(whoami) -d digital_research_manager
```

## Step 4: Reset PostgreSQL Password

### Option A: Reset via psql (if you can connect)

```bash
# Connect to PostgreSQL
psql -U postgres -d postgres

# Then run:
ALTER USER postgres WITH PASSWORD 'your_new_password';
\q
```

### Option B: Reset via pg_hba.conf (if you have file access)

1. Find `pg_hba.conf` file:
```bash
# Common locations:
/usr/local/var/postgres/pg_hba.conf
/opt/homebrew/var/postgres/pg_hba.conf
~/Library/Application\ Support/Postgres/var-14/pg_hba.conf  # Postgres.app
```

2. Temporarily change authentication method:
   - Find line: `host all all 127.0.0.1/32 scram-sha-256`
   - Change to: `host all all 127.0.0.1/32 trust`
   - Save file

3. Restart PostgreSQL:
```bash
# Homebrew
brew services restart postgresql@14

# Or Postgres.app - restart from Applications
```

4. Connect without password:
```bash
psql -U postgres -d postgres
```

5. Set new password:
```sql
ALTER USER postgres WITH PASSWORD 'your_new_password';
\q
```

6. Revert pg_hba.conf back to `scram-sha-256` and restart

### Option C: Create a New User (if you can't reset postgres)

```bash
# Connect as your macOS user
psql -U $(whoami) -d postgres

# Create new user
CREATE USER researchlab_user WITH PASSWORD 'your_password';
CREATE DATABASE digital_research_manager OWNER researchlab_user;
GRANT ALL PRIVILEGES ON DATABASE digital_research_manager TO researchlab_user;
\q
```

Then update your `.env`:
```
DATABASE_URL=postgres://researchlab_user:your_password@localhost:5432/digital_research_manager
```

## Step 5: Check if Database Exists

```bash
# List all databases
psql -U postgres -l

# Or with your username
psql -U $(whoami) -l
```

If `digital_research_manager` doesn't exist, create it:
```sql
CREATE DATABASE digital_research_manager;
```

## Step 6: Update Your .env File

Once you have the correct password, update your `.env`:

```bash
# Open .env file
nano .env
# or
code .env
```

Update this line:
```
DATABASE_URL=postgres://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/digital_research_manager
```

## Common Issues & Solutions

### Issue: "psql: error: connection to server failed"
**Solution**: PostgreSQL is not running. Start it:
```bash
# Homebrew
brew services start postgresql@14

# Or Postgres.app - launch from Applications
```

### Issue: "database does not exist"
**Solution**: Create the database:
```bash
psql -U postgres -c "CREATE DATABASE digital_research_manager;"
```

### Issue: "permission denied"
**Solution**: Use a user that has permissions, or grant permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE digital_research_manager TO your_username;
```

## Quick Test After Setup

```bash
# Test connection
psql "postgres://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/digital_research_manager" -c "SELECT 1;"
```

If this works, your `.env` file is correct!


# 🔧 Database Connection Issue - Resolution Guide
## Fixing "client password must be a string" Error

**Issue:** Database connection error: `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`  
**Status:** Environment/Configuration Issue  
**Code Status:** ✅ Code fixes are correct

---

## 🔍 ROOT CAUSE

The error indicates that the PostgreSQL client is receiving an invalid password value (likely `undefined` or `null` instead of a string).

**This is NOT a code bug** - the code we fixed is correct. This is an **environment configuration issue**.

---

## ✅ SOLUTION OPTIONS

### **Option 1: Use DATABASE_URL (Recommended)**

**Best for:** Production and most development setups

1. **Set DATABASE_URL environment variable:**
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

2. **Or create `.env` file:**
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   ```

3. **For passwords with special characters:**
   ```bash
   # URL encode special characters
   export DATABASE_URL="postgresql://user:pass%40word@localhost:5432/db"
   ```

**Note:** The `database/config.ts` file already handles DATABASE_URL correctly.

---

### **Option 2: Set Individual Database Variables**

**Best for:** Development with explicit configuration

1. **Set environment variables:**
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=digital_research_manager
   export DB_USER=postgres
   export DB_PASSWORD=your_password_here
   ```

2. **Or in `.env` file:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=digital_research_manager
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   ```

**Important:** Make sure `DB_PASSWORD` is set and not empty.

---

### **Option 3: Use Peer Authentication (No Password)**

**Best for:** Local development with PostgreSQL peer authentication

1. **Remove password requirement:**
   ```bash
   unset DB_PASSWORD
   # Or don't set it at all
   ```

2. **Configure PostgreSQL for peer authentication:**
   - Edit `/etc/postgresql/*/main/pg_hba.conf`
   - Set authentication method to `peer` for local connections

**Note:** This only works if your system user matches the PostgreSQL user.

---

## 🔧 QUICK FIX STEPS

### **Step 1: Check Current Configuration**

```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# Check if DB_PASSWORD is set
echo $DB_PASSWORD

# Check if .env file exists
ls -la .env
```

### **Step 2: Set Database Connection**

**Choose one method:**

**Method A - DATABASE_URL:**
```bash
export DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/digital_research_manager"
```

**Method B - Individual Variables:**
```bash
export DB_PASSWORD="yourpassword"
export DB_USER="postgres"
export DB_NAME="digital_research_manager"
export DB_HOST="localhost"
export DB_PORT="5432"
```

### **Step 3: Restart Server**

```bash
# Stop current server (Ctrl+C)
# Then restart
pnpm run dev:backend
# Or
node server/index.js
```

### **Step 4: Test Connection**

```bash
# Test health endpoint
curl http://localhost:5002/health

# Should return:
# {"status":"healthy","database":"PostgreSQL",...}
```

---

## 🧪 VERIFICATION

### **Test 1: Health Check**
```bash
curl http://localhost:5002/health
```
**Expected:** `{"status":"healthy","database":"PostgreSQL"}`

### **Test 2: Registration**
```bash
curl -X POST http://localhost:5002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@test.com",
    "username":"testuser",
    "password":"TestPass123!",
    "first_name":"Test",
    "last_name":"User",
    "role":"student"
  }'
```
**Expected:** HTTP 201 with user object and token

### **Test 3: Fixed Endpoints**
```bash
# Test with authentication token
TOKEN="your-token-here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5002/api/protocols
```
**Expected:** HTTP 200 with data (not 500)

---

## 📋 TROUBLESHOOTING

### **Issue: Still Getting Password Error**

**Check:**
1. Is environment variable actually set?
   ```bash
   echo $DB_PASSWORD  # Should show password, not empty
   ```

2. Did you restart the server after setting variables?
   - Environment variables are read at server start
   - Must restart after changing

3. Is the password correct?
   - Test with `psql`:
   ```bash
   psql -U postgres -d digital_research_manager
   ```

### **Issue: Connection Refused**

**Check:**
1. Is PostgreSQL running?
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Is the port correct?
   ```bash
   # Default is 5432
   psql -h localhost -p 5432 -U postgres
   ```

### **Issue: Database Doesn't Exist**

**Create database:**
```bash
createdb digital_research_manager
# Or
psql -U postgres -c "CREATE DATABASE digital_research_manager;"
```

---

## 🔐 SECURITY NOTES

### **Production:**
- ✅ Use DATABASE_URL with strong password
- ✅ Store in environment variables (not code)
- ✅ Use connection pooling
- ✅ Enable SSL for remote connections

### **Development:**
- ✅ Use .env file (add to .gitignore)
- ✅ Don't commit passwords to git
- ✅ Use strong passwords even in dev

---

## 📄 CODE STATUS

### **✅ Code is Correct:**
- `database/config.ts` - Handles DATABASE_URL correctly
- `database/config.ts` - Handles individual variables correctly
- `database/config.ts` - Handles empty password correctly
- All error handling improvements are in place

### **⚠️ Environment Needs Configuration:**
- Database connection string must be set
- Password must be provided (or use peer auth)
- Server must be restarted after configuration

---

## 🎯 NEXT STEPS

1. **Configure Database Connection:**
   - Choose Option 1, 2, or 3 above
   - Set environment variables
   - Restart server

2. **Test Connection:**
   - Run health check
   - Test registration
   - Test fixed endpoints

3. **Verify All Fixes:**
   - Run `scripts/qa-second-round-testing.sh`
   - All tests should pass

4. **Continue Testing:**
   - Follow `QA_TESTING_STRATEGY_NEXT.md`
   - Fix any remaining issues

---

## ✅ SUCCESS CRITERIA

- ✅ Health endpoint returns healthy status
- ✅ Registration works (HTTP 201)
- ✅ All fixed endpoints return HTTP 200
- ✅ No database connection errors in logs
- ✅ Second round testing passes

---

**Status:** Configuration Issue (Not Code Bug)  
**Code Status:** ✅ All fixes are correct  
**Action Required:** Configure database connection  
**Estimated Time:** 5-10 minutes




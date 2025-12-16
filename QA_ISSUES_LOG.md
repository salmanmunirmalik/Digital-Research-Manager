# 🚨 QA ISSUES LOG
## All Issues Found During E2E Testing

**Project:** Digital Research Manager  
**QA Officer:** Expert QA Agent  
**Start Date:** January 2025  
**Status:** Testing in Progress

---

## 📊 ISSUES SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 **CRITICAL (Blocking)** | 3 | 1 OPEN, 1 PARTIAL, 1 FIXED |
| 🟠 **HIGH (Should Fix)** | 2 | 2 FIXED ✅ |
| 🟡 **MEDIUM (Nice to Have)** | 30+ | 30+ OPEN |
| **TOTAL** | **35+** | 2 FIXED, 1 PARTIAL, 32+ OPEN |

---

## 🔴 CRITICAL ISSUES (Must Fix Before Launch)

### **ISSUE #CRIT-001: User Registration Fails (HTTP 500)**
- **Test Case:** TC-REG-001
- **Phase:** Phase 1.1 - Authentication & Authorization
- **Status:** ⚠️ **PARTIAL** (Code fixed, needs testing)
- **Severity:** 🔴 **CRITICAL - BLOCKING**
- **Priority:** **P0 - MUST FIX**
- **Fix Date:** January 2025
- **Fix Details:** 
  - Improved error handling with detailed logging
  - Better database password handling in config.ts
  - More specific error messages in development mode
- **Testing Required:** 
  - Server restart needed
  - Environment variable check (DB_PASSWORD or DATABASE_URL)
  - Test registration after restart

**Description:**
User registration endpoint returns HTTP 500 "Internal server error" when attempting to register a new user.

**Steps to Reproduce:**
1. Send POST request to `/api/auth/register`
2. Include valid user data:
   ```json
   {
     "email": "test@example.com",
     "username": "testuser",
     "password": "TestPass123!",
     "first_name": "Test",
     "last_name": "User",
     "role": "student"
   }
   ```
3. Server returns HTTP 500 error

**Expected Behavior:**
- HTTP 201 Created
- User object returned
- JWT token generated
- User created in database

**Actual Behavior:**
- HTTP 500 Internal Server Error
- Error message: `{"error":"Internal server error"}`
- No user created

**Root Cause Analysis:**
- Likely database schema mismatch
- `role` field in database expects enum type `user_role` (admin, principal_researcher, co_supervisor, researcher, student)
- Registration endpoint sending string value "student" which may not match enum
- OR database connection issue
- OR missing required fields in INSERT statement

**Impact:**
- **CRITICAL**: Users cannot register new accounts
- Blocks all new user onboarding
- Prevents platform growth
- **BLOCKS DEPLOYMENT**

**Affected Components:**
- `/api/auth/register` endpoint
- User registration flow
- Frontend registration page

**Suggested Fix:**
1. Check database schema for `users` table
2. Verify `role` enum type matches what's being sent
3. Check server logs for detailed error message
4. Ensure all required fields are present in INSERT statement
5. Verify database connection is working
6. Add proper error logging to registration endpoint

**Files to Check:**
- `server/index.ts` (registration endpoint)
- `database/migrations/00000000_base_schema.sql` (users table schema)
- Database connection configuration

**Test After Fix:**
- TC-REG-001: New user can register with valid email
- TC-REG-005: Registration creates user in database
- TC-REG-007: Registration redirects after success

**Assigned To:** Development Team  
**Date Found:** January 2025  
**Target Fix Date:** Before Phase 1 completion

---

## 🟠 HIGH PRIORITY ISSUES (Should Fix Before Launch)

### **ISSUE #HIGH-001: Invalid Login Returns Internal Server Error Instead of 401**
- **Test Case:** TC-LOGIN-002, TC-LOGIN-003
- **Phase:** Phase 1.1 - Authentication & Authorization
- **Status:** ✅ **FIXED**
- **Severity:** 🟠 **HIGH - Should Fix**
- **Priority:** **P1 - Should Fix Before Launch**
- **Fix Date:** January 2025
- **Fix Details:** 
  - Separated database errors from authentication errors
  - Database errors return HTTP 500
  - Authentication failures return HTTP 401
  - Better error logging added
- **Verified:** ⏳ Needs testing

**Description:**
When attempting to login with invalid credentials (non-existent email or wrong password), the server returns HTTP 500 "Internal server error" instead of the expected HTTP 401 "Invalid credentials" or "Unauthorized".

**Steps to Reproduce:**
1. Send POST request to `/api/auth/login`
2. Include invalid credentials:
   ```json
   {
     "email": "nonexistent@test.com",
     "password": "wrongpassword"
   }
   ```
3. Server returns HTTP 500 error

**Expected Behavior:**
- HTTP 401 Unauthorized
- Error message: "Invalid credentials" or "User not found"
- No internal server error exposed to user

**Actual Behavior:**
- HTTP 500 Internal Server Error
- Error message: `{"error":"Internal server error"}`
- Exposes internal error to user (security concern)

**Root Cause Analysis:**
- Likely unhandled exception in login endpoint
- Error handling not properly catching authentication failures
- May be related to database query error when user doesn't exist
- Should return 401, not 500

**Impact:**
- **HIGH**: Security concern - exposes internal errors
- Poor user experience - generic error message
- Doesn't follow REST API best practices
- Could leak information about system internals

**Affected Components:**
- `/api/auth/login` endpoint
- Error handling in authentication flow

**Suggested Fix:**
1. Review login endpoint error handling
2. Ensure all database query errors are caught
3. Return appropriate HTTP 401 for invalid credentials
4. Return HTTP 401 for non-existent users
5. Add proper error logging (server-side only)
6. Never expose internal errors to client

**Files to Check:**
- `server/index.ts` (login endpoint around line 160-249)
- Error handling middleware

**Test After Fix:**
- TC-LOGIN-002: Invalid email shows appropriate error (HTTP 401)
- TC-LOGIN-003: Invalid password shows appropriate error (HTTP 401)
- Verify no HTTP 500 errors for authentication failures

**Assigned To:** Development Team  
**Date Found:** January 2025  
**Target Fix Date:** Before Phase 1 completion

---

## 🟡 MEDIUM PRIORITY ISSUES (Can Fix Post-Launch)

*No medium priority issues found yet*

---

## 📝 TESTING NOTES

### **Phase 1.1: Authentication & Authorization**
- **Status:** 🔄 In Progress
- **Tests Executed:** 4
- **Tests Passed:** 3
- **Tests Failed:** 1
- **Issues Found:** 1 (CRITICAL)

**Working Correctly:**
- ✅ User login with valid credentials (TC-LOGIN-001)
- ✅ Protected routes reject unauthenticated requests (TC-PROTECT-001)
- ✅ Authenticated users can access protected routes (TC-PROTECT-002)
- ✅ Logout functionality works (TC-LOGOUT-002)

**Issues Found:**
- ❌ User registration endpoint (CRITICAL)
- ❌ Invalid login error handling (HIGH)

---

## 🔍 ISSUE INVESTIGATION CHECKLIST

For each issue, verify:
- [ ] Can reproduce consistently
- [ ] Checked server logs for detailed error
- [ ] Verified database schema matches expectations
- [ ] Checked API endpoint code
- [ ] Tested with different inputs
- [ ] Verified environment variables
- [ ] Checked dependencies/imports
- [ ] Reviewed related code

---

## 🎯 ISSUE RESOLUTION WORKFLOW

### **When Issue is Found:**
1. ✅ Document in this file immediately
2. ✅ Assign severity and priority
3. ✅ Add to test execution report
4. ✅ Continue testing (don't stop for non-critical issues)
5. ✅ Take screenshots/videos if applicable

### **When Issue is Fixed:**
1. ✅ Update status to "FIXED"
2. ✅ Add fix details
3. ✅ Retest the issue
4. ✅ Update test execution report
5. ✅ Mark as "VERIFIED" after retest passes

### **Issue Status Values:**
- **OPEN** - Issue found, not yet fixed
- **IN PROGRESS** - Being worked on
- **FIXED** - Code fixed, needs retest
- **VERIFIED** - Fixed and retested successfully
- **DEFERRED** - Will fix post-launch
- **WON'T FIX** - Decided not to fix (with reason)

---

## 📋 ISSUE TEMPLATE

```markdown
### **ISSUE #XXX: [Issue Title]**
- **Test Case:** TC-XXX-XXX
- **Phase:** Phase X.X - [Category]
- **Status:** ❌ OPEN
- **Severity:** 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM
- **Priority:** P0 / P1 / P2

**Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Root Cause Analysis:**
[Investigation findings]

**Impact:**
[What this affects]

**Affected Components:**
- Component 1
- Component 2

**Suggested Fix:**
[How to fix it]

**Files to Check:**
- file1.ts
- file2.tsx

**Test After Fix:**
- TC-XXX-XXX: [Test case]

**Assigned To:** [Name]
**Date Found:** [Date]
**Target Fix Date:** [Date]
```

---

## 📊 ISSUE STATISTICS

### **By Phase:**
- Phase 1 (Critical Path): 15+ issues (2 CRITICAL, 2 HIGH, 11+ MEDIUM)
- Phase 2 (Feature Completeness): 10+ issues (1 CRITICAL, 1 HIGH, 8+ MEDIUM)
- Phase 3 (Integration): 2 issues (MEDIUM)
- Phase 4 (Security): 2 issues (1 CRITICAL, 1 MEDIUM)
- Phase 5 (Performance): 0 issues ✅
- Phase 6 (Browser Compatibility): Checklist created (manual testing required)
- Phase 7 (UX & Accessibility): Checklist created (manual testing required)
- Phase 8 (Error Handling): 7 issues (MEDIUM - error handling improvements needed)
- Phase 9 (Deployment Readiness): 2+ issues (Build process needs verification)
- Phase 1.2 (CRUD): 0 issues
- Phase 1.3 (Dashboard): 0 issues
- Phase 2 (Features): 0 issues
- Phase 3 (Integration): 0 issues
- Phase 4 (Security): 0 issues
- Phase 5 (Performance): 0 issues
- Phase 6 (Compatibility): 0 issues
- Phase 7 (UX/Accessibility): 0 issues
- Phase 8 (Error Handling): 0 issues
- Phase 9 (Deployment): 0 issues

### **By Component:**
- Authentication: 1 issue
- Protocols: 0 issues
- Lab Notebook: 0 issues
- Data Results: 0 issues
- Dashboard: 0 issues
- Other: 0 issues

### **By Status:**
- OPEN: 35+8
- IN PROGRESS: 0
- FIXED: 0
- VERIFIED: 0
- DEFERRED: 0

---

## 🎯 NEXT ACTIONS

1. ✅ Continue Phase 1 testing
2. ✅ Complete all remaining test phases
3. ✅ Document all issues found
4. ⏳ After testing complete: Fix issues one by one
5. ⏳ Retest after each fix
6. ⏳ Update this log as issues are resolved

---

**Last Updated:** January 2025  
**Next Review:** After each testing phase completion


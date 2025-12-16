# E2E Testing Plan - Recommender System & Generative AI

**Date:** January 2025  
**Status:** 🔍 **TESTING IN PROGRESS**

---

## 📋 **TESTING SCOPE**

This E2E testing plan covers all newly integrated features:
1. RecommendationsWidget (Protocols, Papers, Services)
2. Notebook Summary Generation
3. Enhanced AI Features

---

## 🧪 **TEST SCENARIOS**

### **1. RecommendationsWidget Testing**

#### **1.1 Protocol Recommendations**
- [ ] Navigate to `/protocols`
- [ ] Verify "Recommended Protocols for You" widget appears
- [ ] Verify recommendations load (check for loading state)
- [ ] Verify at least 1 recommendation is displayed
- [ ] Click on a recommended protocol
- [ ] Verify protocol detail modal opens
- [ ] Click thumbs up on a recommendation
- [ ] Verify feedback is submitted (check network request)
- [ ] Click thumbs down on a recommendation
- [ ] Verify feedback is submitted

#### **1.2 Paper Recommendations**
- [ ] Navigate to `/reference-library` or paper library page
- [ ] Verify "Papers You Might Like" widget appears
- [ ] Verify recommendations load
- [ ] Verify recommendations are displayed
- [ ] Provide feedback on a recommendation
- [ ] Verify feedback is recorded

#### **1.3 Service Recommendations**
- [ ] Navigate to service marketplace page
- [ ] Verify "Services You Might Need" widget appears
- [ ] Verify recommendations load
- [ ] Click on a recommended service
- [ ] Verify service detail modal opens
- [ ] Provide feedback on a recommendation

#### **1.4 Dashboard Recommendations**
- [ ] Navigate to `/dashboard`
- [ ] Verify "Recommended Protocols" widget appears
- [ ] Verify "Recommended Papers" widget appears
- [ ] Click on a protocol recommendation
- [ ] Verify navigation to protocols page
- [ ] Click on a paper recommendation
- [ ] Verify navigation to paper library

### **2. Notebook Summary Generation Testing**

#### **2.1 Daily Summary**
- [ ] Navigate to `/lab-notebook`
- [ ] Verify "Daily Summary" button is visible
- [ ] Click "Daily Summary" button
- [ ] Verify loading state appears
- [ ] Verify summary modal opens
- [ ] Verify summary content is displayed
- [ ] Verify summary contains relevant information
- [ ] Close summary modal
- [ ] Verify modal closes correctly

#### **2.2 Weekly Summary**
- [ ] Navigate to `/lab-notebook`
- [ ] Verify "Weekly Summary" button is visible
- [ ] Click "Weekly Summary" button
- [ ] Verify loading state appears
- [ ] Verify summary modal opens
- [ ] Verify summary content is displayed
- [ ] Verify summary contains weekly information
- [ ] Close summary modal

### **3. API Endpoint Testing**

#### **3.1 Recommendations API**
- [ ] Test `GET /api/recommendations/protocols`
- [ ] Test `GET /api/recommendations/papers`
- [ ] Test `GET /api/recommendations/services`
- [ ] Test `POST /api/recommendations/feedback`
- [ ] Test `POST /api/recommendations/track`
- [ ] Verify all endpoints return correct status codes
- [ ] Verify response data structure

#### **3.2 Notebook Summaries API**
- [ ] Test `POST /api/notebook-summaries/generate` (daily)
- [ ] Test `POST /api/notebook-summaries/generate` (weekly)
- [ ] Test `GET /api/notebook-summaries/daily`
- [ ] Test `GET /api/notebook-summaries/weekly`
- [ ] Verify all endpoints return correct status codes
- [ ] Verify summary content is generated

---

## 🔧 **MANUAL TESTING STEPS**

### **Prerequisites:**
1. Server is running on `http://localhost:5002`
2. Frontend is running on `http://localhost:5173` (or configured port)
3. User is logged in
4. Database is connected and has test data

### **Test Execution:**

1. **Start the application:**
   ```bash
   # Terminal 1: Start backend
   npm run dev:server
   
   # Terminal 2: Start frontend
   npm run dev
   ```

2. **Login as test user:**
   - Navigate to login page
   - Enter credentials
   - Verify successful login

3. **Test Recommendations:**
   - Navigate to each page with recommendations
   - Verify widgets appear
   - Test interactions
   - Verify API calls in browser DevTools

4. **Test Notebook Summaries:**
   - Navigate to Lab Notebook
   - Generate summaries
   - Verify results

---

## 📊 **AUTOMATED TESTING**

### **Using Playwright (if configured):**
```bash
npx playwright test
```

### **Using Cypress (if configured):**
```bash
npx cypress run
```

### **Manual API Testing:**
```bash
# Test recommendations endpoint
curl -X GET http://localhost:5002/api/recommendations/protocols \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test notebook summaries endpoint
curl -X POST http://localhost:5002/api/notebook-summaries/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"summaryType": "daily"}'
```

---

## ✅ **SUCCESS CRITERIA**

### **Recommendations:**
- ✅ Widgets appear on all target pages
- ✅ Recommendations load successfully
- ✅ Click handlers work correctly
- ✅ Feedback submission works
- ✅ No console errors

### **Notebook Summaries:**
- ✅ Buttons are visible and clickable
- ✅ Summaries generate successfully
- ✅ Modal displays correctly
- ✅ Summary content is readable
- ✅ No errors in console

### **API Endpoints:**
- ✅ All endpoints return 200/201 status
- ✅ Response data structure is correct
- ✅ Error handling works (401, 404, 500)
- ✅ Authentication is enforced

---

## 🐛 **KNOWN ISSUES**

(To be filled during testing)

---

## 📝 **TEST RESULTS**

(To be filled during testing)

---

**Status:** 🔍 **READY FOR TESTING**



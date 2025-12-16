# Manual Testing Guide - Recommendations & Notebook Summaries

**Date:** January 27, 2025  
**Status:** ✅ **READY FOR TESTING**

---

## 🚀 **QUICK START**

### **1. Start the Application**

```bash
# Terminal 1: Start Backend
cd "/Users/m.salmanmalik/Development Projects/researchlab"
pnpm run dev:backend

# Terminal 2: Start Frontend
pnpm run dev:frontend
```

### **2. Access the Application**

- Frontend: `http://localhost:5173` (or port shown in terminal)
- Backend: `http://localhost:5002`

### **3. Login**

- Use existing credentials or register a new account
- Ensure you're logged in before testing

---

## 🧪 **MANUAL TESTING STEPS**

### **TEST 1: Protocol Recommendations**

1. **Navigate to Protocols Page**
   - URL: `http://localhost:5173/protocols`
   - Or click "Protocols" in navigation

2. **Verify Widget Appears**
   - Look for "Recommended Protocols for You" section
   - Should appear after the search section
   - Widget should show loading state initially

3. **Check Recommendations**
   - Wait for recommendations to load
   - Should see at least one recommendation (or "No recommendations" message)
   - Each recommendation should show:
     - Title/Name
     - Description/Reason
     - Thumbs up/down buttons

4. **Test Interactions**
   - Click on a recommendation → Should open protocol detail modal
   - Click thumbs up → Should submit feedback
   - Click thumbs down → Should submit feedback

5. **Check Browser Console**
   - Open DevTools (F12)
   - Check Network tab for API calls
   - Should see: `GET /api/recommendations/protocols?limit=5`
   - Should return 200 status

---

### **TEST 2: Paper Recommendations**

1. **Navigate to Paper Library**
   - URL: `http://localhost:5173/reference-library`
   - Or click "Reference Library" in navigation

2. **Verify Widget Appears**
   - Look for "Papers You Might Like" section
   - Should appear at the top of the library view
   - Widget should be in a white card with padding

3. **Check Recommendations**
   - Recommendations should load
   - Should display paper titles and reasons

4. **Test Feedback**
   - Click thumbs up/down on a recommendation
   - Check Network tab for feedback API call

---

### **TEST 3: Service Recommendations**

1. **Navigate to Service Marketplace**
   - URL: `http://localhost:5173/service-marketplace`
   - Or click "Service Marketplace" in navigation

2. **Verify Widget Appears**
   - Look for "Services You Might Need" section
   - Should appear at the top of browse view
   - Widget should be visible before filters

3. **Test Click Handler**
   - Click on a recommended service
   - Should open service detail modal

---

### **TEST 4: Dashboard Recommendations**

1. **Navigate to Dashboard**
   - URL: `http://localhost:5173/dashboard`
   - Or click "Dashboard" in navigation

2. **Verify Widgets Appear**
   - Look for "Recommended Protocols" widget
   - Look for "Recommended Papers" widget
   - Both should be side-by-side in a grid

3. **Test Navigation**
   - Click on a protocol recommendation
   - Should navigate to protocols page
   - Click on a paper recommendation
   - Should navigate to paper library

---

### **TEST 5: Notebook Summary Generation**

1. **Navigate to Lab Notebook**
   - URL: `http://localhost:5173/lab-notebook`
   - Or click "Lab Notebook" in navigation

2. **Verify Buttons Appear**
   - Look for "Daily Summary" button in the header
   - Look for "Weekly Summary" button in the header
   - Both should be next to "Personal NoteBook Entries" heading

3. **Test Daily Summary**
   - Click "Daily Summary" button
   - Button should show loading state (spinner)
   - Wait for summary to generate (may take 5-10 seconds)
   - Summary modal should open
   - Modal should show:
     - Title: "Daily Summary"
     - Summary content
     - Close button

4. **Test Weekly Summary**
   - Click "Weekly Summary" button
   - Button should show loading state
   - Summary modal should open with weekly summary

5. **Test Modal**
   - Click close button → Modal should close
   - Click X button → Modal should close

6. **Check API Calls**
   - Open DevTools Network tab
   - Should see: `POST /api/notebook-summaries/generate`
   - Request body should include:
     - `summaryType: "daily"` or `"weekly"`
     - `dateRange` with start/end dates

---

## 🔍 **TROUBLESHOOTING**

### **Widgets Not Appearing**

1. **Check Console for Errors**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Common issues:
     - API endpoint not found (404) → Check server is running
     - Authentication error (401) → Check you're logged in
     - CORS error → Check backend CORS settings

2. **Check Network Tab**
   - Look for failed API requests
   - Check request URL is correct
   - Check Authorization header is present

3. **Verify Server is Running**
   ```bash
   curl http://localhost:5002/api/health
   ```
   Should return: `{"status":"API healthy",...}`

### **Summary Buttons Not Appearing**

1. **Check Page Structure**
   - Verify you're on `/lab-notebook` page
   - Check if header section is visible
   - Buttons should be on the right side of "Personal NoteBook Entries" heading

2. **Check Console for Errors**
   - Look for React errors
   - Check if `DocumentTextIcon` is imported correctly

### **API Errors**

1. **401 Unauthorized**
   - Make sure you're logged in
   - Check token is in localStorage
   - Try logging out and back in

2. **404 Not Found**
   - Verify server is running
   - Check routes are mounted in `server/index.ts`
   - Restart server if needed

3. **500 Internal Server Error**
   - Check server logs
   - Verify database connection
   - Check if tables exist (recommendations, notebook entries)

---

## ✅ **SUCCESS CRITERIA**

### **Recommendations:**
- ✅ Widgets appear on all target pages
- ✅ Recommendations load (or show "No recommendations")
- ✅ Click handlers work
- ✅ Feedback buttons work
- ✅ No console errors

### **Notebook Summaries:**
- ✅ Buttons appear in header
- ✅ Buttons are clickable
- ✅ Loading states work
- ✅ Summaries generate successfully
- ✅ Modal displays correctly
- ✅ Modal can be closed

---

## 📊 **TEST RESULTS TEMPLATE**

```
Date: ___________
Tester: ___________

Protocol Recommendations:
  [ ] Widget appears
  [ ] Recommendations load
  [ ] Click handler works
  [ ] Feedback works

Paper Recommendations:
  [ ] Widget appears
  [ ] Recommendations load
  [ ] Feedback works

Service Recommendations:
  [ ] Widget appears
  [ ] Recommendations load
  [ ] Click handler works

Dashboard Recommendations:
  [ ] Both widgets appear
  [ ] Navigation works

Notebook Summaries:
  [ ] Buttons appear
  [ ] Daily summary works
  [ ] Weekly summary works
  [ ] Modal displays
  [ ] Modal closes

Issues Found:
1. 
2. 
3. 

Overall Status: [ ] Pass [ ] Fail [ ] Needs Fix
```

---

## 🎯 **NEXT STEPS AFTER TESTING**

1. Document any issues found
2. Fix critical bugs
3. Retest fixed features
4. Update documentation

---

**Ready for Testing!** 🚀



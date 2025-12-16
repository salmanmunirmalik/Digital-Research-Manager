# E2E Manual Testing Checklist

**Date:** January 2025  
**Use this checklist to manually test all new features**

---

## 🔐 **Prerequisites**

- [ ] Server is running (`npm run dev:server`)
- [ ] Frontend is running (`npm run dev`)
- [ ] User is logged in
- [ ] Browser DevTools Network tab is open

---

## 1️⃣ **Protocol Recommendations**

### **Location:** `/protocols`

- [ ] Page loads without errors
- [ ] "Recommended Protocols for You" widget appears
- [ ] Widget shows loading state initially
- [ ] Recommendations appear (at least 1)
- [ ] Each recommendation shows:
  - [ ] Title
  - [ ] Description or reason
  - [ ] Thumbs up button
  - [ ] Thumbs down button
- [ ] Click on a recommendation
  - [ ] Protocol detail modal opens
  - [ ] Protocol details are displayed
- [ ] Click thumbs up on a recommendation
  - [ ] Button state changes
  - [ ] Network request to `/api/recommendations/feedback` is sent
  - [ ] Request includes correct data
- [ ] Click thumbs down on a recommendation
  - [ ] Button state changes
  - [ ] Network request is sent
- [ ] Check browser console for errors
  - [ ] No errors related to recommendations

---

## 2️⃣ **Paper Recommendations**

### **Location:** Paper Library Page

- [ ] Navigate to paper library page
- [ ] "Papers You Might Like" widget appears
- [ ] Recommendations load successfully
- [ ] Recommendations are displayed
- [ ] Click on a recommendation (if clickable)
- [ ] Provide feedback
- [ ] Verify feedback is submitted

---

## 3️⃣ **Service Recommendations**

### **Location:** Service Marketplace Page

- [ ] Navigate to service marketplace
- [ ] "Services You Might Need" widget appears
- [ ] Recommendations load
- [ ] Click on a recommended service
- [ ] Service detail modal opens
- [ ] Provide feedback
- [ ] Verify feedback is submitted

---

## 4️⃣ **Dashboard Recommendations**

### **Location:** `/dashboard`

- [ ] Navigate to dashboard
- [ ] "Recommended Protocols" widget appears
- [ ] "Recommended Papers" widget appears
- [ ] Both widgets show recommendations
- [ ] Click on a protocol recommendation
  - [ ] Navigates to protocols page
  - [ ] URL includes protocol ID (if applicable)
- [ ] Click on a paper recommendation
  - [ ] Navigates to paper library
  - [ ] URL includes paper ID (if applicable)

---

## 5️⃣ **Notebook Summary Generation**

### **Location:** `/lab-notebook`

- [ ] Navigate to Lab Notebook page
- [ ] "Daily Summary" button is visible
- [ ] "Weekly Summary" button is visible
- [ ] Both buttons are clickable

#### **Daily Summary:**
- [ ] Click "Daily Summary" button
- [ ] Button shows loading state (spinner)
- [ ] Network request to `/api/notebook-summaries/generate` is sent
- [ ] Request includes:
  - [ ] `summaryType: "daily"`
  - [ ] `dateRange` with today's date
- [ ] Summary modal opens
- [ ] Modal shows:
  - [ ] Title: "Daily Summary"
  - [ ] Summary content
  - [ ] Close button
- [ ] Summary content is readable and formatted
- [ ] Click close button
- [ ] Modal closes

#### **Weekly Summary:**
- [ ] Click "Weekly Summary" button
- [ ] Button shows loading state
- [ ] Network request is sent with `summaryType: "weekly"`
- [ ] Summary modal opens
- [ ] Modal shows "Weekly Summary" title
- [ ] Summary content is displayed
- [ ] Summary contains weekly information
- [ ] Modal closes correctly

#### **Error Handling:**
- [ ] Test with no notebook entries
  - [ ] Summary still generates (or shows appropriate message)
- [ ] Test with network error
  - [ ] Error message is displayed
  - [ ] User can retry

---

## 6️⃣ **API Endpoint Testing**

### **Using Browser DevTools or Postman:**

#### **Recommendations:**
- [ ] `GET /api/recommendations/protocols?limit=5`
  - [ ] Returns 200 status
  - [ ] Response includes `recommendations` array
  - [ ] Each recommendation has required fields
- [ ] `GET /api/recommendations/papers?limit=10`
  - [ ] Returns 200 status
  - [ ] Response structure is correct
- [ ] `GET /api/recommendations/services?type=requester`
  - [ ] Returns 200 status
  - [ ] Response structure is correct
- [ ] `POST /api/recommendations/feedback`
  - [ ] Returns 200/201 status
  - [ ] Feedback is recorded
- [ ] `POST /api/recommendations/track`
  - [ ] Returns 200/201 status
  - [ ] Event is tracked

#### **Notebook Summaries:**
- [ ] `POST /api/notebook-summaries/generate` (daily)
  - [ ] Returns 200/201 status
  - [ ] Response includes summary content
- [ ] `POST /api/notebook-summaries/generate` (weekly)
  - [ ] Returns 200/201 status
  - [ ] Response includes summary content
- [ ] `GET /api/notebook-summaries/daily`
  - [ ] Returns 200 status (if implemented)
- [ ] `GET /api/notebook-summaries/weekly`
  - [ ] Returns 200 status (if implemented)

---

## 7️⃣ **Error Scenarios**

- [ ] Test with invalid authentication token
  - [ ] Endpoints return 401
  - [ ] User is redirected to login
- [ ] Test with missing data
  - [ ] Appropriate error messages are shown
- [ ] Test with server error
  - [ ] Error handling works correctly
  - [ ] User sees friendly error message

---

## 8️⃣ **Performance Testing**

- [ ] Recommendations load within 2 seconds
- [ ] Summary generation completes within 10 seconds
- [ ] No memory leaks (check browser DevTools)
- [ ] No excessive API calls

---

## 9️⃣ **Cross-Browser Testing**

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## ✅ **Final Checks**

- [ ] All features work as expected
- [ ] No console errors
- [ ] No network errors
- [ ] UI is responsive
- [ ] All buttons are clickable
- [ ] All modals open and close correctly

---

## 📝 **Issues Found**

(Record any issues discovered during testing)

1. 
2. 
3. 

---

## ✅ **Sign-Off**

- [ ] All critical tests passed
- [ ] All major features working
- [ ] Ready for production

**Tester:** _________________  
**Date:** _________________  
**Status:** ☐ Pass ☐ Fail ☐ Needs Fix



# Portfolio Dashboard Testing Checklist

## 🚀 Quick Start

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Start development server
npm run dev

# 3. Open portfolio page
# Navigate to: http://localhost:3000/portfolio
```

---

## ✅ Testing Checklist

### **1. AI Avatar Section** (Top of Page)

- [ ] Avatar placeholder displays with icon
- [ ] Welcome message text is visible and readable
- [ ] Three benefit points display with checkmarks
- [ ] Background gradient renders correctly
- [ ] Section is responsive on mobile/tablet/desktop

**Expected Result**: Clean hero section with HeyGen placeholder and welcome message

---

### **2. Intake Tab - Personal Information**

- [ ] Age field accepts numbers (optional field)
- [ ] Experience level dropdown works (Beginner/Intermediate/Advanced)
- [ ] Default value is "Intermediate"

**Test Input**:
```
Age: 35
Experience: Intermediate
```

---

### **3. Intake Tab - Investment Goals**

- [ ] Income Goal field accepts currency values
- [ ] Accumulation Goal accepts free text
- [ ] Both fields are optional
- [ ] Placeholder text is visible

**Test Input**:
```
Income Goal: $120,000
Accumulation Goal: $2,000,000 by 2030
```

---

### **4. Intake Tab - Portfolio Allocation** ⭐ CRITICAL

- [ ] All 6 asset class fields accept percentages (0-100)
- [ ] Real-time sum calculation displays
- [ ] Sum indicator turns GREEN when = 100%
- [ ] Sum indicator turns YELLOW when ≠ 100%
- [ ] Error message shows when sum ≠ 100%
- [ ] "Begin Analyzing" button DISABLED when sum ≠ 100%
- [ ] "Begin Analyzing" button ENABLED when sum = 100%

**Test Input (Valid)**:
```
Stocks: 60%
Bonds: 30%
Cash: 10%
Real Estate: 0%
Commodities: 0%
Alternatives: 0%
Total: 100% ✅
```

**Test Input (Invalid)**:
```
Stocks: 60%
Bonds: 30%
Cash: 5%
Total: 95% ❌ (Should show error and disable button)
```

---

### **5. Reset Functionality**

- [ ] "Reset" button clears all form fields
- [ ] Portfolio allocations reset to 0%
- [ ] Experience level resets to "Intermediate"
- [ ] No errors after reset

**Test**: Fill form → Click Reset → Verify all fields clear

---

### **6. Email Capture Modal**

- [ ] Modal appears when clicking "Begin Analyzing" with valid portfolio
- [ ] Modal does NOT appear when portfolio sum ≠ 100%
- [ ] Backdrop darkens background
- [ ] Clicking backdrop closes modal
- [ ] All three fields required (First Name, Last Name, Email)
- [ ] Email validation works

**Test Valid Email**:
```
First Name: John
Last Name: Doe
Email: john@example.com
→ Should accept and proceed
```

**Test Invalid Email**:
```
Email: invalid-email
→ Should show error "Please enter a valid email address"
```

**Test Empty Fields**:
```
Leave any field empty → Click "View Analysis"
→ Should show error for required fields
```

---

### **7. Analysis Processing**

- [ ] "View Analysis" button triggers API call
- [ ] Loading state shows ("Analyzing...")
- [ ] Error handling works (try with no internet)
- [ ] Success switches to Review tab

**Expected Flow**:
```
1. Click "View Analysis"
2. Modal closes
3. Button shows "Analyzing..." with spinner
4. After 2-5 seconds, Review tab activates
```

---

### **8. Review Tab - Analysis Results**

- [ ] Analysis summary header displays with timestamp
- [ ] Conversation ID shows (if available)
- [ ] Market Impact section displays 3-4 bullets
- [ ] Portfolio Impact section displays 3-4 bullets
- [ ] Goal Impact section displays 3-4 bullets
- [ ] Metrics table renders with 4 rows
- [ ] All bullets start with "•" character

**Expected Sections**:
```
✅ Market Impact (3-4 bullets about market conditions)
✅ Portfolio Impact (3-4 bullets about user's specific allocation)
✅ Goal Impact (3-4 bullets about achieving their specific goal)
✅ Metrics Table (Risk Level, Market Timing, Expert Guidance, Portfolio Optimization)
```

---

### **9. Review Tab - Cycle Overview**

- [ ] Cycle dropdown works (Technology / Economic)
- [ ] Cycle gauge displays with score (0-100)
- [ ] Cycle score number visible in center
- [ ] Phase badge displays below gauge
- [ ] Cycle description text displays
- [ ] Timeline visualization shows 4 phases
- [ ] Current phase marker highlights correct position

**Test**:
```
1. Select "Technology Cycle" → Should show Tech gauge
2. Select "Economic Cycle" → Should show Economic gauge
```

---

### **10. Review Tab - Portfolio Cycle Sync**

- [ ] "Current Portfolio" card displays
- [ ] Cycle Score badge shows for user's portfolio
- [ ] All 6 asset allocations display with icons
- [ ] Percentages match intake form
- [ ] Auto Cash calculation displays
- [ ] "Clockwise Portfolio" benchmark card displays
- [ ] Benchmark cycle score shows
- [ ] "Stress Test Scenarios" button displays

**Verify Allocations Match Intake**:
```
If you entered:
- Stocks: 60%
- Bonds: 30%
- Cash: 10%

Then Review tab should show same percentages
```

---

### **11. Stress Test Feature**

- [ ] "Stress Test Scenarios" button clicks
- [ ] Placeholder message displays
- [ ] Button toggles to "Hide" when active

**Current Status**: Placeholder (feature not yet implemented)

---

### **12. CTA Section**

- [ ] "Next Step" section displays at bottom
- [ ] "Match me with an advisor" button links to Calendly
- [ ] "Download Report (PDF)" button clicks (placeholder)
- [ ] Privacy notice displays
- [ ] Privacy Policy link works
- [ ] Disclaimer Policy link works

**Test**:
```
Click "Match me with an advisor"
→ Should open Calendly in new tab
```

---

### **13. Download PDF**

- [ ] "Download PDF" button in header clicks
- [ ] Alert shows "PDF download feature coming soon!"

**Current Status**: Placeholder (feature not yet implemented)

---

### **14. Start Over Functionality**

- [ ] "Start Over" button in Review tab header works
- [ ] Clicking resets to Intake tab
- [ ] All form data clears
- [ ] Ready for new analysis

---

### **15. Tab Navigation**

- [ ] Intake tab active by default
- [ ] Review tab DISABLED until analysis complete
- [ ] Review tab ENABLED after analysis
- [ ] Can switch between tabs after analysis
- [ ] Tab indicators show 1 and 2
- [ ] Active tab highlights in teal

---

### **16. Responsive Design**

**Desktop (≥1024px)**:
- [ ] Two-column layout in AI Avatar section
- [ ] Full-width dashboard
- [ ] Side-by-side portfolio cards

**Tablet (768-1023px)**:
- [ ] Stacked layout in AI Avatar section
- [ ] Full-width tabs
- [ ] Single-column portfolio cards

**Mobile (<768px)**:
- [ ] Single column throughout
- [ ] Hamburger menu (if applicable)
- [ ] Touch-friendly buttons
- [ ] Readable text sizes

---

## 🐛 Common Issues & Solutions

### **Issue**: Button disabled even with 100% allocation
**Solution**: 
- Check browser console for errors
- Verify all allocations are numbers (not strings)
- Try clearing form and re-entering

### **Issue**: Email modal doesn't appear
**Solution**:
- Ensure portfolio sum = exactly 100%
- Check browser console for errors
- Verify email modal component loaded

### **Issue**: Analysis doesn't load
**Solution**:
- Check `.env` file has `OPENAI_API_KEY`
- Verify Supabase connection working
- Check API route logs in terminal

### **Issue**: Review tab stays disabled
**Solution**:
- Check browser console for API errors
- Verify analysis returned successfully
- Try refreshing page

---

## 📊 Expected API Calls

**Single User Journey**:
```
1. Page Load: 0 API calls (static page)
2. Intake Form Fill: 0 API calls (client-side validation)
3. Email Submit: 1 API call (POST /api/portfolio/analyze-dashboard)
4. Review Display: 0 API calls (data already loaded)

Total: 1 API call per analysis 🎉
```

**Compare to Old Flow**: 20-25 API calls (90% reduction!)

---

## ✅ Success Criteria

**All Tests Pass** ✅
- [ ] All form fields work correctly
- [ ] Portfolio validation prevents invalid submissions
- [ ] Email capture modal functions properly
- [ ] Analysis returns results successfully
- [ ] Review tab displays all sections correctly
- [ ] CTAs link to correct destinations
- [ ] No console errors
- [ ] Mobile responsive design works

**User Experience** ✅
- [ ] Flow feels intuitive and fast (<3 minutes)
- [ ] Error messages are clear and helpful
- [ ] Loading states provide feedback
- [ ] Results are easy to read and understand

**Technical** ✅
- [ ] Only 1-2 API calls per user journey
- [ ] Supabase saves conversation data
- [ ] No TypeScript errors in build
- [ ] No console warnings or errors

---

## 📝 Test Data Sets

### **Conservative Investor**
```
Experience: Beginner
Income Goal: $50,000
Accumulation Goal: $500,000 by 2040
Portfolio:
  - Bonds: 60%
  - Stocks: 30%
  - Cash: 10%
```

### **Aggressive Investor**
```
Experience: Advanced
Accumulation Goal: $5,000,000 by 2035
Portfolio:
  - Stocks: 80%
  - Alternatives: 15%
  - Cash: 5%
```

### **Balanced Investor**
```
Experience: Intermediate
Income Goal: $120,000
Accumulation Goal: $2,000,000 by 2030
Portfolio:
  - Stocks: 50%
  - Bonds: 30%
  - Real Estate: 10%
  - Cash: 10%
```

### **Complex Portfolio**
```
Experience: Advanced
Accumulation Goal: $10,000,000 by 2040
Portfolio:
  - Stocks: 40%
  - Bonds: 20%
  - Real Estate: 15%
  - Commodities: 10%
  - Alternatives: 10%
  - Cash: 5%
```

---

## 🎯 Ready to Test!

1. **Start server**: `npm run dev`
2. **Navigate to**: `http://localhost:3000/portfolio`
3. **Follow checklist above** ⬆️
4. **Report any issues** you find

**Expected Result**: A fast, intuitive portfolio analysis experience that completes in under 3 minutes with professional-quality results!

---

## 📞 Need Help?

If you encounter any issues:

1. Check browser console (F12) for errors
2. Check terminal for server errors
3. Verify `.env` file has required keys:
   - `OPENAI_API_KEY`
   - Supabase credentials
4. Clear browser cache and try again
5. Restart development server

**All systems should be operational and ready for testing!** 🚀

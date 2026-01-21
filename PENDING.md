# Pending Issues & Testing Tasks

> Last Updated: January 19, 2026
> Status: **Most issues resolved by @SaiGurulnukurthi**

---

## 🟢 Recently Fixed Issues (Jan 17-19)

### ✅ Issue #7: Unable to select event to create a new QR

**Fixed by:** @SaiGurulnukurthi
**Solution:**

- Created new API endpoints for QR management
- Added QR preview functionality with modal dialog
- QR codes page now uses API endpoints instead of direct Supabase client

### ✅ Issue #6: Hassle to create multiple teams

**Fixed by:** @SaiGurulnukurthi
**Solution:** Improved team creation workflow

### ✅ Issue #5: Event duration not updating with date selection

**Fixed by:** @SaiGurulnukurthi
**Solution:**

- Added `calculateDuration()` function for automatic duration calculation
- Added `calculateEndDateTime()` for computing end time from duration
- Form now syncs duration when dates change
- Fixed dark mode visibility for calendar icons

### ✅ Issue #4: Duplicate events when spamming create button

**Fixed by:** @SaiGurulnukurthi
**Solution:**

- Added `isSubmitting` state to prevent multiple submissions
- Added event name validation before submit
- Button disabled during API call

### ✅ Hunt Page Loading/Scanning Issues

**Fixed by:** @SaiGurulnukurthi
**Solution:**

- Fixed race condition: Event now fetched BEFORE clue data
- Added loading spinner while event data loads
- This fixed the "Getting Your Clues Ready..." stuck state

---

## 🟢 Previously Fixed Issues (Jan 16)

### ✅ Scanner Glitchy (Multiple Popups)

- Added scan lock after first detection
- Added debounce for duplicate codes
- Camera stops immediately on scan
- "Try Again" button appears on error

### ✅ Location Showing to Players

- Removed `location_name` from player view
- Now only visible in admin panel

### ✅ Progress Page Collusion Risk

- Page locked during active hunt
- Only accessible after completion or timeout

### ✅ "Step 1 of 3" Visible

- Removed step count from player view

### ✅ Viewport Warnings

- Moved `viewport` and `themeColor` to separate export

### ✅ All Lint Errors

- Fixed function declaration order
- Fixed unused variables
- Configured eslint properly

---

## 🟡 Testing Needed

### Mobile Testing

| Test Case                     | Status           | Notes           |
| ----------------------------- | ---------------- | --------------- |
| QR Scanner on iOS Chrome      | ⏳ Needs Testing |                 |
| QR Scanner on iOS Safari      | ⏳ Needs Testing | May have issues |
| QR Scanner on Android Chrome  | ⏳ Needs Testing | Should work     |
| Touch targets (44px min)      | ✅ CSS Added     |                 |
| Viewport zoom prevention      | ✅ CSS Added     |                 |

### Scan Flow Testing

| Test Case                       | Status           | Notes                        |
| ------------------------------- | ---------------- | ---------------------------- |
| Scan correct QR → Success       | ⏳ Likely Fixed  | Hunt page fix should resolve |
| Scan wrong QR → Error message   | ⏳ Needs Testing |                              |
| Scan already scanned QR → Error | ⏳ Needs Testing |                              |
| Scan fake QR → Redirect         | ⏳ Needs Testing |                              |
| Hunt not started → Blocked      | ⏳ Needs Testing |                              |
| Hunt timed out → Blocked        | ⏳ Needs Testing |                              |

### Admin Testing

| Test Case             | Status           | Notes                |
| --------------------- | ---------------- | -------------------- |
| Create event          | ✅ Fixed         | Validation added     |
| Add clues             | ✅ Works         |                      |
| Generate QR codes     | ✅ Fixed         | API refactored       |
| Preview QR codes      | ✅ NEW           | Added in this update |
| Start/Stop hunt       | ⏳ Needs Testing |                      |
| Live monitor updates  | ⏳ Needs Testing |                      |
| Export players CSV    | ✅ Implemented   |                      |
| Reset player password | ✅ Implemented   |                      |

---

## 📋 Pre-Event Checklist

Before the actual event:

- [ ] **Create admin user** in Supabase
- [ ] **Disable RLS** or configure proper policies
- [ ] **Verify environment variables** in Vercel
- [ ] **Create event** with correct times and duration
- [ ] **Add all clues** with hint text
- [ ] **Create teams** or use "Generate Teams"
- [ ] **Generate QR codes** and print them
- [ ] **Test complete flow** with 2 test players
- [ ] **Test on actual mobile devices** (iOS + Android)
- [ ] **Verify timer** is working correctly
- [ ] **Test fake QRs** if using them

---

## 💡 Tips for Debugging

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Filter by function (e.g., `/api/scan`)
4. Look for console.log outputs

### Check Supabase Data

1. Go to Supabase Dashboard → Table Editor
2. Verify `team_clue_order` has entries after "Start Hunt"
3. Verify `qr_codes` have correct `qr_token` values
4. Make sure QR codes belong to the same event as teams

### Test with Manual Input

The scan page has a hidden "Can't use camera?" option:

1. Click the button at bottom of scan page
2. Enter QR token manually (from QR code filename)
3. Useful for desktop testing

### Common Issues

| Problem            | Solution                               |
| ------------------ | -------------------------------------- |
| "Invalid QR code"  | QR token doesn't exist or wrong event  |
| "Wrong QR code"    | Not this team's next clue              |
| "Already scanned"  | Team already completed this clue       |
| "Hunt not started" | Admin needs to click "Start Hunt"      |
| "Time's up"        | Hunt timer expired                     |

---

## 📞 Contact / Help

If stuck, check:

1. `TECHNICAL_DOCUMENTATION.md` - Full system docs
2. `supabase/SETUP_GUIDE.md` - Database setup
3. `supabase/schema.sql` - Table definitions
4. Console errors in browser DevTools
5. Vercel Function Logs

---

## 📝 Contributors

- Initial Development: @harsha
- Bug Fixes (Jan 17-19): @SaiGurulnukurthi

---

Good luck with the event! 🎯

# Pending Issues & Testing Tasks

> Last Updated: January 16, 2026
> Status: **Handover to Friend**

---

## 🔴 Known Issues (Need Fixing)

### 1. QR Code Scanning Returns 400 Errors

**Status:** 🔴 Critical - Not Working  
**Location:** `src/app/api/scan/route.ts`

**Symptoms:**
- When players scan QR codes, the API returns 400 errors
- Camera stops but no success confirmation shown
- Clue doesn't advance to next step

**Possible Causes:**
- QR code token not matching database (different event?)
- `team_clue_order` table not populated correctly
- Teams need to "Stop Hunt" and "Start Hunt" again to regenerate clue orders

**Debug Steps:**
1. Check Vercel Function Logs for `/api/scan` endpoint
2. Look for console.log outputs:
   - `"QR lookup failed:"` - Token doesn't match any QR in DB
   - `"No expected clue order found:"` - team_clue_order is empty
   - `"Wrong clue scanned:"` - QR is valid but not the team's next clue
   - `"Duplicate scan attempted:"` - Already scanned this clue

**Quick Fix to Try:**
1. Stop the hunt (Admin → Events → Stop Hunt)
2. Start the hunt again (this regenerates team_clue_order)
3. Make sure QR codes are from the SAME event

---

### 2. Timer May Appear to Reset

**Status:** 🟡 Needs Verification  
**Location:** `src/app/hunt/page.tsx`

**Symptoms:**
- Global timer appears to "reset" when navigating between pages

**Likely Cause:**
- Brief flash while event data loads
- Not a real reset - just UI re-render

**Fix Already Applied:**
- Timer now fetches fresh data from database on load

**Verify by:**
- Check that `event.hunt_started_at` is not changing in database
- Timer should be consistent across all players

---

## 🟡 Testing Needed

### Mobile Testing

| Test Case | Status | Notes |
|-----------|--------|-------|
| QR Scanner on iOS Chrome | ❓ Needs Testing | Camera permissions |
| QR Scanner on iOS Safari | ❓ Needs Testing | May have issues |
| QR Scanner on Android Chrome | ❓ Needs Testing | Should work |
| Touch targets (44px min) | ✅ CSS Added | Verify buttons are easy to tap |
| Viewport zoom prevention | ✅ CSS Added | Inputs shouldn't zoom on focus |

### Scan Flow Testing

| Test Case | Status | Notes |
|-----------|--------|-------|
| Scan correct QR → Success | ❓ Failing | 400 errors in logs |
| Scan wrong QR → Error message | ❓ Needs Testing | Should show "Wrong QR code!" |
| Scan already scanned QR → Error | ❓ Needs Testing | Should show "Already scanned" |
| Scan fake QR → Redirect | ❓ Needs Testing | Should redirect to prank URL |
| Hunt not started → Blocked | ❓ Needs Testing | Should show error |
| Hunt timed out → Blocked | ❓ Needs Testing | Should show "Time's up!" |

### Admin Testing

| Test Case | Status | Notes |
|-----------|--------|-------|
| Create event | ❓ Needs Testing | |
| Add clues | ✅ Works | Fixed earlier |
| Generate QR codes | ❓ Needs Testing | |
| Start/Stop hunt | ❓ Needs Testing | |
| Live monitor updates | ❓ Needs Testing | Real-time subscription |
| Export players CSV | ✅ Implemented | |
| Reset player password | ✅ Implemented | |

### Auth Testing

| Test Case | Status | Notes |
|-----------|--------|-------|
| Player registration | ❓ Needs Testing | |
| Player login | ❓ Needs Testing | |
| Admin login | ✅ Works | |
| Session persistence | ❓ Needs Testing | localStorage |

---

## 🟢 Recently Fixed Issues

### ✅ Scanner Glitchy (Multiple Popups)
- Added scan lock after first detection
- Added debounce for duplicate codes
- Camera now stops immediately
- "Try Again" button appears on error

### ✅ Location Showing to Players
- Removed `location_name` from player view
- Now only visible in admin panel

### ✅ Progress Page Collusion Risk
- Page now locked during active hunt
- Only accessible after completion or timeout

### ✅ "Step 1 of 3" Visible
- Removed step count from player view

### ✅ View Progress Link Confusion
- Removed during hunt
- Only shown when complete

### ✅ Viewport Warnings
- Moved `viewport` and `themeColor` to separate export

### ✅ All Lint Errors
- Fixed function declaration order
- Fixed unused variables
- Disabled overly strict `set-state-in-effect` rule

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
| Problem | Solution |
|---------|----------|
| "Invalid QR code" | QR token doesn't exist or wrong event |
| "Wrong QR code" | Not this team's next clue |
| "Already scanned" | Team already completed this clue |
| "Hunt not started" | Admin needs to click "Start Hunt" |
| "Time's up" | Hunt timer expired |

---

## 📞 Contact / Help

If stuck, check:
1. `TECHNICAL_DOCUMENTATION.md` - Full system docs
2. `supabase/SETUP_GUIDE.md` - Database setup
3. `supabase/schema.sql` - Table definitions
4. Console errors in browser DevTools
5. Vercel Function Logs

---

*Good luck with the event! 🎯*

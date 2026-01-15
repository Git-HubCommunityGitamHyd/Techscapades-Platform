# Supabase Setup Guide

Follow these steps to set up the Techscapades database in your club's Supabase account.

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in with your club's account
2. Click **"New Project"**
3. Fill in:
   - **Organization:** Select your club's organization (or create one)
   - **Project Name:** `techscapades-2026` (or similar)
   - **Database Password:** Generate a strong password and **save it somewhere secure!**
   - **Region:** Select `South Asia (Mumbai)` for best performance in India
4. Click **"Create new project"**
5. Wait ~2 minutes for the project to be provisioned

---

## Step 2: Get Your API Keys

Once the project is ready:

1. Go to **Project Settings** (gear icon in sidebar) → **API**
2. Copy these values (you'll need them for `.env.local`):

| Key | Where to find it |
|-----|------------------|
| **Project URL** | Under "Project URL" (e.g., `https://xxxx.supabase.co`) |
| **anon public** | Under "Project API keys" → `anon` `public` |
| **service_role** | Under "Project API keys" → `service_role` `secret` ⚠️ Keep secret! |

---

## Step 3: Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** (or press Cmd+Enter)
6. You should see "Success. No rows returned" - this is correct!

### Verify Tables Created

Go to **Table Editor** in the sidebar. You should see these tables:
- ✅ `events`
- ✅ `teams`
- ✅ `team_members` (NEW)
- ✅ `clues`
- ✅ `qr_codes`
- ✅ `team_clue_order`
- ✅ `scans`
- ✅ `fake_qr_scans` (NEW)

---

## Step 4: Create Admin Users

There are **2 admin accounts** for this platform. Run this SQL in the SQL Editor:

```sql
-- Create Admin Users
-- ⚠️ REPLACE THE PASSWORD HASHES WITH YOUR OWN BEFORE RUNNING!

INSERT INTO teams (team_name, username, password_hash, is_admin) VALUES
  ('Admin - Harsha', 'igharsha7', 'c9110ba6f0940154a81acbfeece781b0bac231841b8a2ce0485015ec5d63e5ae', true),
  ('Admin - M5', 'm5m5', '3b4120cad5faa8513f128a3e7663c853db7a5e3681024b1de363091a15985a84', true);
```

### Admin Accounts

| Username | Team Name | Login URL |
|----------|-----------|-----------|
| `igharsha7` | Admin - Harsha | `/admin-login` |
| `m5m5` | Admin - M5 | `/admin-login` |

### Generate Password Hashes

Use an online SHA256 tool to generate hashes for your passwords:
- [SHA256 Online](https://emn178.github.io/online-tools/sha256.html)
- [SHA256 Hash Generator](https://passwordsgenerator.net/sha256-hash-generator/)

**Steps:**
1. Go to one of the tools above
2. Type your password (e.g., `MySecretPassword123`)
3. Copy the **lowercase hex output** (64 characters)
4. Replace `PASTE_SHA256_HASH_FOR_...` with your hash

**Example:**
- Password: `MySecretPassword123`
- SHA256 Hash: `ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f`

Alternatively, run this in your browser console (F12 → Console):

```javascript
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Generate hash for igharsha7's password
hashPassword("YourPasswordHere").then(console.log);
```

---

## Step 5: Configure Environment Variables

Create `.env.local` in your project root:

```bash
cp .env.template .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 6: Test the Connection

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/admin-login`

3. Login with your admin credentials

4. If you see the admin dashboard, you're all set! 🎉

---

## Troubleshooting

### "Invalid credentials" on login
- Check that you created the admin user in Step 4
- Verify the password hash matches your password
- Check `.env.local` has correct Supabase URL and keys

### Tables not showing
- Re-run the schema SQL
- Check for errors in the SQL Editor output
- Make sure you're in the correct project

### RLS blocking queries
- The app uses service role key for most operations
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Service role key bypasses RLS

---

## Database Schema Summary

### New Tables (v2.0)

| Table | Purpose |
|-------|---------|
| `team_members` | Individual player accounts with own passwords |
| `fake_qr_scans` | Tracks who fell for rickroll QRs |

### New Columns

| Table | New Columns |
|-------|-------------|
| `events` | `hunt_started_at`, `hunt_duration_minutes`, `hint_delay_minutes`, `default_min_players`, `default_max_players` |
| `teams` | `min_players`, `max_players`, `registration_status`, `hunt_finished_at` |
| `clues` | `hint_text` |
| `qr_codes` | `is_fake`, `redirect_url`, `fake_label` |
| `team_clue_order` | `clue_started_at`, `hint_viewed`, `hint_viewed_at`, `hint_viewed_by` |
| `scans` | `scanned_by`, `hint_was_used` |

---

## Next Steps

After setup is complete:
1. Create your first event in the admin dashboard
2. Add clues/riddles
3. Add teams (from Google Forms data)
4. Share registration link with players
5. Generate QR codes and print them
6. On event day, click "Start Hunt"!

---

*Last updated: January 2026*

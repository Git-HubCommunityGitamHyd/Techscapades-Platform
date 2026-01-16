# Techscapades 4.0 Platform - Technical Documentation

> Last Updated: January 16, 2026
> Version: 2.0

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Core Features](#core-features)
7. [API Endpoints](#api-endpoints)
8. [Environment Variables](#environment-variables)
9. [Deployment](#deployment)
10. [Development Guide](#development-guide)

---

## Overview

Techscapades 4.0 is a **tech-themed treasure hunt platform** built for EPOCH 4.0 by GitHub Community GITAM. Teams compete by solving clues, scanning QR codes at physical locations, and racing against a global timer.

### Key Features
- 🔑 **Individual Player Login** - Each player has their own credentials
- 🎲 **Randomized Clue Order** - Round-robin starting points prevent crowding
- ⏱️ **Global Hunt Timer** - Admin-controlled countdown
- 💡 **Timed Hint System** - Hints become available after delay (costs points)
- 🎭 **Fake QR Codes** - "Hall of Shame" for rickrolled players
- 📊 **Real-time Monitoring** - Live admin dashboard with team progress
- 📱 **Mobile-First Design** - Optimized for phone scanning

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui |
| **QR Scanning** | html5-qrcode |
| **QR Generation** | qrcode (server-side) |
| **Password Hashing** | bcrypt |
| **Deployment** | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Player login
│   │   └── register/page.tsx       # Player registration
│   ├── admin/
│   │   ├── layout.tsx              # Admin sidebar layout
│   │   ├── events/page.tsx         # Event management
│   │   ├── teams/page.tsx          # Team management
│   │   ├── clues/page.tsx          # Clue management
│   │   ├── qr-codes/page.tsx       # QR code generation
│   │   └── monitor/page.tsx        # Live monitoring dashboard
│   ├── admin-login/page.tsx        # Admin login page
│   ├── hunt/page.tsx               # Main player hunt interface
│   ├── scan/page.tsx               # QR scanner page
│   ├── progress/page.tsx           # Player journey (locked during hunt)
│   ├── api/
│   │   ├── admin/                  # Admin-only API routes
│   │   │   ├── events/
│   │   │   │   ├── route.ts        # CRUD events
│   │   │   │   ├── start-hunt/route.ts  # Start hunt
│   │   │   │   └── stop-hunt/route.ts   # Stop hunt
│   │   │   ├── teams/
│   │   │   │   ├── route.ts        # CRUD teams
│   │   │   │   └── generate/route.ts    # Auto-generate teams
│   │   │   ├── clues/route.ts      # CRUD clues
│   │   │   ├── players/
│   │   │   │   ├── route.ts        # List players
│   │   │   │   ├── [id]/route.ts   # Delete player
│   │   │   │   ├── [id]/move/route.ts   # Move player between teams
│   │   │   │   ├── reset-password/route.ts
│   │   │   │   └── export/route.ts # Export CSV
│   │   │   └── qr/generate/route.ts     # Generate QR codes ZIP
│   │   ├── auth/
│   │   │   ├── login/route.ts      # Player login
│   │   │   ├── register/route.ts   # Player registration
│   │   │   └── admin-login/route.ts # Admin login
│   │   ├── scan/route.ts           # QR code scanning logic
│   │   ├── hints/view/route.ts     # View hint (costs points)
│   │   └── teams/available/route.ts # Get available teams
│   ├── layout.tsx                  # Root layout with viewport
│   ├── globals.css                 # Global styles
│   └── page.tsx                    # Landing page
├── components/
│   └── ui/                         # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx             # Auth state management
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client (admin)
│   ├── types.ts                    # TypeScript interfaces
│   └── utils/
│       └── helpers.ts              # Utility functions
└── supabase/
    ├── schema.sql                  # Complete database schema
    └── SETUP_GUIDE.md              # Database setup instructions
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `events` | Hunt events with timer settings |
| `teams` | Team information and game state |
| `team_members` | Individual player accounts |
| `clues` | Riddles with hints |
| `qr_codes` | QR tokens (real & fake) |
| `team_clue_order` | Per-team randomized clue sequence |
| `scans` | Successful scan records |
| `fake_qr_scans` | "Hall of Shame" tracking |

### Key Relationships

```
events (1) ──────── (N) teams
teams (1) ──────── (N) team_members
events (1) ──────── (N) clues
clues (1) ──────── (1) qr_codes
teams (1) ──────── (N) team_clue_order
team_clue_order (N) ──────── (1) clues
teams (1) ──────── (N) scans
```

### Important Columns

**events:**
- `hunt_started_at` - NULL until admin clicks "Start Hunt"
- `hunt_duration_minutes` - Global timer (default 60)
- `hint_delay_minutes` - Time before hints available (default 5)

**teams:**
- `current_step` - Current position in their clue order
- `score` - Points earned
- `is_disqualified` - Banned from scanning

**clues:**
- `hint_text` - Optional hint (costs 5 points to view)
- `step_number` - Admin ordering (for reference)

**team_clue_order:**
- `step_index` - Position in THIS TEAM's order
- `hint_viewed` - Whether they used the hint

---

## Authentication System

### Player Flow
1. Player registers with username/password → Creates `team_members` entry
2. Player logs in → Gets team data with player info
3. Session stored in localStorage (team object)
4. AuthContext provides `team` and `player` throughout app

### Admin Flow
1. Admin logs in with admin credentials
2. Credentials checked against `teams` table (where `is_admin = true`)
3. Admin session stored separately in localStorage

### Password Hashing
- Uses `bcrypt` with 10 salt rounds
- `hashPassword()` and `comparePassword()` in `helpers.ts`

---

## Core Features

### 1. Hunt Timer System
- Admin clicks "Start Hunt" → Sets `hunt_started_at` on event
- Timer calculated from: `hunt_started_at + hunt_duration_minutes`
- All players see same countdown
- Scans rejected when timer expires

### 2. Round-Robin Clue Distribution
When hunt starts (`start-hunt` API):
1. Gets all teams and clues
2. Each team assigned different starting clue (round-robin)
3. Remaining clues shuffled randomly
4. Order stored in `team_clue_order` table

Example with 3 clues, 3 teams:
- Team 1: Clue A → (random B,C)
- Team 2: Clue B → (random A,C)
- Team 3: Clue C → (random A,B)

### 3. Hint System
- Each clue can have a `hint_text`
- Hint locked for `hint_delay_minutes` after viewing clue
- Clicking "Show Hint" costs 5 points
- Full scan without hint = 10 points

### 4. Fake QR Codes
- Admin creates fake QRs with redirect URLs
- Scanning fake QR → Logs to `fake_qr_scans` table
- Player redirected to prank URL
- "Hall of Shame" displayed on admin monitor

### 5. Progress Page Lock
- `/progress` page blocked during active hunt
- Only accessible when hunt complete OR timed out
- Prevents collusion by hiding past clues

---

## API Endpoints

### Public APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Player login |
| POST | `/api/auth/register` | Player registration |
| GET | `/api/teams/available` | List available teams for registration |

### Player APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/scan` | Validate QR code scan |
| POST | `/api/hints/view` | View hint (costs points) |

### Admin APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/admin-login` | Admin login |
| GET/POST/PUT/DELETE | `/api/admin/events` | Event CRUD |
| POST | `/api/admin/events/start-hunt` | Start hunt timer |
| POST | `/api/admin/events/stop-hunt` | Stop hunt |
| GET/POST/DELETE | `/api/admin/teams` | Team CRUD |
| POST | `/api/admin/teams/generate` | Auto-generate teams |
| GET/POST/PUT/DELETE | `/api/admin/clues` | Clue CRUD |
| GET/DELETE | `/api/admin/players` | Player management |
| POST | `/api/admin/players/[id]/move` | Move player to another team |
| POST | `/api/admin/players/reset-password` | Reset player password |
| GET | `/api/admin/players/export` | Export players as CSV |
| POST | `/api/admin/qr/generate` | Generate QR codes ZIP |

---

## Environment Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Secret - server only
```

**Important:** Add all three to Vercel Environment Variables for deployment.

---

## Deployment

### Vercel Deployment
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel settings
4. Deploy

### Supabase Setup
1. Create Supabase project
2. Run `schema.sql` in SQL Editor
3. Disable RLS for testing OR configure proper policies
4. Create admin user (see SETUP_GUIDE.md)

### RLS Quick Fix (for testing)
```sql
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE clues DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_clue_order DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE fake_qr_scans DISABLE ROW LEVEL SECURITY;
```

---

## Development Guide

### Local Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Key Files to Know

| File | Purpose |
|------|---------|
| `src/app/api/scan/route.ts` | Core scanning logic - validates QR, checks order |
| `src/app/api/admin/events/start-hunt/route.ts` | Generates team_clue_order |
| `src/app/hunt/page.tsx` | Main player interface |
| `src/app/scan/page.tsx` | QR scanner with camera |
| `src/contexts/AuthContext.tsx` | Auth state management |
| `src/lib/supabase/server.ts` | Admin Supabase client |

### Adding New Features
1. Create API route in `src/app/api/`
2. Use `createAdminClient()` for admin operations
3. Add UI in appropriate page
4. Update types in `lib/types.ts`

---

## Contact

For questions about this codebase, refer to:
- This documentation
- `PENDING.md` for known issues
- `supabase/SETUP_GUIDE.md` for database setup
- Inline code comments

---

*Built for EPOCH 4.0 by GitHub Community GITAM*

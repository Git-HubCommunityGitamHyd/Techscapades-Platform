# Techscapades Platform - Technical Documentation

> **Last Updated:** January 2026  
> **Version:** 0.1.0  
> **Status:** Development (Admin side mostly complete, Player side functional)

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Player Side Features](#player-side-features)
7. [Admin Side Features](#admin-side-features)
8. [API Reference](#api-reference)
9. [Game Flow & Logic](#game-flow--logic)
10. [Real-time Features](#real-time-features)
11. [Setup Guide](#setup-guide)
12. [Environment Variables](#environment-variables)
13. [Deployment](#deployment)
14. [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## Overview

**Techscapades Platform** is a real-time campus treasure hunt application where:
- Teams compete by solving riddles/clues that lead to physical locations
- At each location, they scan a QR code to validate progress
- Each team gets a **randomized sequence** of clues (so they can't follow each other)
- Admins can manage events, clues, teams, and monitor progress in real-time

### Two User Roles

| Role | Purpose | Access |
|------|---------|--------|
| **Player (Team)** | Participate in treasure hunts | `/login`, `/hunt`, `/scan`, `/progress` |
| **Admin** | Manage events, clues, teams, QR codes, monitor live | `/admin-login`, `/admin/*` |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 16.1.1 |
| **UI Library** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | shadcn/ui (New York style) | Latest |
| **Database** | Supabase (PostgreSQL) | - |
| **Auth** | Custom (password hashing with SHA-256) | - |
| **Real-time** | Supabase Realtime | - |
| **QR Generation** | qrcode | 1.5.4 |
| **QR Scanning** | html5-qrcode | 2.3.8 |
| **ZIP Creation** | jszip | 3.10.1 |
| **Icons** | lucide-react | 0.562.0 |
| **Toasts** | sonner | 2.0.7 |

---

## Project Structure

```
techscapades-platform/
├── public/                     # Static assets
│   ├── favicon.ico
│   └── *.svg                   # Icons
│
├── scripts/
│   └── setup-admin.ts          # Script to create admin user
│
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (fonts, metadata)
│   │   ├── page.tsx            # Landing page (/)
│   │   ├── globals.css         # Tailwind + CSS variables
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx        # Team login page
│   │   │
│   │   ├── admin-login/
│   │   │   └── page.tsx        # Admin login page
│   │   │
│   │   ├── hunt/
│   │   │   └── page.tsx        # Main gameplay - shows current clue
│   │   │
│   │   ├── scan/
│   │   │   └── page.tsx        # QR scanner with camera
│   │   │
│   │   ├── progress/
│   │   │   └── page.tsx        # Team's progress & history
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx      # Admin layout with sidebar
│   │   │   ├── page.tsx        # Redirects to /admin/events
│   │   │   ├── events/
│   │   │   │   └── page.tsx    # Event management
│   │   │   ├── clues/
│   │   │   │   └── page.tsx    # Clue management
│   │   │   ├── teams/
│   │   │   │   └── page.tsx    # Team management
│   │   │   ├── qr-codes/
│   │   │   │   └── page.tsx    # QR code generation
│   │   │   └── monitor/
│   │   │       └── page.tsx    # Live monitoring dashboard
│   │   │
│   │   └── api/                # API Routes
│   │       ├── auth/
│   │       │   ├── login/route.ts       # Team login
│   │       │   └── admin-login/route.ts # Admin login
│   │       ├── scan/
│   │       │   └── route.ts             # QR validation
│   │       └── admin/
│   │           ├── events/route.ts      # Events CRUD
│   │           ├── clues/route.ts       # Clues CRUD
│   │           ├── teams/route.ts       # Teams GET/PUT
│   │           ├── teams/generate/route.ts  # Bulk team creation
│   │           └── qr/generate/route.ts     # QR code generation
│   │
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── select.tsx
│   │       ├── sonner.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── textarea.tsx
│   │
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts       # Browser Supabase client
│       │   └── server.ts       # Server clients (anon + admin)
│       ├── types.ts            # TypeScript interfaces
│       ├── utils.ts            # cn() utility for classnames
│       └── utils/
│           └── helpers.ts      # Password, QR, shuffle utilities
│
├── supabase/
│   ├── schema.sql              # Main database schema
│   └── migrations/
│       ├── add_admin_notes.sql
│       └── create_clue_functions.sql
│
├── .env.template               # Environment variables template
├── .gitignore
├── components.json             # shadcn/ui config
├── MVP.md                      # Original MVP specification
├── SITES.md                    # Route documentation
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     events      │       │      teams      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ event_id (FK)   │
│ name            │       │ id (PK)         │
│ start_time      │       │ team_name       │
│ end_time        │       │ username        │
│ is_active       │       │ password_hash   │
│ created_at      │       │ score           │
└────────┬────────┘       │ current_step    │
         │                │ is_disqualified │
         │                │ is_admin        │
         │                │ created_at      │
         │                └────────┬────────┘
         │                         │
         ▼                         │
┌─────────────────┐                │
│      clues      │                │
├─────────────────┤                │
│ id (PK)         │                │
│ event_id (FK)   │                │
│ step_number     │                │
│ clue_text       │       ┌────────▼────────┐
│ location_name   │       │ team_clue_order │
│ admin_notes     │       ├─────────────────┤
│ created_at      │◄──────│ clue_id (FK)    │
└────────┬────────┘       │ team_id (FK)    │
         │                │ step_index      │
         │                │ id (PK)         │
         ▼                └─────────────────┘
┌─────────────────┐
│    qr_codes     │       ┌─────────────────┐
├─────────────────┤       │      scans      │
│ id (PK)         │◄──────│ qr_code_id (FK) │
│ event_id (FK)   │       │ clue_id (FK)    │
│ clue_id (FK)    │◄──────│ team_id (FK)    │
│ qr_token        │       │ scanned_at      │
│ created_at      │       │ id (PK)         │
└─────────────────┘       └─────────────────┘
```

### Table Definitions

#### `events`
Stores treasure hunt events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `name` | TEXT | Event name (e.g., "Techscapades 2026") |
| `start_time` | TIMESTAMPTZ | When the hunt starts |
| `end_time` | TIMESTAMPTZ | When the hunt ends |
| `is_active` | BOOLEAN | Only one event can be active at a time |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `teams`
Stores both team accounts AND admin accounts (distinguished by `is_admin` flag).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `event_id` | UUID (FK) | Reference to event (NULL for admins) |
| `team_name` | TEXT | Display name |
| `username` | TEXT (UNIQUE) | Login username (e.g., `TEAM_TECH_001`) |
| `password_hash` | TEXT | SHA-256 hashed password |
| `score` | INTEGER | Current score (10 points per clue) |
| `is_disqualified` | BOOLEAN | If team is DQ'd |
| `current_step` | INTEGER | Current clue index (0-based) |
| `is_admin` | BOOLEAN | TRUE for admin users |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `clues`
Stores riddles/clues for each event.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `event_id` | UUID (FK) | Reference to event |
| `step_number` | INTEGER | Order in master sequence |
| `clue_text` | TEXT | The riddle/clue shown to teams |
| `location_name` | TEXT | Optional hint (e.g., "Near Library") |
| `admin_notes` | TEXT | Answer/notes visible only to admins |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `qr_codes`
Stores unique QR tokens for each clue.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `event_id` | UUID (FK) | Reference to event |
| `clue_id` | UUID (FK) | Reference to clue |
| `qr_token` | TEXT (UNIQUE) | Token embedded in QR (e.g., `QR_A1B2C3D4E5F6G7H8`) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `team_clue_order`
Stores randomized clue sequence per team.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `team_id` | UUID (FK) | Reference to team |
| `clue_id` | UUID (FK) | Reference to clue |
| `step_index` | INTEGER | Position in THIS team's sequence (0-based) |

**Constraints:** UNIQUE(team_id, clue_id), UNIQUE(team_id, step_index)

#### `scans`
Stores scan history.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `team_id` | UUID (FK) | Reference to team |
| `clue_id` | UUID (FK) | Reference to clue |
| `qr_code_id` | UUID (FK) | Reference to QR code |
| `scanned_at` | TIMESTAMPTZ | When scanned |

**Constraints:** UNIQUE(team_id, clue_id) - prevents duplicate scans

### Row Level Security (RLS)

All tables have RLS enabled:

| Table | Policy |
|-------|--------|
| `events` | Anyone can read active events |
| `teams` | Teams can read/update only their own row |
| `clues` | Teams can read clues for their event |
| `team_clue_order` | Teams can read only their own order |
| `scans` | Teams can read/insert only their own scans |
| `qr_codes` | Everyone can read (for validation) |

**Admin operations** use service role key to bypass RLS.

---

## Authentication System

### How It Works

1. **No Supabase Auth** - Custom password-based system
2. **Passwords hashed with SHA-256** (in `helpers.ts`)
3. **Session stored in localStorage** (not secure cookies)
4. **No JWT tokens** - Just stores team/admin object in localStorage

### Login Flow

```
User enters username + password
           ↓
API: /api/auth/login or /api/auth/admin-login
           ↓
Server: Find user by username in `teams` table
           ↓
Server: Hash input password, compare with stored hash
           ↓
If match: Return team/admin data (without password_hash)
           ↓
Client: Store in localStorage('team') or localStorage('admin')
           ↓
Protected pages check localStorage on mount
```

### Security Notes

⚠️ **Current limitations:**
- SHA-256 is fast (bcrypt would be better for passwords)
- localStorage is vulnerable to XSS
- No session expiry
- No CSRF protection

For a small campus event with 10 teams, this is acceptable. For production, consider Supabase Auth.

---

## Player Side Features

### 1. Landing Page (`/`)

- Hero section with gradient background
- "Join Hunt" and "Admin Login" buttons
- Feature highlights (Mobile-First, Real-Time, Competitive)

### 2. Team Login (`/login`)

- Username + password form
- Validates against `teams` table
- Checks:
  - Team exists and is not admin
  - Password matches
  - Team is not disqualified
  - Event is active
- Stores team data in localStorage
- Redirects to `/hunt`

### 3. Hunt Page (`/hunt`) - Main Gameplay

**Features:**
- Displays team name and current score
- Shows current clue (riddle text + optional location hint)
- Step indicator ("Step 3 of 8")
- "Scan QR Code" button
- Logout button

**States:**
- **Waiting:** No clues assigned yet
- **Active:** Shows current clue
- **Disqualified:** Shows DQ message
- **Complete:** Shows victory message with final score

**Real-time:** Subscribes to team updates via Supabase Realtime

### 4. QR Scanner (`/scan`)

**Features:**
- Opens device camera (prefers rear camera)
- Scans QR codes using `html5-qrcode`
- Extracts token from QR (or from URL if QR contains URL)
- Sends to `/api/scan` for validation
- Shows success/error messages
- Auto-redirects to `/hunt` on success (2 second delay)

**Camera Handling:**
- Start/Stop controls
- Error handling for camera access denied

### 5. Progress Page (`/progress`)

**Features:**
- Countdown timer to event end
- Progress bar (X/Y clues completed)
- Scan history with timestamps
- Each scan shows location name and time

**Real-time:** Updates when new scans are added

---

## Admin Side Features

### Admin Layout (`/admin/layout.tsx`)

- Responsive sidebar navigation
- Mobile hamburger menu
- Logout button
- Auth check on mount (redirects to `/admin-login` if not authenticated)

### 1. Events Management (`/admin/events`)

**Features:**
- List all events with status badges
- Create new event (name, start date/time, end date/time)
- Edit existing events
- Activate/Deactivate events (only one can be active)
- Delete events (cascades to teams, clues, scans)

**Validations:**
- Start date can't be in the past (for new events)
- End time must be after start time

### 2. Clues Management (`/admin/clues`)

**Features:**
- Event selector dropdown
- Add new clues with:
  - Clue text (the riddle)
  - Location name (optional hint shown to teams)
  - Admin notes (answer/hints - visible only to admins)
- Edit existing clues
- Delete clues (auto-reorders remaining)
- Reorder clues with up/down buttons
- Visual distinction for admin notes (amber/gold color)

### 3. Teams Management (`/admin/teams`)

**Features:**
- Event selector dropdown
- **Bulk generate teams:**
  - Specify count (1-100)
  - Auto-generates usernames: `TEAM_<prefix>_001`
  - Auto-generates random 10-char passwords
  - Creates randomized clue order for each team
  - **IMPORTANT:** Must download CSV - passwords never shown again!
- **Add single team** (after initial generation)
- View all teams with:
  - Username
  - Score (with +/- buttons to adjust)
  - Current step
  - Status (Active/Disqualified)
- Disqualify/Reinstate teams
- Delete teams

**Credentials Download:**
- CSV format: Team Name, Username, Password
- Page warns before leaving if not downloaded
- Button pulses to indicate required action

### 4. QR Codes (`/admin/qr-codes`)

**Features:**
- Event selector dropdown
- Preview all clues that will get QR codes
- "Generate & Download ZIP" button
- Downloads ZIP file containing:
  - PNG images for each clue
  - Named: `clue_01_library.png`
  - 400x400 pixels
  - Dark theme (slate on white)

**QR Token Format:** `QR_<16_CHAR_HEX>`  
**QR Content:** `https://yoursite.com/scan?token=QR_XXXX`

### 5. Live Monitor (`/admin/monitor`)

**Features:**
- Real-time team progress tracking
- Stats cards:
  - Total teams
  - Finished teams
  - Total clues
  - Disqualified teams
- Collapsible "Clue Answer Reference" (shows all clues with admin notes)
- Team leaderboard table:
  - Rank (1st = gold, 2nd = silver, 3rd = bronze)
  - Team name
  - Score with +/- adjustment buttons
  - Progress bar
  - Last scan timestamp
  - Status badge
  - DQ/Reinstate button
- "End Event" button (deactivates event)

**Real-time:** Subscribes to both team updates and scan inserts

---

## API Reference

### Authentication APIs

#### `POST /api/auth/login`
Team login.

**Request:**
```json
{
  "username": "TEAM_TECH_001",
  "password": "aBcDe12345"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "team": {
    "id": "uuid",
    "team_name": "Team 1",
    "username": "TEAM_TECH_001",
    "event_id": "uuid",
    "score": 30,
    "current_step": 3,
    "is_disqualified": false,
    "is_admin": false
  }
}
```

**Error Responses:**
- 400: Missing username/password
- 401: Invalid credentials
- 403: Team disqualified or event not active
- 404: Event not found

#### `POST /api/auth/admin-login`
Admin login.

Same structure as team login but:
- Checks `is_admin = true`
- Returns `admin` instead of `team`

---

### Scan API

#### `POST /api/scan`
Validate QR code scan.

**Request:**
```json
{
  "token": "QR_A1B2C3D4E5F6G7H8",
  "team_id": "team-uuid"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Correct! Move on to the next clue.",
  "newScore": 40,
  "nextStep": 4,
  "isComplete": false
}
```

**Error Responses:**
- 400: Missing token/team_id, invalid QR, already scanned, wrong QR
- 403: Team disqualified, event not active, hunt not started/ended
- 404: Team not found, event not found
- 500: Database error

**Validation Logic:**
1. Team exists and is not disqualified
2. Event exists and is active
3. Current time is within event start/end
4. QR token exists and belongs to this event
5. QR is for the team's expected next clue
6. Team hasn't already scanned this clue

---

### Admin APIs

All admin APIs use service role key (bypasses RLS).

#### `GET /api/admin/events`
Fetch all events.

#### `POST /api/admin/events`
Create event.

**Request:**
```json
{
  "name": "Techscapades 2026",
  "start_time": "2026-01-15T09:00:00Z",
  "end_time": "2026-01-15T17:00:00Z"
}
```

#### `PUT /api/admin/events`
Update event.

**Request:**
```json
{
  "id": "event-uuid",
  "name": "New Name",
  "is_active": true
}
```

*Note: Activating an event deactivates all others.*

#### `DELETE /api/admin/events?id=<uuid>`
Delete event (cascades to related data).

---

#### `GET /api/admin/clues?event_id=<uuid>`
Fetch clues for an event.

#### `POST /api/admin/clues`
Create clue.

**Request:**
```json
{
  "event_id": "uuid",
  "step_number": 1,
  "clue_text": "I guard the knowledge of ages...",
  "location_name": "Near main building",
  "admin_notes": "Answer: Library"
}
```

#### `PUT /api/admin/clues`
Update clue.

#### `DELETE /api/admin/clues?id=<uuid>`
Delete clue.

---

#### `GET /api/admin/teams?event_id=<uuid>`
Fetch teams for an event.

#### `PUT /api/admin/teams`
Update team (score, disqualify, etc.).

**Request:**
```json
{
  "id": "team-uuid",
  "score": 50,
  "is_disqualified": true
}
```

#### `DELETE /api/admin/teams?id=<uuid>`
Delete team.

---

#### `POST /api/admin/teams/generate`
Bulk generate teams.

**Request:**
```json
{
  "event_id": "uuid",
  "count": 10,
  "prefix": "TECH"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully created 10 teams",
  "credentials": [
    {
      "team_name": "Team 1",
      "username": "TEAM_TECH_001",
      "password": "aBcDeFgHiJ"
    },
    ...
  ]
}
```

**What it does:**
1. Generates random passwords (10 chars, alphanumeric)
2. Creates team records with hashed passwords
3. Creates randomized `team_clue_order` for each team

---

#### `POST /api/admin/qr/generate`
Generate QR codes for all clues.

**Request:**
```json
{
  "event_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 8 QR codes",
  "zipBase64": "<base64-encoded-zip>",
  "clueCount": 8
}
```

---

## Game Flow & Logic

### Complete Game Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN SETUP PHASE                            │
├─────────────────────────────────────────────────────────────────────┤
│  1. Admin creates an Event                                          │
│     - Sets name, start time, end time                               │
│                                                                     │
│  2. Admin creates Clues (the riddles)                               │
│     - Adds clue text, location hints, admin notes (answers)         │
│     - Orders them with up/down buttons                              │
│                                                                     │
│  3. Admin generates Teams                                           │
│     - Specifies count (e.g., 10)                                    │
│     - System creates usernames + random passwords                   │
│     - System assigns RANDOMIZED clue order per team                 │
│     - Admin downloads CSV with credentials                          │
│                                                                     │
│  4. Admin generates QR Codes                                        │
│     - Downloads ZIP with PNG images                                 │
│     - Prints and places at physical locations                       │
│                                                                     │
│  5. Admin activates the Event                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        HUNT DAY (LIVE)                              │
├─────────────────────────────────────────────────────────────────────┤
│  FOR EACH TEAM:                                                     │
│                                                                     │
│  1. Team logs in with provided credentials                          │
│                                                                     │
│  2. Team sees their FIRST clue (based on their random order)        │
│     └── e.g., "I guard the knowledge of ages..." (📍 Main Building) │
│                                                                     │
│  3. Team physically searches for the QR code                        │
│     └── They deduce it's the Library and go there                   │
│                                                                     │
│  4. Team scans the QR code                                          │
│     └── System validates: Is this the correct QR for THIS team?     │
│                                                                     │
│  5a. IF CORRECT:                                                    │
│      - +10 points                                                   │
│      - Advance to next step                                         │
│      - Show NEXT clue                                               │
│                                                                     │
│  5b. IF WRONG:                                                      │
│      - "Wrong QR code! This is not your next clue."                 │
│      - No change in progress                                        │
│                                                                     │
│  6. Repeat until all clues completed                                │
│                                                                     │
│  7. VICTORY! Team sees completion message                           │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      ADMIN MONITORING (LIVE)                        │
├─────────────────────────────────────────────────────────────────────┤
│  - Watch real-time leaderboard                                      │
│  - See progress bars update as teams scan                           │
│  - Adjust scores if needed (+/-)                                    │
│  - Disqualify teams if cheating detected                            │
│  - Reference clue answers when teams ask questions                  │
│  - End event when time's up or all finished                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Randomized Clue Order Example

Say you have 4 clues: Library, Cafeteria, Admin Block, Auditorium

When teams are generated:

| Team | Step 0 | Step 1 | Step 2 | Step 3 |
|------|--------|--------|--------|--------|
| Team 1 | Library | Cafeteria | Admin | Auditorium |
| Team 2 | Cafeteria | Auditorium | Library | Admin |
| Team 3 | Admin | Library | Auditorium | Cafeteria |

So if Team 1 sees Team 2 at the Library, Team 1 can't follow - Library might be Team 2's step 2, but it's Team 1's step 0 (they already did it!).

### Scoring

- **10 points per clue** (hardcoded in `/api/scan/route.ts`)
- Admins can manually adjust scores (+/- 10 increments in UI)
- Score is stored in `teams.score`

---

## Real-time Features

Powered by Supabase Realtime subscriptions.

### Hunt Page (`/hunt`)
```typescript
supabase
  .channel("team-updates")
  .on("postgres_changes", {
    event: "UPDATE",
    schema: "public", 
    table: "teams",
    filter: `id=eq.${teamId}`
  }, callback)
  .subscribe()
```

Updates team data when admin adjusts score or DQs.

### Progress Page (`/progress`)
```typescript
supabase
  .channel("progress-updates")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "scans",
    filter: `team_id=eq.${teamId}`
  }, callback)
  .subscribe()
```

Updates scan history in real-time.

### Monitor Page (`/admin/monitor`)
```typescript
// Teams channel
supabase.channel("monitor-teams")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "teams",
    filter: `event_id=eq.${eventId}`
  }, callback)

// Scans channel  
supabase.channel("monitor-scans")
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "scans"
  }, callback)
```

Updates leaderboard in real-time.

---

## Setup Guide

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Step 1: Clone & Install

```bash
git clone <repo-url>
cd Techscapades-Platform
npm install
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your:
   - Project URL
   - anon key
   - service_role key

### Step 3: Run Database Schema

In Supabase SQL Editor, run:

1. `supabase/schema.sql` (main schema)
2. `supabase/migrations/add_admin_notes.sql`
3. `supabase/migrations/create_clue_functions.sql`

### Step 4: Create Environment File

```bash
cp .env.template .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Create Admin User

Option A - Run script:
```bash
npx ts-node --esm scripts/setup-admin.ts
```

Option B - Direct SQL:
```sql
INSERT INTO teams (team_name, username, password_hash, is_admin)
VALUES (
  'Administrator',
  'admin',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  true
);
-- Default password: 123456 (CHANGE THIS!)
```

### Step 6: Run Development Server

```bash
npm run dev
```

Visit:
- http://localhost:3000 (landing page)
- http://localhost:3000/admin-login (admin)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | App URL (for QR code links) |
| `ADMIN_USERNAME` | ❌ | For setup script (default: "admin") |
| `ADMIN_PASSWORD` | ❌ | For setup script (default: "TreasureHunt2024!") |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Important Notes

- Set `NEXT_PUBLIC_APP_URL` to your production URL
- QR codes will contain this URL
- Ensure Supabase allows your production domain in CORS

---

## Known Limitations & Future Improvements

### Current Limitations

1. **No password reset** - Teams can't recover passwords
2. **No public leaderboard** - Only visible to admin
3. **Basic auth** - localStorage-based, no session expiry
4. **No offline mode** - Requires internet connection
5. **Single admin role** - No role-based permissions
6. **No team photo/avatar support**
7. **No GPS validation** - Could add location verification

### Potential Improvements

- [ ] Add public leaderboard page
- [ ] Implement Supabase Auth for proper sessions
- [ ] Add push notifications for event start/end
- [ ] Add hint system (teams can request hints with point penalty)
- [ ] Add photo upload at each scan location
- [ ] GPS validation (verify team is actually at location)
- [ ] Multiple concurrent events support
- [ ] Export results to PDF/Excel
- [ ] Dark/Light theme toggle
- [ ] Accessibility improvements

---

## Quick Reference

### URLs

| Page | URL |
|------|-----|
| Landing | `/` |
| Team Login | `/login` |
| Admin Login | `/admin-login` |
| Hunt (gameplay) | `/hunt` |
| QR Scanner | `/scan` |
| Progress | `/progress` |
| Admin Events | `/admin/events` |
| Admin Clues | `/admin/clues` |
| Admin Teams | `/admin/teams` |
| Admin QR Codes | `/admin/qr-codes` |
| Admin Monitor | `/admin/monitor` |

### Key Files

| Purpose | File |
|---------|------|
| Team login logic | `src/app/api/auth/login/route.ts` |
| QR validation logic | `src/app/api/scan/route.ts` |
| Team generation | `src/app/api/admin/teams/generate/route.ts` |
| Hunt gameplay UI | `src/app/hunt/page.tsx` |
| QR Scanner UI | `src/app/scan/page.tsx` |
| Live monitor UI | `src/app/admin/monitor/page.tsx` |
| Database schema | `supabase/schema.sql` |
| TypeScript types | `src/lib/types.ts` |
| Helper utilities | `src/lib/utils/helpers.ts` |

---

*End of Technical Documentation*

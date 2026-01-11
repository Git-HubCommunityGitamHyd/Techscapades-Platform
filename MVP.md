# Techscapades - Campus Treasure Hunt Platform

## MVP Specification

A real-time campus treasure hunt platform where teams compete by scanning QR codes at various locations to progress through clues and earn points.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui components |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (password-only) |
| **Realtime** | Supabase Realtime subscriptions |
| **Storage** | Supabase Storage (QR images) |
| **Deployment** | Vercel (Frontend), Supabase (Backend) |

---

## Features

### ✅ Included in MVP

- Admin creates and manages events
- Admin bulk-creates team accounts (username + password)
- Linear treasure hunt flow per team
- Unique QR code per clue/location
- Per-team randomized clue order
- QR scan validation (order-enforced)
- Live score & progress tracking (Supabase Realtime)
- Admin dashboard (edit clues, scores, disqualify teams)
- Downloadable QR images
- Admin notes for clue answers (visible only to admins)

### ❌ Intentionally Cut (for MVP)

- Password reset
- GPS/location validation
- Public leaderboard screen
- Multi-admin roles
- Offline mode

---

## Architecture

```
Next.js (App Router) + Tailwind + shadcn/ui
│
├── Participant App (Mobile-first)
│   ├── Login
│   ├── Current Clue View
│   ├── QR Scanner
│   └── Progress View
│
├── Admin Dashboard
│   ├── Event Management
│   ├── Clue Management
│   ├── Team Management
│   ├── QR Code Generation
│   ├── Live Monitoring
│   └── Analytics
│
└── Supabase Backend
    ├── Auth (password-only)
    ├── Postgres (RLS enforced)
    ├── Realtime (progress updates)
    └── Storage (QR images)
```

---

## Data Model

### `events`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| name | TEXT | Event name |
| start_time | TIMESTAMPTZ | Event start |
| end_time | TIMESTAMPTZ | Event end |
| is_active | BOOLEAN | Whether event is live |
| created_at | TIMESTAMPTZ | Creation timestamp |

### `teams`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| event_id | UUID (FK) | Reference to event |
| team_name | TEXT | Display name |
| username | TEXT | Login username |
| password_hash | TEXT | Hashed password |
| score | INTEGER | Current score |
| is_disqualified | BOOLEAN | DQ status |
| current_step | INTEGER | Current clue index |
| is_admin | BOOLEAN | Admin flag |
| created_at | TIMESTAMPTZ | Creation timestamp |

### `clues`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| event_id | UUID (FK) | Reference to event |
| step_number | INTEGER | Order in sequence |
| clue_text | TEXT | The riddle/clue |
| location_name | TEXT | Optional location hint |
| admin_notes | TEXT | Answer/hints (admin only) |
| created_at | TIMESTAMPTZ | Creation timestamp |

### `qr_codes`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| event_id | UUID (FK) | Reference to event |
| clue_id | UUID (FK) | Reference to clue |
| qr_token | TEXT | Unique scannable token |
| created_at | TIMESTAMPTZ | Creation timestamp |

### `team_clue_order`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| team_id | UUID (FK) | Reference to team |
| clue_id | UUID (FK) | Reference to clue |
| step_index | INTEGER | Team's clue order |

### `scans`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| team_id | UUID (FK) | Reference to team |
| clue_id | UUID (FK) | Reference to clue |
| qr_code_id | UUID (FK) | Reference to QR code |
| scanned_at | TIMESTAMPTZ | Scan timestamp |

---

## Game Flow

### Team Experience

```
1. Login
   └── Team enters username + password
   
2. View Current Clue
   └── See riddle/clue text for current step
   
3. Find Location
   └── Solve clue and go to location
   
4. Scan QR Code
   └── Use camera to scan QR at location
   
5. Validation
   ├── ✓ Correct: Score increases, next clue revealed
   └── ✗ Wrong: Error message, try again
   
6. Repeat until all clues completed
   
7. Victory!
   └── Team sees completion status
```

### QR Scan Validation Logic

1. Team scans QR code
2. Backend fetches `qr_token`
3. Validation checks:
   - Event is active
   - Team is not disqualified
   - Token matches **expected next clue** for this team
4. If valid:
   - Insert scan record
   - Increment score
   - Advance to next step
5. If invalid:
   - Return appropriate error message

**No duplicate scans allowed** (unique constraint on team + clue).

---

## Admin Dashboard Sections

### 1. Events
- Create/edit events
- Set start & end times
- Activate/deactivate events

### 2. Clues
- Add/edit/delete clues
- Reorder clue sequence
- Add admin notes (answers)

### 3. Teams
- Bulk-generate team accounts
- Auto-assign randomized clue order
- View/manage credentials

### 4. QR Codes
- Auto-generate QR for each clue
- Download QR codes
- Print-ready format

### 5. Live Monitor
- Real-time team progress
- Score tracking
- Last scan timestamps
- Adjust scores manually
- Disqualify teams
- End event instantly

---

## Auth Strategy

- **Password-only authentication** via Supabase Auth
- Admin generates credentials:
  - Username: `TEAM_<event>_<number>`
  - Random 8-10 character password
- Credentials exportable as needed
- Teams can log in from multiple devices

### Row Level Security (RLS)
- Teams can read/write **only their own row**
- Admin operations use service role key to bypass RLS

---

## Realtime Updates

### Subscriptions
- `teams` table changes
- `scans` table inserts

### Admin View
- Sees all teams in real-time

### Team View
- Sees only their own progress updates

**Expected latency:** <500ms (suitable for campus WiFi)

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | Team login |
| `/api/auth/admin-login` | POST | Admin login |
| `/api/scan` | POST | QR code validation |
| `/api/admin/events` | GET/POST/PUT/DELETE | Event CRUD |
| `/api/admin/clues` | GET/POST/PUT/DELETE | Clue CRUD |
| `/api/admin/teams` | GET/DELETE | Team management |
| `/api/admin/teams/generate` | POST | Bulk team generation |
| `/api/admin/qr/generate` | POST | QR code generation |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── admin-login/
│   ├── admin/
│   │   ├── events/
│   │   ├── clues/
│   │   ├── teams/
│   │   ├── qr-codes/
│   │   └── monitor/
│   ├── hunt/
│   ├── scan/
│   └── api/
│       ├── auth/
│       ├── scan/
│       └── admin/
├── components/
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── types.ts
│   └── utils/
└── styles/
```

---

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase project and run schema SQL
4. Configure environment variables
5. Run development server: `npm run dev`
6. Access admin at `/admin-login`

---

## License

MIT

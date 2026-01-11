# Techscapades - Site Map

Quick navigation reference for all pages in the application.

**Base URL:** `http://localhost:3000` (dev) or your deployed domain

---

## 🎮 Player Side (Team/Participant)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page |
| `/login` | Team Login | Teams enter username & password to join the hunt |
| `/hunt` | Active Hunt | Shows current clue, main gameplay screen |
| `/scan` | QR Scanner | Camera-based QR code scanning page |
| `/progress` | Progress View | Team's progress, score, and completion status |

### Player Flow
```
/login → /hunt → /scan → /hunt (next clue) → ... → /progress (completion)
```

---

## 🔐 Admin Side (Dashboard)

| Route | Page | Description |
|-------|------|-------------|
| `/admin-login` | Admin Login | Admin authentication page |
| `/admin` | Dashboard Home | Admin dashboard overview/redirect |
| `/admin/events` | Events | Create, edit, and manage hunt events |
| `/admin/clues` | Clues | Add, edit, reorder clues with admin notes |
| `/admin/teams` | Teams | Generate and manage team accounts |
| `/admin/qr-codes` | QR Codes | Generate and download QR codes for clues |
| `/admin/monitor` | Live Monitor | Real-time team progress tracking |

### Admin Navigation (Sidebar Order)
```
📅 Events
🔍 Clues
👥 Teams
📱 QR Codes
📡 Live Monitor
```

---

## 🔗 Quick Links

### Development
- **Player Login:** [localhost:3000/login](http://localhost:3000/login)
- **Admin Login:** [localhost:3000/admin-login](http://localhost:3000/admin-login)
- **Hunt Page:** [localhost:3000/hunt](http://localhost:3000/hunt)
- **Admin Dashboard:** [localhost:3000/admin](http://localhost:3000/admin)

### Common Admin Tasks
| Task | Go To |
|------|-------|
| Create new event | `/admin/events` |
| Add clues to event | `/admin/clues` |
| Generate team accounts | `/admin/teams` |
| Download QR codes | `/admin/qr-codes` |
| Monitor live progress | `/admin/monitor` |

---

## 📱 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Team login |
| `/api/auth/admin-login` | POST | Admin login |
| `/api/scan` | POST | QR code validation |
| `/api/admin/events` | CRUD | Event management |
| `/api/admin/clues` | CRUD | Clue management |
| `/api/admin/teams` | GET/DELETE | Team management |
| `/api/admin/teams/generate` | POST | Bulk team generation |
| `/api/admin/qr/generate` | POST | QR code generation |

---

## 🎨 Page Purposes

### Player Pages

**`/login`**
- Simple username/password form
- Redirects to `/hunt` on success

**`/hunt`**
- Displays current clue text
- Shows step progress (e.g., "Clue 3 of 10")
- "Scan QR" button to proceed

**`/scan`**
- Opens device camera
- Scans QR code
- Validates and advances on success

**`/progress`**
- Shows completion status
- Displays final score
- Shows all clues completed

### Admin Pages

**`/admin/events`**
- Create new treasure hunt events
- Set start/end times
- Activate/deactivate events
- Edit existing events

**`/admin/clues`**
- Add riddles/clues for selected event
- Reorder clues (drag up/down)
- Add location hints
- Add admin notes (answers visible only to admins)

**`/admin/teams`**
- Bulk generate team accounts
- Set team name prefix and count
- View generated credentials
- Delete teams

**`/admin/qr-codes`**
- View all clues for selected event
- Generate QR codes
- Download individual or bulk QR images

**`/admin/monitor`**
- Real-time team leaderboard
- View progress bars per team
- Adjust scores (+/- buttons)
- Disqualify/reinstate teams
- Collapsible clue answer reference
- End event button

---

## 🔒 Access Control

| Page Type | Required Auth |
|-----------|---------------|
| `/login`, `/admin-login` | None (public) |
| `/hunt`, `/scan`, `/progress` | Team login required |
| `/admin/*` | Admin login required |

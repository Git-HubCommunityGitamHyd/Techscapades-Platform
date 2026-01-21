# Techscapades 4.0 🎯

A real-time campus treasure hunt platform built for **EPOCH 4.0** by GitHub Community GITAM. Teams compete by solving clues, scanning QR codes at physical locations, and racing against a global timer.

## ✨ Features

- 🔑 **Individual Player Login** - Each player has their own credentials
- 🎲 **Randomized Clue Order** - Round-robin starting points prevent crowding
- ⏱️ **Global Hunt Timer** - Admin-controlled countdown
- 💡 **Timed Hint System** - Hints become available after delay (costs points)
- 🎭 **Fake QR Codes** - "Hall of Shame" for rickrolled players
- 📊 **Real-time Monitoring** - Live admin dashboard with team progress
- 📱 **Mobile-First Design** - Optimized for phone scanning

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui |
| **QR Scanning** | html5-qrcode |
| **QR Generation** | qrcode (server-side) |
| **Deployment** | Vercel |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/techscapades-platform.git
   cd techscapades-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the schema from `supabase/schema.sql` in the SQL Editor
   - See `supabase/SETUP_GUIDE.md` for detailed instructions

4. **Configure environment variables**
   ```bash
   cp .env.template .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   - Player: [http://localhost:3000/login](http://localhost:3000/login)
   - Admin: [http://localhost:3000/admin-login](http://localhost:3000/admin-login)

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── api/             # API routes
│   ├── hunt/            # Main player hunt interface
│   ├── login/           # Player login
│   ├── scan/            # QR scanner
│   └── progress/        # Player progress view
├── components/ui/       # shadcn/ui components
├── contexts/            # React contexts (Auth)
└── lib/
    ├── supabase/        # Supabase clients
    ├── types.ts         # TypeScript interfaces
    └── utils/           # Helper functions
```

## 🎮 How It Works

### Player Flow
1. Player logs in with their credentials
2. Views their current clue (riddle)
3. Solves the clue and goes to the location
4. Scans the QR code at the location
5. If correct → earns points, gets next clue
6. Repeat until all clues completed or time runs out

### Scoring
- **10 points** - Scan without using hint
- **5 points** - Scan after viewing hint

### Admin Flow
1. Create event with hunt duration and hint delay
2. Add clues with optional hints
3. Generate and print QR codes
4. Start the hunt (triggers timer and randomizes clue order)
5. Monitor progress in real-time
6. Stop hunt when done

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [MVP.md](MVP.md) | Full MVP specification |
| [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) | Technical details |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Development status |
| [PENDING.md](PENDING.md) | Known issues & testing checklist |
| [SITES.md](SITES.md) | Site map & routes |
| [supabase/SETUP_GUIDE.md](supabase/SETUP_GUIDE.md) | Database setup |

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel settings
4. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## 📋 Pre-Event Checklist

- [ ] Create admin user in Supabase
- [ ] Disable RLS or configure proper policies
- [ ] Create event with correct times
- [ ] Add all clues with hints
- [ ] Generate and print QR codes
- [ ] Test complete flow on mobile devices
- [ ] Brief volunteers on admin panel

## 🤝 Contributors

- Initial Development: @harsha
- Bug Fixes & Features (Jan 2026): @SaiGurulnukurthi

## 📄 License

MIT

---

*Built for EPOCH 4.0 by GitHub Community GITAM* 🚀

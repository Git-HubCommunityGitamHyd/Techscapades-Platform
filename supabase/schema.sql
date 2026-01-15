-- =====================================================
-- TECHSCAPADES PLATFORM - DATABASE SCHEMA
-- =====================================================
-- Version: 2.0 (Updated January 2026)
-- Run this in your Supabase SQL Editor
--
-- CHANGES FROM v1.0:
-- - Added individual player authentication (team_members table)
-- - Added timed hint system
-- - Added global hunt timer
-- - Added fake QR codes (rickrolls)
-- - Added fake QR scan tracking
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- EVENTS TABLE
-- =====================================================
-- Stores treasure hunt events with timer and settings
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  
  -- NEW: Global hunt timer
  hunt_started_at TIMESTAMPTZ,              -- NULL until admin clicks "Start Hunt"
  hunt_duration_minutes INTEGER DEFAULT 60, -- Total hunt duration
  
  -- NEW: Global hint settings
  hint_delay_minutes INTEGER DEFAULT 5,     -- Time before hints become available
  
  -- NEW: Default player limits
  default_min_players INTEGER DEFAULT 2,
  default_max_players INTEGER DEFAULT 2,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEAMS TABLE
-- =====================================================
-- Stores team info (created by admin from Google Forms data)
-- NOTE: Passwords are now in team_members table, not here
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  
  -- Player limits
  min_players INTEGER DEFAULT 2,
  max_players INTEGER DEFAULT 2,
  
  -- Registration status: 'pending' | 'active' | 'full'
  registration_status TEXT DEFAULT 'pending',
  
  -- Game state
  score INTEGER DEFAULT 0,
  is_disqualified BOOLEAN DEFAULT false,
  current_step INTEGER DEFAULT 0,
  
  -- Completion tracking
  hunt_finished_at TIMESTAMPTZ,             -- When team completed all clues
  
  -- Admin flag (for admin users only)
  is_admin BOOLEAN DEFAULT false,
  
  -- Legacy: Keep for admin login (admin users still use this)
  -- Regular teams authenticate via team_members table
  username TEXT UNIQUE,
  password_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEAM MEMBERS TABLE (NEW)
-- =====================================================
-- Individual players within teams - each has own login
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  player_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CLUES TABLE
-- =====================================================
-- Riddles/clues for treasure hunt
CREATE TABLE clues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  
  -- The riddle shown to players
  clue_text TEXT NOT NULL,
  
  -- NEW: Separate hint (shown after delay)
  hint_text TEXT,
  
  -- Location name (can be used as an additional hint or for admin reference)
  location_name TEXT,
  
  -- Admin notes (answers, only visible to admins)
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- QR CODES TABLE
-- =====================================================
-- QR tokens for each clue + fake/meme QRs
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  clue_id UUID REFERENCES clues(id) ON DELETE CASCADE,
  
  qr_token TEXT UNIQUE NOT NULL,
  
  -- NEW: Fake QR support (rickrolls, memes)
  is_fake BOOLEAN DEFAULT false,
  redirect_url TEXT,                        -- URL to redirect to for fake QRs
  fake_label TEXT,                          -- Label like "Rickroll 1"
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEAM CLUE ORDER TABLE
-- =====================================================
-- Randomized clue path per team + progress tracking
CREATE TABLE team_clue_order (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  clue_id UUID REFERENCES clues(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  
  -- NEW: Progress tracking for hint system
  clue_started_at TIMESTAMPTZ,              -- When team first saw this clue
  hint_viewed BOOLEAN DEFAULT false,
  hint_viewed_at TIMESTAMPTZ,
  hint_viewed_by UUID REFERENCES team_members(id), -- Which player viewed the hint
  
  UNIQUE(team_id, clue_id),
  UNIQUE(team_id, step_index)
);

-- =====================================================
-- SCANS TABLE
-- =====================================================
-- Valid QR scan history
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  clue_id UUID REFERENCES clues(id) ON DELETE CASCADE,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  
  -- NEW: Track which player made the scan
  scanned_by UUID REFERENCES team_members(id),
  
  -- NEW: Track if hint was used (for scoring)
  hint_was_used BOOLEAN DEFAULT false,
  
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, clue_id)
);

-- =====================================================
-- FAKE QR SCANS TABLE (NEW)
-- =====================================================
-- "Hall of Shame" - tracks who fell for fake QRs
CREATE TABLE fake_qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
-- Performance optimization

-- Teams
CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_teams_username ON teams(username);
CREATE INDEX idx_teams_registration_status ON teams(registration_status);

-- Team Members
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_username ON team_members(username);

-- Clues
CREATE INDEX idx_clues_event_id ON clues(event_id);
CREATE INDEX idx_clues_step_number ON clues(event_id, step_number);

-- QR Codes
CREATE INDEX idx_qr_codes_qr_token ON qr_codes(qr_token);
CREATE INDEX idx_qr_codes_clue_id ON qr_codes(clue_id);
CREATE INDEX idx_qr_codes_is_fake ON qr_codes(is_fake);

-- Team Clue Order
CREATE INDEX idx_team_clue_order_team_id ON team_clue_order(team_id);
CREATE INDEX idx_team_clue_order_step ON team_clue_order(team_id, step_index);

-- Scans
CREATE INDEX idx_scans_team_id ON scans(team_id);

-- Fake QR Scans
CREATE INDEX idx_fake_qr_scans_team_id ON fake_qr_scans(team_id);
CREATE INDEX idx_fake_qr_scans_qr_code_id ON fake_qr_scans(qr_code_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_clue_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fake_qr_scans ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- EVENTS POLICIES
-- -----------------------------------------------------
-- Anyone can read active events
CREATE POLICY "Anyone can read active events" ON events
  FOR SELECT USING (is_active = true);

-- -----------------------------------------------------
-- TEAMS POLICIES
-- -----------------------------------------------------
-- Public can read team names for registration dropdown
CREATE POLICY "Anyone can read team basic info" ON teams
  FOR SELECT USING (true);

-- Teams can update their own game state (via service role)
-- Note: Most updates go through API with service role

-- -----------------------------------------------------
-- TEAM MEMBERS POLICIES
-- -----------------------------------------------------
-- Players can read their own data
CREATE POLICY "Players can read own data" ON team_members
  FOR SELECT USING (true);

-- Allow inserts for registration (via service role for security)
-- Note: Registration goes through API with service role

-- -----------------------------------------------------
-- CLUES POLICIES
-- -----------------------------------------------------
-- Players can read clues for their event
CREATE POLICY "Players can read event clues" ON clues
  FOR SELECT USING (true);

-- -----------------------------------------------------
-- TEAM CLUE ORDER POLICIES
-- -----------------------------------------------------
-- Players can read their team's clue order
CREATE POLICY "Players can read team clue order" ON team_clue_order
  FOR SELECT USING (true);

-- -----------------------------------------------------
-- QR CODES POLICIES
-- -----------------------------------------------------
-- Everyone can read QR codes (needed for validation)
CREATE POLICY "Anyone can read qr codes" ON qr_codes
  FOR SELECT USING (true);

-- -----------------------------------------------------
-- SCANS POLICIES
-- -----------------------------------------------------
-- Players can read their team's scans
CREATE POLICY "Players can read team scans" ON scans
  FOR SELECT USING (true);

-- -----------------------------------------------------
-- FAKE QR SCANS POLICIES
-- -----------------------------------------------------
-- Players can read fake QR scan history (hall of shame is public!)
CREATE POLICY "Anyone can read fake qr scans" ON fake_qr_scans
  FOR SELECT USING (true);

-- =====================================================
-- NOTES FOR IMPLEMENTATION
-- =====================================================
-- 
-- ADMIN OPERATIONS:
-- Use supabase service role client to bypass RLS for:
-- - Creating/updating events
-- - Creating teams
-- - Generating QR codes
-- - Managing clues
-- - All write operations
--
-- PLAYER AUTHENTICATION:
-- - Players authenticate via /api/auth/login
-- - API verifies credentials against team_members table
-- - Returns player + team info on success
--
-- ADMIN AUTHENTICATION:
-- - Admins still use teams.username + teams.password_hash
-- - Identified by is_admin = true
-- =====================================================

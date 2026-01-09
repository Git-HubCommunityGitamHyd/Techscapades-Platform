-- Supabase Schema for Campus Treasure Hunt Platform
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  is_disqualified BOOLEAN DEFAULT false,
  current_step INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clues table
CREATE TABLE clues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  clue_text TEXT NOT NULL,
  location_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Codes table
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  clue_id UUID REFERENCES clues(id) ON DELETE CASCADE,
  qr_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Clue Order (randomized path per team)
CREATE TABLE team_clue_order (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  clue_id UUID REFERENCES clues(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  UNIQUE(team_id, clue_id),
  UNIQUE(team_id, step_index)
);

-- Scans table (scan history)
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  clue_id UUID REFERENCES clues(id) ON DELETE CASCADE,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, clue_id)
);

-- Indexes for performance
CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_teams_username ON teams(username);
CREATE INDEX idx_clues_event_id ON clues(event_id);
CREATE INDEX idx_qr_codes_qr_token ON qr_codes(qr_token);
CREATE INDEX idx_team_clue_order_team_id ON team_clue_order(team_id);
CREATE INDEX idx_scans_team_id ON scans(team_id);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_clue_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Events: Anyone can read active events
CREATE POLICY "Anyone can read active events" ON events
  FOR SELECT USING (is_active = true);

-- Teams: Teams can only read/update their own row
CREATE POLICY "Teams can read own data" ON teams
  FOR SELECT USING (auth.uid()::text = id::text OR is_admin = true);

CREATE POLICY "Teams can update own data" ON teams
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Clues: Teams can read clues for their event
CREATE POLICY "Teams can read event clues" ON clues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.event_id = clues.event_id 
      AND teams.id::text = auth.uid()::text
    )
  );

-- Team Clue Order: Teams can only read their own order
CREATE POLICY "Teams can read own clue order" ON team_clue_order
  FOR SELECT USING (team_id::text = auth.uid()::text);

-- Scans: Teams can read/insert their own scans
CREATE POLICY "Teams can read own scans" ON scans
  FOR SELECT USING (team_id::text = auth.uid()::text);

CREATE POLICY "Teams can insert own scans" ON scans
  FOR INSERT WITH CHECK (team_id::text = auth.uid()::text);

-- QR Codes: Teams can read QR codes (for validation)
CREATE POLICY "Teams can read qr codes" ON qr_codes
  FOR SELECT USING (true);

-- Admin policies (use service role key to bypass RLS)
-- Admins should use supabase service role client

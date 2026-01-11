// Database types for Supabase tables

export interface Event {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  team_name: string;
  username: string;
  password_hash: string;
  score: number;
  is_disqualified: boolean;
  current_step: number;
  is_admin: boolean;
  created_at: string;
}

export interface Clue {
  id: string;
  event_id: string;
  step_number: number;
  clue_text: string;
  location_name: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface QRCode {
  id: string;
  event_id: string;
  clue_id: string;
  qr_token: string;
  created_at: string;
}

export interface TeamClueOrder {
  id: string;
  team_id: string;
  clue_id: string;
  step_index: number;
}

export interface Scan {
  id: string;
  team_id: string;
  clue_id: string;
  qr_code_id: string;
  scanned_at: string;
}

// API Response types
export interface ScanResponse {
  success: boolean;
  message: string;
  newScore?: number;
  nextStep?: number;
  isComplete?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  team?: Team;
}

// Form types
export interface CreateEventForm {
  name: string;
  start_time: string;
  end_time: string;
}

export interface CreateClueForm {
  clue_text: string;
  location_name?: string;
  admin_notes?: string;
}

export interface CreateTeamForm {
  team_name: string;
}

// Admin types
export interface TeamWithProgress extends Team {
  last_scan_time?: string;
  clue_name?: string;
}

export interface GenerateTeamsRequest {
  event_id: string;
  count: number;
  prefix?: string;
}

export interface GeneratedTeamCredential {
  team_name: string;
  username: string;
  password: string;
}

// Database types for Supabase client
export type Database = {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at'>;
        Update: Partial<Omit<Event, 'id' | 'created_at'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at'>;
        Update: Partial<Omit<Team, 'id' | 'created_at'>>;
      };
      clues: {
        Row: Clue;
        Insert: Omit<Clue, 'id' | 'created_at'>;
        Update: Partial<Omit<Clue, 'id' | 'created_at'>>;
      };
      qr_codes: {
        Row: QRCode;
        Insert: Omit<QRCode, 'id' | 'created_at'>;
        Update: Partial<Omit<QRCode, 'id' | 'created_at'>>;
      };
      team_clue_order: {
        Row: TeamClueOrder;
        Insert: Omit<TeamClueOrder, 'id'>;
        Update: Partial<Omit<TeamClueOrder, 'id'>>;
      };
      scans: {
        Row: Scan;
        Insert: Omit<Scan, 'id' | 'scanned_at'>;
        Update: Partial<Omit<Scan, 'id' | 'scanned_at'>>;
      };
    };
  };
};

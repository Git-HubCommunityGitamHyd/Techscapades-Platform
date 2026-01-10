-- Migration to add admin_notes column to clues table
-- Run this in your Supabase SQL Editor

ALTER TABLE clues ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clues';

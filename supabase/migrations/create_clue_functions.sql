-- SQL Functions to bypass PostgREST schema cache issue
-- Run this in your Supabase SQL Editor

-- Function to insert a clue with admin_notes
CREATE OR REPLACE FUNCTION insert_clue(
    p_event_id UUID,
    p_step_number INTEGER,
    p_clue_text TEXT,
    p_location_name TEXT DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_clue clues%ROWTYPE;
BEGIN
    INSERT INTO clues (event_id, step_number, clue_text, location_name, admin_notes)
    VALUES (p_event_id, p_step_number, p_clue_text, p_location_name, p_admin_notes)
    RETURNING * INTO new_clue;
    
    RETURN row_to_json(new_clue);
END;
$$;

-- Function to update admin_notes for a clue
CREATE OR REPLACE FUNCTION update_clue_admin_notes(
    p_clue_id UUID,
    p_admin_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE clues 
    SET admin_notes = p_admin_notes
    WHERE id = p_clue_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION insert_clue TO authenticated;
GRANT EXECUTE ON FUNCTION insert_clue TO anon;
GRANT EXECUTE ON FUNCTION insert_clue TO service_role;

GRANT EXECUTE ON FUNCTION update_clue_admin_notes TO authenticated;
GRANT EXECUTE ON FUNCTION update_clue_admin_notes TO anon;
GRANT EXECUTE ON FUNCTION update_clue_admin_notes TO service_role;

-- Also try to reload the schema cache
NOTIFY pgrst, 'reload schema';

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET - Fetch all clues for an event
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("event_id");

        const supabase = createAdminClient();

        let query = supabase.from("clues").select("*").order("step_number", { ascending: true });

        if (eventId) {
            query = query.eq("event_id", eventId);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Clues fetch error:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch clues" }, { status: 500 });
    }
}

// POST - Create new clue (using raw SQL to bypass schema cache issue)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event_id, step_number, clue_text, location_name, admin_notes } = body;

        if (!event_id || !clue_text) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Use raw SQL to bypass schema cache issue
        const { data, error } = await supabase.rpc('insert_clue', {
            p_event_id: event_id,
            p_step_number: step_number,
            p_clue_text: clue_text,
            p_location_name: location_name || null,
            p_admin_notes: admin_notes || null,
        });

        if (error) {
            console.error("Clue insert error:", error);

            // Fallback: try inserting without admin_notes if RPC doesn't exist
            if (error.code === 'PGRST202') {
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from("clues")
                    .insert({
                        event_id,
                        step_number,
                        clue_text,
                        location_name: location_name || null,
                    })
                    .select()
                    .single();

                if (fallbackError) {
                    return NextResponse.json({ success: false, message: fallbackError.message }, { status: 500 });
                }

                // Update admin_notes separately using raw SQL
                if (admin_notes && fallbackData) {
                    try {
                        await supabase.rpc('update_clue_admin_notes', {
                            p_clue_id: fallbackData.id,
                            p_admin_notes: admin_notes
                        });
                    } catch {
                        // Ignore if RPC doesn't exist yet
                    }
                }

                return NextResponse.json({ success: true, data: { ...fallbackData, admin_notes } });
            }

            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Clue creation error:", error);
        return NextResponse.json({ success: false, message: "Failed to create clue" }, { status: 500 });
    }
}

// PUT - Update clue
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Clue ID required" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { error } = await supabase
            .from("clues")
            .update(updates)
            .eq("id", id);

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Clue update error:", error);
        return NextResponse.json({ success: false, message: "Failed to update clue" }, { status: 500 });
    }
}

// DELETE - Delete clue
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Clue ID required" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { error } = await supabase.from("clues").delete().eq("id", id);

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Clue delete error:", error);
        return NextResponse.json({ success: false, message: "Failed to delete clue" }, { status: 500 });
    }
}

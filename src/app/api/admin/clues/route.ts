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

// POST - Create new clue
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event_id, step_number, clue_text, location_name, hint_text, admin_notes } = body;

        if (!event_id || !clue_text) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Direct insert - simpler and doesn't require RPC functions
        const { data, error } = await supabase
            .from("clues")
            .insert({
                event_id,
                step_number,
                clue_text,
                location_name: location_name || null,
                hint_text: hint_text || null,
                admin_notes: admin_notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error("Clue insert error:", error);
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

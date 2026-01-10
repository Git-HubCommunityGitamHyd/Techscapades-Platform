import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET - Fetch all teams for an event
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("event_id");

        const supabase = createAdminClient();

        let query = supabase
            .from("teams")
            .select("*")
            .eq("is_admin", false)
            .order("created_at", { ascending: true });

        if (eventId) {
            query = query.eq("event_id", eventId);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Teams fetch error:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch teams" }, { status: 500 });
    }
}

// PUT - Update team (score, disqualify, etc.)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Team ID required" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { error } = await supabase
            .from("teams")
            .update(updates)
            .eq("id", id);

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Team update error:", error);
        return NextResponse.json({ success: false, message: "Failed to update team" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET - Fetch players for a team or event
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get("team_id");
        const eventId = searchParams.get("event_id");

        const supabase = createAdminClient();

        if (teamId) {
            // Fetch players for a specific team
            const { data, error } = await supabase
                .from("team_members")
                .select("*")
                .eq("team_id", teamId)
                .order("created_at", { ascending: true });

            if (error) {
                return NextResponse.json({ success: false, message: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, data });
        } else if (eventId) {
            // Fetch all players for an event (join with teams)
            const { data, error } = await supabase
                .from("team_members")
                .select(`
                    *,
                    teams!inner(event_id, team_name)
                `)
                .eq("teams.event_id", eventId)
                .order("created_at", { ascending: true });

            if (error) {
                return NextResponse.json({ success: false, message: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, data });
        } else {
            return NextResponse.json(
                { success: false, message: "team_id or event_id required" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Players fetch error:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch players" }, { status: 500 });
    }
}

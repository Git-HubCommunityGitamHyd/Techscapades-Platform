import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET - Fetch teams with available slots for registration
export async function GET() {
    try {
        const supabase = createAdminClient();

        // Get all active events
        const { data: events } = await supabase
            .from("events")
            .select("id")
            .eq("is_active", true);

        if (!events || events.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        const eventIds = events.map(e => e.id);

        // Get all non-admin teams for active events
        const { data: teams, error: teamsError } = await supabase
            .from("teams")
            .select("id, team_name, max_players, event_id")
            .eq("is_admin", false)
            .in("event_id", eventIds);

        if (teamsError) {
            return NextResponse.json({ success: false, message: teamsError.message }, { status: 500 });
        }

        if (!teams || teams.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Get member counts for each team
        const teamsWithCounts = await Promise.all(
            teams.map(async (team) => {
                const { count } = await supabase
                    .from("team_members")
                    .select("*", { count: "exact", head: true })
                    .eq("team_id", team.id);

                return {
                    id: team.id,
                    team_name: team.team_name,
                    current_members: count || 0,
                    max_players: team.max_players || 2,
                };
            })
        );

        // Filter to only teams with available slots
        const availableTeams = teamsWithCounts.filter(
            t => t.current_members < t.max_players
        );

        return NextResponse.json({ success: true, data: availableTeams });
    } catch (error) {
        console.error("Available teams fetch error:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch teams" }, { status: 500 });
    }
}

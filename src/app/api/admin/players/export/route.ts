import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET - Export players as CSV
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const event_id = searchParams.get("event_id");

        if (!event_id) {
            return NextResponse.json(
                { success: false, message: "Event ID is required" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get all players for the event with their team info
        const { data: players, error } = await supabase
            .from("team_members")
            .select(`
                id,
                player_name,
                username,
                created_at,
                team:teams(id, team_name, event_id)
            `)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 500 }
            );
        }

        // Filter to only players in teams for this event
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredPlayers = (players || []).filter((p: any) => {
            const team = Array.isArray(p.team) ? p.team[0] : p.team;
            return team?.event_id === event_id;
        });

        // Generate CSV content
        const csvHeaders = ["Team Name", "Player Name", "Username", "Registered At"];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const csvRows = filteredPlayers.map((p: any) => {
            const team = Array.isArray(p.team) ? p.team[0] : p.team;
            return [
                team?.team_name || "Unknown",
                p.player_name,
                p.username,
                new Date(p.created_at).toLocaleString(),
            ];
        });

        const csv = [csvHeaders, ...csvRows]
            .map(row => row.map((cell: string) => `"${cell}"`).join(","))
            .join("\n");

        // Return as downloadable CSV
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="players_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Export players error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to export players" },
            { status: 500 }
        );
    }
}

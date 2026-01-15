import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// PUT - Move a player to a different team
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { new_team_id } = body;

        if (!id || !new_team_id) {
            return NextResponse.json(
                { success: false, message: "Player ID and new team ID required" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get the target team to check capacity
        const { data: targetTeam, error: teamError } = await supabase
            .from("teams")
            .select("id, max_players")
            .eq("id", new_team_id)
            .single();

        if (teamError || !targetTeam) {
            return NextResponse.json(
                { success: false, message: "Target team not found" },
                { status: 404 }
            );
        }

        // Count current members in target team
        const { count: currentMembers } = await supabase
            .from("team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", new_team_id);

        const maxPlayers = targetTeam.max_players || 2;
        if ((currentMembers || 0) >= maxPlayers) {
            return NextResponse.json(
                { success: false, message: "Target team is full" },
                { status: 400 }
            );
        }

        // Move the player
        const { error } = await supabase
            .from("team_members")
            .update({ team_id: new_team_id })
            .eq("id", id);

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Player move error:", error);
        return NextResponse.json({ success: false, message: "Failed to move player" }, { status: 500 });
    }
}

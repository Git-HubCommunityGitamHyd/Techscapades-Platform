import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/utils/helpers";

// POST - Reset a player's password (admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { player_id, new_password } = body;

        if (!player_id || !new_password) {
            return NextResponse.json(
                { success: false, message: "Player ID and new password are required" },
                { status: 400 }
            );
        }

        if (new_password.length < 4) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 4 characters" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Verify player exists
        const { data: player, error: playerError } = await supabase
            .from("team_members")
            .select("id, player_name, username")
            .eq("id", player_id)
            .single();

        if (playerError || !player) {
            return NextResponse.json(
                { success: false, message: "Player not found" },
                { status: 404 }
            );
        }

        // Hash the new password
        const password_hash = await hashPassword(new_password);

        // Update the password
        const { error: updateError } = await supabase
            .from("team_members")
            .update({ password_hash })
            .eq("id", player_id);

        if (updateError) {
            return NextResponse.json(
                { success: false, message: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Password reset for ${player.player_name} (@${player.username})`,
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to reset password" },
            { status: 500 }
        );
    }
}

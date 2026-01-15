import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/utils/helpers";

// POST - Register a new player
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { team_id, player_name, username, password } = body;

        // Validation
        if (!team_id || !player_name || !username || !password) {
            return NextResponse.json(
                { success: false, message: "All fields are required" },
                { status: 400 }
            );
        }

        if (password.length < 4) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 4 characters" },
                { status: 400 }
            );
        }

        // Username format validation
        if (!/^[a-z0-9_]+$/.test(username)) {
            return NextResponse.json(
                { success: false, message: "Username can only contain lowercase letters, numbers, and underscores" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Check if username already exists
        const { data: existingUser } = await supabase
            .from("team_members")
            .select("id")
            .eq("username", username)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Username already taken. Please choose another." },
                { status: 400 }
            );
        }

        // Get team info and check capacity
        const { data: team, error: teamError } = await supabase
            .from("teams")
            .select("id, team_name, max_players, event_id")
            .eq("id", team_id)
            .single();

        if (teamError || !team) {
            return NextResponse.json(
                { success: false, message: "Team not found" },
                { status: 404 }
            );
        }

        // Check if team has room
        const { count: currentMembers } = await supabase
            .from("team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team_id);

        const maxPlayers = team.max_players || 2;
        if ((currentMembers || 0) >= maxPlayers) {
            return NextResponse.json(
                { success: false, message: "This team is already full" },
                { status: 400 }
            );
        }

        // Check if event is active
        const { data: event } = await supabase
            .from("events")
            .select("is_active")
            .eq("id", team.event_id)
            .single();

        if (!event?.is_active) {
            return NextResponse.json(
                { success: false, message: "Registration is closed for this event" },
                { status: 400 }
            );
        }

        // Hash password and create player
        const password_hash = await hashPassword(password);

        const { data: newMember, error: insertError } = await supabase
            .from("team_members")
            .insert({
                team_id,
                player_name,
                username,
                password_hash,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Insert error:", insertError);
            return NextResponse.json(
                { success: false, message: "Failed to register. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Registration successful!",
            data: {
                id: newMember.id,
                player_name: newMember.player_name,
                username: newMember.username,
                team_name: team.team_name,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { success: false, message: "Registration failed. Please try again." },
            { status: 500 }
        );
    }
}

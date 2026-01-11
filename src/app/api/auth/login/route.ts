import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/utils/helpers";

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: "Username and password required" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Find team by username
        const { data: team, error } = await supabase
            .from("teams")
            .select("*")
            .eq("username", username)
            .eq("is_admin", false)
            .single();

        if (error || !team) {
            return NextResponse.json(
                { success: false, message: "Invalid username or password" },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, team.password_hash);
        if (!isValid) {
            return NextResponse.json(
                { success: false, message: "Invalid username or password" },
                { status: 401 }
            );
        }

        // Check if team is disqualified
        if (team.is_disqualified) {
            return NextResponse.json(
                { success: false, message: "Your team has been disqualified" },
                { status: 403 }
            );
        }

        // Check if the event is active
        const { data: event, error: eventError } = await supabase
            .from("events")
            .select("is_active, name")
            .eq("id", team.event_id)
            .single();

        if (eventError || !event) {
            return NextResponse.json(
                { success: false, message: "Event not found" },
                { status: 404 }
            );
        }

        if (!event.is_active) {
            return NextResponse.json(
                { success: false, message: `The event "${event.name}" is not currently active` },
                { status: 403 }
            );
        }

        // Return team data (without password hash)
        const { password_hash: _, ...safeTeam } = team;

        return NextResponse.json({
            success: true,
            message: "Login successful",
            team: safeTeam,
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 }
        );
    }
}

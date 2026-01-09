import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generatePassword, generateUsername, hashPassword, shuffleArray } from "@/lib/utils/helpers";
import type { GeneratedTeamCredential } from "@/lib/types";

interface ClueOrderInsert {
    team_id: string;
    clue_id: string;
    step_index: number;
}

interface TeamInsert {
    id: string;
    event_id: string;
    team_name: string;
    username: string;
    password_hash: string;
    score: number;
    is_disqualified: boolean;
    current_step: number;
    is_admin: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const { event_id, count, prefix } = await request.json();

        if (!event_id || !count) {
            return NextResponse.json(
                { success: false, message: "Event ID and count are required" },
                { status: 400 }
            );
        }

        if (count < 1 || count > 100) {
            return NextResponse.json(
                { success: false, message: "Count must be between 1 and 100" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Verify event exists
        const { data: event, error: eventError } = await supabase
            .from("events")
            .select("*")
            .eq("id", event_id)
            .single();

        if (eventError || !event) {
            return NextResponse.json(
                { success: false, message: "Event not found" },
                { status: 404 }
            );
        }

        // Get all clues for the event
        const { data: clues } = await supabase
            .from("clues")
            .select("id")
            .eq("event_id", event_id)
            .order("step_number");

        if (!clues || clues.length === 0) {
            return NextResponse.json(
                { success: false, message: "No clues found for this event. Add clues first." },
                { status: 400 }
            );
        }

        // Get existing team count for numbering
        const { count: existingCount } = await supabase
            .from("teams")
            .select("id", { count: "exact" })
            .eq("event_id", event_id)
            .eq("is_admin", false);

        const startNumber = (existingCount || 0) + 1;
        const eventName = (event as { name: string }).name;
        const eventPrefix = prefix || eventName.substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, "");

        const credentials: GeneratedTeamCredential[] = [];
        const teamsToInsert: TeamInsert[] = [];
        const clueOrdersToInsert: ClueOrderInsert[] = [];

        for (let i = 0; i < count; i++) {
            const teamNumber = startNumber + i;
            const username = generateUsername(eventPrefix, teamNumber);
            const password = generatePassword(10);
            const passwordHash = await hashPassword(password);

            const teamId = crypto.randomUUID();

            teamsToInsert.push({
                id: teamId,
                event_id,
                team_name: `Team ${teamNumber}`,
                username,
                password_hash: passwordHash,
                score: 0,
                is_disqualified: false,
                current_step: 0,
                is_admin: false,
            });

            credentials.push({
                team_name: `Team ${teamNumber}`,
                username,
                password,
            });

            // Create randomized clue order for this team
            const clueIds = clues.map((c: { id: string }) => c.id);
            const shuffledClues = shuffleArray(clueIds);
            shuffledClues.forEach((clueId: string, index: number) => {
                clueOrdersToInsert.push({
                    team_id: teamId,
                    clue_id: clueId,
                    step_index: index,
                });
            });
        }

        // Insert teams
        const { error: teamInsertError } = await supabase
            .from("teams")
            .insert(teamsToInsert);

        if (teamInsertError) {
            console.error("Team insert error:", teamInsertError);
            return NextResponse.json(
                { success: false, message: "Failed to create teams" },
                { status: 500 }
            );
        }

        // Insert clue orders
        const { error: clueOrderError } = await supabase
            .from("team_clue_order")
            .insert(clueOrdersToInsert);

        if (clueOrderError) {
            console.error("Clue order insert error:", clueOrderError);
            return NextResponse.json(
                { success: false, message: "Failed to assign clue orders" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Successfully created ${count} teams`,
            credentials,
        });
    } catch (error) {
        console.error("Team generation error:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 }
        );
    }
}

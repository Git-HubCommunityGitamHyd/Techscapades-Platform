import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { token, team_id } = await request.json();

        if (!token || !team_id) {
            return NextResponse.json(
                { success: false, message: "Missing token or team_id" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get team data
        const { data: team, error: teamError } = await supabase
            .from("teams")
            .select("*")
            .eq("id", team_id)
            .single();

        if (teamError || !team) {
            return NextResponse.json(
                { success: false, message: "Team not found" },
                { status: 404 }
            );
        }

        // Check if team is disqualified
        if (team.is_disqualified) {
            return NextResponse.json(
                { success: false, message: "Your team has been disqualified" },
                { status: 403 }
            );
        }

        // Get event status
        const { data: event } = await supabase
            .from("events")
            .select("*")
            .eq("id", team.event_id)
            .single();

        if (!event) {
            return NextResponse.json(
                { success: false, message: "Event not found" },
                { status: 404 }
            );
        }

        // Check if event is active
        if (!event.is_active) {
            return NextResponse.json(
                { success: false, message: "This event is not currently active" },
                { status: 403 }
            );
        }

        // Check time constraints
        const now = new Date();
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);

        if (now < startTime) {
            return NextResponse.json(
                { success: false, message: "The hunt hasn't started yet" },
                { status: 403 }
            );
        }

        if (now > endTime) {
            return NextResponse.json(
                { success: false, message: "The hunt has ended" },
                { status: 403 }
            );
        }

        // Get QR code by token
        const { data: qrCode, error: qrError } = await supabase
            .from("qr_codes")
            .select("*, clue:clues(*)")
            .eq("qr_token", token)
            .eq("event_id", team.event_id)
            .single();

        if (qrError || !qrCode) {
            return NextResponse.json(
                { success: false, message: "Invalid QR code" },
                { status: 400 }
            );
        }

        // Get the team's expected next clue
        const { data: expectedClueOrder } = await supabase
            .from("team_clue_order")
            .select("clue_id")
            .eq("team_id", team_id)
            .eq("step_index", team.current_step)
            .single();

        if (!expectedClueOrder) {
            return NextResponse.json(
                { success: false, message: "No more clues to scan - hunt complete!" },
                { status: 400 }
            );
        }

        // Verify this is the expected clue
        if (qrCode.clue_id !== expectedClueOrder.clue_id) {
            return NextResponse.json(
                { success: false, message: "Wrong QR code! This is not your next clue." },
                { status: 400 }
            );
        }

        // Check for duplicate scan (shouldn't happen due to unique constraint, but double-check)
        const { data: existingScan } = await supabase
            .from("scans")
            .select("id")
            .eq("team_id", team_id)
            .eq("clue_id", qrCode.clue_id)
            .single();

        if (existingScan) {
            return NextResponse.json(
                { success: false, message: "You've already scanned this clue" },
                { status: 400 }
            );
        }

        // Create scan record
        const { error: scanError } = await supabase
            .from("scans")
            .insert({
                team_id,
                clue_id: qrCode.clue_id,
                qr_code_id: qrCode.id,
            });

        if (scanError) {
            console.error("Scan insert error:", scanError);
            return NextResponse.json(
                { success: false, message: "Failed to record scan" },
                { status: 500 }
            );
        }

        // Update team score and step
        const newScore = team.score + 10; // 10 points per clue
        const newStep = team.current_step + 1;

        const { error: updateError } = await supabase
            .from("teams")
            .update({ score: newScore, current_step: newStep })
            .eq("id", team_id);

        if (updateError) {
            console.error("Team update error:", updateError);
            return NextResponse.json(
                { success: false, message: "Failed to update progress" },
                { status: 500 }
            );
        }

        // Get total clues to check if hunt is complete
        const { count: totalClues } = await supabase
            .from("clues")
            .select("id", { count: "exact" })
            .eq("event_id", team.event_id);

        const isComplete = newStep >= (totalClues || 0);

        return NextResponse.json({
            success: true,
            message: isComplete ? "🎉 Congratulations! You've completed the hunt!" : "Correct! Move on to the next clue.",
            newScore,
            nextStep: newStep,
            isComplete,
        });
    } catch (error) {
        console.error("Scan error:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 }
        );
    }
}

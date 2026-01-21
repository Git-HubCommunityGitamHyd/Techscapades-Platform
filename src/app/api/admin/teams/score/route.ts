import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST - Adjust team score
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { team_id, adjustment } = body;

        console.log("Score adjustment request:", { team_id, adjustment });

        if (!team_id || adjustment === undefined) {
            console.log("Missing required fields");
            return NextResponse.json(
                { success: false, message: "Team ID and adjustment are required" },
                { status: 400 }
            );
        }

        // Ensure adjustment is a multiple of 5
        if (adjustment % 5 !== 0) {
            console.log("Adjustment not multiple of 5:", adjustment);
            return NextResponse.json(
                { success: false, message: "Adjustment must be a multiple of 5" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get current team score
        const { data: team, error: fetchError } = await supabase
            .from("teams")
            .select("score")
            .eq("id", team_id)
            .single();

        console.log("Fetch team result:", { team, fetchError });

        if (fetchError || !team) {
            console.log("Team not found:", fetchError);
            return NextResponse.json(
                { success: false, message: "Team not found" },
                { status: 404 }
            );
        }

        // Calculate new score (minimum 0)
        const newScore = Math.max(0, team.score + adjustment);
        console.log("Updating score:", { oldScore: team.score, adjustment, newScore });

        // Update team score
        const { data: updateData, error: updateError } = await supabase
            .from("teams")
            .update({ score: newScore })
            .eq("id", team_id)
            .select();

        console.log("Update result:", { updateData, updateError });

        if (updateError) {
            console.error("Score update error:", updateError);
            return NextResponse.json(
                { success: false, message: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Score adjusted by ${adjustment}`,
            new_score: newScore,
        });
    } catch (error) {
        console.error("Adjust score error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to adjust score" },
            { status: 500 }
        );
    }
}

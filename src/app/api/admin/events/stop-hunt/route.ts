import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST - Stop the hunt for an event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event_id } = body;

        if (!event_id) {
            return NextResponse.json(
                { success: false, message: "Event ID is required" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Clear hunt_started_at to stop the hunt
        const { error: updateError } = await supabase
            .from("events")
            .update({ hunt_started_at: null })
            .eq("id", event_id);

        if (updateError) {
            return NextResponse.json(
                { success: false, message: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Hunt stopped successfully!",
        });
    } catch (error) {
        console.error("Stop hunt error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to stop hunt" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST - Start the hunt for an event
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

        // Get the event
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

        if (!event.is_active) {
            return NextResponse.json(
                { success: false, message: "Event must be active to start the hunt" },
                { status: 400 }
            );
        }

        // Set hunt_started_at to now
        const { error: updateError } = await supabase
            .from("events")
            .update({ hunt_started_at: new Date().toISOString() })
            .eq("id", event_id);

        if (updateError) {
            return NextResponse.json(
                { success: false, message: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Hunt started successfully!",
        });
    } catch (error) {
        console.error("Start hunt error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to start hunt" },
            { status: 500 }
        );
    }
}

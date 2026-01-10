import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET - Fetch all events
export async function GET() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Events fetch error:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch events" }, { status: 500 });
    }
}

// POST - Create new event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, start_time, end_time } = body;

        if (!name || !start_time || !end_time) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("events")
            .insert({
                name,
                start_time: new Date(start_time).toISOString(),
                end_time: new Date(end_time).toISOString(),
                is_active: false,
            })
            .select()
            .single();

        if (error) {
            console.error("Event insert error:", error);
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Event creation error:", error);
        return NextResponse.json({ success: false, message: "Failed to create event" }, { status: 500 });
    }
}

// PUT - Update event
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Event ID required" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // If activating, deactivate all other events first
        if (updates.is_active === true) {
            await supabase.from("events").update({ is_active: false }).neq("id", id);
        }

        const { error } = await supabase
            .from("events")
            .update(updates)
            .eq("id", id);

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Event update error:", error);
        return NextResponse.json({ success: false, message: "Failed to update event" }, { status: 500 });
    }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Event ID required" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { error } = await supabase.from("events").delete().eq("id", id);

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Event delete error:", error);
        return NextResponse.json({ success: false, message: "Failed to delete event" }, { status: 500 });
    }
}

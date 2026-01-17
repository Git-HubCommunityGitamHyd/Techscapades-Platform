import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET - Fetch fake QR codes for an event
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const event_id = searchParams.get("event_id");

        if (!event_id) {
            return NextResponse.json({ success: false, message: "Event ID required" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("qr_codes")
            .select("*")
            .eq("event_id", event_id)
            .eq("is_fake", true)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Fetch fake QRs error:", error);
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error("Fetch fake QRs error:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch fake QR codes" }, { status: 500 });
    }
}

// POST - Create a fake QR code
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event_id, label, redirect_url } = body;

        if (!event_id || !label || !redirect_url) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();
        const qrToken = `FAKE_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const { data, error } = await supabase
            .from("qr_codes")
            .insert({
                event_id,
                clue_id: null,
                qr_token: qrToken,
                is_fake: true,
                redirect_url,
                fake_label: label,
            })
            .select()
            .single();

        if (error) {
            console.error("Create fake QR error:", error);
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Create fake QR error:", error);
        return NextResponse.json({ success: false, message: "Failed to create fake QR code" }, { status: 500 });
    }
}

// DELETE - Delete a fake QR code
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "QR code ID required" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { error } = await supabase
            .from("qr_codes")
            .delete()
            .eq("id", id)
            .eq("is_fake", true); // Extra safety check

        if (error) {
            console.error("Delete fake QR error:", error);
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete fake QR error:", error);
        return NextResponse.json({ success: false, message: "Failed to delete fake QR code" }, { status: 500 });
    }
}

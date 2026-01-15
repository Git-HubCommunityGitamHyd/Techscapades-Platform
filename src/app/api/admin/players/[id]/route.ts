import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// DELETE - Remove a player from their team
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ success: false, message: "Player ID required" }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from("team_members")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Player delete error:", error);
        return NextResponse.json({ success: false, message: "Failed to delete player" }, { status: 500 });
    }
}

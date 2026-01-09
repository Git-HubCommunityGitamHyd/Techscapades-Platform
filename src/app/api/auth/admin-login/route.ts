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

        // Find admin user
        const { data: admin, error } = await supabase
            .from("teams")
            .select("*")
            .eq("username", username)
            .eq("is_admin", true)
            .single();

        console.log("Admin query result:", { admin, error });

        if (error || !admin) {
            console.log("Admin not found or error:", error);
            return NextResponse.json(
                { success: false, message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Verify password
        const adminData = admin as { password_hash: string;[key: string]: unknown };
        console.log("Stored hash:", adminData.password_hash);
        const isValid = await verifyPassword(password, adminData.password_hash);
        console.log("Password valid:", isValid);

        if (!isValid) {
            return NextResponse.json(
                { success: false, message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Return admin data (without password hash)
        const { password_hash: _, ...safeAdmin } = admin;

        return NextResponse.json({
            success: true,
            message: "Admin login successful",
            admin: safeAdmin,
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 }
        );
    }
}

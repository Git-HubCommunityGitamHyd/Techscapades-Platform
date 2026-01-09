// Script to set up an admin user in the database
// Run this with: npx ts-node --esm scripts/setup-admin.ts

import { createClient } from "@supabase/supabase-js";

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function setupAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing environment variables. Make sure .env.local is configured.");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Default admin credentials - CHANGE THESE!
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "TreasureHunt2024!";

    const passwordHash = await hashPassword(adminPassword);

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
        .from("teams")
        .select("id")
        .eq("username", adminUsername)
        .eq("is_admin", true)
        .single();

    if (existingAdmin) {
        console.log("Admin user already exists. Updating password...");
        await supabase
            .from("teams")
            .update({ password_hash: passwordHash })
            .eq("id", existingAdmin.id);
    } else {
        console.log("Creating admin user...");
        const { error } = await supabase.from("teams").insert({
            event_id: null,
            team_name: "Administrator",
            username: adminUsername,
            password_hash: passwordHash,
            score: 0,
            is_disqualified: false,
            current_step: 0,
            is_admin: true,
        });

        if (error) {
            console.error("Failed to create admin:", error);
            process.exit(1);
        }
    }

    console.log("\n✅ Admin setup complete!");
    console.log("   Username:", adminUsername);
    console.log("   Password:", adminPassword);
    console.log("\n⚠️  Please change the default password after first login!");
}

setupAdmin().catch(console.error);

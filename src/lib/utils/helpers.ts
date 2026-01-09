import { v4 as uuidv4 } from "uuid";

// Generate a random password
export function generatePassword(length: number = 8): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Generate a unique QR token
export function generateQRToken(): string {
    return `QR_${uuidv4().replace(/-/g, "").substring(0, 16).toUpperCase()}`;
}

// Generate team username
export function generateUsername(eventPrefix: string, teamNumber: number): string {
    return `TEAM_${eventPrefix}_${String(teamNumber).padStart(3, "0")}`;
}

// Shuffle array (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Format date for display
export function formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

// Calculate time remaining
export function getTimeRemaining(endTime: string): {
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
} {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isExpired: false };
}

// Simple hash for passwords (in production, use bcrypt on server)
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

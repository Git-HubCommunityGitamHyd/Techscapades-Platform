"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AvailableTeam {
    id: string;
    team_name: string;
    current_members: number;
    max_players: number;
}

export default function RegisterPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<AvailableTeam[]>([]);
    const [selectedTeam, setSelectedTeam] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [fetchingTeams, setFetchingTeams] = useState(true);

    useEffect(() => {
        fetchAvailableTeams();
    }, []);

    const fetchAvailableTeams = async () => {
        try {
            const response = await fetch("/api/teams/available");
            const data = await response.json();
            if (data.success) {
                setTeams(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching teams:", err);
        } finally {
            setFetchingTeams(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!selectedTeam) {
            setError("Please select a team");
            return;
        }
        if (!playerName.trim()) {
            setError("Please enter your name");
            return;
        }
        if (!username.trim()) {
            setError("Please enter a username");
            return;
        }
        if (password.length < 4) {
            setError("Password must be at least 4 characters");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    team_id: selectedTeam,
                    player_name: playerName.trim(),
                    username: username.trim().toLowerCase(),
                    password,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to login with success message
                router.push("/login?registered=true");
            } else {
                setError(data.message || "Registration failed");
            }
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedTeamData = teams.find(t => t.id === selectedTeam);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <Card className="w-full max-w-md bg-zinc-950 border-white/10">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-black"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                        Join Your Team
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Register to participate in Techscapades 4.0
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {fetchingTeams ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400 mb-4">No teams available for registration yet.</p>
                            <p className="text-gray-500 text-sm">Please wait for the organizers to create teams.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="team" className="text-gray-300">Select Your Team</Label>
                                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                        <SelectValue placeholder="Choose your team" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10">
                                        {teams.map((team) => (
                                            <SelectItem
                                                key={team.id}
                                                value={team.id}
                                                className="text-white hover:bg-white/10"
                                                disabled={team.current_members >= team.max_players}
                                            >
                                                {team.team_name} ({team.current_members}/{team.max_players})
                                                {team.current_members >= team.max_players && " - Full"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedTeamData && (
                                    <p className="text-xs text-gray-500">
                                        {selectedTeamData.max_players - selectedTeamData.current_members} spot(s) remaining
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="playerName" className="text-gray-300">Your Name</Label>
                                <Input
                                    id="playerName"
                                    type="text"
                                    placeholder="e.g., Harsha"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    required
                                    className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-500 focus:border-white/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-gray-300">Choose a Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="e.g., harsha_dev"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                    required
                                    className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-500 focus:border-white/30"
                                />
                                <p className="text-xs text-gray-500">Lowercase letters, numbers, and underscores only</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-300">Set Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-500 focus:border-white/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-500 focus:border-white/30"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Registering...
                                    </span>
                                ) : (
                                    "Register & Join Team"
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 flex flex-col items-center gap-2">
                        <Link
                            href="/login"
                            className="text-sm text-gray-500 hover:text-white"
                        >
                            Already registered? Login →
                        </Link>
                        <Link
                            href="/"
                            className="text-sm text-gray-600 hover:text-white"
                        >
                            Back to Home
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

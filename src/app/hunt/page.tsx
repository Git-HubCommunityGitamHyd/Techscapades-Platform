"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Team, Clue } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function HuntPage() {
    const { team, player, isLoading: authLoading, logout } = useAuth();
    const [localTeam, setLocalTeam] = useState<Team | null>(null);
    const [currentClue, setCurrentClue] = useState<Clue | null>(null);
    const [totalClues, setTotalClues] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCurrentClue = useCallback(async (teamData: Team) => {
        try {
            const supabase = createClient();

            const { data: cluesCount } = await supabase
                .from("clues")
                .select("id", { count: "exact" })
                .eq("event_id", teamData.event_id);

            setTotalClues(cluesCount?.length || 0);

            const { data: clueOrder } = await supabase
                .from("team_clue_order")
                .select("clue_id")
                .eq("team_id", teamData.id)
                .eq("step_index", teamData.current_step)
                .single();

            if (clueOrder) {
                const { data: clue } = await supabase
                    .from("clues")
                    .select("*")
                    .eq("id", clueOrder.clue_id)
                    .single();

                setCurrentClue(clue || null);
            }
        } catch (error) {
            console.error("Error fetching clue:", error);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;

        if (!team) {
            setIsLoading(false);
            return;
        }

        setLocalTeam(team);
        fetchCurrentClue(team);
        setIsLoading(false);

        const supabase = createClient();
        const channel = supabase
            .channel("team-updates")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "teams",
                    filter: `id=eq.${team.id}`,
                },
                (payload) => {
                    const updatedTeam = payload.new as Team;
                    setLocalTeam(updatedTeam);
                    localStorage.setItem("team", JSON.stringify(updatedTeam));
                    fetchCurrentClue(updatedTeam);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [authLoading, team, fetchCurrentClue]);

    const handleLogout = () => {
        logout();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!localTeam) return null;

    const isHuntComplete = localTeam.current_step >= totalClues;
    const isDisqualified = localTeam.is_disqualified;

    return (
        <div className="min-h-screen bg-black p-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">{localTeam.team_name}</h1>
                        <p className="text-sm text-gray-400">
                            {player?.player_name && <span className="text-gray-300">{player.player_name}</span>}
                            {player?.player_name && " • "}
                            Score: {localTeam.score} points
                        </p>
                    </div>
                    <Button variant="ghost" onClick={handleLogout} className="text-gray-400 hover:text-white">
                        Logout
                    </Button>
                </div>

                {/* Progress Badge */}
                <div className="flex gap-2">
                    <Badge variant="outline" className="border-white/30 text-gray-300">
                        Step {localTeam.current_step + 1} of {totalClues || "?"}
                    </Badge>
                    {isDisqualified && (
                        <Badge variant="destructive">Disqualified</Badge>
                    )}
                    {isHuntComplete && !isDisqualified && (
                        <Badge className="bg-white/10 text-white border-white/30">
                            Hunt Complete! 🎉
                        </Badge>
                    )}
                </div>

                {/* Main Content */}
                {isDisqualified ? (
                    <Card className="bg-red-500/10 border-red-500/30">
                        <CardContent className="pt-6 text-center">
                            <div className="text-6xl mb-4">🚫</div>
                            <h2 className="text-xl font-bold text-red-400 mb-2">Team Disqualified</h2>
                            <p className="text-gray-400">
                                Your team has been disqualified from this event. Please contact an event organizer for more information.
                            </p>
                        </CardContent>
                    </Card>
                ) : isHuntComplete ? (
                    <Card className="bg-white/5 border-white/20">
                        <CardContent className="pt-6 text-center">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-xl font-bold text-white mb-2">Congratulations!</h2>
                            <p className="text-gray-400 mb-4">
                                You&apos;ve completed the treasure hunt with a score of {localTeam.score} points!
                            </p>
                            <Link href="/progress">
                                <Button className="bg-white hover:bg-gray-200 text-black">
                                    View Your Journey
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : currentClue ? (
                    <>
                        <Card className="bg-zinc-950 border-white/10">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="text-white font-bold">{localTeam.current_step + 1}</span>
                                    </div>
                                    <CardTitle className="text-lg text-white">Current Clue</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                                    {currentClue.clue_text}
                                </p>
                                {currentClue.location_name && (
                                    <p className="mt-4 text-sm text-gray-400">
                                        📍 Hint: {currentClue.location_name}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Link href="/scan" className="block">
                            <Button className="w-full h-16 text-lg bg-white hover:bg-gray-200 text-black font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                Scan QR Code
                            </Button>
                        </Link>
                    </>
                ) : (
                    <Card className="bg-zinc-950 border-white/10">
                        <CardContent className="pt-6 text-center">
                            <div className="text-6xl mb-4">⏳</div>
                            <h2 className="text-xl font-bold text-white mb-2">Waiting for Hunt to Start</h2>
                            <p className="text-gray-400">
                                The event organizer hasn&apos;t set up your clues yet. Please wait for instructions.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="flex justify-center gap-4 pt-4">
                    <Link href="/progress">
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                            View Progress
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

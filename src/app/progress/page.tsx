"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Team, Scan, Clue, Event } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, getTimeRemaining } from "@/lib/utils/helpers";

export default function ProgressPage() {
    const router = useRouter();
    const [team, setTeam] = useState<Team | null>(null);
    const [scans, setScans] = useState<(Scan & { clue?: Clue })[]>([]);
    const [event, setEvent] = useState<Event | null>(null);
    const [totalClues, setTotalClues] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, isExpired: false });
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (teamData: Team) => {
        const supabase = createClient();

        const { data: eventData } = await supabase
            .from("events")
            .select("*")
            .eq("id", teamData.event_id)
            .single();

        if (eventData) {
            setEvent(eventData);
        }

        const { data: clues } = await supabase
            .from("clues")
            .select("*")
            .eq("event_id", teamData.event_id);

        setTotalClues(clues?.length || 0);

        const { data: scanData } = await supabase
            .from("scans")
            .select("*")
            .eq("team_id", teamData.id)
            .order("scanned_at", { ascending: true });

        if (scanData && clues) {
            const scansWithClues = scanData.map((scan) => ({
                ...scan,
                clue: clues.find((c) => c.id === scan.clue_id),
            }));
            setScans(scansWithClues);
        }
    }, []);

    useEffect(() => {
        const storedTeam = localStorage.getItem("team");
        if (!storedTeam) {
            router.push("/login");
            return;
        }

        const teamData = JSON.parse(storedTeam) as Team;
        setTeam(teamData);
        fetchData(teamData);
        setIsLoading(false);

        const supabase = createClient();
        const channel = supabase
            .channel("progress-updates")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "scans",
                    filter: `team_id=eq.${teamData.id}`,
                },
                () => {
                    fetchData(teamData);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router, fetchData]);

    useEffect(() => {
        if (!event) return;

        const interval = setInterval(() => {
            setTimeRemaining(getTimeRemaining(event.end_time));
        }, 1000);

        return () => clearInterval(interval);
    }, [event]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!team) return null;

    const progressPercent = totalClues > 0 ? (team.current_step / totalClues) * 100 : 0;

    return (
        <div className="min-h-screen bg-black p-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/hunt">
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                            ← Back
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold text-white">Your Progress</h1>
                    <div className="w-16" />
                </div>

                {/* Time Remaining */}
                {event && !timeRemaining.isExpired && (
                    <Card className="bg-zinc-950 border-white/10">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-400 mb-2">Time Remaining</p>
                                <div className="flex justify-center gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-mono font-bold text-white">
                                            {String(timeRemaining.hours).padStart(2, "0")}
                                        </div>
                                        <div className="text-xs text-gray-500">Hours</div>
                                    </div>
                                    <div className="text-3xl font-bold text-gray-400">:</div>
                                    <div className="text-center">
                                        <div className="text-3xl font-mono font-bold text-white">
                                            {String(timeRemaining.minutes).padStart(2, "0")}
                                        </div>
                                        <div className="text-xs text-gray-500">Min</div>
                                    </div>
                                    <div className="text-3xl font-bold text-gray-400">:</div>
                                    <div className="text-center">
                                        <div className="text-3xl font-mono font-bold text-white">
                                            {String(timeRemaining.seconds).padStart(2, "0")}
                                        </div>
                                        <div className="text-xs text-gray-500">Sec</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Card */}
                <Card className="bg-zinc-950 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            <span>{team.team_name}</span>
                            <Badge className="bg-white/10 text-white border-white/30">
                                {team.score} pts
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Progress</span>
                                <span className="text-white font-medium">
                                    {team.current_step} / {totalClues} clues
                                </span>
                            </div>
                            <Progress value={progressPercent} className="h-3" />
                        </div>
                    </CardContent>
                </Card>

                {/* Scan History */}
                <Card className="bg-zinc-950 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Scan History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {scans.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">
                                No scans yet. Start your hunt!
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {scans.map((scan, index) => (
                                    <div
                                        key={scan.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-sm">{index + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm truncate">
                                                {scan.clue?.location_name || `Clue ${index + 1}`}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {formatDateTime(scan.scanned_at)}
                                            </p>
                                        </div>
                                        <svg
                                            className="h-5 w-5 text-white flex-shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Event, Team, Scan, Clue } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/helpers";

interface TeamWithScan extends Team {
    lastScan?: Scan;
}

export default function MonitorPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>("");
    const [teams, setTeams] = useState<TeamWithScan[]>([]);
    const [clues, setClues] = useState<Clue[]>([]);
    const [totalClues, setTotalClues] = useState(0);
    const [showClueReference, setShowClueReference] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTeams = useCallback(async () => {
        if (!selectedEvent) return;

        const supabase = createClient();

        // Get teams for the event
        const { data: teamsData } = await supabase
            .from("teams")
            .select("*")
            .eq("event_id", selectedEvent)
            .eq("is_admin", false)
            .order("score", { ascending: false });

        // Get total clues with admin notes
        const { data: cluesData, count } = await supabase
            .from("clues")
            .select("*", { count: "exact" })
            .eq("event_id", selectedEvent)
            .order("step_number", { ascending: true });

        setClues(cluesData || []);
        setTotalClues(count || 0);

        if (teamsData) {
            // Get last scan for each team
            const teamsWithScans: TeamWithScan[] = await Promise.all(
                teamsData.map(async (team) => {
                    const { data: scans } = await supabase
                        .from("scans")
                        .select("*")
                        .eq("team_id", team.id)
                        .order("scanned_at", { ascending: false })
                        .limit(1);

                    return {
                        ...team,
                        lastScan: scans?.[0] || undefined,
                    };
                })
            );

            setTeams(teamsWithScans);
        }
    }, [selectedEvent]);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchTeams();

            // Set up realtime subscriptions
            const supabase = createClient();

            const teamsChannel = supabase
                .channel("monitor-teams")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "teams",
                        filter: `event_id=eq.${selectedEvent}`,
                    },
                    () => {
                        fetchTeams();
                    }
                )
                .subscribe();

            const scansChannel = supabase
                .channel("monitor-scans")
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "scans",
                    },
                    () => {
                        fetchTeams();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(teamsChannel);
                supabase.removeChannel(scansChannel);
            };
        }
    }, [selectedEvent, fetchTeams]);

    const fetchEvents = async () => {
        const supabase = createClient();
        const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
        setEvents(data || []);

        // Select active event by default
        const activeEvent = data?.find((e) => e.is_active);
        if (activeEvent) {
            setSelectedEvent(activeEvent.id);
        } else if (data && data.length > 0) {
            setSelectedEvent(data[0].id);
        }
        setIsLoading(false);
    };

    const toggleDisqualify = async (team: Team) => {
        const supabase = createClient();
        await supabase
            .from("teams")
            .update({ is_disqualified: !team.is_disqualified })
            .eq("id", team.id);
        fetchTeams();
    };

    const adjustScore = async (teamId: string, adjustment: number) => {
        const team = teams.find((t) => t.id === teamId);
        if (!team) return;

        const newScore = Math.max(0, team.score + adjustment);
        const supabase = createClient();
        await supabase.from("teams").update({ score: newScore }).eq("id", teamId);
        fetchTeams();
    };

    const endEvent = async () => {
        if (!confirm("Are you sure you want to end this event? This will deactivate it.")) return;

        const supabase = createClient();
        await supabase.from("events").update({ is_active: false }).eq("id", selectedEvent);
        fetchEvents();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    const activeEvent = events.find((e) => e.id === selectedEvent);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        Live Monitor
                        <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    </h1>
                    <p className="text-gray-400 mt-1">Real-time team progress tracking</p>
                </div>

                {activeEvent?.is_active && (
                    <Button variant="destructive" onClick={endEvent}>
                        End Event
                    </Button>
                )}
            </div>

            {/* Event Selector */}
            <div className="w-64">
                <Label className="text-gray-300">Select Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                        <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                        {events.map((event) => (
                            <SelectItem key={event.id} value={event.id} className="text-white hover:bg-slate-700">
                                {event.name} {event.is_active && "🟢"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-white/10">
                    <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold text-white">{teams.length}</div>
                        <p className="text-sm text-gray-400">Teams</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/10">
                    <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold text-green-400">
                            {teams.filter((t) => t.current_step >= totalClues && totalClues > 0).length}
                        </div>
                        <p className="text-sm text-gray-400">Finished</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/10">
                    <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold text-white">{totalClues}</div>
                        <p className="text-sm text-gray-400">Total Clues</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/10">
                    <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold text-red-400">
                            {teams.filter((t) => t.is_disqualified).length}
                        </div>
                        <p className="text-sm text-gray-400">Disqualified</p>
                    </CardContent>
                </Card>
            </div>

            {/* Clue Answer Reference */}
            <Card className="bg-amber-900/20 border-amber-700/50">
                <CardHeader className="cursor-pointer" onClick={() => setShowClueReference(!showClueReference)}>
                    <CardTitle className="text-amber-400 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            🔑 Clue Answer Reference
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50">
                                {clues.filter(c => c.admin_notes).length} answers
                            </Badge>
                        </span>
                        <span className="text-lg">{showClueReference ? "▼" : "▶"}</span>
                    </CardTitle>
                </CardHeader>
                {showClueReference && (
                    <CardContent className="pt-0">
                        {clues.length === 0 ? (
                            <p className="text-amber-300/60 text-center py-4">No clues configured for this event</p>
                        ) : (
                            <div className="space-y-3">
                                {clues.map((clue) => (
                                    <div
                                        key={clue.id}
                                        className="p-3 rounded-lg bg-black/50 border border-amber-700/30"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Badge className="bg-white/20 text-white border-white/50 shrink-0">
                                                Step {clue.step_number}
                                            </Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-300 text-sm">{clue.clue_text}</p>
                                                {clue.location_name && (
                                                    <p className="text-xs text-white mt-1">📍 {clue.location_name}</p>
                                                )}
                                                {clue.admin_notes ? (
                                                    <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                                                        <p className="text-xs text-amber-400 font-medium">Answer:</p>
                                                        <p className="text-amber-200 font-medium">{clue.admin_notes}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-500 mt-2 italic">No answer configured</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Teams Table */}
            <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Team Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    {teams.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No teams in this event</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-400 border-b border-white/10">
                                        <th className="text-left pb-3">#</th>
                                        <th className="text-left pb-3">Team</th>
                                        <th className="text-left pb-3">Score</th>
                                        <th className="text-left pb-3">Progress</th>
                                        <th className="text-left pb-3">Last Scan</th>
                                        <th className="text-left pb-3">Status</th>
                                        <th className="text-right pb-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((team, index) => (
                                        <tr
                                            key={team.id}
                                            className={`border-b border-white/10 ${team.is_disqualified ? "opacity-50" : ""
                                                }`}
                                        >
                                            <td className="py-3">
                                                <span
                                                    className={`font-bold ${index === 0
                                                        ? "text-yellow-400"
                                                        : index === 1
                                                            ? "text-gray-300"
                                                            : index === 2
                                                                ? "text-orange-400"
                                                                : "text-gray-500"
                                                        }`}
                                                >
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-white font-medium">{team.team_name}</span>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => adjustScore(team.id, -10)}
                                                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="font-bold text-white w-8 text-center">{team.score}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => adjustScore(team.id, 10)}
                                                        className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 bg-slate-700 rounded-full h-2">
                                                        <div
                                                            className="bg-white h-2 rounded-full transition-all"
                                                            style={{
                                                                width: `${totalClues > 0 ? (team.current_step / totalClues) * 100 : 0}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-gray-400 text-xs">
                                                        {team.current_step}/{totalClues}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-gray-400 text-xs">
                                                {team.lastScan ? formatDateTime(team.lastScan.scanned_at) : "-"}
                                            </td>
                                            <td className="py-3">
                                                {team.is_disqualified ? (
                                                    <Badge variant="destructive">DQ</Badge>
                                                ) : team.current_step >= totalClues && totalClues > 0 ? (
                                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                                        🏆 Done
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                                        Active
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant={team.is_disqualified ? "default" : "destructive"}
                                                    onClick={() => toggleDisqualify(team)}
                                                    className="text-xs"
                                                >
                                                    {team.is_disqualified ? "Reinstate" : "DQ"}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Event, Team } from "@/lib/types";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalEvents: 0,
        activeEvents: 0,
        totalTeams: 0,
        totalScans: 0,
    });
    const [activeEvent, setActiveEvent] = useState<Event | null>(null);
    const [topTeams, setTopTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const supabase = createClient();

        // Get events count
        const { count: totalEvents } = await supabase
            .from("events")
            .select("id", { count: "exact" });

        const { count: activeEvents } = await supabase
            .from("events")
            .select("id", { count: "exact" })
            .eq("is_active", true);

        // Get active event details
        const { data: activeEventData } = await supabase
            .from("events")
            .select("*")
            .eq("is_active", true)
            .single();

        setActiveEvent(activeEventData || null);

        // Get teams count
        const { count: totalTeams } = await supabase
            .from("teams")
            .select("id", { count: "exact" })
            .eq("is_admin", false);

        // Get scans count
        const { count: totalScans } = await supabase
            .from("scans")
            .select("id", { count: "exact" });

        // Get top teams from active event
        if (activeEventData) {
            const { data: teams } = await supabase
                .from("teams")
                .select("*")
                .eq("event_id", activeEventData.id)
                .eq("is_admin", false)
                .order("score", { ascending: false })
                .limit(5);

            setTopTeams(teams || []);
        }

        setStats({
            totalEvents: totalEvents || 0,
            activeEvents: activeEvents || 0,
            totalTeams: totalTeams || 0,
            totalScans: totalScans || 0,
        });

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">Welcome to the Treasure Hunt admin dashboard</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{stats.totalEvents}</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Active Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-400">{stats.activeEvents}</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Teams</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{stats.totalTeams}</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Scans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-400">{stats.totalScans}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Event */}
            {activeEvent && (
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                            Active Event: {activeEvent.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400">Start Time:</span>
                                <p className="text-white">{new Date(activeEvent.start_time).toLocaleString()}</p>
                            </div>
                            <div>
                                <span className="text-slate-400">End Time:</span>
                                <p className="text-white">{new Date(activeEvent.end_time).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Leaderboard */}
            {topTeams.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">🏆 Leaderboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topTeams.map((team, index) => (
                                <div
                                    key={team.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : index === 1
                                                        ? "bg-slate-400/20 text-slate-300"
                                                        : index === 2
                                                            ? "bg-orange-500/20 text-orange-400"
                                                            : "bg-slate-700 text-slate-400"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{team.team_name}</p>
                                            <p className="text-xs text-slate-500">Step {team.current_step}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-purple-400">{team.score}</p>
                                        <p className="text-xs text-slate-500">points</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

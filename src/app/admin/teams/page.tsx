"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Event, Team, GeneratedTeamCredential } from "@/lib/types";

export default function TeamsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [teamCount, setTeamCount] = useState(10);
    const [credentials, setCredentials] = useState<GeneratedTeamCredential[]>([]);
    const [mustDownload, setMustDownload] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchTeams = useCallback(async () => {
        if (!selectedEvent) return;
        try {
            const response = await fetch(`/api/admin/teams?event_id=${selectedEvent}`);
            const data = await response.json();
            if (data.success) {
                setTeams(data.data || []);
            }
        } catch (err) {
            console.error("Fetch teams error:", err);
        }
    }, [selectedEvent]);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchTeams();
        }
    }, [selectedEvent, fetchTeams]);

    const fetchEvents = async () => {
        try {
            const response = await fetch("/api/admin/events");
            const data = await response.json();
            if (data.success && data.data?.length > 0) {
                setEvents(data.data);
                setSelectedEvent(data.data[0].id);
            }
        } catch (err) {
            console.error("Fetch events error:", err);
        }
        setIsLoading(false);
    };

    const generateTeams = async () => {
        setGenerating(true);
        setError("");
        setCredentials([]);

        try {
            const response = await fetch("/api/admin/teams/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: selectedEvent, count: teamCount }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(data.message);
                setCredentials(data.credentials);
                setMustDownload(true);
                fetchTeams();
            } else {
                setError(data.message);
            }
        } catch {
            setError("Failed to generate teams");
        } finally {
            setGenerating(false);
        }
    };

    // Warn user before leaving if they haven't downloaded credentials
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (mustDownload) {
                e.preventDefault();
                e.returnValue = "You have undownloaded team credentials. Are you sure you want to leave?";
                return e.returnValue;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [mustDownload]);

    const downloadCSV = () => {
        const csv = [
            "Team Name,Username,Password",
            ...credentials.map((c) => `${c.team_name},${c.username},${c.password}`),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `team_credentials_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        // Clear credentials after download and remove blocking
        setMustDownload(false);
        setTimeout(() => {
            setCredentials([]);
            setSuccess("");
        }, 3000);
    };

    const toggleDisqualify = async (team: Team) => {
        try {
            await fetch("/api/admin/teams", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: team.id, is_disqualified: !team.is_disqualified }),
            });
            fetchTeams();
        } catch (err) {
            console.error("Toggle error:", err);
        }
    };

    const adjustScore = async (teamId: string, adjustment: number) => {
        const team = teams.find((t) => t.id === teamId);
        if (!team) return;

        const newScore = Math.max(0, team.score + adjustment);
        try {
            await fetch("/api/admin/teams", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: teamId, score: newScore }),
            });
            fetchTeams();
        } catch (err) {
            console.error("Score adjust error:", err);
        }
    };

    const addSingleTeam = async () => {
        setGenerating(true);
        setError("");
        setCredentials([]);

        try {
            const response = await fetch("/api/admin/teams/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: selectedEvent, count: 1 }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(data.message);
                setCredentials(data.credentials);
                setMustDownload(true);
                fetchTeams();
            } else {
                setError(data.message);
            }
        } catch {
            setError("Failed to add team");
        } finally {
            setGenerating(false);
        }
    };

    const deleteTeam = async (teamId: string, teamName: string) => {
        if (!confirm(`Are you sure you want to delete ${teamName}? This action cannot be undone.`)) return;

        try {
            await fetch(`/api/admin/teams?id=${teamId}`, { method: "DELETE" });
            fetchTeams();
            setSuccess(`${teamName} deleted successfully`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Delete error:", err);
            setError("Failed to delete team");
        }
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
                <h1 className="text-3xl font-bold text-white">Teams</h1>
                <p className="text-slate-400 mt-1">Manage teams and generate credentials</p>
            </div>

            {/* Event Selector */}
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <Label className="text-slate-300">Select Event</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            {events.map((event) => (
                                <SelectItem key={event.id} value={event.id} className="text-white hover:bg-slate-700">
                                    {event.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Generate Teams - Only show when no teams exist */}
            {teams.length === 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Generate Teams</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 items-end">
                            <div className="w-32">
                                <Label className="text-slate-300">Number of Teams</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={teamCount}
                                    onChange={(e) => setTeamCount(parseInt(e.target.value) || 1)}
                                    className="bg-slate-900 border-slate-700 text-white"
                                />
                            </div>
                            <Button
                                onClick={generateTeams}
                                disabled={generating || !selectedEvent}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {generating ? "Generating..." : "Generate Teams"}
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && credentials.length > 0 && (
                            <div className="mt-4 space-y-4">
                                <Alert className={mustDownload ? "bg-amber-500/20 border-amber-500 text-amber-300" : "bg-green-500/10 border-green-500/50 text-green-400"}>
                                    <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div>
                                            <span className="font-semibold">{success}</span>
                                            {mustDownload && (
                                                <p className="text-sm mt-1 text-amber-200">
                                                    ⚠️ You must download the CSV before leaving. Passwords won&apos;t be shown again!
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={downloadCSV}
                                            className={mustDownload ? "bg-amber-600 hover:bg-amber-700 animate-pulse" : "bg-green-600 hover:bg-green-700"}
                                        >
                                            {mustDownload ? "⬇️ Download CSV (Required)" : "✓ Downloaded"}
                                        </Button>
                                    </AlertDescription>
                                </Alert>

                                <div className="max-h-48 overflow-y-auto bg-slate-900 rounded-lg p-4">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-slate-400 border-b border-slate-700">
                                                <th className="text-left pb-2">Team</th>
                                                <th className="text-left pb-2">Username</th>
                                                <th className="text-left pb-2">Password</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {credentials.map((cred, i) => (
                                                <tr key={i} className="text-white border-b border-slate-800">
                                                    <td className="py-2">{cred.team_name}</td>
                                                    <td className="py-2 font-mono text-xs">{cred.username}</td>
                                                    <td className="py-2 font-mono text-xs">{cred.password}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Add Team Card - Show when teams exist and need to download */}
            {teams.length > 0 && success && credentials.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                        <Alert className={mustDownload ? "bg-amber-500/20 border-amber-500 text-amber-300" : "bg-green-500/10 border-green-500/50 text-green-400"}>
                            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <span className="font-semibold">{success}</span>
                                    {mustDownload && (
                                        <p className="text-sm mt-1 text-amber-200">
                                            ⚠️ You must download the CSV before leaving. Passwords won&apos;t be shown again!
                                        </p>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={downloadCSV}
                                    className={mustDownload ? "bg-amber-600 hover:bg-amber-700 animate-pulse" : "bg-green-600 hover:bg-green-700"}
                                >
                                    {mustDownload ? "⬇️ Download CSV (Required)" : "✓ Downloaded"}
                                </Button>
                            </AlertDescription>
                        </Alert>

                        <div className="max-h-48 overflow-y-auto bg-slate-900 rounded-lg p-4 mt-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-700">
                                        <th className="text-left pb-2">Team</th>
                                        <th className="text-left pb-2">Username</th>
                                        <th className="text-left pb-2">Password</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {credentials.map((cred, i) => (
                                        <tr key={i} className="text-white border-b border-slate-800">
                                            <td className="py-2">{cred.team_name}</td>
                                            <td className="py-2 font-mono text-xs">{cred.username}</td>
                                            <td className="py-2 font-mono text-xs">{cred.password}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Teams List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">Teams ({teams.length})</CardTitle>
                    {teams.length > 0 && (
                        <Button
                            onClick={addSingleTeam}
                            disabled={generating || !selectedEvent}
                            className="bg-purple-600 hover:bg-purple-700"
                            size="sm"
                        >
                            {generating ? "Adding..." : "+ Add Team"}
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {teams.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No teams yet. Generate some teams above!</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-700">
                                        <th className="text-left pb-3">Team</th>
                                        <th className="text-left pb-3">Username</th>
                                        <th className="text-left pb-3">Score</th>
                                        <th className="text-left pb-3">Step</th>
                                        <th className="text-left pb-3">Status</th>
                                        <th className="text-right pb-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((team) => (
                                        <tr key={team.id} className="text-white border-b border-slate-800">
                                            <td className="py-3">{team.team_name}</td>
                                            <td className="py-3 font-mono text-xs text-slate-400">{team.username}</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => adjustScore(team.id, -10)}
                                                        className="h-6 w-6 p-0 text-red-400"
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="font-bold text-purple-400">{team.score}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => adjustScore(team.id, 10)}
                                                        className="h-6 w-6 p-0 text-green-400"
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="py-3">{team.current_step}</td>
                                            <td className="py-3">
                                                {team.is_disqualified ? (
                                                    <Badge variant="destructive">Disqualified</Badge>
                                                ) : (
                                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant={team.is_disqualified ? "default" : "destructive"}
                                                        onClick={() => toggleDisqualify(team)}
                                                    >
                                                        {team.is_disqualified ? "Reinstate" : "Disqualify"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteTeam(team.id, team.team_name)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
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

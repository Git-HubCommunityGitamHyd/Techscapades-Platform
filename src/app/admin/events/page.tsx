"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { Event } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/helpers";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        start_time: "",
        end_time: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch("/api/admin/events");
            const data = await response.json();
            if (data.success) {
                setEvents(data.data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
        setIsLoading(false);
    };

    const formatDateTimeLocal = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            if (editingEvent) {
                // Update existing event
                const response = await fetch("/api/admin/events", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editingEvent.id,
                        name: formData.name,
                        start_time: new Date(formData.start_time).toISOString(),
                        end_time: new Date(formData.end_time).toISOString(),
                    }),
                });

                const data = await response.json();
                if (!data.success) {
                    setError(data.message || "Failed to update event");
                    return;
                }
                setSuccess("Event updated successfully!");
            } else {
                // Create new event
                const response = await fetch("/api/admin/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                const data = await response.json();
                if (!data.success) {
                    setError(data.message || "Failed to create event");
                    return;
                }
                setSuccess("Event created successfully!");
            }

            setIsDialogOpen(false);
            setFormData({ name: "", start_time: "", end_time: "" });
            setEditingEvent(null);
            fetchEvents();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Submit error:", err);
            setError("Failed to save event");
        }
    };

    const openEditDialog = (event: Event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name,
            start_time: formatDateTimeLocal(event.start_time),
            end_time: formatDateTimeLocal(event.end_time),
        });
        setIsDialogOpen(true);
    };

    const openCreateDialog = () => {
        setEditingEvent(null);
        setFormData({ name: "", start_time: "", end_time: "" });
        setIsDialogOpen(true);
    };

    const toggleActive = async (event: Event) => {
        try {
            await fetch("/api/admin/events", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: event.id, is_active: !event.is_active }),
            });
            fetchEvents();
        } catch (err) {
            console.error("Toggle error:", err);
        }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm("Are you sure? This will delete all teams, clues, and scans for this event.")) {
            return;
        }
        try {
            await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
            fetchEvents();
        } catch (err) {
            console.error("Delete error:", err);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Events</h1>
                    <p className="text-slate-400 mt-1">Manage treasure hunt events</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingEvent(null);
                        setFormData({ name: "", start_time: "", end_time: "" });
                        setError("");
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={openCreateDialog}>
                            + New Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                {editingEvent ? "Edit Event" : "Create New Event"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label className="text-slate-300">Event Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Campus Treasure Hunt 2024"
                                    className="bg-slate-800 border-slate-700 text-white"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Start Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">End Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                                {editingEvent ? "Update Event" : "Create Event"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {success && (
                <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4">
                {events.length === 0 ? (
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="py-12 text-center">
                            <p className="text-slate-400">No events yet. Create your first event!</p>
                        </CardContent>
                    </Card>
                ) : (
                    events.map((event) => (
                        <Card key={event.id} className="bg-slate-800/50 border-slate-700">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-white flex items-center gap-3">
                                    {event.name}
                                    {event.is_active && (
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                            Active
                                        </Badge>
                                    )}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditDialog(event)}
                                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={event.is_active ? "destructive" : "default"}
                                        onClick={() => toggleActive(event)}
                                        className={event.is_active ? "" : "bg-green-600 hover:bg-green-700"}
                                    >
                                        {event.is_active ? "Deactivate" : "Activate"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteEvent(event.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400">Start:</span>
                                        <p className="text-white">{formatDateTime(event.start_time)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">End:</span>
                                        <p className="text-white">{formatDateTime(event.end_time)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

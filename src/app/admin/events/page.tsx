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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Event } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/helpers";

// Generate hours 08-16
const hours = Array.from({ length: 9 }, (_, i) => String(i + 8).padStart(2, "0"));
// Generate minutes 00, 15, 30, 45
const minutes = ["00", "15", "30", "45"];

// Get today's date in YYYY-MM-DD format for min attribute
const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
};

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        start_date: "",
        start_hour: "09",
        start_minute: "00",
        end_date: "",
        end_hour: "17",
        end_minute: "00",
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

    const parseDateTimeToForm = (dateStr: string) => {
        const date = new Date(dateStr);
        const dateOnly = date.toISOString().split("T")[0];
        const hour = String(date.getHours()).padStart(2, "0");
        // Round to nearest 15 min
        const min = String(Math.round(date.getMinutes() / 15) * 15).padStart(2, "0");
        return { date: dateOnly, hour, minute: min === "60" ? "00" : min };
    };

    const combineDateTime = (date: string, hour: string, minute: string) => {
        return new Date(`${date}T${hour}:${minute}:00`).toISOString();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const startTime = combineDateTime(formData.start_date, formData.start_hour, formData.start_minute);
        const endTime = combineDateTime(formData.end_date, formData.end_hour, formData.end_minute);

        // Validate that start date is not in the past (only for new events)
        if (!editingEvent) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(formData.start_date);
            if (startDate < today) {
                setError("Start date cannot be in the past");
                return;
            }
        }

        // Validate that end time is after start time
        if (new Date(endTime) <= new Date(startTime)) {
            setError("End time must be after start time");
            return;
        }

        try {
            if (editingEvent) {
                const response = await fetch("/api/admin/events", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editingEvent.id,
                        name: formData.name,
                        start_time: startTime,
                        end_time: endTime,
                    }),
                });

                const data = await response.json();
                if (!data.success) {
                    setError(data.message || "Failed to update event");
                    return;
                }
                setSuccess("Event updated successfully!");
            } else {
                const response = await fetch("/api/admin/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formData.name,
                        start_time: startTime,
                        end_time: endTime,
                    }),
                });

                const data = await response.json();
                if (!data.success) {
                    setError(data.message || "Failed to create event");
                    return;
                }
                setSuccess("Event created successfully!");
            }

            setIsDialogOpen(false);
            resetForm();
            fetchEvents();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Submit error:", err);
            setError("Failed to save event");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            start_date: "",
            start_hour: "09",
            start_minute: "00",
            end_date: "",
            end_hour: "17",
            end_minute: "00",
        });
        setEditingEvent(null);
    };

    const openEditDialog = (event: Event) => {
        setEditingEvent(event);
        const start = parseDateTimeToForm(event.start_time);
        const end = parseDateTimeToForm(event.end_time);
        setFormData({
            name: event.name,
            start_date: start.date,
            start_hour: start.hour,
            start_minute: start.minute,
            end_date: end.date,
            end_hour: end.hour,
            end_minute: end.minute,
        });
        setIsDialogOpen(true);
    };

    const openCreateDialog = () => {
        resetForm();
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Events</h1>
                    <p className="text-gray-400 mt-1">Manage treasure hunt events</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        resetForm();
                        setError("");
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-white hover:bg-gray-200 text-black" onClick={openCreateDialog}>
                            + New Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border-white/10 max-w-md">
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
                                <Label className="text-gray-300">Event Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Techscapades 4.0 2024"
                                    className="bg-zinc-900 border-white/10 text-white"
                                    required
                                />
                            </div>

                            {/* Start Date/Time */}
                            <div className="space-y-2">
                                <Label className="text-gray-300">Start Date & Time</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        min={!editingEvent ? getTodayDate() : undefined}
                                        className="bg-zinc-900 border-white/10 text-white flex-1"
                                        required
                                    />
                                    <Select value={formData.start_hour} onValueChange={(v) => setFormData({ ...formData, start_hour: v })}>
                                        <SelectTrigger className="w-20 bg-zinc-900 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 max-h-48">
                                            {hours.map((h) => (
                                                <SelectItem key={h} value={h} className="text-white">{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-white self-center">:</span>
                                    <Select value={formData.start_minute} onValueChange={(v) => setFormData({ ...formData, start_minute: v })}>
                                        <SelectTrigger className="w-20 bg-zinc-900 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            {minutes.map((m) => (
                                                <SelectItem key={m} value={m} className="text-white">{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* End Date/Time */}
                            <div className="space-y-2">
                                <Label className="text-gray-300">End Date & Time</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        min={formData.start_date || undefined}
                                        className="bg-zinc-900 border-white/10 text-white flex-1"
                                        required
                                    />
                                    <Select value={formData.end_hour} onValueChange={(v) => setFormData({ ...formData, end_hour: v })}>
                                        <SelectTrigger className="w-20 bg-zinc-900 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 max-h-48">
                                            {hours.map((h) => (
                                                <SelectItem key={h} value={h} className="text-white">{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-white self-center">:</span>
                                    <Select value={formData.end_minute} onValueChange={(v) => setFormData({ ...formData, end_minute: v })}>
                                        <SelectTrigger className="w-20 bg-zinc-900 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            {minutes.map((m) => (
                                                <SelectItem key={m} value={m} className="text-white">{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-white hover:bg-gray-200 text-black">
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
                    <Card className="bg-zinc-900/50 border-white/10">
                        <CardContent className="py-12 text-center">
                            <p className="text-gray-400">No events yet. Create your first event!</p>
                        </CardContent>
                    </Card>
                ) : (
                    events.map((event) => (
                        <Card key={event.id} className="bg-zinc-900/50 border-white/10">
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
                                        className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
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
                                        <span className="text-gray-400">Start:</span>
                                        <p className="text-white">{formatDateTime(event.start_time)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">End:</span>
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

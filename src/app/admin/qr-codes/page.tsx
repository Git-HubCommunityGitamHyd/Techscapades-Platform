"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Event, Clue, QRCode } from "@/lib/types";

interface FakeQRForm {
    label: string;
    redirect_url: string;
}

export default function QRCodesPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>("");
    const [clues, setClues] = useState<Clue[]>([]);
    const [fakeQRs, setFakeQRs] = useState<QRCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [creatingFake, setCreatingFake] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [fakeForm, setFakeForm] = useState<FakeQRForm>({
        label: "",
        redirect_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchClues();
            fetchFakeQRs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEvent]);

    const fetchEvents = async () => {
        const supabase = createClient();
        const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
        setEvents(data || []);
        if (data && data.length > 0) {
            setSelectedEvent(data[0].id);
        }
        setIsLoading(false);
    };

    const fetchClues = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("clues")
            .select("*")
            .eq("event_id", selectedEvent)
            .order("step_number", { ascending: true });
        setClues(data || []);
    };

    const fetchFakeQRs = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("qr_codes")
            .select("*")
            .eq("event_id", selectedEvent)
            .eq("is_fake", true)
            .order("created_at", { ascending: true });
        setFakeQRs(data || []);
    };

    const createFakeQR = async () => {
        if (!fakeForm.label.trim() || !fakeForm.redirect_url.trim()) {
            setError("Please fill in both label and redirect URL");
            return;
        }

        setCreatingFake(true);
        setError("");
        setSuccess("");

        try {
            const supabase = createClient();
            const qrToken = `FAKE_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

            const { error: insertError } = await supabase
                .from("qr_codes")
                .insert({
                    event_id: selectedEvent,
                    clue_id: null,
                    qr_token: qrToken,
                    is_fake: true,
                    redirect_url: fakeForm.redirect_url,
                    fake_label: fakeForm.label,
                });

            if (insertError) {
                throw insertError;
            }

            setSuccess(`Fake QR "${fakeForm.label}" created successfully!`);
            setFakeForm({ label: "", redirect_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
            fetchFakeQRs();
        } catch (err) {
            setError("Failed to create fake QR code");
            console.error(err);
        } finally {
            setCreatingFake(false);
        }
    };

    const deleteFakeQR = async (id: string) => {
        if (!confirm("Are you sure you want to delete this fake QR?")) return;

        try {
            const supabase = createClient();
            const { error: deleteError } = await supabase
                .from("qr_codes")
                .delete()
                .eq("id", id);

            if (deleteError) throw deleteError;

            setSuccess("Fake QR deleted");
            fetchFakeQRs();
        } catch {
            setError("Failed to delete fake QR");
        }
    };

    const generateQRCodes = async () => {
        setGenerating(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/admin/qr/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: selectedEvent }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(data.message);

                // Download zip file
                const binaryString = atob(data.zipBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: "application/zip" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `qr_codes_${new Date().toISOString().split("T")[0]}.zip`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                setError(data.message);
            }
        } catch {
            setError("Failed to generate QR codes");
        } finally {
            setGenerating(false);
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
            <div>
                <h1 className="text-3xl font-bold text-white">QR Codes</h1>
                <p className="text-gray-400 mt-1">Generate and download QR codes for clues</p>
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
                                {event.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            {/* Generate QR Codes */}
            <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Generate QR Codes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-400">
                        This will generate a QR code for each clue in the selected event. The QR codes will be downloaded as a ZIP file containing PNG images.
                    </p>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={generateQRCodes}
                            disabled={generating || clues.length === 0}
                            className="bg-white hover:bg-gray-200 text-black"
                        >
                            {generating ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Generating...
                                </span>
                            ) : (
                                "Generate & Download ZIP"
                            )}
                        </Button>
                        <span className="text-gray-400 text-sm">
                            {clues.length} clue{clues.length !== 1 ? "s" : ""} will be included
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Clues Preview */}
            <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Clues to Generate</CardTitle>
                </CardHeader>
                <CardContent>
                    {clues.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                            No clues found for this event. Add clues first before generating QR codes.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {clues.map((clue) => (
                                <div
                                    key={clue.id}
                                    className="flex items-center gap-4 p-3 rounded-lg bg-black/50"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                                        {clue.step_number}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white truncate">{clue.location_name || `Clue ${clue.step_number}`}</p>
                                        <p className="text-gray-500 text-sm truncate">{clue.clue_text}</p>
                                    </div>
                                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fake QR Codes Section */}
            <Card className="bg-zinc-900/50 border-red-500/30">
                <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                        <span>🎭</span> Fake QR Codes (Hall of Shame)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-400 text-sm">
                        Create fake QR codes that redirect players to any URL (rickrolls, memes, etc.).
                        Players who scan these will be added to the &quot;Hall of Shame&quot;!
                    </p>

                    {/* Create Fake QR Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-black/50 rounded-lg">
                        <div>
                            <Label className="text-gray-300">Label</Label>
                            <Input
                                placeholder="e.g., Rickroll 1"
                                value={fakeForm.label}
                                onChange={(e) => setFakeForm({ ...fakeForm, label: e.target.value })}
                                className="bg-zinc-900 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Redirect URL</Label>
                            <Input
                                placeholder="https://..."
                                value={fakeForm.redirect_url}
                                onChange={(e) => setFakeForm({ ...fakeForm, redirect_url: e.target.value })}
                                className="bg-zinc-900 border-white/10 text-white"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={createFakeQR}
                                disabled={creatingFake}
                                className="bg-red-600 hover:bg-red-700 text-white w-full"
                            >
                                {creatingFake ? "Creating..." : "Create Fake QR"}
                            </Button>
                        </div>
                    </div>

                    {/* List of Fake QRs */}
                    {fakeQRs.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-white font-medium">Existing Fake QRs</h4>
                            {fakeQRs.map((qr) => (
                                <div
                                    key={qr.id}
                                    className="flex items-center gap-4 p-3 rounded-lg bg-red-950/30 border border-red-500/20"
                                >
                                    <span className="text-2xl">🎭</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-red-300 font-medium">{qr.fake_label}</p>
                                        <p className="text-gray-500 text-sm truncate">{qr.redirect_url}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteFakeQR(qr.id)}
                                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

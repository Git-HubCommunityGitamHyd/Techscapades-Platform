"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Team } from "@/lib/types";

export default function ScanPage() {
    const router = useRouter();
    const [team, setTeam] = useState<Team | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<unknown>(null);

    const stopScanner = useCallback(async () => {
        if (html5QrCodeRef.current) {
            try {
                const scanner = html5QrCodeRef.current as { stop: () => Promise<void> };
                await scanner.stop();
                html5QrCodeRef.current = null;
            } catch (error) {
                console.error("Error stopping scanner:", error);
            }
        }
    }, []);

    useEffect(() => {
        const storedTeam = localStorage.getItem("team");
        if (!storedTeam) {
            router.push("/login");
            return;
        }
        setTeam(JSON.parse(storedTeam) as Team);

        return () => {
            stopScanner();
        };
    }, [router, stopScanner]);

    const processQRCode = async (decodedText: string) => {
        if (isProcessing || !team) return;
        setIsProcessing(true);

        try {
            let token = decodedText;
            if (decodedText.includes("token=")) {
                const url = new URL(decodedText);
                token = url.searchParams.get("token") || decodedText;
            }

            const response = await fetch("/api/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, team_id: team.id }),
            });

            const data = await response.json();
            setResult(data);

            if (data.success) {
                const updatedTeam = { ...team, score: data.newScore, current_step: data.nextStep };
                localStorage.setItem("team", JSON.stringify(updatedTeam));
                setTeam(updatedTeam);

                await stopScanner();
                setIsScanning(false);

                setTimeout(() => {
                    router.push("/hunt");
                }, 2000);
            }
        } catch (error) {
            console.error("Scan error:", error);
            setResult({ success: false, message: "Failed to process QR code" });
        } finally {
            setIsProcessing(false);
        }
    };

    const startScanner = async () => {
        if (!scannerRef.current) return;

        setIsScanning(true);
        setResult(null);

        try {
            const { Html5Qrcode } = await import("html5-qrcode");
            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    processQRCode(decodedText);
                },
                () => {
                    // QR code detection error (silent)
                }
            );
        } catch (error) {
            console.error("Scanner error:", error);
            setResult({ success: false, message: "Could not access camera" });
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen bg-black p-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/hunt")}
                        className="text-gray-400 hover:text-white"
                    >
                        ← Back
                    </Button>
                    <h1 className="text-xl font-bold text-white">Scan QR Code</h1>
                    <div className="w-16" />
                </div>

                {/* Result Alert */}
                {result && (
                    <Alert
                        className={
                            result.success
                                ? "bg-green-500/10 border-green-500/50 text-green-400"
                                : "bg-red-500/10 border-red-500/50 text-red-400"
                        }
                    >
                        <AlertDescription className="flex items-center gap-2">
                            {result.success ? (
                                <>
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {result.message}
                                </>
                            ) : (
                                <>
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    {result.message}
                                </>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Scanner */}
                <Card className="bg-zinc-950 border-white/10 overflow-hidden">
                    <CardContent className="p-0">
                        <div
                            id="qr-reader"
                            ref={scannerRef}
                            className="w-full aspect-square bg-black"
                        />
                    </CardContent>
                </Card>

                {/* Controls */}
                {!isScanning ? (
                    <Button
                        onClick={startScanner}
                        className="w-full h-14 text-lg bg-white hover:bg-gray-200 text-black font-semibold"
                    >
                        <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Start Camera
                    </Button>
                ) : (
                    <Button
                        onClick={async () => {
                            await stopScanner();
                            setIsScanning(false);
                        }}
                        variant="outline"
                        className="w-full h-14 text-lg border-white/20 text-gray-300 hover:bg-white/10"
                    >
                        Stop Scanning
                    </Button>
                )}

                {/* Instructions */}
                <div className="text-center text-sm text-gray-400">
                    <p>Point your camera at the QR code at your current location.</p>
                    <p className="mt-1">Make sure you&apos;re scanning in the correct order!</p>
                </div>
            </div>
        </div>
    );
}

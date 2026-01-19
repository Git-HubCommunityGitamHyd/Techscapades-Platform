"use client";

export function HuntPageSkeleton() {
    return (
        <div className="min-h-screen bg-black p-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-6 w-32 skeleton mb-1"></div>
                        <div className="h-4 w-24 skeleton"></div>
                    </div>
                    <div className="h-8 w-16 skeleton rounded-full"></div>
                </div>

                {/* Timer skeleton */}
                <div className="h-24 skeleton rounded-lg"></div>

                {/* Clue card skeleton */}
                <div className="skeleton rounded-lg p-6 space-y-4">
                    <div className="h-6 w-24 skeleton"></div>
                    <div className="space-y-2">
                        <div className="h-4 w-full skeleton"></div>
                        <div className="h-4 w-5/6 skeleton"></div>
                        <div className="h-4 w-4/6 skeleton"></div>
                    </div>
                </div>

                {/* Button skeleton */}
                <div className="h-14 w-full skeleton rounded-lg"></div>
            </div>
        </div>
    );
}

export function ScanPageSkeleton() {
    return (
        <div className="min-h-screen bg-black p-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="h-10 w-20 skeleton rounded"></div>
                    <div className="h-6 w-32 skeleton"></div>
                    <div className="w-16"></div>
                </div>

                {/* Scanner area */}
                <div className="aspect-square w-full skeleton rounded-lg"></div>

                {/* Button */}
                <div className="h-14 w-full skeleton rounded-lg"></div>
            </div>
        </div>
    );
}

export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-12 w-12",
        lg: "h-16 w-16",
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={`animate-spin rounded-full border-t-2 border-b-2 border-white gpu ${sizeClasses[size]}`}
            ></div>
        </div>
    );
}

export function FullPageSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Spinner size="md" />
        </div>
    );
}

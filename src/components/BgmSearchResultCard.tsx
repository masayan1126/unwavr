"use client";

import { BgmSearchResult } from "@/lib/types";
import { Play, Music } from "lucide-react";
import { useState } from "react";

type Props = {
    results: BgmSearchResult[];
    onPlay: (result: BgmSearchResult) => void;
};

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function Thumbnail({ src, alt }: { src: string; alt: string }) {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className="w-16 h-12 bg-muted rounded shrink-0 flex items-center justify-center">
                <Music size={16} className="text-muted-foreground" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className="w-16 h-12 object-cover rounded shrink-0"
            onError={() => setError(true)}
        />
    );
}

export default function BgmSearchResultCard({ results, onPlay }: Props) {
    if (results.length === 0) return null;

    return (
        <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
                検索結果 ({results.length}件)
            </div>
            {results.map((result, idx) => (
                <div
                    key={result.videoId}
                    className="flex items-center gap-3 p-2 rounded-lg bg-background/80 hover:bg-background transition-colors border border-border/50"
                >
                    <span className="text-xs text-muted-foreground w-4 shrink-0 text-center">
                        {idx + 1}
                    </span>
                    <Thumbnail src={result.thumbnail} alt={result.title} />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" title={result.title}>
                            {result.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {formatDuration(result.duration)}
                        </div>
                    </div>
                    <button
                        onClick={() => onPlay(result)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-xs font-medium shadow-sm"
                        title="再生してプレイリストに追加"
                    >
                        <Play size={12} fill="currentColor" />
                        <span>再生</span>
                    </button>
                </div>
            ))}
        </div>
    );
}

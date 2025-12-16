"use client";
import { useAppStore } from "@/lib/store";
import { X, Minimize2, Maximize2, SkipBack, SkipForward } from "lucide-react";
import { useState, useEffect } from "react";

export default function GlobalBgmPlayer() {
    const currentId = useAppStore((s) => s.bgmCurrentTrackId);
    const tracks = useAppStore((s) => s.bgmTracks);
    const stopBgm = useAppStore((s) => s.stopBgm);
    const playBgmTrack = useAppStore((s) => s.playBgmTrack);

    const [isMinimized, setIsMinimized] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const track = tracks.find((t) => t.id === currentId);

    // Auto-show when track changes
    useEffect(() => {
        if (currentId) {
            setIsVisible(true);
            setIsMinimized(false);
        }
    }, [currentId]);

    if (!currentId || !track) return null;

    if (!isVisible) return null;

    const handleNext = () => {
        const idx = tracks.findIndex((t) => t.id === currentId);
        if (idx === -1) return;
        const nextIdx = (idx + 1) % tracks.length;
        playBgmTrack(tracks[nextIdx].id);
    };

    const handlePrev = () => {
        const idx = tracks.findIndex((t) => t.id === currentId);
        if (idx === -1) return;
        const prevIdx = (idx - 1 + tracks.length) % tracks.length;
        playBgmTrack(tracks[prevIdx].id);
    };

    return (
        <div
            className={`fixed z-[199000] transition-all duration-300 shadow-xl bg-black rounded-lg overflow-hidden border border-white/10 ${isMinimized
                ? "bottom-20 left-4 md:bottom-4 md:left-4 w-64 h-16 flex items-center"
                : "bottom-20 left-4 md:bottom-4 md:left-4 w-80 sm:w-96 aspect-video"
                }`}
        >
            {isMinimized ? (
                <div className="flex items-center w-full px-3 gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{track.title}</div>
                        <div className="text-[10px] text-white/60 truncate">Playing</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrev} className="text-white/80 hover:text-white p-1">
                            <SkipBack size={14} />
                        </button>
                        <button onClick={() => setIsMinimized(false)} className="text-white/80 hover:text-white p-1">
                            <Maximize2 size={14} />
                        </button>
                        <button onClick={stopBgm} className="text-white/80 hover:text-white p-1">
                            <X size={14} />
                        </button>
                        <button onClick={handleNext} className="text-white/80 hover:text-white p-1">
                            <SkipForward size={14} />
                        </button>
                    </div>
                    {/* Hidden iframe to keep playing audio */}
                    <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${track.videoId}?autoplay=1&enablejsapi=1`}
                            title="BGM Player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                    </div>
                </div>
            ) : (
                <div className="relative w-full h-full group">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${track.videoId}?autoplay=1&enablejsapi=1`}
                        title="BGM Player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />

                    {/* Overlay Controls */}
                    <div className="absolute top-0 left-0 right-0 p-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/50 to-transparent">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
                            title="最小化"
                        >
                            <Minimize2 size={14} />
                        </button>
                        <button
                            onClick={stopBgm}
                            className="p-1.5 bg-black/40 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-colors"
                            title="閉じる"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
                        <div className="pointer-events-auto flex gap-4">
                            <button onClick={handlePrev} className="text-white hover:text-primary transition-colors">
                                <SkipBack size={20} />
                            </button>
                            <button onClick={handleNext} className="text-white hover:text-primary transition-colors">
                                <SkipForward size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

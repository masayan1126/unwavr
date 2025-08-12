"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Play, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";

function extractVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
    }
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1) || null;
    }
    return null;
  } catch {
    // treat as raw id
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    return null;
  }
}

export default function BgmPage() {
  const tracks = useAppStore((s) => s.bgmTracks);
  const add = useAppStore((s) => s.addBgmTrack);
  const remove = useAppStore((s) => s.removeBgmTrack);
  const move = useAppStore((s) => s.moveBgmTrack);
  const clear = useAppStore((s) => s.clearBgmTracks);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);

  const addTrack = async () => {
    const vid = extractVideoId(url.trim());
    if (!vid) return;
    let useTitle = title.trim();
    if (!useTitle) {
      try {
        const res = await fetch(`/api/youtube/oembed?id=${encodeURIComponent(vid)}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.title) useTitle = data.title as string;
        }
      } catch {}
    }
    add({ videoId: vid, title: useTitle || "(無題)", url: url.trim() });
    setUrl("");
    setTitle("");
  };

  const play = (id: string) => {
    setCurrentId(id);
  };

  const idxOf = (id: string) => tracks.findIndex((t) => t.id === id);

  return (
    <div className="p-4 border rounded max-w-3xl">
      <div className="text-sm font-semibold mb-3">作業用BGM（YouTubeプレイリスト）</div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          className="flex-1 border rounded px-2 py-1"
          placeholder="YouTubeのURL または 動画ID"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="flex-1 border rounded px-2 py-1"
          placeholder="タイトル（任意）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="px-3 py-1 rounded border flex items-center gap-1" onClick={addTrack}>
          <Plus size={14} /> 追加
        </button>
        <button className="px-3 py-1 rounded border" onClick={clear}>全クリア</button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {tracks.length === 0 ? (
          <div className="text-xs opacity-70">プレイリストが空です。URLまたは動画IDを追加してください。</div>
        ) : (
          tracks.map((t) => (
            <div key={t.id} className="border rounded p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <button className="px-2 py-1 border rounded" onClick={() => play(t.id)} title="再生">
                  <Play size={14} />
                </button>
                <img
                  src={`https://img.youtube.com/vi/${t.videoId}/mqdefault.jpg`}
                  alt={t.title}
                  className="w-16 h-9 object-cover rounded border"
                  loading="lazy"
                />
                <div className="flex flex-col min-w-0">
                  <div className="text-sm truncate" title={t.title}>{t.title}</div>
                  <div className="text-[11px] opacity-60 truncate" title={t.url}>https://youtu.be/{t.videoId}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border rounded" onClick={() => move(idxOf(t.id), Math.max(0, idxOf(t.id) - 1))}>
                  <ChevronUp size={14} />
                </button>
                <button className="px-2 py-1 border rounded" onClick={() => move(idxOf(t.id), Math.min(tracks.length - 1, idxOf(t.id) + 1))}>
                  <ChevronDown size={14} />
                </button>
                <button className="px-2 py-1 border rounded" onClick={() => remove(t.id)} title="削除">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {currentId && (
        <div className="mt-4">
          <div className="text-xs font-semibold mb-2">再生中</div>
          <div className="aspect-video w-full border rounded overflow-hidden">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${tracks.find((t) => t.id === currentId)?.videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}



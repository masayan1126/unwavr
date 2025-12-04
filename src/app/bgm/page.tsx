"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useAppStore } from "@/lib/store";
import { Play, Trash2, ChevronUp, ChevronDown, Plus, RefreshCw, Download } from "lucide-react";
import PrimaryButton from "@/components/PrimaryButton";

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
  const groups = useAppStore((s) => s.bgmGroups);
  const hydrating = useAppStore((s) => s.hydrating);
  const hydrate = useAppStore((s) => s.hydrateFromDb);
  const add = useAppStore((s) => s.addBgmTrack);
  const remove = useAppStore((s) => s.removeBgmTrack);
  const move = useAppStore((s) => s.moveBgmTrack);
  const clear = useAppStore((s) => s.clearBgmTracks);
  const addGroup = useAppStore((s) => s.addBgmGroup);
  const updateGroup = useAppStore((s) => s.updateBgmGroup);
  const setTrackGroup = useAppStore((s) => s.setBgmTrackGroup);
  const moveWithinGroup = useAppStore((s) => s.moveBgmTrackWithinGroup);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  // const [currentId, setCurrentId] = useState<string | null>(null); // Removed local state
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [keyword, setKeyword] = useState("");
  const grouped = useMemo(() => {
    const map = new Map<string | undefined, typeof tracks>();
    for (const t of tracks) {
      const key = t.groupId;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tracks]);

  const [dragOverGroupId, setDragOverGroupId] = useState<string | "__ungrouped" | null>(null);

  const childrenOf = (parentId?: string) => groups.filter((g) => g.parentId === parentId);

  function handleDropToGroup(e: React.DragEvent, targetGroupId?: string) {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const srcId = data.trackId as string;
      if (!srcId) return;
      setTrackGroup(srcId, targetGroupId);
      setDragOverGroupId(null);
    } catch {
      setDragOverGroupId(null);
    }
  }

  function renderGroupNode(groupId?: string) {
    const isUngrouped = groupId == null;
    const group = groups.find((g) => g.id === groupId);
    const title = isUngrouped ? "未分類" : group?.name ?? "グループ";
    const list = grouped.get(groupId) ?? [];
    return (
      <div key={groupId ?? "__ungrouped"} className={`rounded-xl overflow-hidden bg-[var(--sidebar)] shadow-sm ${dragOverGroupId === (groupId ?? "__ungrouped") ? "ring-2 ring-[var(--primary)]/50" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverGroupId(groupId ?? "__ungrouped");
        }}
        onDragLeave={() => setDragOverGroupId(null)}
        onDrop={(e) => handleDropToGroup(e, groupId)}
      >
        <div className="px-3 py-2 text-[11px] uppercase tracking-wide opacity-70 flex items-center gap-2 border-b border-black/5 dark:border-white/5">
          <span className="inline-block w-2 h-2 rounded-full bg-black/20" />
          <span className="truncate">{title}</span>
          {!isUngrouped && (
            <span className="ml-auto flex items-center gap-2">
              <label className="text-[10px] opacity-60">親</label>
              <select
                className="px-2 py-1 border rounded text-[11px] bg-transparent"
                value={group?.parentId ?? ""}
                onChange={(e) => updateGroup(group!.id, { parentId: e.target.value || undefined })}
              >
                <option value="">なし</option>
                {groups
                  .filter((g) => g.id !== group!.id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
              </select>
            </span>
          )}
        </div>
        <div>
          {list.map((t) => (
            <div
              key={t.id}
              className="border-t px-3 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify({ trackId: t.id }));
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const data = JSON.parse(e.dataTransfer.getData("application/json"));
                  const srcId = data.trackId as string;
                  if (!srcId || srcId === t.id) return;
                  // 異なるグループから来た場合はグループ変更後、目的のトラックの前に移動
                  const src = tracks.find((x) => x.id === srcId);
                  const sameGroup = src?.groupId === (groupId ?? undefined);
                  if (!sameGroup) setTrackGroup(srcId, groupId);
                  moveWithinGroup(srcId, t.id);
                } catch { }
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button className="px-2 py-1 border rounded hover:bg-black/5 dark:hover:bg-white/10" onClick={() => play(t.id)} title="再生">
                  <Play size={14} />
                </button>
                <Image
                  src={`https://img.youtube.com/vi/${t.videoId}/mqdefault.jpg`}
                  alt={t.title}
                  width={160}
                  height={90}
                  className="w-24 h-14 sm:w-24 sm:h-14 object-cover rounded border"
                />
                <div className="flex flex-col min-w-0">
                  <div className="text-sm font-medium truncate" title={t.title}>{t.title}</div>
                  <div className="text-[11px] opacity-60 truncate" title={t.url}>https://youtu.be/{t.videoId}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button className="px-2 py-1 border rounded hover:bg-black/5 dark:hover:bg-white/10" onClick={() => move(idxOf(t.id), Math.max(0, idxOf(t.id) - 1))}>
                  <ChevronUp size={14} />
                </button>
                <button className="px-2 py-1 border rounded hover:bg-black/5 dark:hover:bg-white/10" onClick={() => move(idxOf(t.id), Math.min(tracks.length - 1, idxOf(t.id) + 1))}>
                  <ChevronDown size={14} />
                </button>
                <select
                  className="px-2 py-1 border rounded text-xs bg-transparent"
                  value={t.groupId ?? ""}
                  onChange={(e) => setTrackGroup(t.id, e.target.value || undefined)}
                >
                  <option value="">未分類</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button className="px-2 py-1 border rounded hover:bg-[var(--danger)]/10 dark:hover:bg-[var(--danger)]/20" onClick={() => remove(t.id)} title="削除">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* 子グループ */}
        {!isUngrouped && (
          <div className="pl-3 sm:pl-4 py-2 flex flex-col gap-2">
            {childrenOf(groupId).map((child) => renderGroupNode(child.id))}
          </div>
        )}
      </div>
    );
  }

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
      } catch { }
    }
    add({ videoId: vid, title: useTitle || "(無題)", url: url.trim(), groupId: selectedGroupId || undefined });
    setUrl("");
    setTitle("");
  };

  const play = (id: string) => {
    // setCurrentId(id); // Removed local state update
    try { useAppStore.getState().playBgmTrack(id); } catch { }
  };

  const idxOf = (id: string) => tracks.findIndex((t) => t.id === id);

  return (
    <div className="max-w-[1400px] mx-auto p-6 sm:p-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">作業用BGM（YouTubeプレイリスト）</h1>
        <button
          className={`px-3 py-1.5 rounded border text-sm flex items-center gap-2 ${hydrating ? "opacity-70" : ""}`}
          onClick={() => hydrate()}
          disabled={hydrating}
          aria-busy={hydrating}
          title="データを再同期"
        >
          <RefreshCw size={16} className={hydrating ? "animate-spin" : ""} /> 再読み込み
        </button>
      </div>
      {hydrating && <div className="text-xs opacity-70 mb-2">同期中...</div>}
      {!hydrating && tracks.length === 0 && groups.length === 0 && (
        <div className="text-xs opacity-70 mb-2">
          DBからプレイリストを読み込みます。必要に応じて
          <button className="underline ml-1" onClick={() => hydrate()}>再読み込み</button>
          してください。
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
        <input
          className="border rounded-lg px-3 py-2 text-sm bg-transparent sm:col-span-2 lg:col-span-3"
          placeholder="YouTubeのURL または 動画ID"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm bg-transparent sm:col-span-2 lg:col-span-2"
          placeholder="タイトル（任意）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-transparent"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          title="追加先グループ"
        >
          <option value="">未分類に追加</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <PrimaryButton onClick={addTrack} label="追加" iconLeft={<Plus size={14} />} />
        <button className="px-3 py-2 text-sm rounded border hover:bg-black/5 dark:hover:bg-white/10" onClick={clear}>全クリア</button>
        <button
          className={`px-3 py-2 text-sm rounded border hover:bg-red-50 dark:hover:bg-red-900/20 ${deletingAll ? 'opacity-70' : ''}`}
          disabled={deletingAll}
          onClick={async () => {
            if (!window.confirm('プレイリスト内の全トラックを削除します。よろしいですか？')) return;
            try {
              setDeletingAll(true);
              const ids = tracks.map((t) => t.id);
              for (const id of ids) {
                remove(id);
              }
              alert('全トラックを削除しました');
            } finally {
              setDeletingAll(false);
            }
          }}
        >一括削除</button>
        <input
          className="border rounded-lg px-3 py-2 text-sm bg-transparent"
          placeholder="キーワード（例: MV, Official Video）"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          title="タイトルに含まれるキーワードでフィルタ"
        />
        <button
          className={`px-3 py-2 text-sm rounded border flex items-center gap-2 justify-center ${importing ? 'opacity-70' : ''}`}
          disabled={importing}
          onClick={async () => {
            try {
              setImporting(true);
              const res = await fetch('/api/youtube/channel?handle=@gadoro1next&max=200');
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || 'fetch failed');
              let items = (data.items ?? []) as Array<{ videoId: string; title: string; url: string }>;
              const kw = keyword.trim().toLowerCase();
              if (kw) items = items.filter((it) => (it.title ?? '').toLowerCase().includes(kw));
              for (const it of items) {
                add({ videoId: it.videoId, title: it.title || it.videoId, url: it.url, groupId: selectedGroupId || undefined });
              }
              alert(`${items.length}件を取り込みました`);
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              alert(`取り込みに失敗しました: ${msg}`);
            } finally {
              setImporting(false);
            }
          }}
          title="gadoro公式チャンネルから取得して一括登録"
        >
          <Download size={14} /> 公式から一括取込
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-transparent"
            placeholder="グループ名（フォルダ名）"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button className="px-3 py-2 text-sm rounded border w-full sm:w-auto hover:bg-black/5 dark:hover:bg-white/10" onClick={() => {
            const name = newGroupName.trim();
            if (!name) return;
            addGroup({ name });
            setNewGroupName("");
          }}>グループ追加</button>
        </div>

        {tracks.length === 0 ? (
          <div className="text-xs opacity-70">プレイリストが空です。URLまたは動画IDを追加してください。</div>
        ) : (
          <div className="flex flex-col gap-2">
            {renderGroupNode(undefined)}
            {childrenOf(undefined).map((g) => renderGroupNode(g.id))}
          </div>
        )}
      </div>

    </div>
  );
}



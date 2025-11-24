"use client";
import Link from "next/link";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/Providers";
import PrimaryButton from "@/components/PrimaryButton";

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BgmImportExportPage() {
  const groups = useAppStore((s) => s.bgmGroups);
  const tracks = useAppStore((s) => s.bgmTracks);
  const hydrateFromDb = useAppStore((s) => s.hydrateFromDb);
  const toast = useToast();
  const [text, setText] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);

  function exportJson(): void {
    const data = {
      groups,
      tracks,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const json = JSON.stringify(data, null, 2);
    downloadText(`bgm_export_${Date.now()}.json`, json);
    toast.show("JSONをエクスポートしました", "success");
  }

  async function importJson(jsonText: string): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      toast.show("JSONのパースに失敗しました", "error");
      return;
    }
    if (!parsed || typeof parsed !== "object") {
      toast.show("不正なJSONです", "error");
      return;
    }
    const obj = parsed as { groups?: unknown; tracks?: unknown };
    const payload: { groups?: unknown[]; tracks?: unknown[] } = {};
    if (Array.isArray(obj.groups)) payload.groups = obj.groups;
    if (Array.isArray(obj.tracks)) payload.tracks = obj.tracks;
    if (!payload.groups && !payload.tracks) {
      toast.show("groups または tracks を含むJSONを指定してください", "error");
      return;
    }
    try {
      setImporting(true);
      const res = await fetch("/api/db/bgm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.show(`インポート失敗: ${err.error ?? res.statusText}`, "error");
        return;
      }
      await hydrateFromDb();
      toast.show("インポートしました", "success");
    } catch {
      toast.show("インポートに失敗しました", "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">BGM インポート/エクスポート</h1>
        <Link className="text-sm underline opacity-80" href="/bgm">一覧へ戻る</Link>
      </div>

      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="text-sm font-medium">エクスポート（JSON）</div>
        <PrimaryButton label="エクスポート" onClick={exportJson} />
      </div>

      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
        <div className="text-sm font-medium">インポート（JSON）</div>
        <div className="text-xs opacity-70">groups, tracks を含むJSONを貼り付けてください。</div>
        <textarea
          className="border rounded p-2 h-40 bg-transparent text-sm"
          placeholder='{"groups": [], "tracks": []}'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded-[3px] border text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${importing ? "opacity-70" : ""}`}
            disabled={importing}
            onClick={() => importJson(text)}
          >
            インポート
          </button>
          <button className="px-3 py-1 rounded-[3px] border text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors" onClick={() => setText("")}>クリア</button>
        </div>
      </div>
    </div>
  );
}



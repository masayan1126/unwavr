"use client";
import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { TaskType, Scheduled, DateRange } from "@/lib/types";

type ImportResult = { imported: number; failed: number; errors: string[] };

function parseDateRanges(input: string): DateRange[] {
  if (!input.trim()) return [];
  const ranges: DateRange[] = [];
  for (const part of input.split(";").map((s) => s.trim()).filter(Boolean)) {
    const [a, b] = part.split("..").map((s) => s.trim());
    const sa = new Date(a);
    const sb = new Date(b);
    if (isNaN(sa.getTime()) || isNaN(sb.getTime())) continue;
    const start = new Date(sa.getFullYear(), sa.getMonth(), sa.getDate()).getTime();
    const end = new Date(sb.getFullYear(), sb.getMonth(), sb.getDate()).getTime();
    ranges.push({ start: Math.min(start, end), end: Math.max(start, end) });
  }
  return ranges;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function ImportExportPage() {
  const tasks = useAppStore((s) => s.tasks);
  const addTask = useAppStore((s) => s.addTask);
  const addHistory = useAppStore((s) => s.addImportHistory);
  const history = useAppStore((s) => s.importHistory);
  const deleteHistory = useAppStore((s) => s.deleteImportHistory);
  const clearHistory = useAppStore((s) => s.clearImportHistory);
  const [result, setResult] = useState<ImportResult | null>(null);
  const dayLabels = ["日","月","火","水","木","金","土"] as const;

  function parseDaysOfWeek(input: string): number[] {
    const parts = input
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    const out: number[] = [];
    for (const p of parts) {
      if (/^\d+$/.test(p)) {
        const n = parseInt(p, 10);
        if (n >= 0 && n <= 6) out.push(n);
        continue;
      }
      // 日本語の曜日記号（例: 月, 水, 金）をサポート
      const idx = dayLabels.indexOf(p as typeof dayLabels[number]);
      if (idx !== -1) out.push(idx);
    }
    return out.sort();
  }

  async function handleImport(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setResult({ imported: 0, failed: 0, errors: ["空のCSV"] });
      return;
    }
    const header = lines[0].split(",").map((h) => h.trim());
    // 日本語/英語ヘッダー双方を許容
    const headerIndex = (...names: string[]) => {
      for (const n of names) {
        const i = header.indexOf(n);
        if (i !== -1) return i;
      }
      return -1;
    };
    const idx = {
      title: headerIndex("title", "タイトル"),
      description: headerIndex("description", "説明"),
      type: headerIndex("type", "種別"),
      daysOfWeek: headerIndex("daysOfWeek", "曜日"),
      dateRanges: headerIndex("dateRanges", "期間"),
      estimatedPomodoros: headerIndex("estimatedPomodoros", "見積ポモ"),
    };
    const errors: string[] = [];
    let ok = 0;
    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw.trim()) continue;
      const cells = raw.split(",");
      try {
        const title = (cells[idx.title] ?? "").trim();
        if (!title) throw new Error("タイトルが空です");
        const typeStr = (cells[idx.type] ?? "backlog").trim() as TaskType;
        const description = (cells[idx.description] ?? "").trim() || undefined;
        const est = parseInt((cells[idx.estimatedPomodoros] ?? "0").trim() || "0", 10);
        let scheduled: Scheduled | undefined = undefined;
        if (typeStr === "scheduled" || typeStr === "daily") {
          const dows = (cells[idx.daysOfWeek] ?? "").trim();
          const dr = (cells[idx.dateRanges] ?? "").trim();
          const daysOfWeek = dows ? parseDaysOfWeek(dows) : [];
          const dateRanges = parseDateRanges(dr);
          scheduled = { daysOfWeek, dateRanges: dateRanges.length ? dateRanges : undefined };
        }
        addTask({ title, description, type: typeStr, scheduled, estimatedPomodoros: Number.isFinite(est) ? est : 0 });
        ok++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`行${i + 1}: ${msg}`);
      }
    }
    const summary = { imported: ok, failed: errors.length, errors };
    setResult(summary);
    addHistory({ fileName: file.name, ...summary, timestamp: Date.now() });
  }

  function exportCSV() {
    // 日本語ヘッダーで出力
    const header = ["タイトル", "説明", "種別", "曜日", "期間", "見積ポモ"]; 
    const rows = tasks.map((t) => {
      const daysRaw = (t.scheduled?.daysOfWeek ?? [])
        .map((n) => (n >= 0 && n <= 6 ? dayLabels[n] : String(n)))
        .join(";");
      const days = daysRaw || "-"; // 空欄だと表計算で0になることがあるため見やすい表記に
      const rangesRaw = (t.scheduled?.dateRanges ?? [])
        .map((r) => `${formatDate(r.start)}..${formatDate(r.end)}`)
        .join(";");
      const ranges = rangesRaw || "-";
      const esc = (v: string) => (v.includes(",") || v.includes("\n") ? `"${v.replaceAll('"', '""')}"` : v);
      return [
        esc(t.title ?? ""),
        esc(t.description ?? ""),
        t.type,
        days,
        ranges,
        String(t.estimatedPomodoros ?? 0),
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">タスクのインポート/エクスポート</h1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>

      <div className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col gap-3">
        <div className="text-sm font-medium">インポート（CSV）</div>
        <div className="text-xs opacity-70">ヘッダー行を含むCSVを選択してください。対応列（日本語/英語どちらでも可）: タイトル(title), 説明(description), 種別(type: daily/scheduled/backlog), 曜日(daysOfWeek: 1;3;5), 期間(dateRanges: 2025-01-01..2025-01-05;2025-05-01..2025-05-03), 見積ポモ(estimatedPomodoros)</div>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
          }}
        />
        {result && (
          <div className="text-sm">
            インポート: {result.imported}件 / 失敗: {result.failed}件
            {result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs text-red-600 dark:text-red-400">
                {result.errors.map((er, i) => (
                  <li key={i}>{er}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div>
          <a className="text-sm underline" href="/sample-tasks.csv" download>
            サンプルCSVをダウンロード
          </a>
        </div>
      </div>

      <div className="border rounded p-4 border-black/10 dark:border-white/10 flex items-center justify-between">
        <div className="text-sm font-medium">エクスポート（CSV）</div>
        <button className="px-3 py-1 rounded bg-foreground text-background text-sm" onClick={exportCSV}>
          ダウンロード
        </button>
      </div>

      <div className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">インポート履歴</div>
          <button className="text-xs underline opacity-80" onClick={clearHistory}>履歴をすべて削除</button>
        </div>
        {history.length === 0 ? (
          <div className="text-sm opacity-70">履歴なし</div>
        ) : (
          <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
            {history.map((h) => (
              <div key={h.id} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <div className="font-medium">{h.fileName}</div>
                  <div className="text-xs opacity-70">{new Date(h.timestamp).toLocaleString()}</div>
                </div>
                <div className="text-xs">成功: {h.imported}</div>
                <div className="text-xs">失敗: {h.failed}</div>
                <button className="text-xs underline opacity-80" onClick={() => deleteHistory(h.id)}>
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



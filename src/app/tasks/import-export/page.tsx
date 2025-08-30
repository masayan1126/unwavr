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
  const addMilestone = useAppStore((s) => s.addMilestone);
  const addLauncherCategory = useAppStore((s) => s.addLauncherCategory);
  const addLauncherShortcut = useAppStore((s) => s.addLauncherShortcut);
  const setLauncherOnboarded = useAppStore((s) => s.setLauncherOnboarded);
  const addHistory = useAppStore((s) => s.addImportHistory);
  const history = useAppStore((s) => s.importHistory);
  const deleteHistory = useAppStore((s) => s.deleteImportHistory);
  const clearHistory = useAppStore((s) => s.clearImportHistory);
  const clearAll = useAppStore((s) => s.clearTasksMilestonesLaunchers);
  const [result, setResult] = useState<ImportResult | null>(null);
  const dayLabels = ["日","月","火","水","木","金","土"] as const;

  function generateDemoData() {
    // Milestones
    const milestoneTitles = [
      "React学習100時間",
      "英単語2000語",
      "ランニング300km",
      "読書20冊",
      "ブログ10記事"
    ];
    milestoneTitles.forEach((title, idx) => {
      addMilestone({ title, targetUnits: (idx + 1) * 10, currentUnits: Math.floor(((idx + 1) * 10) * 0.3) });
    });

    // Tasks
    // 20件: daily
    for (let i = 0; i < 20; i++) {
      addTask({
        title: `毎日タスク #${i + 1}`,
        description: i % 3 === 0 ? `説明: 習慣 ${i + 1}` : undefined,
        type: "daily",
        estimatedPomodoros: (i % 5),
      });
    }
    // 20件: scheduled（曜日＋期間混在）
    for (let i = 0; i < 20; i++) {
      const start = new Date();
      start.setDate(start.getDate() + i);
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(start.getDate() + 3);
      const daysOfWeek = [i % 7, (i + 2) % 7].sort();
      addTask({
        title: `特定日タスク #${i + 1}`,
        description: i % 4 === 0 ? `説明: 集中 ${i + 1}` : undefined,
        type: "scheduled",
        scheduled: {
          daysOfWeek,
          dateRanges: i % 2 === 0 ? [{ start: start.getTime(), end: end.getTime() }] : undefined,
        },
        estimatedPomodoros: (i % 4) + 1,
      });
    }
    // 20件: backlog（今日やる日付含む）
    for (let i = 0; i < 20; i++) {
      const today = new Date();
      const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      const another = new Date();
      another.setDate(another.getDate() + (i % 10));
      const anotherUtc = Date.UTC(another.getUTCFullYear(), another.getUTCMonth(), another.getUTCDate());
      const planned = i % 3 === 0 ? [todayUtc, anotherUtc] : [anotherUtc];
      addTask({
        title: `積み上げ候補 #${i + 1}`,
        description: i % 2 === 0 ? `説明: 後でやる ${i + 1}` : undefined,
        type: "backlog",
        plannedDates: planned,
        estimatedPomodoros: i % 3,
      });
    }

    // Launchers
    const cats = [
      { name: "学習", color: "#3b82f6" },
      { name: "開発", color: "#10b981" },
      { name: "情報収集", color: "#f59e0b" },
      { name: "コミュニケーション", color: "#8b5cf6" },
    ];
    cats.forEach((c) => addLauncherCategory({ name: c.name, color: c.color }));
    type ShortcutSeed = {
      label: string;
      url: string;
      iconName: string;
      color: string;
      categoryIndex: number;
      kind?: "web" | "app";
    };
    const shortcuts: ShortcutSeed[] = [
      { label: "GitHub", url: "https://github.com", iconName: "Github", color: "#000000", categoryIndex: 1 },
      { label: "StackOverflow", url: "https://stackoverflow.com", iconName: "MessageSquare", color: "#f48024", categoryIndex: 1 },
      { label: "MDN", url: "https://developer.mozilla.org", iconName: "BookOpen", color: "#000000", categoryIndex: 1 },
      { label: "Qiita", url: "https://qiita.com", iconName: "TrendingUp", color: "#55c500", categoryIndex: 2 },
      { label: "Zenn", url: "https://zenn.dev", iconName: "BookOpen", color: "#3ea8ff", categoryIndex: 2 },
      { label: "Notion", url: "https://www.notion.so", iconName: "NotebookPen", color: "#000000", categoryIndex: 0 },
      { label: "Google Calendar", url: "https://calendar.google.com", iconName: "Calendar", color: "#4285F4", categoryIndex: 3 },
      { label: "Slack", url: "slack://open", iconName: "MessageCircle", color: "#611f69", categoryIndex: 3, kind: "app" },
      { label: "Zoom", url: "zoommtg://", iconName: "Video", color: "#0B5CFF", categoryIndex: 3, kind: "app" },
    ];
    shortcuts.forEach((s) => {
      addLauncherShortcut({
        label: s.label,
        url: s.url,
        iconName: s.iconName,
        color: s.color,
        kind: s.kind ?? "web",
        categoryId: undefined,
      });
    });
    setLauncherOnboarded(true);

    alert("デモデータを作成しました（タスク60件、マイルストーン5件、ランチャー9件）");
  }

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
      description: headerIndex("description", "詳細"),
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
        <div className="text-xs opacity-70">ヘッダー行を含むCSVを選択してください。対応列（日本語/英語どちらでも可）: タイトル(title), 詳細(description), 種別(type: daily/scheduled/backlog), 曜日(daysOfWeek: 1;3;5), 期間(dateRanges: 2025-01-01..2025-01-05;2025-05-01..2025-05-03), 見積ポモ(estimatedPomodoros)</div>
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

      <div className="border rounded p-4 border-black/10 dark:border-white/10 flex items-center justify-between">
        <div className="text-sm font-medium">デモデータの作成</div>
        <button
          className="px-3 py-1 rounded bg-foreground text-background text-sm"
          onClick={async () => {
            const mod = await import('@/components/Providers');
            const ok = await mod.useConfirm()('デモデータ（タスク/ランチャー/マイルストーン）を大量生成します。続行しますか？', { confirmText: '生成' });
            if (ok) generateDemoData();
          }}
        >
          作成する
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

      <div className="border rounded p-4 border-red-500/30 bg-red-500/5 flex flex-col gap-3">
        <div className="text-sm font-medium text-red-600">危険な操作</div>
        <div className="text-xs opacity-80">タスク・マイルストーン・ランチャーの設定をすべて削除します。この操作は取り消せません。</div>
        <div>
          <button
            className="px-3 py-2 rounded bg-red-600 text-white text-sm"
            onClick={async () => {
              const mod = await import('@/components/Providers');
              const ok2 = await mod.useConfirm()('本当に全て削除しますか？この操作は取り消せません。', { tone: 'danger', confirmText: '削除' });
              if (ok2) {
                clearAll();
                alert('すべて削除しました');
              }
            }}
          >
            すべて削除（タスク/マイルストーン/ランチャー）
          </button>
        </div>
      </div>
    </div>
  );
}



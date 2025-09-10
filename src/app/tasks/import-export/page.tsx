"use client";
import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useConfirm, useToast } from "@/components/Providers";
import { TaskType, Scheduled, DateRange, type Task } from "@/lib/types";

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

function parsePlannedDates(input: string): number[] {
  if (!input.trim()) return [];
  const out: number[] = [];
  const parts = input.split(";").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const d = new Date(part);
    if (isNaN(d.getTime())) continue;
    const stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    out.push(stamp);
  }
  return out.sort((a,b)=>a-b);
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
  const hydrate = useAppStore((s) => s.hydrateFromDb);
  const [result, setResult] = useState<ImportResult | null>(null);
  const dayLabels = ["日","月","火","水","木","金","土"] as const;
  const confirm = useConfirm();
  const toast = useToast();
  // エクスポート設定（固定出力: 列選択なし）

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
    // 日本語/英語ヘッダー双方を許容（後方互換: 旧フォーマットも受容）
    const headerIndex = (...names: string[]) => {
      for (const n of names) {
        const i = header.indexOf(n);
        if (i !== -1) return i;
      }
      return -1;
    };
    const idx = {
      // 共通
      title: headerIndex("タイトル", "title"),
      description: headerIndex("詳細", "description"),
      // 種別（新: タイプ、日本語値 / 旧: 種別, 英語値）
      type: headerIndex("タイプ", "種別", "type"),
      // 特定曜日のタスク（新: 設定されている曜日 / 旧: 曜日）
      daysOfWeek: headerIndex("設定されている曜日", "曜日", "daysOfWeek"),
      // 積み上げ候補（新: 設定されている実行日）
      plannedDates: headerIndex("設定されている実行日"),
      // 旧フォーマット互換（期間/見積）
      dateRanges: headerIndex("期間", "dateRanges"),
      estimatedPomodoros: headerIndex("見積ポモ", "estimatedPomodoros"),
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
        const description = (cells[idx.description] ?? "").trim() || undefined;

        // 種別の解釈（日本語/英語双方を受容）
        const rawType = (cells[idx.type] ?? "").trim();
        let typeStr: TaskType;
        if (rawType === "毎日" || rawType.toLowerCase() === "daily") typeStr = "daily";
        else if (rawType === "特定曜日" || rawType.toLowerCase() === "scheduled") typeStr = "scheduled";
        else if (rawType === "積み上げ候補" || rawType.toLowerCase() === "backlog") typeStr = "backlog";
        else typeStr = "backlog";

        // 各列の解釈
        const daysRaw = (idx.daysOfWeek !== -1 ? (cells[idx.daysOfWeek] ?? "").trim() : "");
        const plannedRaw = (idx.plannedDates !== -1 ? (cells[idx.plannedDates] ?? "").trim() : "");
        const rangesRaw = (idx.dateRanges !== -1 ? (cells[idx.dateRanges] ?? "").trim() : "");
        const estRaw = (idx.estimatedPomodoros !== -1 ? (cells[idx.estimatedPomodoros] ?? "0").trim() : "0");

        const estimated = parseInt(estRaw || "0", 10);
        let scheduled: Scheduled | undefined = undefined;
        let plannedDates: number[] | undefined = undefined;

        if (typeStr === "scheduled") {
          const daysOfWeek = daysRaw ? parseDaysOfWeek(daysRaw) : [];
          const dateRanges = rangesRaw ? parseDateRanges(rangesRaw) : [];
          scheduled = { daysOfWeek, dateRanges: dateRanges.length ? dateRanges : undefined };
        }
        if (typeStr === "backlog") {
          const planned = plannedRaw ? parsePlannedDates(plannedRaw) : [];
          plannedDates = planned.length ? planned : undefined;
        }

        addTask({
          title,
          description,
          type: typeStr,
          scheduled,
          plannedDates,
          estimatedPomodoros: Number.isFinite(estimated) ? estimated : 0,
        });
        ok++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`行${i + 1}: ${msg}`);
      }
    }
    const summary = { imported: ok, failed: errors.length, errors };
    setResult(summary);
    addHistory({ fileName: file.name, ...summary, timestamp: Date.now() });
    if (errors.length === 0) {
      toast.show(`インポート完了: ${ok}件`, 'success');
    } else {
      toast.show(`インポート完了: 成功${ok}件 / 失敗${errors.length}件`, 'warning');
    }
  }

  function exportCSV() {
    const csv = generateCSV(tasks);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show('CSVをエクスポートしました', 'success');
  }

  type ExportOptions = {};

  function generateCSV(tasksList: Task[], opts?: ExportOptions): string {
    const options: ExportOptions = opts ?? {};
    const esc = (v: string): string => (v.includes(",") || v.includes("\n") || v.includes("\r") ? `"${v.replaceAll('"', '""')}"` : v);
    const wrap = (v: string, n: number = 20): string => {
      if (!v || v.length <= n) return v;
      const parts: string[] = [];
      for (let i = 0; i < v.length; i += n) parts.push(v.slice(i, i + n));
      // セル内改行も CRLF にして Excel 等での表示を安定化
      return parts.join("\r\n");
    };

    const header: string[] = ["タイトル", "詳細", "タイプ", "設定されている曜日", "設定されている実行日"];

    const rows = tasksList.map((t) => {
      const cells: string[] = [];
      // タイトルは30文字、詳細は60文字で折り返し
      const title = wrap(t.title ?? "", 30);
      const desc = wrap(t.description ?? "", 60);
      const typeLabel = t.type === "daily" ? "毎日" : t.type === "scheduled" ? "特定曜日" : "積み上げ候補";
      cells.push(esc(title), esc(desc), esc(typeLabel));

      const daysRaw = t.type === "scheduled"
        ? (t.scheduled?.daysOfWeek ?? []).map((n) => (n >= 0 && n <= 6 ? dayLabels[n] : String(n))).join(";")
        : "-";
      const days = wrap(daysRaw || "-", 20);
      cells.push(esc(days));

      const plannedRaw = t.type === "backlog"
        ? (t.plannedDates ?? []).slice().sort((a,b)=>a-b).map((ts) => formatDate(ts)).join(";")
        : "-";
      const planned = wrap(plannedRaw || "-", 20);
      cells.push(esc(planned));
      return cells.join(",");
    });
    const EOL = "\r\n";
    return [header.join(","), ...rows].join(EOL);
  }

  async function exportCSVChooseFile(): Promise<void> {
    const fileName = `tasks_export_${Date.now()}.csv`;
    // Feature detection for File System Access API
    const anyWindow = window as unknown as {
      showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>;
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    };
    const csv = generateCSV(tasks);
    try {
      if (anyWindow.showSaveFilePicker) {
        const fileHandle = await anyWindow.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'CSV Files',
              accept: { 'text/csv': ['.csv'] },
            },
          ],
        } as unknown);
        const writable = await fileHandle.createWritable();
        await writable.write(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        await writable.close();
        toast.show(`CSVを保存しました: ${fileName}`, 'success');
        return;
      }
      if (anyWindow.showDirectoryPicker) {
        const dir = await anyWindow.showDirectoryPicker();
        const fileHandle = await dir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        await writable.close();
        toast.show(`CSVを保存しました: ${fileName}`, 'success');
        return;
      }
      exportCSV();
      toast.show('ブラウザ未対応のため通常ダウンロードで出力しました', 'info');
    } catch (e) {
      const err = e as Error;
      const message = err?.message ?? '保存に失敗しました';
      if (message.toLowerCase().includes('abort') || message.toLowerCase().includes('cancel')) {
        toast.show('保存をキャンセルしました', 'info');
        return;
      }
      toast.show(message, 'error');
    }
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">タスクのインポート/エクスポート</h1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>

      <div className="border rounded p-4 border-[var(--border)] flex flex-col gap-3">
        <div className="text-sm font-medium">インポート（CSV）</div>
        <div className="text-xs opacity-70">
          ヘッダー行を含むCSVを選択してください。推奨フォーマット（日本語）:
          タイトル, 詳細, タイプ(毎日/積み上げ候補/特定曜日), 設定されている曜日(例: 日;火;木), 設定されている実行日(例: 2025-05-10;2025-05-12)
          <br />
          後方互換として旧フォーマット（英語列名: title, description, type, daysOfWeek, dateRanges など）も受け付けます。
        </div>
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
              <ul className="mt-2 list-disc pl-5 text-xs text-[var(--danger)] dark:text-[var(--danger)]">
                {result.errors.map((er, i) => (
                  <li key={i}>{er}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div>
          <a className="text-sm underline" href="/sample-tasks.csv" download onClick={() => toast.show('サンプルCSVをダウンロードします', 'info')}>
            サンプルCSVをダウンロード
          </a>
        </div>
      </div>

      <div className="border rounded p-4 border-[var(--border)] flex flex-col gap-3">
        <div className="text-sm font-medium">エクスポート（CSV）</div>
        <div className="flex flex-wrap items-center gap-3 text-xs" />
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded border text-sm" onClick={exportCSV}>
            通常ダウンロード
          </button>
          <button className="px-3 py-1 rounded bg-foreground text-background text-sm" onClick={exportCSVChooseFile}>
            保存先を選んでエクスポート
          </button>
        </div>
      </div>

      <div className="border rounded p-4 border-[var(--border)] flex items-center justify-between">
        <div className="text-sm font-medium">デモデータ / サンプル投入</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border text-sm"
            onClick={async () => {
              const ok = await confirm('エンジニア向けの実務的なサンプル（タスク/マイルストーン/ランチャー）をDBに投入します。続行しますか？', { confirmText: '投入' });
              if (!ok) return;
              try {
                const res = await fetch('/api/db/seed/engineer', { method: 'POST' });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  toast.show(`投入に失敗: ${err.error ?? res.statusText}`, 'error');
                  return;
                }
                await hydrate();
                toast.show('エンジニア向けサンプルを投入しました', 'success');
              } catch {
                toast.show('投入に失敗しました', 'error');
              }
            }}
          >
            デモデータ投入
          </button>
        </div>
      </div>

      <div className="border rounded p-4 border-[var(--border)] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">インポート履歴</div>
          <button className="text-xs underline opacity-80" onClick={() => { clearHistory(); toast.show('履歴をすべて削除しました', 'success'); }}>履歴をすべて削除</button>
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
                <button className="text-xs underline opacity-80" onClick={() => { deleteHistory(h.id); toast.show('履歴を削除しました', 'success'); }}>
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded p-4 border-[var(--danger)]/30 bg-[var(--danger)]/5 flex flex-col gap-3">
        <div className="text-sm font-medium text-[var(--danger)]">危険な操作</div>
        <div className="text-xs opacity-80">タスク・マイルストーン・ランチャーの設定をすべて削除します。この操作は取り消せません。</div>
        <div>
          <button
            className="px-3 py-2 rounded bg-[var(--danger)] text-white text-sm"
            onClick={async () => {
              const ok2 = await confirm('本当に全て削除しますか？この操作は取り消せません。', { tone: 'danger', confirmText: '削除' });
              if (ok2) {
                clearAll();
                toast.show('すべて削除しました', 'success');
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



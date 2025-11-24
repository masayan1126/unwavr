"use client";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useToast, useConfirm } from "@/components/Providers";
import { useState } from "react";

export default function MilestonesImportExportPage() {
  const exportMilestones = useAppStore((s) => s.exportMilestones);
  const importMilestones = useAppStore((s) => s.importMilestones);
  const hydrateFromDb = useAppStore((s) => s.hydrateFromDb);
  const milestones = useAppStore((s) => s.milestones);
  const toast = useToast();
  const confirm = useConfirm();
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ success: boolean; imported?: number; errors?: string[] } | null>(null);
  const [importHistory, setImportHistory] = useState<{ id: string; timestamp: number; imported: number; failed: number }[]>([]);
  const [exportHistory, setExportHistory] = useState<{ id: string; timestamp: number; count: number }[]>([]);

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">マイルストーンのインポート/エクスポート</h1>
        <Link className="text-sm underline opacity-80" href="/milestones">一覧へ戻る</Link>
      </div>

      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="text-sm font-medium">エクスポート（CSV）</div>
        <button
          className="px-3 py-1.5 rounded text-sm bg-[var(--primary)] text-[#0f172a] border border-transparent hover:opacity-80"
          onClick={() => {
            exportMilestones();
            setExportHistory((arr) => [{ id: `exp_${Date.now()}`, timestamp: Date.now(), count: milestones.length }, ...arr]);
            toast.show('CSVをエクスポートしました', 'success');
          }}
        >
          エクスポート
        </button>
      </div>

      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
        <div className="text-sm font-medium">インポート（CSV/JSON）</div>
        <div className="text-xs opacity-70">CSV推奨ヘッダー: タイトル,目標,現在,期限（YYYY-MM-DD）</div>
        <textarea className="border rounded p-2 h-40 bg-transparent text-sm" placeholder="CSV または JSON を貼り付け" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded border text-sm"
            onClick={() => {
              const res = importMilestones(text);
              setResult(res);
              if (res.success) {
                const imported = res.imported ?? 0;
                setImportHistory((arr) => [{ id: `imp_${Date.now()}`, timestamp: Date.now(), imported, failed: res.errors?.length ?? 0 }, ...arr]);
                toast.show(`インポート完了: ${imported}件`, 'success');
                hydrateFromDb();
              } else {
                setImportHistory((arr) => [{ id: `imp_${Date.now()}`, timestamp: Date.now(), imported: 0, failed: res.errors?.length ?? 1 }, ...arr]);
                toast.show(res.errors?.[0] ?? 'インポート失敗', 'error');
              }
            }}
          >インポート</button>
          <button className="px-3 py-1 rounded border text-sm" onClick={() => setText("")}>クリア</button>
        </div>
        {result && (
          <div className="text-sm">
            成功: {result.success ? 'はい' : 'いいえ'} {result.imported != null ? `（${result.imported}件）` : ''}
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs text-[var(--danger)] dark:text-[var(--danger)]">
                {result.errors.map((er, i) => (<li key={i}>{er}</li>))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="text-sm font-medium">サンプル投入（マイルストーン）</div>
        <button className="px-3 py-1 rounded border text-sm" onClick={async () => {
          const ok = await confirm('サンプルのマイルストーンをDBに投入します。続行しますか？', { confirmText: '投入' });
          if (!ok) return;
          try {
            const samples = [
              { title: 'React学習100時間', targetUnits: 100, currentUnits: 30 },
              { title: '読書20冊', targetUnits: 20, currentUnits: 5 },
            ];
            for (const m of samples) {
              await fetch('/api/db/milestones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
            }
            await hydrateFromDb();
            toast.show('サンプルを投入しました', 'success');
          } catch {
            toast.show('投入に失敗しました', 'error');
          }
        }}>デモデータ投入</button>
      </div>

      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">インポート履歴</div>
          <button className="text-xs underline opacity-80" onClick={() => setImportHistory([])}>履歴をすべて削除</button>
        </div>
        {importHistory.length === 0 ? (
          <div className="text-sm opacity-70">履歴なし</div>
        ) : (
          <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
            {importHistory.map((h) => (
              <div key={h.id} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <div className="font-medium">貼り付けからのインポート</div>
                  <div className="text-xs opacity-70">{new Date(h.timestamp).toLocaleString()}</div>
                </div>
                <div className="text-xs">成功: {h.imported}</div>
                <div className="text-xs">失敗: {h.failed}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">エクスポート履歴</div>
          <button className="text-xs underline opacity-80" onClick={() => setExportHistory([])}>履歴をすべて削除</button>
        </div>
        {exportHistory.length === 0 ? (
          <div className="text-sm opacity-70">履歴なし</div>
        ) : (
          <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
            {exportHistory.map((h) => (
              <div key={h.id} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <div className="font-medium">CSVエクスポート</div>
                  <div className="text-xs opacity-70">{new Date(h.timestamp).toLocaleString()}</div>
                </div>
                <div className="text-xs">件数: {h.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

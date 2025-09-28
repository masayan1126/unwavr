"use client";
import { useState, useRef } from "react";
import { useAppStore } from "@/lib/store";

export default function Milestones() {
  const milestones = useAppStore((s) => s.milestones);
  const add = useAppStore((s) => s.addMilestone);
  const update = useAppStore((s) => s.updateMilestoneProgress);
  const remove = useAppStore((s) => s.removeMilestone);
  const exportMilestones = useAppStore((s) => s.exportMilestones);
  const importMilestones = useAppStore((s) => s.importMilestones);

  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(10);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportMilestones();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importMilestones(content);
      
      if (result.success) {
        setImportMessage({
          type: 'success',
          message: `${result.imported}個のマイルストーンをインポートしました。${result.errors.length > 0 ? ` (${result.errors.length}個のエラー)` : ''}`
        });
      } else {
        setImportMessage({
          type: 'error',
          message: `インポートに失敗しました: ${result.errors.join(', ')}`
        });
      }

      // メッセージを3秒後に消す
      setTimeout(() => setImportMessage(null), 3000);
    };
    reader.readAsText(file);

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border border-black/10 dark:border-white/10 rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wide opacity-70">マイルストーン</div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1 rounded border text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={milestones.length === 0}
            title="CSV形式（日本語ヘッダー）でダウンロードします"
          >
            CSVエクスポート
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded border text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
            title="CSV/JSONのどちらでもインポートできます（推奨: CSV）"
          >
            CSVインポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {importMessage && (
        <div className={`mb-3 p-2 rounded text-xs ${
          importMessage.type === 'success' 
            ? 'bg-[var(--primary)]/15 text-[var(--primary)] dark:bg-[var(--primary)]/20 dark:text-[var(--primary)]' 
            : 'bg-[var(--danger)]/15 text-[var(--danger)] dark:bg-[var(--danger)]/20 dark:text-[var(--danger)]'
        }`}>
          {importMessage.message}
        </div>
      )}

      <form
        className="flex gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          add({ title: title.trim(), targetUnits: target, currentUnits: 0 });
          setTitle("");
          setTarget(10);
        }}
      >
        <input
          className="flex-1 border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
          placeholder="マイルストーン名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="w-24 border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
          value={target}
          onChange={(e) => setTarget(parseInt(e.target.value || "1", 10))}
        />
        <button className="px-3 py-1 rounded bg-foreground text-background text-sm">追加</button>
      </form>

      <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
        {milestones.length === 0 ? (
          <div className="text-sm opacity-60 py-2">マイルストーンなし</div>
        ) : (
          milestones.map((m) => (
            <div key={m.id} className="py-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{m.title}</div>
                <button className="text-xs opacity-70 underline" onClick={() => remove(m.id)}>
                  削除
                </button>
              </div>
              <div className="text-xs opacity-70 mb-1">
                {m.currentUnits}/{m.targetUnits}
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded border text-xs" onClick={() => update(m.id, -1)}>
                  -1
                </button>
                <button className="px-2 py-1 rounded border text-xs" onClick={() => update(m.id, 1)}>
                  +1
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



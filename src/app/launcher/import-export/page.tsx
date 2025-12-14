"use client";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useToast, useConfirm } from "@/components/Providers";
import { useState } from "react";

export default function LauncherImportExportPage() {
  const exportLaunchers = useAppStore((s) => s.exportLaunchers);
  const importLaunchers = useAppStore((s) => s.importLaunchers);
  const hydrateFromDb = useAppStore((s) => s.hydrateFromDb);
  const toast = useToast();
  const confirm = useConfirm();
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);
  const [result, setResult] = useState<{ success: boolean; importedShortcuts?: number; importedCategories?: number; errors?: string[] } | null>(null);

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ランチャーのインポート/エクスポート</h1>
        <Link className="text-sm underline opacity-80" href="/launcher">一覧へ戻る</Link>
      </div>

      <div className="border rounded p-4 border-[var(--border)] flex items-center justify-between">
        <div className="text-sm font-medium">エクスポート（JSON）</div>
        <button style={{ backgroundColor: "var(--primary)" }} className="px-3 py-1.5 rounded text-sm text-white dark:text-background border border-transparent hover:opacity-80" onClick={async () => {
          const fileName = `launchers_${Date.now()}.json`;
          const data = {
            categories: useAppStore.getState().launcherCategories,
            shortcuts: useAppStore.getState().launcherShortcuts,
          };
          const json = JSON.stringify(data, null, 2);

          // Feature detection for File System Access API
          const anyWindow = window as unknown as {
            showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>;
            showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
          };

          try {
            if (anyWindow.showSaveFilePicker) {
              const fileHandle = await anyWindow.showSaveFilePicker({
                suggestedName: fileName,
                types: [
                  {
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] },
                  },
                ],
              } as unknown);
              const writable = await fileHandle.createWritable();
              await writable.write(new Blob([json], { type: 'application/json' }));
              await writable.close();
              toast.show(`JSONを保存しました: ${fileName}`, 'success');
              return;
            }
            if (anyWindow.showDirectoryPicker) {
              const dir = await anyWindow.showDirectoryPicker();
              const fileHandle = await dir.getFileHandle(fileName, { create: true });
              const writable = await fileHandle.createWritable();
              await writable.write(new Blob([json], { type: 'application/json' }));
              await writable.close();
              toast.show(`JSONを保存しました: ${fileName}`, 'success');
              return;
            }
            // Fallback
            exportLaunchers();
            toast.show('JSONをエクスポートしました', 'success');
          } catch (e) {
            const err = e as Error;
            const message = err?.message ?? '保存に失敗しました';
            if (message.toLowerCase().includes('abort') || message.toLowerCase().includes('cancel')) {
              toast.show('保存をキャンセルしました', 'info');
              return;
            }
            toast.show(message, 'error');
          }
        }}>
          エクスポート
        </button>
      </div>

      <div className="border rounded p-4 border-[var(--border)] flex flex-col gap-3">
        <div className="text-sm font-medium">インポート（JSON）</div>
        <div className="text-xs opacity-70">Launcher カテゴリ/ショートカットのJSONを貼り付けてください。</div>
        <textarea className="border rounded p-2 h-40 bg-transparent text-sm" placeholder="JSON を貼り付け" value={text} onChange={(e) => setText(e.target.value)} />
        <label className="inline-flex items-center gap-2 text-xs opacity-80">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> 既存を置き換える
        </label>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded border text-sm" onClick={() => {
            try {
              const res = importLaunchers(text, replace);
              setResult(res);
              if (res.success) { toast.show(`インポート完了: ショートカット${res.importedShortcuts ?? 0} / カテゴリ${res.importedCategories ?? 0}`, 'success'); hydrateFromDb(); }
              else { toast.show(res.errors?.[0] ?? 'インポート失敗', 'error'); }
            } catch {
              toast.show('インポート失敗', 'error');
            }
          }}>インポート</button>
          <button className="px-3 py-1 rounded border text-sm" onClick={() => setText("")}>クリア</button>
        </div>
        {result && (
          <div className="text-sm">
            成功: {result.success ? 'はい' : 'いいえ'} {result.importedShortcuts != null || result.importedCategories != null ? `（ショートカット${result.importedShortcuts ?? 0} / カテゴリ${result.importedCategories ?? 0}）` : ''}
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs text-[var(--danger)] dark:text-[var(--danger)]">
                {result.errors.map((er, i) => (<li key={i}>{er}</li>))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="border rounded p-4 border-[var(--border)] flex items-center justify-between">
        <div className="text-sm font-medium">サンプル投入（ランチャー）</div>
        <button className="px-3 py-1 rounded border text-sm" onClick={async () => {
          const ok = await confirm('サンプルのランチャー設定をDBに投入します。続行しますか？', { confirmText: '投入' });
          if (!ok) return;
          try {
            const cats = [
              { name: '学習', color: '#3b82f6' },
              { name: '情報収集', color: '#f59e0b' },
            ];
            for (const c of cats) {
              await fetch('/api/db/launchers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: [{ ...c, id: `cat_${Math.random().toString(36).slice(2)}` }] }) });
            }
            await hydrateFromDb();
            toast.show('サンプルを投入しました', 'success');
          } catch {
            toast.show('投入に失敗しました', 'error');
          }
        }}>デモデータ投入</button>
      </div>
    </div>
  );
}

"use client";
import { useAppStore } from "@/lib/store";
import { useToast, useConfirm } from "@/components/Providers";
import { useState, useRef } from "react";
import { Download, Upload, Database, FileUp, Trash2, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";

function formatDateTimeForFilename(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}_${hh}${mm}${ss}`;
}

export default function MilestonesImportExport() {
    const exportMilestones = useAppStore((s) => s.exportMilestones);
    const importMilestones = useAppStore((s) => s.importMilestones);
    const hydrateFromDb = useAppStore((s) => s.hydrateFromDb);
    const milestones = useAppStore((s) => s.milestones);
    const toast = useToast();
    const confirm = useConfirm();
    const [text, setText] = useState("");
    const [result, setResult] = useState<{ success: boolean; imported?: number; errors?: string[] } | null>(null);
    const [importHistory, setImportHistory] = useState<{ id: string; timestamp: number; imported: number; failed: number; fileName?: string }[]>([]);
    const [exportHistory, setExportHistory] = useState<{ id: string; timestamp: number; count: number }[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>("");

    async function handleFileImport(file: File) {
        const content = await file.text();
        const res = importMilestones(content);
        setResult(res);
        if (res.success) {
            const imported = res.imported ?? 0;
            setImportHistory((arr) => [{ id: `imp_${Date.now()}`, timestamp: Date.now(), imported, failed: res.errors?.length ?? 0, fileName: file.name }, ...arr]);
            toast.show(`インポート完了: ${imported}件`, 'success');
            hydrateFromDb();
        } else {
            setImportHistory((arr) => [{ id: `imp_${Date.now()}`, timestamp: Date.now(), imported: 0, failed: res.errors?.length ?? 1, fileName: file.name }, ...arr]);
            toast.show(res.errors?.[0] ?? 'インポート失敗', 'error');
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    async function handleExport() {
        const csv = exportMilestones();
        const fileName = `milestones_export_${formatDateTimeForFilename()}.csv`;

        // Feature detection for File System Access API
        const anyWindow = window as unknown as {
            showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>;
            showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
        };

        try {
            if (anyWindow.showSaveFilePicker) {
                const fileHandle = await anyWindow.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{ description: 'CSV Files', accept: { 'text/csv': ['.csv'] } }],
                } as unknown);
                const writable = await fileHandle.createWritable();
                await writable.write(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
                await writable.close();
                toast.show(`CSVを保存しました: ${fileName}`, 'success');
                setExportHistory((arr) => [{ id: `exp_${Date.now()}`, timestamp: Date.now(), count: milestones.length }, ...arr]);
                return;
            }
            if (anyWindow.showDirectoryPicker) {
                const dir = await anyWindow.showDirectoryPicker();
                const fileHandle = await dir.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
                await writable.close();
                toast.show(`CSVを保存しました: ${fileName}`, 'success');
                setExportHistory((arr) => [{ id: `exp_${Date.now()}`, timestamp: Date.now(), count: milestones.length }, ...arr]);
                return;
            }

            // Fallback
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setExportHistory((arr) => [{ id: `exp_${Date.now()}`, timestamp: Date.now(), count: milestones.length }, ...arr]);
            toast.show('CSVをエクスポートしました', 'success');
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
        <div className="flex flex-col gap-6">
            {/* エクスポートセクション */}
            <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Download size={16} className="text-primary" />
                    <span>エクスポート（CSV）</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    マイルストーンをCSVファイルとして保存します。ファイル名には日時が自動で付与されます。
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleExport} iconLeft={<Download size={14} />}>
                        エクスポート
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {milestones.length}件のマイルストーン
                    </span>
                </div>
            </div>

            {/* インポートセクション */}
            <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Upload size={16} className="text-primary" />
                    <span>インポート（CSV/JSON）</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    CSV推奨ヘッダー: タイトル, 目標, 現在, 期限（YYYY-MM-DD）
                </div>

                {/* ファイル選択インポート */}
                <div className="flex items-center gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json,text/csv,application/json"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setSelectedFileName(f.name);
                            handleFileImport(f);
                        }}
                    />
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        iconLeft={<FileUp size={14} />}
                    >
                        ファイルを選択
                    </Button>
                    {selectedFileName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                            <FileText size={12} />
                            <span className="truncate max-w-[200px]" title={selectedFileName}>{selectedFileName}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">または</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* テキスト貼り付けインポート */}
                <textarea
                    className="w-full border border-border rounded-lg p-3 h-32 bg-transparent text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="CSV または JSON を貼り付け..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            if (!text.trim()) {
                                toast.show('テキストを入力してください', 'warning');
                                return;
                            }
                            const res = importMilestones(text);
                            setResult(res);
                            if (res.success) {
                                const imported = res.imported ?? 0;
                                setImportHistory((arr) => [{ id: `imp_${Date.now()}`, timestamp: Date.now(), imported, failed: res.errors?.length ?? 0, fileName: '貼り付け' }, ...arr]);
                                toast.show(`インポート完了: ${imported}件`, 'success');
                                setText("");
                                hydrateFromDb();
                            } else {
                                setImportHistory((arr) => [{ id: `imp_${Date.now()}`, timestamp: Date.now(), imported: 0, failed: res.errors?.length ?? 1, fileName: '貼り付け' }, ...arr]);
                                toast.show(res.errors?.[0] ?? 'インポート失敗', 'error');
                            }
                        }}
                        iconLeft={<Upload size={14} />}
                        disabled={!text.trim()}
                    >
                        インポート
                    </Button>
                    <Button variant="ghost" onClick={() => setText("")} disabled={!text}>
                        クリア
                    </Button>
                </div>

                {/* 結果表示 */}
                {result && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${result.success
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                        : 'bg-red-500/10 text-red-700 dark:text-red-400'
                        }`}>
                        {result.success ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
                        <div>
                            <div className="font-medium">
                                {result.success ? `${result.imported}件をインポートしました` : 'インポートに失敗しました'}
                            </div>
                            {result.errors && result.errors.length > 0 && (
                                <ul className="mt-1 list-disc pl-4 text-xs opacity-80">
                                    {result.errors.slice(0, 5).map((er, i) => (<li key={i}>{er}</li>))}
                                    {result.errors.length > 5 && <li>...他 {result.errors.length - 5}件のエラー</li>}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* サンプル投入セクション */}
            <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Database size={16} className="text-primary" />
                    <span>サンプル投入（マイルストーン）</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    デモ用のサンプルマイルストーンをデータベースに追加します。
                </div>
                <div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
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
                        }}
                        iconLeft={<Database size={14} />}
                    >
                        デモデータ投入
                    </Button>
                </div>
            </div>

            {/* インポート履歴 */}
            <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock size={16} className="text-primary" />
                        <span>インポート履歴</span>
                    </div>
                    {importHistory.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setImportHistory([])}>
                            <Trash2 size={12} className="mr-1" />
                            履歴をクリア
                        </Button>
                    )}
                </div>
                {importHistory.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">履歴なし</div>
                ) : (
                    <div className="flex flex-col divide-y divide-border">
                        {importHistory.map((h) => (
                            <div key={h.id} className="py-3 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${h.failed === 0 ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                                    {h.failed === 0 ? (
                                        <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                                    ) : (
                                        <XCircle size={14} className="text-amber-600 dark:text-amber-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{h.fileName || '貼り付けからのインポート'}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</div>
                                </div>
                                <div className="flex items-center gap-3 text-xs shrink-0">
                                    <span className="text-green-600 dark:text-green-400">成功: {h.imported}</span>
                                    {h.failed > 0 && <span className="text-red-600 dark:text-red-400">失敗: {h.failed}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* エクスポート履歴 */}
            <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock size={16} className="text-primary" />
                        <span>エクスポート履歴</span>
                    </div>
                    {exportHistory.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setExportHistory([])}>
                            <Trash2 size={12} className="mr-1" />
                            履歴をクリア
                        </Button>
                    )}
                </div>
                {exportHistory.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">履歴なし</div>
                ) : (
                    <div className="flex flex-col divide-y divide-border">
                        {exportHistory.map((h) => (
                            <div key={h.id} className="py-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Download size={14} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">CSVエクスポート</div>
                                    <div className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</div>
                                </div>
                                <div className="text-xs text-muted-foreground shrink-0">
                                    {h.count}件
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

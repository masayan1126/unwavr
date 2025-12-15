"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Milestone } from "@/lib/types";
import { Pencil, Trash2, X, Plus, Pin, Maximize2, Minimize2, ChevronDown, ChevronRight, ListTodo, Check, Tag, Download, Upload } from "lucide-react";
import { Task } from "@/lib/types";
import WysiwygEditor from "./WysiwygEditor";

interface EditingMilestone {
  id: string;
  title: string;
  description: string;
  targetUnits: number;
  tag: string;
}

// 押しピンの色をランダムに選択するための配列
const pinColors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
];

// IDから一貫した色を取得
function getPinColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return pinColors[Math.abs(hash) % pinColors.length];
}

// カードの微妙な回転角度を取得
function getCardRotation(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rotation = (hash % 5) - 2; // -2 to 2 degrees
  return `rotate(${rotation}deg)`;
}

// ファイル名用の日時フォーマット
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

// マイルストーン詳細・編集ダイアログ
function MilestoneDialog({
  milestone,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isNew = false,
}: {
  milestone: EditingMilestone | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditingMilestone) => void;
  onDelete?: () => void;
  isNew?: boolean;
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [editing, setEditing] = useState<EditingMilestone | null>(milestone);
  const isLauncherOpen = useAppStore((s) => s.isLauncherOpen);

  // milestone が変更されたら editing を更新
  useEffect(() => {
    setEditing(milestone);
  }, [milestone]);

  if (!isOpen || !editing) return null;

  const handleSave = () => {
    if (!editing.title.trim()) return;
    onSave(editing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`z-10 bg-card text-foreground shadow-2xl flex flex-col overflow-hidden ${isMaximized
          ? `fixed inset-0 rounded-none ${isLauncherOpen ? "xl:right-[260px]" : ""}`
          : "relative w-full max-w-2xl max-h-[90vh] rounded-xl mx-4"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Pin size={16} />
            <span className="font-medium text-foreground">
              {isNew ? "新しいマイルストーン" : "マイルストーンを編集"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors"
              onClick={() => setIsMaximized(!isMaximized)}
              aria-label={isMaximized ? "元に戻す" : "最大化"}
            >
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors"
              onClick={onClose}
              aria-label="閉じる"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* タイトル */}
          <div>
            <label className="text-sm font-medium mb-2 block">タイトル</label>
            <input
              className="w-full border border-border rounded-[var(--radius-md)] px-4 py-3 bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-fast"
              placeholder="達成したい目標"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              autoFocus
            />
          </div>

          {/* 目標値 */}
          <div>
            <label className="text-sm font-medium mb-2 block">目標値</label>
            <input
              type="number"
              min={1}
              className="w-full border border-border rounded-[var(--radius-md)] px-4 py-3 bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-fast"
              value={editing.targetUnits}
              onChange={(e) => setEditing({ ...editing, targetUnits: parseInt(e.target.value || "1", 10) })}
            />
          </div>

          {/* タグ */}
          <div>
            <label className="text-sm font-medium mb-2 block">タグ（任意）</label>
            <input
              className="w-full border border-border rounded-[var(--radius-md)] px-4 py-3 bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-fast"
              placeholder="例: 仕事、健康、学習..."
              value={editing.tag}
              onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">同じタグのマイルストーンがグループ化されます</p>
          </div>

          {/* 詳細 */}
          <div>
            <label className="text-sm font-medium mb-2 block">詳細（任意）</label>
            <WysiwygEditor
              value={editing.description}
              onChange={(html) => setEditing({ ...editing, description: html })}
            />
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <div>
            {!isNew && onDelete && (
              <Button variant="ghost" onClick={onDelete} iconLeft={<Trash2 size={14} />} className="text-danger hover:text-danger hover:bg-danger/10">
                削除
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={!editing.title.trim()}>
              {isNew ? "追加する" : "保存"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Milestones() {
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const add = useAppStore((s) => s.addMilestone);
  const update = useAppStore((s) => s.updateMilestone);
  const updateProgress = useAppStore((s) => s.updateMilestoneProgress);
  const remove = useAppStore((s) => s.removeMilestone);
  const exportMilestones = useAppStore((s) => s.exportMilestones);
  const importMilestones = useAppStore((s) => s.importMilestones);

  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<EditingMilestone | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // マイルストーンに紐付いたタスクを取得
  const getTasksForMilestone = (milestoneId: string): Task[] => {
    return tasks.filter((t) => t.milestoneId === milestoneId);
  };

  // 展開/折りたたみを切り替え
  const toggleExpand = (milestoneId: string) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }
      return next;
    });
  };

  // タグでグループ化
  const groupedMilestones = useMemo(() => {
    const groups: { tag: string; milestones: Milestone[] }[] = [];
    const tagMap = new Map<string, Milestone[]>();

    milestones.forEach((m) => {
      const tag = m.tag || "";
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)!.push(m);
    });

    // タグありのグループをアルファベット順で並べる
    const sortedTags = Array.from(tagMap.keys())
      .filter((t) => t !== "")
      .sort((a, b) => a.localeCompare(b, "ja"));

    sortedTags.forEach((tag) => {
      groups.push({ tag, milestones: tagMap.get(tag)! });
    });

    // タグなしは最後に
    if (tagMap.has("")) {
      groups.push({ tag: "", milestones: tagMap.get("")! });
    }

    return groups;
  }, [milestones]);

  // 全てのユニークなタグを取得（ドロップダウン用）
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    milestones.forEach((m) => {
      if (m.tag) tags.add(m.tag);
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b, "ja"));
  }, [milestones]);

  const handleExport = async () => {
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
        setImportMessage({ type: 'success', message: `CSVを保存しました: ${fileName}` });
        setTimeout(() => setImportMessage(null), 3000);
        return;
      }
      if (anyWindow.showDirectoryPicker) {
        const dir = await anyWindow.showDirectoryPicker();
        const fileHandle = await dir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        await writable.close();
        setImportMessage({ type: 'success', message: `CSVを保存しました: ${fileName}` });
        setTimeout(() => setImportMessage(null), 3000);
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
      setImportMessage({ type: 'success', message: 'CSVをエクスポートしました' });
      setTimeout(() => setImportMessage(null), 3000);
    } catch (e) {
      const err = e as Error;
      const message = err?.message ?? '保存に失敗しました';
      if (message.toLowerCase().includes('abort') || message.toLowerCase().includes('cancel')) {
        setImportMessage({ type: 'success', message: '保存をキャンセルしました' });
        setTimeout(() => setImportMessage(null), 3000);
        return;
      }
      setImportMessage({ type: 'error', message });
      setTimeout(() => setImportMessage(null), 3000);
    }
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

      setTimeout(() => setImportMessage(null), 3000);
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditDialog = (m: Milestone) => {
    setEditingMilestone({
      id: m.id,
      title: m.title,
      description: m.description || "",
      targetUnits: m.targetUnits,
      tag: m.tag || "",
    });
    setShowEditDialog(true);
  };

  const openAddDialog = () => {
    setEditingMilestone({
      id: "",
      title: "",
      description: "",
      targetUnits: 10,
      tag: "",
    });
    setShowAddDialog(true);
  };

  const handleSaveNew = (data: EditingMilestone) => {
    add({
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      targetUnits: data.targetUnits,
      tag: data.tag.trim() || undefined,
      currentUnits: 0,
      order: 0,
    });
  };

  const handleSaveEdit = (data: EditingMilestone) => {
    update(data.id, {
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      tag: data.tag.trim() || undefined,
      targetUnits: data.targetUnits,
    });
  };

  const handleDelete = () => {
    if (editingMilestone) {
      remove(editingMilestone.id);
      setShowEditDialog(false);
      setEditingMilestone(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Pin size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">マイルストーン</h2>
          <span className="text-sm text-muted-foreground">({milestones.length})</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={openAddDialog}
            size="sm"
            variant="primary"
            iconLeft={<Plus size={14} />}
          >
            追加
          </Button>
          <Button
            onClick={handleExport}
            size="sm"
            variant="outline"
            disabled={milestones.length === 0}
            iconLeft={<Download size={14} />}
          >
            エクスポート
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            iconLeft={<Upload size={14} />}
          >
            インポート
          </Button>
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
        <div className={`p-3 rounded-lg text-sm ${importMessage.type === 'success'
          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
          : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
          {importMessage.message}
        </div>
      )}

      {/* マイルストーンカード */}
      <div className="space-y-8">
        {milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Pin size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">まだマイルストーンがありません</p>
            <p className="text-sm opacity-70 mb-4">目標を追加して、達成に向けて進捗を管理しましょう</p>
            <Button onClick={openAddDialog} variant="primary" size="sm">
              <Plus size={14} className="mr-1" />
              最初のマイルストーンを追加
            </Button>
          </div>
        ) : (
          groupedMilestones.map((group) => (
            <div key={group.tag || "__no_tag__"} className="space-y-4">
              {/* タググループヘッダー */}
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Tag size={16} className="text-primary" />
                <h3 className="font-semibold text-foreground">
                  {group.tag || "未分類"}
                </h3>
                <span className="text-sm text-muted-foreground">({group.milestones.length})</span>
              </div>

              {/* カードグリッド */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
                {group.milestones.map((m) => {
              const progress = m.targetUnits > 0 ? (m.currentUnits / m.targetUnits) * 100 : 0;
              const pinColor = getPinColor(m.id);
              const rotation = getCardRotation(m.id);

              return (
                <div
                  key={m.id}
                  className="relative group"
                  style={{ transform: rotation }}
                >
                  {/* 押しピン */}
                  <div className={`absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-5 h-5 rounded-full ${pinColor} shadow-lg border-2 border-white dark:border-gray-800`}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40" />
                  </div>

                  {/* カード */}
                  <div className="bg-card rounded-[var(--radius-lg)] shadow-token-sm hover:shadow-token-md transition-base overflow-hidden border border-border">
                    <div className="p-4 pt-5">
                      {/* タイトルとアクション */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-foreground leading-tight line-clamp-2">
                          {m.title}
                        </h3>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            className="p-1 rounded hover:bg-muted transition-colors"
                            onClick={() => openEditDialog(m)}
                            title="編集"
                          >
                            <Pencil size={12} className="text-muted-foreground" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-red-500/10 transition-colors"
                            onClick={() => remove(m.id)}
                            title="削除"
                          >
                            <Trash2 size={12} className="text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* 詳細 */}
                      {m.description && (
                        <div
                          className="text-xs text-muted-foreground mb-3 line-clamp-3 prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          dangerouslySetInnerHTML={{ __html: m.description }}
                        />
                      )}

                      {/* 進捗表示 */}
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-bold text-foreground">
                            {m.currentUnits}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{m.targetUnits}
                            </span>
                          </span>
                          <span className="text-sm font-medium text-muted-foreground">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progress >= 100
                                ? 'bg-green-500'
                                : 'bg-primary'
                              }`}
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 進捗ボタン */}
                    <div className="flex border-t border-border">
                      <button
                        className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                        onClick={() => updateProgress(m.id, -1)}
                      >
                        −1
                      </button>
                      <div className="w-px bg-border" />
                      <button
                        className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                        onClick={() => updateProgress(m.id, 1)}
                      >
                        +1
                      </button>
                    </div>

                    {/* 紐付けタスク展開セクション */}
                    {(() => {
                      const linkedTasks = getTasksForMilestone(m.id);
                      const isExpanded = expandedMilestones.has(m.id);
                      const completedCount = linkedTasks.filter((t) => t.completed).length;

                      if (linkedTasks.length === 0) return null;

                      return (
                        <>
                          <button
                            className="w-full flex items-center justify-between px-4 py-2 border-t border-border hover:bg-muted/50 transition-colors"
                            onClick={() => toggleExpand(m.id)}
                          >
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <ListTodo size={12} />
                              <span>タスク ({completedCount}/{linkedTasks.length})</span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown size={14} className="text-muted-foreground" />
                            ) : (
                              <ChevronRight size={14} className="text-muted-foreground" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="border-t border-border bg-muted/30">
                              <div className="px-3 py-2 space-y-1 max-h-48 overflow-y-auto">
                                {linkedTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className={`flex items-start gap-2 text-xs py-1.5 px-2 rounded hover:bg-muted/50 transition-colors ${
                                      task.completed ? "opacity-50" : ""
                                    }`}
                                  >
                                    <div className={`shrink-0 mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                      task.completed
                                        ? "bg-green-500 border-green-500 text-white"
                                        : "border-border"
                                    }`}>
                                      {task.completed && <Check size={10} />}
                                    </div>
                                    <span className={`leading-tight ${task.completed ? "line-through" : ""}`}>
                                      {task.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新規追加ダイアログ */}
      <MilestoneDialog
        milestone={editingMilestone}
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingMilestone(null);
        }}
        onSave={handleSaveNew}
        isNew
      />

      {/* 編集ダイアログ */}
      <MilestoneDialog
        milestone={editingMilestone}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingMilestone(null);
        }}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

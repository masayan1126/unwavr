"use client";
import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { copyDescriptionWithFormat, type CopyFormat } from "@/lib/taskUtils";
import { useToast } from "@/components/Providers";
import { Copy, ChevronDown } from "lucide-react";
import WysiwygEditor from "@/components/WysiwygEditor";
import { X } from "lucide-react";

export default function TaskDescriptionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const task = useAppStore((s) => s.tasks.find((t) => t.id === id));
  const updateTask = useAppStore((s) => s.updateTask);
  const toast = useToast();

  const [html, setHtml] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!task) return;
    setHtml(task.description ?? "");
  }, [task]);

  const handleSave = useCallback(() => {
    if (!task) return;
    setIsSaving(true);
    updateTask(task.id, { description: html || undefined });
    setLastSavedAt(Date.now());
    setTimeout(() => setIsSaving(false), 150);
  }, [task, html, updateTask]);

  useEffect(() => {
    if (!task) router.push("/");
  }, [task, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [html, task]);

  if (!task) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center">タスクが見つかりません</div>
      </div>
    );
  }

  function CopyMenu({ onCopy }: { onCopy: (format: CopyFormat) => void }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative inline-block text-left z-[1000]">
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2 py-1 rounded border"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title="説明をコピー"
        >
          <Copy size={14} />
          コピー
          <ChevronDown size={12} />
        </button>
        {open && (
          <div className="absolute right-0 mt-1 w-44 rounded border bg-background text-foreground shadow-lg z-[1001]">
            {( ["markdown","text","html"] as CopyFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => { onCopy(fmt); setOpen(false); }}
              >
                {fmt === 'text' ? 'テキストでコピー' : fmt === 'markdown' ? 'Markdownでコピー' : 'HTMLでコピー'}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 bg-background sticky top-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium">詳細を編集: {task.title}</h1>
          <span className="text-xs opacity-70">ID: {task.id}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <CopyMenu onCopy={async (fmt) => {
            if (!html.trim()) { toast.show("説明がありません", "warning"); return; }
            await copyDescriptionWithFormat(html, fmt);
            toast.show(`${fmt === 'markdown' ? 'Markdown' : fmt === 'html' ? 'HTML' : 'テキスト'}でコピーしました`, 'success');
          }} />
          {isSaving ? (
            <span className="opacity-80">更新中です...</span>
          ) : lastSavedAt ? (
            <span className="opacity-70">更新完了: {new Date(lastSavedAt).toLocaleTimeString()}</span>
          ) : null}
          <button className="px-3 py-1 rounded border" onClick={handleSave}>保存</button>
          <button
            className="p-2 rounded border hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => window.close()}
            aria-label="閉じる"
            title="閉じる"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-5xl mx-auto">
          <WysiwygEditor value={html} onChange={setHtml} onBlur={handleSave} />
        </div>
      </div>
    </div>
  );
}



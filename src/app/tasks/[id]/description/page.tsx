"use client";
import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import WysiwygEditor from "@/components/WysiwygEditor";
import { X } from "lucide-react";

export default function TaskDescriptionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const task = useAppStore((s) => s.tasks.find((t) => t.id === id));
  const updateTask = useAppStore((s) => s.updateTask);

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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 bg-background sticky top-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium">説明を編集: {task.title}</h1>
          <span className="text-xs opacity-70">ID: {task.id}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
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



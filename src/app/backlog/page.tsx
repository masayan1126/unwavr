"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import { Filter as FilterIcon } from "lucide-react";

export default function BacklogPage() {
  const tasks = useAppStore((s) => s.tasks);
  const backlog = useMemo(() => tasks.filter((t) => t.type === "backlog"), [tasks]);
  
  // フィルター状態
  const [showIncomplete, setShowIncomplete] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // 実行済みと未実行に分ける
  const incompleteBacklog = useMemo(() => backlog.filter((t) => !t.completed), [backlog]);
  const completedBacklog = useMemo(() => backlog.filter((t) => t.completed), [backlog]);
  
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">バックログ</h1>
        <div className="flex items-center gap-4">
          <Link href="/tasks/new" className="px-3 py-1.5 rounded border text-sm flex items-center gap-2">
            タスク追加
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="px-3 py-1.5 rounded border flex items-center gap-2"
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
            >
              <FilterIcon size={16} /> フィルター
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-72 border rounded bg-background text-foreground shadow-lg p-3 flex flex-col gap-3">
                  <div className="text-xs opacity-70">表示設定</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowIncomplete((v) => !v)}
                      className={`px-2 py-1 rounded-full border text-xs ${showIncomplete ? "bg-foreground text-background" : ""}`}
                    >未実行</button>
                    <button
                      type="button"
                      onClick={() => setShowCompleted((v) => !v)}
                      className={`px-2 py-1 rounded-full border text-xs ${showCompleted ? "bg-foreground text-background" : ""}`}
                    >実行済み</button>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 rounded border text-xs"
                      onClick={() => {
                        setShowIncomplete(true);
                        setShowCompleted(true);
                      }}
                    >リセット</button>
                    <button type="button" className="px-2 py-1 rounded bg-foreground text-background text-xs" onClick={() => setFilterOpen(false)}>閉じる</button>
                  </div>
                </div>
              </>
            )}
          </div>
          <Link className="text-sm underline opacity-80" href="/">
            ホーム
          </Link>
        </div>
      </div>
      
      {/* 適用中のフィルター表示 */}
      <div className="flex flex-wrap items-center gap-2 px-2 py-1 rounded border border-black/10 dark:border-white/10">
        <span className="text-[11px] opacity-70 mr-1">適用中</span>
        {showIncomplete && (
          <span className="px-2 py-0.5 rounded-full border">未実行</span>
        )}
        {showCompleted && (
          <span className="px-2 py-0.5 rounded-full border">実行済み</span>
        )}
      </div>
      
      {/* 未実行のバックログ */}
      {showIncomplete && (
        <TaskList 
          title={`未実行 (${incompleteBacklog.length})`} 
          tasks={incompleteBacklog} 
          showPlannedDates 
          tableMode 
          showCreatedColumn={false} 
          showPlannedColumn 
          showTypeColumn 
          showMilestoneColumn={false}
        />
      )}
      
      {/* 実行済みのバックログ */}
      {showCompleted && completedBacklog.length > 0 && (
        <TaskList 
          title={`実行済み (${completedBacklog.length})`} 
          tasks={completedBacklog} 
          showPlannedDates 
          tableMode 
          showCreatedColumn={false} 
          showPlannedColumn 
          showTypeColumn 
          showMilestoneColumn={false}
        />
      )}
    </div>
  );
}



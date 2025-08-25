"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";
import { getEarliestExecutionDate, isOverdue } from "@/lib/taskUtils";
import SectionLoader from "@/components/SectionLoader";

// moved to taskUtils

export default function IncompleteTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  
  // 未完了で期限切れのタスクを取得
  const overdueTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 完了済みのタスクは除外
      if (task.completed) return false;
      
      // 期限切れのタスクのみ
      return isOverdue(task);
    }).sort((a, b) => {
      // 最古の実行日でソート
      const aDate = getEarliestExecutionDate(a);
      const bDate = getEarliestExecutionDate(b);
      
      if (aDate === null && bDate === null) return 0;
      if (aDate === null) return 1;
      if (bDate === null) return -1;
      
      return aDate - bDate;
    });
  }, [tasks]);
  
  // タスクを種別ごとにグループ化
  const overdueByType = useMemo(() => {
    const daily = overdueTasks.filter(t => t.type === "daily");
    const scheduled = overdueTasks.filter(t => t.type === "scheduled");
    const backlog = overdueTasks.filter(t => t.type === "backlog");
    
    return { daily, scheduled, backlog };
  }, [overdueTasks]);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const total = overdueTasks.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const offset = (page - 1) * pageSize;
    return overdueTasks.slice(offset, offset + pageSize);
  }, [overdueTasks, page, pageSize]);

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">未完了タスク</h1>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => {
              const ids = pageItems.map((t) => t.id);
              useAppStore.getState().completeTasks(ids);
            }}
            title="このページに表示中の未完了を完了にします"
          >表示分を完了</button>
          <Link className="text-sm underline opacity-80" href="/">ホーム</Link>
        </div>
      </div>
      
      <div className="text-sm opacity-70 mb-4">
        実行日が今日の日付より前なのに完了済みになっていないタスクを表示しています。
      </div>
      
      {hydrating ? (
        <SectionLoader label="未完了タスクを読み込み中..." lines={5} />
      ) : overdueTasks.length === 0 ? (
        <div className="border rounded p-8 text-center">
          <div className="text-lg font-medium mb-2">🎉 素晴らしい！</div>
          <div className="text-sm opacity-70">期限切れの未完了タスクはありません。</div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs opacity-70">{page} / {totalPages}（全 {total} 件）</div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <span className="opacity-70">1ページあたり</span>
                <select className="border rounded px-2 py-1 bg-transparent" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                  {[10,20,50,100].map(n => (<option key={n} value={n}>{n}</option>))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 rounded border text-sm disabled:opacity-50" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>前へ</button>
                <button className="px-2 py-1 rounded border text-sm disabled:opacity-50" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>次へ</button>
              </div>
            </div>
          </div>
          {/* 積み上げ候補タスク */}
          {pageItems.filter(t=>t.type==='backlog').length > 0 && (
            <TaskList 
              title={`積み上げ候補 - 期限切れ (${pageItems.filter(t=>t.type==='backlog').length})`} 
              tasks={pageItems.filter(t=>t.type==='backlog')} 
              showPlannedDates 
              tableMode 
              showCreatedColumn={false} 
              showPlannedColumn 
              showTypeColumn 
              showMilestoneColumn={false}
            />
          )}
          
          {/* 特定日タスク */}
          {pageItems.filter(t=>t.type==='scheduled').length > 0 && (
            <TaskList 
              title={`特定日 - 期限切れ (${pageItems.filter(t=>t.type==='scheduled').length})`} 
              tasks={pageItems.filter(t=>t.type==='scheduled')} 
              showPlannedDates 
              tableMode 
              showCreatedColumn={false} 
              showPlannedColumn 
              showScheduledColumn 
              showTypeColumn 
              showMilestoneColumn={false}
            />
          )}
          
          {/* 毎日タスク（期限切れの概念はないが、一応表示） */}
          {pageItems.filter(t=>t.type==='daily').length > 0 && (
            <TaskList 
              title={`毎日 - 未完了 (${pageItems.filter(t=>t.type==='daily').length})`} 
              tasks={pageItems.filter(t=>t.type==='daily')} 
              showPlannedDates 
              tableMode 
              showCreatedColumn={false} 
              showPlannedColumn={false} 
              showTypeColumn 
              showMilestoneColumn={false}
            />
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 border rounded bg-yellow-50 dark:bg-yellow-900/20">
        <div className="text-sm font-medium mb-2">💡 ヒント</div>
        <div className="text-xs opacity-70 space-y-1">
          <div>• 期限切れのタスクは最古の実行日順で表示されています</div>
          <div>• 完了したタスクは自動的にこのリストから除外されます</div>
          <div>• 毎日タスクは期限切れの概念がないため、通常は表示されません</div>
        </div>
      </div>
    </div>
  );
}

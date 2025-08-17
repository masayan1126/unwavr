"use client";
import Link from "next/link";
import { useMemo } from "react";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";

// 今日の日付をUTCで取得（0時0分0秒）
function getTodayUtc(): number {
  const today = new Date();
  return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
}

// タスクが期限切れかどうかを判定
function isOverdue(task: Task): boolean {
  const todayUtc = getTodayUtc();
  
  if (task.type === "daily") {
    // 毎日タスクは期限切れの概念がない
    return false;
  }
  
  if (task.type === "scheduled") {
    // 特定日タスクの場合、日付範囲をチェック
    if (task.scheduled?.dateRanges) {
      for (const range of task.scheduled.dateRanges) {
        if (range.end < todayUtc) {
          return true; // 期間が終了している
        }
      }
    }
    // 曜日指定のみの場合は期限切れの概念がない
    return false;
  }
  
  if (task.type === "backlog") {
    // バックログタスクの場合、plannedDatesをチェック
    if (task.plannedDates && task.plannedDates.length > 0) {
      const latestPlannedDate = Math.max(...task.plannedDates);
      return latestPlannedDate < todayUtc;
    }
    // 実行日が設定されていない場合は期限切れの概念がない
    return false;
  }
  
  return false;
}

// タスクの最古の実行日を取得
function getEarliestExecutionDate(task: Task): number | null {
  if (task.type === "daily") {
    return null; // 毎日タスクは実行日がない
  }
  
  if (task.type === "scheduled") {
    if (task.scheduled?.dateRanges && task.scheduled.dateRanges.length > 0) {
      return Math.min(...task.scheduled.dateRanges.map(r => r.start));
    }
    return null;
  }
  
  if (task.type === "backlog") {
    if (task.plannedDates && task.plannedDates.length > 0) {
      return Math.min(...task.plannedDates);
    }
    return null;
  }
  
  return null;
}

export default function IncompleteTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  
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
  
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">未完了タスク</h1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>
      
      <div className="text-sm opacity-70 mb-4">
        実行日が今日の日付より前なのに完了済みになっていないタスクを表示しています。
      </div>
      
      {overdueTasks.length === 0 ? (
        <div className="border rounded p-8 text-center">
          <div className="text-lg font-medium mb-2">🎉 素晴らしい！</div>
          <div className="text-sm opacity-70">期限切れの未完了タスクはありません。</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* バックログタスク */}
          {overdueByType.backlog.length > 0 && (
            <TaskList 
              title={`バックログ - 期限切れ (${overdueByType.backlog.length})`} 
              tasks={overdueByType.backlog} 
              showPlannedDates 
              tableMode 
              showCreatedColumn={false} 
              showPlannedColumn 
              showTypeColumn 
              showMilestoneColumn={false}
            />
          )}
          
          {/* 特定日タスク */}
          {overdueByType.scheduled.length > 0 && (
            <TaskList 
              title={`特定日 - 期限切れ (${overdueByType.scheduled.length})`} 
              tasks={overdueByType.scheduled} 
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
          {overdueByType.daily.length > 0 && (
            <TaskList 
              title={`毎日 - 未完了 (${overdueByType.daily.length})`} 
              tasks={overdueByType.daily} 
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

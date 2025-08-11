"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { isTaskForToday } from "@/lib/types";

function formatDow(days?: number[]): string {
  if (!days || days.length === 0) return "-";
  const labels = ["日", "月", "火", "水", "木", "金", "土"];
  return days.map((d) => labels[d] ?? String(d)).join("、");
}

export default function TaskDetail({ taskId, backHref }: { taskId: string; backHref: string }) {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const milestones = useAppStore((s) => s.milestones);
  const toggle = useAppStore((s) => s.toggleTask);
  const remove = useAppStore((s) => s.removeTask);
  const setActive = useAppStore((s) => s.setActiveTask);
  const activeId = useAppStore((s) => s.pomodoro.activeTaskId);
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return (
      <div className="space-y-3">
        <div className="text-sm">タスクが見つかりません。</div>
        <Link className="text-sm underline" href={backHref}>
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const milestone = task.milestoneId ? milestones.find((m) => m.id === task.milestoneId) : undefined;
  const today = isTaskForToday(task);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{task.title}</h2>
        <Link className="text-sm underline opacity-80" href={backHref}>
          一覧へ戻る
        </Link>
      </div>

      {task.description && <p className="text-sm opacity-80">{task.description}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded p-3 border-black/10 dark:border-white/10">
          <div className="text-xs uppercase opacity-60 mb-2">基本情報</div>
          <div className="text-sm">種別: {task.type === "daily" ? "毎日" : task.type === "backlog" ? "バックログ" : "曜日/連休"}</div>
          <div className="text-sm">今日対象: {today ? "はい" : "いいえ"}</div>
          <div className="text-sm">作成: {new Date(task.createdAt).toLocaleString()}</div>
          <div className="text-sm">
            進捗: {(task.completedPomodoros ?? 0)}/{task.estimatedPomodoros ?? 0} ポモ
          </div>
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-1 rounded border text-sm" onClick={() => toggle(task.id)}>
              {task.completed ? "未完了に戻す" : "完了にする"}
            </button>
            <button
              className={`px-3 py-1 rounded border text-sm ${activeId === task.id ? "bg-foreground text-background" : ""}`}
              onClick={() => setActive(activeId === task.id ? undefined : task.id)}
            >
              {activeId === task.id ? "ポモ対象解除" : "ポモ対象に設定"}
            </button>
          </div>
        </div>

        <div className="border rounded p-3 border-black/10 dark:border-white/10">
          <div className="text-xs uppercase opacity-60 mb-2">スケジュール</div>
          {task.type !== "scheduled" ? (
            <div className="text-sm opacity-70">スケジュール指定なし</div>
          ) : (
            <div className="text-sm space-y-1">
              <div>曜日: {formatDow(task.scheduled?.daysOfWeek)}</div>
              <div className="space-y-1">
                <div>期間:</div>
                <ul className="list-disc pl-5">
                  {(task.scheduled?.dateRanges ?? []).length === 0 ? (
                    <li className="opacity-70">なし</li>
                  ) : (
                    (task.scheduled?.dateRanges ?? []).map((r, idx) => (
                      <li key={`${r.start}-${r.end}-${idx}`}>
                        {new Date(r.start).toLocaleDateString()} 〜 {new Date(r.end).toLocaleDateString()}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded p-3 border-black/10 dark:border-white/10">
        <div className="text-xs uppercase opacity-60 mb-2">マイルストーン</div>
        {milestone ? (
          <div className="text-sm">
            {milestone.title}: {milestone.currentUnits}/{milestone.targetUnits}
          </div>
        ) : (
          <div className="text-sm opacity-70">未設定</div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          className="px-3 py-1 rounded bg-red-600 text-white text-sm"
          onClick={() => {
            remove(task.id);
            router.push(backHref);
          }}
        >
          削除
        </button>
      </div>
    </div>
  );
}



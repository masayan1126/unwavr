"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Providers";
import { copyDescriptionWithFormat } from "@/lib/taskUtils";
import { useAppStore } from "@/lib/store";
import { isTaskForToday } from "@/lib/types";
import RichText from "@/components/RichText";
import { Split, Loader2 } from "lucide-react";
import { breakdownTask } from "@/lib/gemini";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

function formatDow(days?: number[]): string {
  if (!days || days.length === 0) return "-";
  const labels = ["日", "月", "火", "水", "木", "金", "土"];
  return days.map((d) => labels[d] ?? String(d)).join("、");
}

export default function TaskDetail({ taskId, backHref }: { taskId: string; backHref: string }) {
  const router = useRouter();
  const toast = useToast();
  const tasks = useAppStore((s) => s.tasks);
  const milestones = useAppStore((s) => s.milestones);
  const toggle = useAppStore((s) => s.toggleTask);
  const remove = useAppStore((s) => s.removeTask);
  const setActive = useAppStore((s) => s.setActiveTask);
  const activeId = useAppStore((s) => s.pomodoro.activeTaskId);
  const apiKey = useAppStore((s) => s.geminiApiKey);
  const updateTask = useAppStore((s) => s.updateTask);
  const language = useAppStore((s) => s.language);
  const task = tasks.find((t) => t.id === taskId);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {task.title}
          {activeId === task.id && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium border rounded-full px-2 py-0.5 whitespace-nowrap bg-primary/10 text-primary border-primary/30">
              着手中
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            disabled={isBreakingDown}
            onClick={async () => {
              if (isBreakingDown) return;
              if (!apiKey) {
                toast.show("Gemini APIキーを設定してください", "error");
                return;
              }
              setIsBreakingDown(true);
              try {
                const subtasks = await breakdownTask(apiKey, task.title, task.description || "", language);
                if (subtasks.length > 0) {
                  const checklist = "\n\n" + subtasks.map(s => `- [ ] ${s}`).join("\n");
                  updateTask(task.id, { description: (task.description || "") + checklist });
                  toast.show("サブタスクを追加しました", "success");
                } else {
                  toast.show("サブタスクを生成できませんでした", "error");
                }
              } catch (e) {
                console.error(e);
                toast.show("エラーが発生しました", "error");
              } finally {
                setIsBreakingDown(false);
              }
            }}
          >
            {isBreakingDown ? <Loader2 size={14} className="animate-spin" /> : <Split size={14} />}
            Breakdown
          </button>
          {task.description ? (
            <button
              className="text-sm underline opacity-80"
              onClick={async () => {
                await copyDescriptionWithFormat(task.description!, 'markdown');
                toast.show("Markdownでコピーしました", "success");
              }}
            >
              説明をコピー
            </button>
          ) : null}
          <Link className="text-sm underline opacity-80" href={backHref}>
            一覧へ戻る
          </Link>
        </div>
      </div>

      {task.description && (
        <RichText className="prose prose-sm dark:prose-invert opacity-90" html={task.description} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded-[var(--radius-md)] p-3 border-border">
          <div className="text-xs uppercase opacity-60 mb-2">基本情報</div>
          <div className="text-sm">種別: {task.type === "daily" ? "毎日" : task.type === "backlog" ? "積み上げ候補" : "曜日/連休"}</div>
          <div className="text-sm">今日対象: {today ? "はい" : "いいえ"}</div>
          <div className="text-sm">作成: {new Date(task.createdAt).toLocaleString()}</div>
          <div className="text-sm">
            進捗: {(task.completedPomodoros ?? 0)}/{task.estimatedPomodoros ?? 0} ポモ
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => toggle(task.id)}>
              {task.completed ? "未完了に戻す" : "完了にする"}
            </Button>
            <Button
              variant={activeId === task.id ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActive(activeId === task.id ? undefined : task.id)}
            >
              {activeId === task.id ? "ポモ対象解除" : "ポモ対象に設定"}
            </Button>
          </div>
        </div>

        <div className="border rounded-[var(--radius-md)] p-3 border-border">
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

      <div className="border rounded-[var(--radius-md)] p-3 border-border">
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
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            remove(task.id);
            router.push(backHref);
          }}
        >
          削除
        </Button>
      </div>
    </div>
  );
}



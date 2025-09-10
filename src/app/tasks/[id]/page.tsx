"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { useToast } from "@/components/Providers";
import { useAppStore } from "@/lib/store";
import { TaskType, Scheduled } from "@/lib/types";
import RichText from "@/components/RichText";
import { copyDescriptionWithFormat } from "@/lib/taskUtils";
import WysiwygEditor from "@/components/WysiwygEditor";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const toast = useToast();
  const searchParams = useSearchParams();
  const task = useAppStore((s) => s.tasks.find((t) => t.id === id));
  const activeTaskId = useAppStore((s) => s.pomodoro.activeTaskId);
  const setActiveTask = useAppStore((s) => s.setActiveTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const removeTask = useAppStore((s) => s.removeTask);
  const milestones = useAppStore((s) => s.milestones);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("daily");
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(0);
  const [milestoneId, setMilestoneId] = useState("");
  const [plannedDates, setPlannedDates] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // スケジュール設定用の状態
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    if (!task) {
      router.push("/");
      return;
    }

    setTitle(task.title);
    setDescription(task.description || "");
    setType(task.type);
    setEstimatedPomodoros(task.estimatedPomodoros || 0);
    setMilestoneId(task.milestoneId || "");
    setPlannedDates(task.plannedDates || []);

    // スケジュール設定の初期化
    if (task.scheduled) {
      setSelectedDays(task.scheduled.daysOfWeek || []);
      if (task.scheduled.dateRanges && task.scheduled.dateRanges.length > 0) {
        const range = task.scheduled.dateRanges[0];
        setRangeStart(new Date(range.start).toISOString().split('T')[0]);
        setRangeEnd(new Date(range.end).toISOString().split('T')[0]);
      }
    }
  }, [task, router]);

  useEffect(() => {
    const focus = searchParams?.get('focus');
    if (focus === 'description') {
      setIsEditing(true);
      setTimeout(() => {
        const el = document.getElementById('editor-description');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
  }, [searchParams]);

  if (!task) {
    return (
      <div className="p-6 sm:p-10 max-w-3xl mx-auto">
        <div className="text-center">タスクが見つかりません</div>
      </div>
    );
  }

  const handleSave = (keepEditing?: boolean) => {
    if (!title.trim()) return;

    let newScheduled: Scheduled | undefined = undefined;
    if (type === "scheduled") {
      newScheduled = {
        daysOfWeek: selectedDays,
        dateRanges: rangeStart && rangeEnd ? [
          {
            start: new Date(rangeStart).getTime(),
            end: new Date(rangeEnd).getTime()
          }
        ] : undefined
      };
    }

    updateTask(task.id, {
      title: title.trim(),
      description: description || undefined,
      type,
      scheduled: newScheduled,
      estimatedPomodoros: estimatedPomodoros || 0,
      milestoneId: milestoneId || undefined,
      plannedDates: type === "backlog" ? plannedDates : []
    });

    if (!keepEditing) {
      setIsEditing(false);
    }
    toast.show('タスクを保存しました', 'success');
  };

  const handleDelete = () => {
    removeTask(task.id);
    router.push("/");
    toast.show('タスクを削除しました', 'success');
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      const next = prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day];
      setTimeout(() => handleSave(true), 0);
      return next;
    });
  };

  const addPlannedDate = () => {
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (!plannedDates.includes(todayUtc)) {
      setPlannedDates(prev => {
        const next = [...prev, todayUtc];
        setTimeout(() => handleSave(true), 0);
        return next;
      });
    }
  };

  const removePlannedDate = (date: number) => {
    setPlannedDates(prev => prev.filter(d => d !== date));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          タスク詳細
          {task && activeTaskId === task.id && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium border rounded-full px-2 py-0.5 whitespace-nowrap bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30">
              着手中
            </span>
          )}
        </h1>
        <div className="flex items-center gap-4">
          <Link className="text-sm underline opacity-80" href="/">
            ホーム
          </Link>
        </div>
      </div>

      {!isEditing ? (
        // 表示モード
        <div className="space-y-4">
          <div className="border rounded p-4 border-[var(--border)]">
            <div className="flex items-center justify-between mb-2 gap-2">
              <h2 className="text-lg font-medium flex items-center gap-2">
                {task.title}
                {activeTaskId === task.id && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium border rounded-full px-2 py-0.5 whitespace-nowrap bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30">
                    着手中
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (task.description) {
                      await copyDescriptionWithFormat(task.description, 'markdown');
                      toast.show('Markdownでコピーしました', 'success');
                    } else {
                      toast.show('説明がありません', 'warning');
                    }
                  }}
                  className="text-sm underline opacity-80"
                >
                  説明をコピー
                </button>
                <button
                  onClick={() => setActiveTask(activeTaskId === task.id ? undefined : task.id)}
                  className={`text-sm underline opacity-80 ${activeTaskId === task.id ? 'text-[var(--primary)]' : ''}`}
                >
                  {activeTaskId === task.id ? '着手中を解除' : '着手中に設定'}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm underline opacity-80"
                >
                  編集
                </button>
              </div>
            </div>
            
            {task.description && (
              <div className="prose prose-sm dark:prose-invert opacity-90 mb-3">
                <RichText html={task.description} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="opacity-60">タイプ:</span>
                <span className="ml-2">
                  {task.type === "daily" ? "毎日" : 
                   task.type === "scheduled" ? "特定曜日" : "積み上げ候補"}
                </span>
              </div>
              
              {(task.estimatedPomodoros ?? 0) > 0 && (
                <div>
                  <span className="opacity-60">見積ポモ数:</span>
                  <span className="ml-2">{task.estimatedPomodoros ?? 0}</span>
                </div>
              )}

              {task.milestoneId && (
                <div>
                  <span className="opacity-60">マイルストーン:</span>
                  <span className="ml-2">
                    {milestones.find(m => m.id === task.milestoneId)?.title}
                  </span>
                </div>
              )}

              {task.type === "scheduled" && task.scheduled && (
                <div>
                  <span className="opacity-60">スケジュール:</span>
                  <div className="ml-2">
                    {task.scheduled.daysOfWeek && task.scheduled.daysOfWeek.length > 0 && (
                      <div>曜日: {task.scheduled.daysOfWeek.map(d => weekdayLabels[d]).join(", ")}</div>
                    )}
                    {task.scheduled.dateRanges && task.scheduled.dateRanges.length > 0 && (
                      <div>期間: {task.scheduled.dateRanges.map(r => 
                        `${formatDate(r.start)} - ${formatDate(r.end)}`
                      ).join(", ")}</div>
                    )}
                  </div>
                </div>
              )}

              {task.type === "backlog" && task.plannedDates && task.plannedDates.length > 0 && (
                <div>
                  <span className="opacity-60">予定日:</span>
                  <div className="ml-2">
                    {task.plannedDates.map(date => (
                      <div key={date}>{formatDate(date)}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-[var(--danger)] text-white rounded hover:opacity-90"
            >
              削除
            </button>
          </div>
        </div>
      ) : (
        // 編集モード
        <div className="space-y-4">
          <div className="border rounded p-4 border-[var(--border)]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleSave(true)}
                  className="w-full border border-[var(--border)] rounded px-3 py-2 bg-transparent"
                />
              </div>

              <div id="editor-description" className="space-y-2">
                <label className="block text-sm font-medium">詳細</label>
                <WysiwygEditor
                  value={description}
                  onChange={(html) => { setDescription(html); }}
                  onBlur={() => handleSave(true)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">タイプ</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as TaskType;
                    setType(newType);
                    if (newType === "scheduled") {
                      setSelectedDays([]);
                      setRangeStart("");
                      setRangeEnd("");
                    }
                    if (newType !== "backlog") {
                      setPlannedDates([]);
                    }
                  }}
                  onBlur={() => handleSave(true)}
                  className="w-full border border-[var(--border)] rounded px-3 py-2 bg-transparent"
                >
                  <option value="daily">毎日</option>
                  <option value="backlog">積み上げ候補</option>
                  <option value="scheduled">特定曜日</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">見積ポモ数</label>
                <input
                  type="number"
                  min={0}
                  value={estimatedPomodoros}
                  onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 0)}
                  onBlur={() => handleSave(true)}
                  className="w-full border border-[var(--border)] rounded px-3 py-2 bg-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">マイルストーン</label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  onBlur={() => handleSave(true)}
                  className="w-full border border-[var(--border)] rounded px-3 py-2 bg-transparent"
                >
                  <option value="">未選択</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.currentUnits}/{m.targetUnits})
                    </option>
                  ))}
                </select>
              </div>

              {type === "scheduled" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">曜日</label>
                    <div className="flex gap-2">
                      {weekdayLabels.map((label, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleDay(index)}
                          className={`px-3 py-1 rounded border ${
                            selectedDays.includes(index)
                              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                              : "border-[var(--border)]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">期間</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        onBlur={() => handleSave(true)}
                        className="border border-[var(--border)] rounded px-3 py-2 bg-transparent"
                      />
                      <span className="flex items-center">〜</span>
                      <input
                        type="date"
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        onBlur={() => handleSave(true)}
                        className="border border-[var(--border)] rounded px-3 py-2 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {type === "backlog" && (
                <div>
                  <label className="block text-sm font-medium mb-2">予定日</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={addPlannedDate}
                      className="px-3 py-1 text-sm border border-[var(--border)] rounded"
                    >
                      今日を追加
                    </button>
                    {plannedDates.length > 0 && (
                      <div className="space-y-1">
                        {plannedDates.map(date => (
                          <div key={date} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span>{formatDate(date)}</span>
                            <button
                              onClick={() => { removePlannedDate(date); setTimeout(()=>handleSave(), 0); }}
                              className="text-[var(--danger)] text-sm"
                            >
                              削除
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSave()}
              disabled={!title.trim()}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              保存
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-[var(--border)] rounded"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 transition-all duration-300 opacity-100 backdrop-blur-[2px]" />
          <div className="relative z-10 bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4 transition-all duration-300 ease-out [filter:blur(0px)]">
            <h3 className="text-lg font-medium mb-4">タスクを削除しますか？</h3>
            <p className="text-sm opacity-70 mb-6">この操作は取り消せません。</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-[var(--border)] rounded"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-[var(--danger)] text-white rounded hover:opacity-90"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Providers";
import { useAppStore } from "@/lib/store";
import { TaskType, Scheduled } from "@/lib/types";
import RichText from "@/components/RichText";
import { copyDescriptionWithFormat } from "@/lib/taskUtils";
import WysiwygEditor from "@/components/WysiwygEditor";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Edit3,
  Trash2,
  Play,
  Pause,
  Copy,
  CheckCircle2,
  Repeat,
  CalendarDays,
  Layers
} from "lucide-react";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const toast = useToast();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
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
  const [pomodoroWorkMinutes, setPomodoroWorkMinutes] = useState<number | "">("");
  const [milestoneId, setMilestoneId] = useState("");
  const [plannedDates, setPlannedDates] = useState<number[]>([]);
  const [plannedDateGoogleEvents, setPlannedDateGoogleEvents] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
    setPomodoroWorkMinutes(task.pomodoroSetting?.workDurationSec ? Math.floor(task.pomodoroSetting.workDurationSec / 60) : "");
    setMilestoneId(task.milestoneId || "");
    setPlannedDates(task.plannedDates || []);
    setPlannedDateGoogleEvents(task.plannedDateGoogleEvents || {});

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
      <div className="p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="text-center py-12 opacity-60">タスクが見つかりません</div>
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
      pomodoroSetting: pomodoroWorkMinutes ? { workDurationSec: Number(pomodoroWorkMinutes) * 60 } : undefined,
      milestoneId: milestoneId || undefined,
      plannedDates: type === "backlog" ? plannedDates : [],
      plannedDateGoogleEvents: type === "backlog" ? plannedDateGoogleEvents : {},
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

  const addPlannedDate = useCallback(async () => {
    if (isSyncing || !task) return;

    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    if (plannedDates.includes(todayUtc)) {
      toast.show("今日は既に予定日に追加されています", "warning");
      return;
    }

    setIsSyncing(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = (session as any)?.access_token;
    console.log("[addPlannedDate] session:", session);
    console.log("[addPlannedDate] accessToken:", accessToken ? "exists" : "undefined");
    let googleEventId: string | undefined;

    // Googleカレンダーにイベントを作成
    if (accessToken) {
      try {
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        console.log("[addPlannedDate] Creating event with dateStr:", dateStr);
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: task.title,
            start: { date: dateStr },
            end: { date: dateStr },
          }),
        });

        console.log("[addPlannedDate] Response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          googleEventId = data.id;
          console.log("[addPlannedDate] Event created:", googleEventId);
        } else {
          const errorText = await res.text();
          console.error("[addPlannedDate] Failed to create event:", res.status, errorText);
        }
      } catch (err) {
        console.error("[addPlannedDate] Google Calendar sync error:", err);
      }
    } else {
      console.log("[addPlannedDate] No accessToken, skipping Google sync");
    }

    // ローカルの状態を更新
    const newPlannedDates = [...plannedDates, todayUtc];
    const newGoogleEvents = { ...plannedDateGoogleEvents };
    if (googleEventId) {
      newGoogleEvents[String(todayUtc)] = googleEventId;
    }

    setPlannedDates(newPlannedDates);
    setPlannedDateGoogleEvents(newGoogleEvents);

    // タスクを保存
    updateTask(task.id, {
      plannedDates: newPlannedDates,
      plannedDateGoogleEvents: newGoogleEvents,
    });

    setIsSyncing(false);
    let message: string;
    let toastType: 'success' | 'warning' | 'error' = 'success';
    if (googleEventId) {
      message = "予定日を追加し、Googleカレンダーに同期しました";
    } else if (!accessToken) {
      message = "予定日を追加しました（Googleアカウントでログインするとカレンダー同期できます）";
      toastType = "warning";
    } else {
      message = "予定日を追加しました（Google同期に失敗）";
      toastType = "error";
    }
    toast.show(message, toastType);
  }, [isSyncing, task, plannedDates, plannedDateGoogleEvents, session, updateTask, toast]);

  const removePlannedDate = useCallback(async (date: number) => {
    if (isSyncing || !task) return;

    setIsSyncing(true);

    // Googleカレンダーから削除
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = (session as any)?.access_token;
    const googleEventId = plannedDateGoogleEvents[String(date)];

    if (accessToken && googleEventId) {
      try {
        const res = await fetch(`/api/calendar/events/${googleEventId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          console.log("Google Calendar event deleted:", googleEventId);
        } else {
          console.error("Failed to delete Google Calendar event:", await res.text());
        }
      } catch (err) {
        console.error("Google Calendar delete error:", err);
      }
    }

    // ローカルの状態を更新
    const newPlannedDates = plannedDates.filter(d => d !== date);
    const newGoogleEvents = { ...plannedDateGoogleEvents };
    delete newGoogleEvents[String(date)];

    setPlannedDates(newPlannedDates);
    setPlannedDateGoogleEvents(newGoogleEvents);

    // タスクを保存
    updateTask(task.id, {
      plannedDates: newPlannedDates,
      plannedDateGoogleEvents: newGoogleEvents,
    });

    setIsSyncing(false);
    toast.show("予定日を削除しました", "success");
  }, [isSyncing, task, plannedDates, plannedDateGoogleEvents, session, updateTask, toast]);

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

  const getTypeIcon = () => {
    switch (task.type) {
      case "daily": return <Repeat size={16} className="text-[var(--primary)]" />;
      case "scheduled": return <CalendarDays size={16} className="text-[var(--warning)]" />;
      case "backlog": return <Layers size={16} className="text-purple-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (task.type) {
      case "daily": return "毎日";
      case "scheduled": return "特定曜日";
      case "backlog": return "積み上げ候補";
    }
  };

  const getTypeBgColor = () => {
    switch (task.type) {
      case "daily": return "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30";
      case "scheduled": return "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30";
      case "backlog": return "bg-purple-500/10 text-purple-500 border-purple-500/30";
    }
  };

  const isActive = activeTaskId === task.id;

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-[var(--border)] hover:bg-background transition-colors"
          title="戻る"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold truncate">{task.title}</h1>
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 ${getTypeBgColor()}`}>
              {getTypeIcon()}
              <span>{getTypeLabel()}</span>
            </div>
            {isActive && (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 bg-green-500/10 text-green-500 border-green-500/30">
                <Play size={12} fill="currentColor" />
                <span>着手中</span>
              </div>
            )}
          </div>
        </div>
        <Link
          href="/"
          className="text-sm opacity-70 hover:opacity-100 hidden sm:block"
        >
          ホーム
        </Link>
      </div>

      {!isEditing ? (
        /* 表示モード */
        <div className="space-y-6">
          {/* メインカード */}
          <div className="bg-background rounded-xl p-6 border border-[var(--border)]">
            {/* アクションボタン */}
            <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-[var(--border)]">
              <button
                onClick={() => setActiveTask(isActive ? undefined : task.id)}
                style={!isActive ? { backgroundColor: "var(--primary)" } : undefined}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-green-500 text-white"
                  : "text-white dark:text-background hover:opacity-90"
                  }`}
              >
                {isActive ? <Pause size={14} /> : <Play size={14} />}
                {isActive ? '着手中を解除' : '着手開始'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-[var(--border)] hover:bg-white/5 transition-colors"
              >
                <Edit3 size={14} />
                編集
              </button>
              <button
                onClick={async () => {
                  if (task.description) {
                    await copyDescriptionWithFormat(task.description, 'markdown');
                    toast.show('Markdownでコピーしました', 'success');
                  } else {
                    toast.show('説明がありません', 'warning');
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-[var(--border)] hover:bg-white/5 transition-colors"
              >
                <Copy size={14} />
                説明をコピー
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger)]/10 transition-colors ml-auto"
              >
                <Trash2 size={14} />
                削除
              </button>
            </div>

            {/* 説明 */}
            {task.description && (
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider opacity-60 mb-3 flex items-center gap-2">
                  <Edit3 size={12} />
                  説明
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <RichText html={task.description} />
                </div>
              </div>
            )}

            {/* 詳細情報 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* ポモドーロ */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-[var(--border)]">
                <div className="p-2 rounded-lg bg-[var(--primary)]/10">
                  <Clock size={16} className="text-[var(--primary)]" />
                </div>
                <div>
                  <div className="text-xs opacity-60">ポモドーロ</div>
                  <div className="font-medium">
                    {task.completedPomodoros ?? 0} / {task.estimatedPomodoros ?? 0}
                    {task.pomodoroSetting?.workDurationSec && (
                      <span className="ml-2 text-xs opacity-60">
                        ({Math.floor(task.pomodoroSetting.workDurationSec / 60)}分)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* マイルストーン */}
              {task.milestoneId && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-[var(--border)]">
                  <div className="p-2 rounded-lg bg-[var(--warning)]/10">
                    <Target size={16} className="text-[var(--warning)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs opacity-60">マイルストーン</div>
                    <div className="font-medium truncate">
                      {milestones.find(m => m.id === task.milestoneId)?.title || "未設定"}
                    </div>
                  </div>
                </div>
              )}

              {/* 完了状態 */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-[var(--border)]">
                <div className={`p-2 rounded-lg ${task.completed ? "bg-green-500/10" : "bg-gray-500/10"}`}>
                  <CheckCircle2 size={16} className={task.completed ? "text-green-500" : "text-gray-500"} />
                </div>
                <div>
                  <div className="text-xs opacity-60">ステータス</div>
                  <div className="font-medium">{task.completed ? "完了" : "未完了"}</div>
                </div>
              </div>

              {/* スケジュール（特定曜日の場合） */}
              {task.type === "scheduled" && task.scheduled && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-[var(--border)] sm:col-span-2 lg:col-span-3">
                  <div className="p-2 rounded-lg bg-[var(--warning)]/10">
                    <Calendar size={16} className="text-[var(--warning)]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs opacity-60">スケジュール</div>
                    <div className="font-medium">
                      {task.scheduled.daysOfWeek && task.scheduled.daysOfWeek.length > 0 ? (
                        <span>曜日: {task.scheduled.daysOfWeek.map(d => weekdayLabels[d]).join(", ")}</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">曜日未指定</span>
                      )}
                      {task.scheduled.dateRanges && task.scheduled.dateRanges.length > 0 && (
                        <span className="ml-3">
                          期間: {task.scheduled.dateRanges.map(r => `${formatDate(r.start)} - ${formatDate(r.end)}`).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 予定日（バックログの場合） */}
              {task.type === "backlog" && task.plannedDates && task.plannedDates.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-[var(--border)] sm:col-span-2 lg:col-span-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Calendar size={16} className="text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs opacity-60">予定日</div>
                    <div className="font-medium">
                      {task.plannedDates.map(date => formatDate(date)).join(", ")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 編集モード */
        <div className="space-y-6">
          <div className="bg-background rounded-xl p-6 border border-[var(--border)]">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 opacity-80">タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleSave(true)}
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-transparent focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                />
              </div>

              <div id="editor-description" className="space-y-2">
                <label className="block text-sm font-medium opacity-80">詳細</label>
                <WysiwygEditor
                  value={description}
                  onChange={(html) => { setDescription(html); }}
                  onBlur={() => handleSave(true)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-80">タイプ</label>
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
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-transparent focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                  >
                    <option value="daily">毎日</option>
                    <option value="backlog">積み上げ候補</option>
                    <option value="scheduled">特定曜日</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 opacity-80">見積ポモ数</label>
                  <input
                    type="number"
                    min={0}
                    value={estimatedPomodoros}
                    onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 0)}
                    onBlur={() => handleSave(true)}
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-transparent focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 opacity-80">カスタム作業時間（分）</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    placeholder="デフォルト"
                    value={pomodoroWorkMinutes}
                    onChange={(e) => setPomodoroWorkMinutes(e.target.value === "" ? "" : parseInt(e.target.value))}
                    onBlur={() => handleSave(true)}
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-transparent focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                  />
                  <span className="text-xs opacity-60 whitespace-nowrap">分 (未設定時はデフォルト)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 opacity-80">マイルストーン</label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  onBlur={() => handleSave(true)}
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-transparent focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
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
                <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                  <div>
                    <label className="block text-sm font-medium mb-3 opacity-80">曜日</label>
                    <div className="flex gap-2 flex-wrap">
                      {weekdayLabels.map((label, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleDay(index)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDays.includes(index)
                            ? "bg-[var(--primary)] text-white"
                            : "border border-[var(--border)] hover:bg-white/5"
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80">期間</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="date"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        onBlur={() => handleSave(true)}
                        className="border border-[var(--border)] rounded-lg px-4 py-2.5 bg-transparent focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                      />
                      <span className="opacity-60">〜</span>
                      <input
                        type="date"
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        onBlur={() => handleSave(true)}
                        className="border border-[var(--border)] rounded-lg px-4 py-2.5 bg-transparent focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {type === "backlog" && (
                <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                  <label className="block text-sm font-medium opacity-80">予定日</label>
                  <button
                    type="button"
                    onClick={addPlannedDate}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Calendar size={14} />
                    )}
                    {isSyncing ? "同期中..." : "今日を追加"}
                  </button>
                  {plannedDates.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {plannedDates.map(date => (
                        <div key={date} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{formatDate(date)}</span>
                            {plannedDateGoogleEvents[String(date)] && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                Google連携済
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removePlannedDate(date)}
                            disabled={isSyncing}
                            className="text-[var(--danger)] text-sm hover:underline disabled:opacity-50"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave()}
              disabled={!title.trim()}
              style={{ backgroundColor: "var(--primary)" }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white dark:text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 size={16} />
              保存
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 border border-[var(--border)] rounded-lg hover:bg-white/5 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-[100000]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative z-10 bg-background border border-[var(--border)] p-6 rounded-xl max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[var(--danger)]/10">
                <Trash2 size={20} className="text-[var(--danger)]" />
              </div>
              <h3 className="text-lg font-semibold">タスクを削除しますか？</h3>
            </div>
            <p className="text-sm opacity-70 mb-6">この操作は取り消せません。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-white/5 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-[var(--danger)] text-white rounded-lg hover:opacity-90 transition-colors"
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

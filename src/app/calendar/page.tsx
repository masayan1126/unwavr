"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import { getDate as getDayOfMonth, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Loader2 } from "lucide-react";
import DayDetailPanel from "@/components/calendar/DayDetailPanel";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";

type GCalEvent = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

function toDate(value?: string) {
  if (!value) return undefined;
  return parseISO(value);
}

type ViewMode = "day" | "week" | "month";

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const tasks = useAppStore((s) => s.tasks);
  const updateTask = useAppStore((s) => s.updateTask);
  const [events, setEvents] = useState<GCalEvent[]>([]);
  // const [gTasks, setGTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isMovingTask, setIsMovingTask] = useState(false); // タスク移動中のローディング状態

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const gridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 0, locale: ja }), [monthStart]);
  const gridEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 0, locale: ja }), [monthEnd]);

  // 週ビュー用の開始・終了日
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0, locale: ja }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 0, locale: ja }), [currentDate]);

  const daysInMonth = useMemo(() => getDayOfMonth(monthEnd), [monthEnd]);
  const weekdaysInMonth = useMemo(() => {
    let cnt = 0;
    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(monthStart, i);
      const dow = getDay(d);
      if (dow >= 1 && dow <= 5) cnt++;
    }
    return cnt;
  }, [monthStart, daysInMonth]);

  // Googleカレンダーイベントを取得する関数
  const fetchGoogleEvents = useCallback(() => {
    if (status !== "authenticated") return;
    const accessToken = (session as unknown as { access_token?: string })?.access_token;
    if (!accessToken) return;
    const timeMin = monthStart.toISOString();
    const timeMax = monthEnd.toISOString();
    fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setEvents(d.items ?? []))
      .catch(() => { });
  }, [session, status, monthStart, monthEnd]);

  useEffect(() => {
    fetchGoogleEvents();
    // Google Tasks (ToDo) も取得（締切のあるものは日付に表示）
    // fetch(`/api/tasks`, { headers: { Authorization: `Bearer ${accessToken}` } })
    //   .then((r) => r.json())
    //   .then((d) => setGTasks(d.items ?? []))
    //   .catch(() => {});
  }, [fetchGoogleEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, GCalEvent[]>();
    for (const e of events) {
      const start = e.start?.dateTime || e.start?.date;
      if (!start) continue;
      const key = format(toDate(start)!, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  // タスクを日付ごとにグループ化（plannedDatesに基づく）
  // Googleカレンダーに同期済み（plannedDateGoogleEventsにIDがある）タスクは除外
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.archived) continue;
      if (task.type !== "backlog") continue;
      const plannedDates = task.plannedDates ?? [];
      const googleEvents = task.plannedDateGoogleEvents ?? {};

      for (const ts of plannedDates) {
        const dateKey = format(new Date(ts), "yyyy-MM-dd");

        // この日付にGoogleイベントIDが紐付いている場合は、Googleカレンダーに同期済み
        // → 黄色表示しない（青のGoogleイベントとして表示される）
        const hasGoogleEventForDate = Object.keys(googleEvents).some((key) => {
          const eventDate = new Date(Number(key));
          return format(eventDate, "yyyy-MM-dd") === dateKey;
        });
        if (hasGoogleEventForDate) continue;

        const list = map.get(dateKey) ?? [];
        list.push(task);
        map.set(dateKey, list);
      }
    }
    return map;
  }, [tasks]);

  // タスクの日付を移動し、GoogleカレンダーイベントIDも更新
  const moveTaskToDate = useCallback((
    taskId: string,
    fromDateUtc: number,
    toDateUtc: number,
    googleEventId?: string // 新しいまたは更新されたイベントID
  ) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // ローカルタイムゾーンでの日付を取得
    const fromDateLocal = new Date(fromDateUtc);
    const fromYear = fromDateLocal.getFullYear();
    const fromMonth = fromDateLocal.getMonth();
    const fromDay = fromDateLocal.getDate();

    console.log("[moveTaskToDate] Moving task", task.title);
    console.log("[moveTaskToDate] from:", `${fromYear}-${fromMonth + 1}-${fromDay}`, "to:", format(new Date(toDateUtc), "yyyy-MM-dd"));

    // 元の日付を削除、移動先を追加
    const newPlannedDates = (task.plannedDates ?? []).filter(d => {
      const dt = new Date(d);
      return !(dt.getFullYear() === fromYear && dt.getMonth() === fromMonth && dt.getDate() === fromDay);
    });

    // 移動先の日付を追加（同じ日がなければ）
    const toDateLocal = new Date(toDateUtc);
    const alreadyExists = newPlannedDates.some(d => {
      const dt = new Date(d);
      return dt.getFullYear() === toDateLocal.getFullYear() &&
             dt.getMonth() === toDateLocal.getMonth() &&
             dt.getDate() === toDateLocal.getDate();
    });
    if (!alreadyExists) {
      newPlannedDates.push(toDateUtc);
    }

    // GoogleイベントIDのマッピングを更新
    const newGoogleEvents = { ...(task.plannedDateGoogleEvents ?? {}) };
    // 元の日付のエントリを削除（キーは元のタイムスタンプ文字列）
    const oldKeys = Object.keys(newGoogleEvents).filter(key => {
      const dt = new Date(Number(key));
      return dt.getFullYear() === fromYear && dt.getMonth() === fromMonth && dt.getDate() === fromDay;
    });
    oldKeys.forEach(key => delete newGoogleEvents[key]);

    // 新しい日付にイベントIDを設定
    if (googleEventId) {
      newGoogleEvents[String(toDateUtc)] = googleEventId;
    }

    console.log("[moveTaskToDate] Final plannedDates:", newPlannedDates);
    console.log("[moveTaskToDate] Final plannedDateGoogleEvents:", newGoogleEvents);

    updateTask(taskId, {
      plannedDates: newPlannedDates,
      plannedDateGoogleEvents: newGoogleEvents,
    });
  }, [tasks, updateTask]);

  // タスクに日付を追加し、GoogleカレンダーイベントIDを紐付け
  const addPlannedDateWithGoogleEvent = useCallback((
    taskId: string,
    dateUtc: number,
    googleEventId: string
  ) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newPlannedDates = [...(task.plannedDates ?? [])];
    if (!newPlannedDates.includes(dateUtc)) {
      newPlannedDates.push(dateUtc);
    }

    const newGoogleEvents = { ...(task.plannedDateGoogleEvents ?? {}) };
    newGoogleEvents[String(dateUtc)] = googleEventId;

    updateTask(taskId, {
      plannedDates: newPlannedDates,
      plannedDateGoogleEvents: newGoogleEvents,
    });
  }, [tasks, updateTask]);

  // タスクに紐づくGoogleイベントIDを取得
  const getGoogleEventIdForDate = useCallback((task: Task, dateUtc: number): string | undefined => {
    const googleEvents = task.plannedDateGoogleEvents ?? {};
    // 完全一致で検索
    if (googleEvents[String(dateUtc)]) {
      return googleEvents[String(dateUtc)];
    }
    // 同じ日付のキーを検索（タイムスタンプが異なる場合）
    const targetDate = new Date(dateUtc);
    for (const key of Object.keys(googleEvents)) {
      const keyDate = new Date(Number(key));
      if (keyDate.getFullYear() === targetDate.getFullYear() &&
          keyDate.getMonth() === targetDate.getMonth() &&
          keyDate.getDate() === targetDate.getDate()) {
        return googleEvents[key];
      }
    }
    return undefined;
  }, []);

  const create = async () => {
    const accessToken = (session as unknown as { access_token?: string })?.access_token;
    if (!accessToken) return;
    const startIso = startInput ? new Date(startInput).toISOString() : new Date().toISOString();
    const endIso = endInput
      ? new Date(endInput).toISOString()
      : new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const body = {
      summary: title || "無題",
      start: { dateTime: startIso },
      end: { dateTime: endIso },
    };
    await fetch("/api/calendar/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setTitle("");
    setStartInput("");
    setEndInput("");
    // refetch
    const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(monthStart.toISOString())}&timeMax=${encodeURIComponent(monthEnd.toISOString())}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    setEvents(data.items ?? []);
  };

  const days: Date[] = useMemo(() => {
    const arr: Date[] = [];
    if (viewMode === "day") {
      arr.push(currentDate);
    } else if (viewMode === "week") {
      let d = weekStart;
      while (d <= weekEnd) {
        arr.push(d);
        d = addDays(d, 1);
      }
    } else {
      let d = gridStart;
      while (d <= gridEnd) {
        arr.push(d);
        d = addDays(d, 1);
      }
    }
    return arr;
  }, [viewMode, currentDate, weekStart, weekEnd, gridStart, gridEnd]);

  // const isTaskOnDate = (task: Task, date: Date) => {
  //   if (task.type === "daily" || task.type === "scheduled") return isTaskForToday(task, date);
  //   const created = new Date(task.createdAt);
  //   created.setHours(0, 0, 0, 0);
  //   const d0 = new Date(date);
  //   d0.setHours(0, 0, 0, 0);
  //   return created.getTime() === d0.getTime();
  // };

  // helper removed (unused)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // removed task editing id
  const [editingEvent, setEditingEvent] = useState<GCalEvent | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [detailDate, setDetailDate] = useState<Date | null>(null);

  const sessionAccessToken = (session as unknown as { access_token?: string })?.access_token;
  const isGoogleConnected = !!sessionAccessToken;

  // 日ビューの場合は詳細パネルを自動で表示
  useEffect(() => {
    if (viewMode === "day") {
      setDetailDate(currentDate);
    }
  }, [viewMode, currentDate]);

  const openCreateDialog = (date: Date) => {
    setDialogMode("create");
    setEditingEvent(null);
    setSelectedDate(date);
    setFormTitle("");
    const iso = format(date, "yyyy-MM-dd");
    setFormStart(`${iso}T09:00`);
    setFormEnd(`${iso}T09:30`);
    setDialogOpen(true);
  };

  // removed task edit dialog

  const openEditEvent = (ev: GCalEvent) => {
    setDialogMode("edit");
    setEditingEvent(ev);
    setSelectedDate(toDate(ev.start?.dateTime || ev.start?.date || "") ?? new Date());
    setFormTitle(ev.summary || "");
    setFormStart((ev.start?.dateTime || ev.start?.date || "").slice(0, 16));
    setFormEnd((ev.end?.dateTime || ev.end?.date || "").slice(0, 16));
    setDialogOpen(true);
  };

  // classification removed

  const submitDialog = async () => {
    if (!selectedDate) return;
    if (dialogMode === "create") {
      {
        const accessToken = (session as unknown as { access_token?: string })?.access_token;
        if (!accessToken) return;
        const startIso = formStart ? new Date(formStart).toISOString() : new Date().toISOString();
        const endIso = formEnd
          ? new Date(formEnd).toISOString()
          : new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const body = {
          summary: formTitle || "(無題)",
          start: { dateTime: startIso },
          end: { dateTime: endIso },
        };
        await fetch("/api/calendar/events", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const timeMin = monthStart.toISOString();
        const timeMax = monthEnd.toISOString();
        const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        setEvents(data.items ?? []);
      }
    } else {
      if (editingEvent?.id) {
        const accessToken = (session as unknown as { access_token?: string })?.access_token;
        if (!accessToken) return;
        // 簡易更新（削除→作成）
        await fetch(`/api/calendar/events/${editingEvent.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const startIso2 = formStart ? new Date(formStart).toISOString() : new Date().toISOString();
        const endIso2 = formEnd
          ? new Date(formEnd).toISOString()
          : new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const body = {
          summary: formTitle || "(無題)",
          start: { dateTime: startIso2 },
          end: { dateTime: endIso2 },
        };
        await fetch("/api/calendar/events", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const timeMin = monthStart.toISOString();
        const timeMax = monthEnd.toISOString();
        const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        setEvents(data.items ?? []);
      }
    }
    setDialogOpen(false);
  };

  const deleteDialog = async () => {
    if (editingEvent?.id) {
      const accessToken = (session as unknown as { access_token?: string })?.access_token;
      if (!accessToken) return;
      await fetch(`/api/calendar/events/${editingEvent.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(monthStart.toISOString())}&timeMax=${encodeURIComponent(monthEnd.toISOString())}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setEvents(data.items ?? []);
      setDialogOpen(false);
    }
  };

  return (
    <div className="flex gap-4">
      {/* 月間カレンダー */}
      <div className={`bg-[var(--sidebar)] rounded-xl p-5 shadow-sm transition-all ${detailDate ? "flex-1" : "w-full"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Calendar size={16} />
          カレンダー（Google同期）
          {isMovingTask && (
            <span className="flex items-center gap-1 text-xs text-primary animate-pulse">
              <Loader2 size={12} className="animate-spin" />
              移動中...
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* ビューモード切り替え */}
          <div className="flex items-center border rounded overflow-hidden text-xs">
            <button
              className={`px-3 py-1.5 transition-colors ${viewMode === "day" ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
              onClick={() => {
                setViewMode("day");
                setCurrentDate(new Date());
              }}
            >
              日
            </button>
            <button
              className={`px-3 py-1.5 border-x transition-colors ${viewMode === "week" ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
              onClick={() => {
                setViewMode("week");
                setCurrentDate(new Date());
              }}
            >
              週
            </button>
            <button
              className={`px-3 py-1.5 transition-colors ${viewMode === "month" ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
              onClick={() => setViewMode("month")}
            >
              月
            </button>
          </div>
          {/* ナビゲーション */}
          <div className="flex items-center gap-2 text-sm">
            <button
              className="px-2 py-1 border rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => {
                if (viewMode === "month") {
                  setCurrentMonth(addMonths(currentMonth, -1));
                } else if (viewMode === "week") {
                  setCurrentDate(subWeeks(currentDate, 1));
                } else {
                  setCurrentDate(subDays(currentDate, 1));
                }
              }}
            >
              {"<"}
            </button>
            <button
              className="px-2 py-1 border rounded text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setCurrentMonth(startOfMonth(today));
              }}
            >
              今日
            </button>
            <div className="min-w-[10rem] text-center text-sm">
              {viewMode === "month" && format(currentMonth, "yyyy年 M月")}
              {viewMode === "week" && `${format(weekStart, "M/d")} - ${format(weekEnd, "M/d")}`}
              {viewMode === "day" && format(currentDate, "yyyy年 M月d日 (E)", { locale: ja })}
            </div>
            <button
              className="px-2 py-1 border rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => {
                if (viewMode === "month") {
                  setCurrentMonth(addMonths(currentMonth, 1));
                } else if (viewMode === "week") {
                  setCurrentDate(addWeeks(currentDate, 1));
                } else {
                  setCurrentDate(addDays(currentDate, 1));
                }
              }}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>

      {/* Google連携バナー */}
      {status === "authenticated" && !isGoogleConnected && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Googleカレンダーと連携する
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Googleアカウントと連携すると、カレンダーの予定を表示・作成・編集できます。
              </p>
            </div>
            <button
              onClick={() => signIn("google", { callbackUrl: "/calendar" })}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleで連携
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] opacity-80 mb-2">
        <div className="inline-flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded border" style={{ backgroundColor: "#039BE5", borderColor: "#039BE5" }} />
          <span>予定（Google）</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {viewMode === "month" && <span>今月: {daysInMonth}日 / 平日: {weekdaysInMonth}日</span>}
          {viewMode === "week" && <span>週間ビュー</span>}
          {viewMode === "day" && <span>日間ビュー</span>}
        </div>
      </div>

      {/* 曜日ヘッダー（日ビュー以外） */}
      {viewMode !== "day" && (
        <div className="grid grid-cols-7 text-xs mb-1 opacity-70">
          {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
            <div key={w} className="px-2 py-1 text-center">{w}</div>
          ))}
        </div>
      )}
      {/* カレンダーグリッド */}
      <div className={`grid gap-1 ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const todays = eventsByDate.get(key) ?? [];
          const dayTasks = tasksByDate.get(key) ?? [];
          const cellDateUtc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).getTime();
          const inMonth = viewMode === "month" ? isSameMonth(d, monthStart) : true;
          const dow = d.getDay();
          // ビューモードに応じたセルのスタイル
          const cellHeight = viewMode === "day"
            ? "min-h-[400px]"
            : viewMode === "week"
              ? "min-h-32 sm:min-h-40"
              : "min-h-20 sm:min-h-24 md:min-h-28";
          const cls = [
            `border rounded ${cellHeight} p-1 flex flex-col gap-1 cursor-pointer`,
            inMonth ? "" : "opacity-50",
            isToday(d) ? "ring-2 ring-foreground" : "",
            dow === 0 ? "bg-[var(--danger)]/5 border-[var(--danger)]/20" : "",
            dow === 6 ? "bg-[var(--primary)]/5 border-[var(--primary)]/20" : "",
            dragOverKey === key ? "bg-[var(--warning)]/10 border-[var(--warning)]/30" : "",
          ].join(" ");
          return (
            <div
              key={key}
              className={cls}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOverKey(key);
              }}
              onDragOver={(e) => {
                // Allow drop
                e.preventDefault();
                setDragOverKey(key);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setDragOverKey(null);
                const data = e.dataTransfer.getData("application/json");
                if (!data) return;
                try {
                  const payload = JSON.parse(data) as { type?: string; id?: string; taskId?: string; fromDateUtc?: number; start?: string; end?: string };

                  // タスクのD&D処理
                  if (payload.type === "calendar-task" && payload.taskId && payload.fromDateUtc != null) {
                    // 二重操作防止
                    if (isMovingTask) {
                      console.log("[Calendar onDrop] Already moving task, ignoring");
                      return;
                    }

                    console.log("[Calendar onDrop] Processing calendar-task", payload);
                    setIsMovingTask(true);

                    try {
                      const toDateUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
                      const fromDateStr = format(new Date(payload.fromDateUtc), "yyyy-MM-dd");
                      const targetDateStr = format(d, "yyyy-MM-dd");

                      // 同じ日への移動は無視
                      if (fromDateStr === targetDateStr) {
                        console.log("[Calendar onDrop] Same date, ignoring");
                        return;
                      }

                      const accessToken = (session as unknown as { access_token?: string })?.access_token;
                      const task = tasks.find(t => t.id === payload.taskId);

                      if (accessToken && task) {
                        // 既存のGoogleイベントIDを取得
                        const existingEventId = getGoogleEventIdForDate(task, payload.fromDateUtc);
                        let newEventId: string | undefined;

                        if (existingEventId) {
                          // 既存イベントを更新（日付を変更）
                          console.log("[Calendar onDrop] Updating existing event", existingEventId, "to", targetDateStr);
                          const res = await fetch(`/api/calendar/events/${existingEventId}`, {
                            method: "PATCH",
                            headers: {
                              Authorization: `Bearer ${accessToken}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              start: { date: targetDateStr },
                              end: { date: targetDateStr },
                            }),
                          });
                          if (res.ok) {
                            console.log("[Calendar onDrop] Event updated successfully");
                            newEventId = existingEventId;
                          } else {
                            console.error("[Calendar onDrop] Failed to update event", await res.text());
                          }
                        } else {
                          // 新規イベントを作成
                          console.log("[Calendar onDrop] Creating new event for", task.title, "on", targetDateStr);
                          const res = await fetch("/api/calendar/events", {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${accessToken}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              summary: `📋 ${task.title}`,
                              description: task.description || undefined,
                              start: { date: targetDateStr },
                              end: { date: targetDateStr },
                            }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            newEventId = data.id;
                            console.log("[Calendar onDrop] Event created successfully", newEventId);
                          } else {
                            console.error("[Calendar onDrop] Failed to create event", await res.text());
                          }
                        }

                        // ローカルのplannedDatesとGoogleイベントIDマッピングを更新
                        moveTaskToDate(payload.taskId, payload.fromDateUtc, toDateUtc, newEventId);

                        // Googleカレンダーを再取得
                        fetchGoogleEvents();
                      } else {
                        // Google未連携の場合はローカルのみ更新
                        moveTaskToDate(payload.taskId, payload.fromDateUtc, toDateUtc);
                      }
                    } catch (err) {
                      console.error("[Calendar onDrop] Error moving task", err);
                    } finally {
                      setIsMovingTask(false);
                    }
                    return;
                  }

                  // Google Calendarイベントの処理
                  if (!payload.id) return;
                  const accessToken = (session as unknown as { access_token?: string })?.access_token;
                  if (!accessToken) return;

                  // 終日イベントかどうかを判定（dateTimeがなくdateのみの場合は終日イベント）
                  const isAllDayEvent = payload.start && !payload.start.includes("T");
                  const targetDateStr = format(d, "yyyy-MM-dd");

                  let body: { start: { date?: string; dateTime?: string }; end: { date?: string; dateTime?: string } };

                  if (isAllDayEvent) {
                    // 終日イベントの場合はdate形式を維持
                    body = {
                      start: { date: targetDateStr },
                      end: { date: targetDateStr },
                    };
                  } else {
                    // 時間指定イベントの場合
                    const originalStart = payload.start ? parseISO(payload.start) : undefined;
                    const originalEnd = payload.end ? parseISO(payload.end) : undefined;
                    const durationMs = originalStart && originalEnd ? (originalEnd.getTime() - originalStart.getTime()) : 30 * 60 * 1000;

                    const startLocal = new Date(d);
                    startLocal.setHours(9, 0, 0, 0);
                    const endLocal = new Date(startLocal.getTime() + durationMs);

                    body = {
                      start: { dateTime: startLocal.toISOString() },
                      end: { dateTime: endLocal.toISOString() },
                    };
                  }

                  await fetch(`/api/calendar/events/${payload.id}`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  });
                  // refetch events in current month
                  const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(monthStart.toISOString())}&timeMax=${encodeURIComponent(monthEnd.toISOString())}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                  });
                  const json = await res.json();
                  setEvents(json.items ?? []);
                } catch { }
              }}
              onDragLeave={() => {
                setDragOverKey(null);
              }}
              onClick={(e) => {
                // 何も選択されていないセル（余白）をクリックしたら詳細パネルを表示
                if ((e.target as HTMLElement).dataset.kind !== "event") {
                  setDetailDate(d);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                openCreateDialog(d);
              }}
            >
              <div className="text-[11px] opacity-70 flex items-center justify-between">
                <span>
                  {viewMode === "day" ? (
                    format(d, "M月d日 (E)", { locale: ja })
                  ) : viewMode === "week" ? (
                    `${format(d, "d")} (${format(d, "E", { locale: ja })})`
                  ) : (
                    format(d, "d")
                  )}
                </span>
                {isSameDay(d, new Date()) && <span className="text-[10px] px-1 rounded bg-foreground text-background">今日</span>}
              </div>
              <div className="flex flex-col gap-1 mt-1 overflow-hidden flex-1">
                {/* Google Calendar イベント */}
                {todays.slice(0, viewMode === "day" ? 20 : viewMode === "week" ? 5 : 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="text-[11px] truncate px-1 py-0.5 rounded cursor-pointer text-white"
                    style={{ backgroundColor: "#039BE5", border: "1px solid #039BE5" }}
                    title={ev.summary}
                    data-kind="event"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify({ id: ev.id, start: ev.start?.dateTime || ev.start?.date, end: ev.end?.dateTime || ev.end?.date }));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditEvent(ev);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      openEditEvent(ev);
                    }}
                  >
                    {ev.summary || "(無題)"}
                  </div>
                ))}
                {todays.length > (viewMode === "day" ? 20 : viewMode === "week" ? 5 : 2) && (
                  <div className="text-[10px] opacity-60 px-1">+{todays.length - (viewMode === "day" ? 20 : viewMode === "week" ? 5 : 2)}件（予定）</div>
                )}
                {/* タスク（積み上げ候補のplannedDates） */}
                {dayTasks.slice(0, viewMode === "day" ? 20 : viewMode === "week" ? 5 : 2).map((task) => (
                  <div
                    key={task.id}
                    className="text-[11px] truncate px-1 py-0.5 rounded cursor-grab active:cursor-grabbing"
                    style={{ backgroundColor: "var(--warning)", border: "1px solid var(--warning)", color: "var(--warning-foreground, #000)" }}
                    title={task.title}
                    data-kind="event"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify({
                        type: "calendar-task",
                        taskId: task.id,
                        fromDateUtc: cellDateUtc,
                      }));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailDate(d);
                    }}
                  >
                    📋 {task.title}
                  </div>
                ))}
                {dayTasks.length > (viewMode === "day" ? 20 : viewMode === "week" ? 5 : 2) && (
                  <div className="text-[10px] opacity-60 px-1">+{dayTasks.length - (viewMode === "day" ? 20 : viewMode === "week" ? 5 : 2)}件（タスク）</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 mb-2 text-xs">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル"
          className="border rounded px-2 py-1"
        />
        <input
          type="datetime-local"
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          type="datetime-local"
          value={endInput}
          onChange={(e) => setEndInput(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button onClick={create} className="px-3 py-1 rounded border text-sm">イベント作成</button>
        <div className="text-xs opacity-60">日付セルをクリックすると入力に反映されます</div>
      </div>

      {dialogOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="w-[92vw] max-w-sm bg-background text-foreground border rounded p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold mb-2">
              {dialogMode === "create" ? "新規作成" : "編集"}（予定）
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs opacity-70">タイトル</span>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="border rounded px-2 py-1 w-56" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs opacity-70">開始</span>
                <input type="datetime-local" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="border rounded px-2 py-1 w-56" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs opacity-70">終了</span>
                <input type="datetime-local" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="border rounded px-2 py-1 w-56" />
              </label>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button className="px-3 py-1 rounded border text-sm" onClick={() => setDialogOpen(false)}>キャンセル</button>
              <div className="flex items-center gap-2">
                {dialogMode === "edit" && (
                  <button className="px-3 py-1 rounded border text-sm" onClick={deleteDialog}>削除</button>
                )}
                <button className="px-3 py-1 rounded bg-foreground text-background text-sm" onClick={submitDialog}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

      {/* 日間詳細パネル */}
      {detailDate && (
        <div className="w-96 bg-[var(--sidebar)] rounded-xl shadow-sm overflow-hidden">
          <DayDetailPanel
            date={detailDate}
            onClose={() => setDetailDate(null)}
            onGoogleCalendarUpdate={fetchGoogleEvents}
          />
        </div>
      )}
    </div>
  );
}

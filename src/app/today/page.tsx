"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { useAppStore } from "@/lib/store";
import { isTaskForToday, Task } from "@/lib/types";

type GCalEvent = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

function toDate(value?: string) {
  if (!value) return undefined as unknown as Date | undefined;
  return parseISO(value);
}

export default function TodayPage() {
  const { data: session, status } = useSession();
  const tasks = useAppStore((s) => s.tasks);
  const [events, setEvents] = useState<GCalEvent[]>([]);

  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const todayEnd = useMemo(() => endOfDay(new Date()), []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const accessToken = (session as unknown as { access_token?: string })?.access_token;
    if (!accessToken) return;
    const timeMin = todayStart.toISOString();
    const timeMax = todayEnd.toISOString();
    fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setEvents(d.items ?? []))
      .catch(() => {});
  }, [session, status, todayStart, todayEnd]);

  const tasksForToday: Task[] = useMemo(() => {
    return tasks.filter((t) => isTaskForToday(t, new Date()));
  }, [tasks]);

  const timeBoundEvents = useMemo(() => {
    const list = events.filter((e) => Boolean(e.start?.dateTime));
    list.sort((a, b) => {
      const sa = a.start?.dateTime ? toDate(a.start.dateTime)?.getTime() ?? 0 : 0;
      const sb = b.start?.dateTime ? toDate(b.start.dateTime)?.getTime() ?? 0 : 0;
      return sa - sb;
    });
    return list;
  }, [events]);

  const allDayEvents = useMemo(() => {
    return events.filter((e) => Boolean(e.start?.date));
  }, [events]);

  const reload = async () => {
    const accessToken = (session as unknown as { access_token?: string })?.access_token;
    if (!accessToken) return;
    const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(todayStart.toISOString())}&timeMax=${encodeURIComponent(todayEnd.toISOString())}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    setEvents(data.items ?? []);
  };

  return (
    <div className="p-4 border rounded">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold">今日のまとめ（{format(new Date(), "PPP(E)", { locale: ja })}）</div>
        <button onClick={reload} className="px-2 py-1 border rounded text-xs">更新</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="border rounded p-3">
          <div className="text-xs font-semibold mb-2">時間が決まっている（Googleカレンダー）</div>
          {timeBoundEvents.length === 0 && (
            <div className="text-xs opacity-60">予定はありません</div>
          )}
          <ul className="flex flex-col gap-2">
            {timeBoundEvents.map((e) => {
              const s = e.start?.dateTime ? toDate(e.start.dateTime) : undefined;
              const en = e.end?.dateTime ? toDate(e.end.dateTime) : undefined;
              const range = s && en ? `${format(s, "HH:mm")} - ${format(en, "HH:mm")}` : "";
              return (
                <li key={e.id} className="text-xs flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: "#039BE5" }} />
                  <span className="tabular-nums min-w-[7.5rem]">{range}</span>
                  <span className="truncate" title={e.summary}>{e.summary || "(無題)"}</span>
                </li>
              );
            })}
          </ul>
          {allDayEvents.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] opacity-70 mb-1">終日</div>
              <ul className="flex flex-col gap-1">
                {allDayEvents.map((e) => (
                  <li key={e.id} className="text-xs flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: "#039BE5" }} />
                    <span className="truncate" title={e.summary}>{e.summary || "(無題)"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="border rounded p-3">
          <div className="text-xs font-semibold mb-2">時間が決まっていない（このサービスのタスク）</div>
          {tasksForToday.length === 0 && (
            <div className="text-xs opacity-60">タスクはありません</div>
          )}
          <ul className="flex flex-col gap-2">
            {tasksForToday.map((t) => (
              <li key={t.id} className="text-xs flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: "#4284F3" }} />
                <span className="truncate" title={t.title}>{t.title}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

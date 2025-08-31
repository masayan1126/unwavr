"use client";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { X, Clock, Calendar } from "lucide-react";

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

export default function CalendarNotificationBar() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのみlocalStorageを読み込む
  useEffect(() => {
    setIsClient(true);
    const savedVisibility = localStorage.getItem('calendar-notification-visible');
    // 保存された値がない場合（初回）は表示する
    if (savedVisibility === null) {
      setIsVisible(true);
    } else {
      setIsVisible(savedVisibility !== 'false');
    }
  }, []);
  
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const accessToken = (session as unknown as { access_token?: string })?.access_token;
    if (!accessToken) return;
    if (hasFetched) return; // 既に取得済みの場合はスキップ

    setHasFetched(true);
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const timeMin = todayStart.toISOString();
    const timeMax = todayEnd.toISOString();
    
    fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.items ?? []);
      })
      .catch(() => {});
  }, [session, status, hasFetched]);

  // 時間が決まっているイベントのみを取得し、時間順にソート
  const timeBoundEvents = useMemo(() => {
    return events
      .filter((e) => Boolean(e.start?.dateTime))
      .sort((a, b) => {
        const sa = a.start?.dateTime ? toDate(a.start.dateTime)?.getTime() ?? 0 : 0;
        const sb = b.start?.dateTime ? toDate(b.start.dateTime)?.getTime() ?? 0 : 0;
        return sa - sb;
      });
  }, [events]);

  // 通知バーを閉じる
  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('calendar-notification-visible', 'false');
  };



  // クライアントサイドでない場合は何も表示しない
  if (!isClient) {
    return null;
  }

  // 通知バーが非表示またはイベントがない場合は何も表示しない
  if (!isVisible || timeBoundEvents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-[var(--border)] shadow-sm">
      <div className="px-6 sm:px-10 py-2 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Calendar size={14} className="flex-shrink-0" />
            <span className="text-xs font-medium">今日の予定</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-1">
            {timeBoundEvents.map((event) => {
              const startTime = event.start?.dateTime ? toDate(event.start.dateTime) : undefined;
              const endTime = event.end?.dateTime ? toDate(event.end.dateTime) : undefined;
              const timeRange = startTime && endTime 
                ? `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`
                : startTime 
                ? `${format(startTime, "HH:mm")}`
                : "";

              return (
                <div key={event.id} className="flex items-center gap-2 flex-shrink-0 bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20 border border-[var(--primary)]/30 rounded-md px-2 py-1">
                  <Clock size={12} className="text-[var(--primary)]" />
                  <span className="text-xs font-medium tabular-nums text-[var(--primary)]">{timeRange}</span>
                  <span className="text-xs truncate max-w-28 text-gray-700 dark:text-gray-300" title={event.summary}>
                    {event.summary || "(無題)"}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            title="通知を閉じる"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* スクロールバーを隠すためのスタイル */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

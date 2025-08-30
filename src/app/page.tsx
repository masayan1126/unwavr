"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { useTodayTasks } from "@/hooks/useTodayTasks";
import WeatherWidget from "@/components/WeatherWidget";
import { Plus, RefreshCw } from "lucide-react";
import { useConfirm } from "@/components/Providers";
import { useAppStore } from "@/lib/store";
import SectionLoader from "@/components/SectionLoader";
import { useEffect, useState } from "react";

export default function Home() {
  const {
    incompleteToday,
    dailyDoneFiltered,
    scheduledDoneFiltered,
    backlogDoneFiltered,
  } = useTodayTasks();
  const hydrateFromDb = useAppStore((s) => s.hydrateFromDb);
  const hydrating = useAppStore((s) => s.hydrating);
  useConfirm();
  const [nowLabel, setNowLabel] = useState("");
  useEffect(() => {
    const update = () => {
      const d = new Date();
      const dateStr = d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
      const weekday = d.toLocaleDateString("ja-JP", { weekday: "short" });
      const timeStr = d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
      setNowLabel(`${dateStr} (${weekday}) ${timeStr}`);
    };
    update();
    const id = window.setInterval(update, 10000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ホーム</h1>
        <div className="flex items-center gap-4">
          <span className="text-base sm:text-lg md:text-xl font-medium tabular-nums">{nowLabel}</span>
          <WeatherWidget variant="large" />
          <button
            className={`px-2 py-1 rounded border flex items-center gap-2 ${hydrating ? "opacity-70" : ""}`}
            onClick={async () => {
              await hydrateFromDb();
            }}
            disabled={hydrating}
            aria-busy={hydrating}
            title="データを再読み込み"
          >
            <RefreshCw size={16} className={hydrating ? "animate-spin" : ""} />
            <span className="hidden sm:inline">再読み込み</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
        {/* 未完了 */}
        <section className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col min-h-[320px]">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">未完了 ({incompleteToday.length})</h2>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <Link href={{ pathname: "/tasks", query: { new: "1" } }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm"><Plus size={16} />追加</Link>
            </div>
          </div>
          {hydrating ? (
            <SectionLoader label="今日のタスクを読み込み中..." lines={5} />
          ) : (
            <TaskList title="" tasks={incompleteToday.slice(0,10)} showType tableMode showCreatedColumn={false} showPlannedColumn showTypeColumn showMilestoneColumn={false} enableSelection />
          )}
          <div className="mt-2 text-right">
            <Link href={{ pathname: "/tasks", query: { daily: "1", backlogToday: "1", scheduledToday: "1", onlyIncomplete: "1" } }} className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>

        {/* 積み上げ済み (毎日) */}
        <section className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col min-h-[320px]">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">積み上げ済み (毎日) ({dailyDoneFiltered.length})</h2>
            <div className="ml-auto flex items-center gap-2 text-xs" />
          </div>
          {hydrating ? (
            <SectionLoader label="読み込み中..." lines={4} />
          ) : (
            <TaskList title="" tasks={dailyDoneFiltered.slice(0,10)} showType tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} enableSelection />
          )}
          <div className="mt-2 text-right">
            <Link href="/tasks/daily" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>

        {/* 完了済み (特定曜日) */}
        <section className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col min-h-[320px]">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">完了済み (特定曜日) ({scheduledDoneFiltered.length})</h2>
          </div>
          {hydrating ? (
            <SectionLoader label="読み込み中..." lines={4} />
          ) : (
            <TaskList title="" tasks={scheduledDoneFiltered.slice(0,10)} showType tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} enableSelection />
          )}
          <div className="mt-2 text-right">
            <Link href="/tasks/scheduled" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>

        {/* 完了済み (積み上げ候補) */}
        <section className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col min-h-[320px]">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">完了済み (積み上げ候補) ({backlogDoneFiltered.length})</h2>
          </div>
          {hydrating ? (
            <SectionLoader label="読み込み中..." lines={4} />
          ) : (
            <TaskList title="" tasks={backlogDoneFiltered.slice(0,10)} showType tableMode showCreatedColumn={false} showPlannedColumn showTypeColumn showMilestoneColumn={false} enableSelection />
          )}
          <div className="mt-2 text-right">
            <Link href="/backlog" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>
      </div>

      {/* AddQiitaZenn は案内文削除のため一時的に非表示 */}
    </div>
  );
}



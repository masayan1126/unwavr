"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import PrimaryButton from "@/components/PrimaryButton";
import TaskDialog from "@/components/TaskCreateDialog";
import TaskForm from "@/components/TaskForm";
import { useTodayTasks } from "@/hooks/useTodayTasks";
import WeatherWidget from "@/components/WeatherWidget";
import NetworkSpeedIndicator from "@/components/NetworkSpeedIndicator";
import { Plus, RefreshCw, ChevronDown } from "lucide-react";
import TaskCreateDialog from "@/components/TaskCreateDialog";
import { useConfirm } from "@/components/Providers";
import { useAppStore } from "@/lib/store";
import HomePageSkeleton from "@/components/HomePageSkeleton";
import ActiveTasksQueue from "@/components/ActiveTasksQueue";
import { useEffect, useState } from "react";

export default function Home() {
  const {
    incompleteToday,
    dailyDoneFiltered,
    scheduledDoneFiltered,
    backlogDoneFiltered,
    loading,
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
  const [openCreate, setOpenCreate] = useState(false);
  const defaultCreateType = "backlog" as const;

  if (hydrating) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-[1400px] mx-auto flex flex-col gap-6">
      <header
        role="banner"
        aria-label="サイトヘッダー"
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2">
          {/* Left side placeholder or title if needed */}
        </div>
        <div className="flex items-center gap-4 md:gap-6 text-sm">
          {/* Status Bar */}
          <div className="flex items-center gap-3 md:gap-4 bg-card border border-border rounded-full px-4 py-1.5 shadow-sm">
            <NetworkSpeedIndicator />
            <div className="w-px h-4 bg-border" />
            <WeatherWidget variant="small" />
            <div className="w-px h-4 bg-border" />
            <time
              dateTime={new Date().toISOString()}
              className="font-medium text-muted-foreground tabular-nums"
            >
              {nowLabel}
            </time>
          </div>

          {/* Reload Button */}
          <button
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors"
            onClick={async () => {
              await hydrateFromDb();
            }}
            disabled={hydrating}
            aria-busy={hydrating}
            title="データを再読み込み"
          >
            <RefreshCw size={18} className={hydrating ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <ActiveTasksQueue />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
        {/* 未完了 */}
        <section className="relative flex flex-col min-h-[320px] md:col-span-2 bg-[var(--sidebar)] rounded-xl p-5 pb-10 shadow-sm">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">未完了 ({incompleteToday.length})</h2>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <button
                onClick={() => setOpenCreate(true)}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#2383E2] dark:bg-[#2383E2] text-white text-sm font-medium rounded-[3px] shadow-sm hover:bg-[#2383E2]/90 transition-all"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>新規</span>
                <div className="w-px h-3 bg-white/20 mx-0.5" />
                <ChevronDown size={14} className="opacity-70 group-hover:opacity-100" />
              </button>
            </div>
          </div>
          <TaskList title="" tasks={incompleteToday.slice(0, 10)} showType tableMode showCreatedColumn={false} showPlannedColumn showTypeColumn showMilestoneColumn={false} enableSelection />
          <div className="absolute bottom-3 right-5">
            <Link href={{ pathname: "/tasks", query: { daily: "1", backlogToday: "1", scheduledToday: "1", onlyIncomplete: "1" } }} className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>

        {/* 積み上げ済み (毎日) */}
        <section className="relative flex flex-col min-h-[320px] bg-[var(--sidebar)] rounded-xl p-5 pb-10 shadow-sm">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">積み上げ済み (毎日) ({dailyDoneFiltered.length})</h2>
            <div className="ml-auto flex items-center gap-2 text-xs" />
          </div>
          <TaskList title="" tasks={dailyDoneFiltered.slice(0, 10)} showType tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} enableSelection />
          <div className="absolute bottom-3 right-5">
            <Link href="/tasks/daily" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>

        {/* 完了済み (特定曜日) */}
        <section className="relative flex flex-col min-h-[320px] bg-[var(--sidebar)] rounded-xl p-5 pb-10 shadow-sm">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">完了済み (特定曜日) ({scheduledDoneFiltered.length})</h2>
          </div>
          <TaskList title="" tasks={scheduledDoneFiltered.slice(0, 10)} showType tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} enableSelection />
          <div className="absolute bottom-3 right-5">
            <Link href="/tasks/scheduled" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>

        {/* 完了済み (積み上げ候補) */}
        <section className="relative flex flex-col min-h-[320px] md:col-span-2 bg-[var(--sidebar)] rounded-xl p-5 pb-10 shadow-sm">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">完了済み (積み上げ候補) ({backlogDoneFiltered.length})</h2>
          </div>
          <TaskList title="" tasks={backlogDoneFiltered.slice(0, 10)} showType tableMode showCreatedColumn={false} showPlannedColumn showTypeColumn showMilestoneColumn={false} enableSelection />
          <div className="absolute bottom-3 right-5">
            <Link href="/tasks/backlog" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>
      </div>

      {/* AddQiitaZenn は案内文削除のため一時的に非表示 */}
      <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規タスク">
        <TaskForm defaultType={defaultCreateType} onSubmitted={(mode) => { if (mode === 'close') setOpenCreate(false); }} />
      </TaskDialog>
    </div>
  );
}



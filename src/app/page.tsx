"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import PrimaryButton from "@/components/PrimaryButton";
import TaskDialog from "@/components/TaskCreateDialog";
import TaskForm from "@/components/TaskForm";
import { useTodayTasks } from "@/hooks/useTodayTasks";
import WeatherWidget from "@/components/WeatherWidget";
import NetworkSpeedIndicator from "@/components/NetworkSpeedIndicator";
import { Plus, RefreshCw } from "lucide-react";
import TaskCreateDialog from "@/components/TaskCreateDialog";
import { useConfirm } from "@/components/Providers";
import { useAppStore } from "@/lib/store";
import HomePageSkeleton from "@/components/HomePageSkeleton";
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
    <div className="min-h-screen p-6 sm:p-10 max-w-6xl mx-auto flex flex-col gap-6">
      <header
        role="banner"
        aria-label="サイトヘッダー"
      >
        <div className="flex items-center justify-between gap-2 md:gap-3">
          <h1 className="text-xl font-semibold"></h1>
          <div className="flex items-center gap-2 md:gap-3">
            <NetworkSpeedIndicator />
            <time
              dateTime={new Date().toISOString()}
              className="text-lg font-medium text-gray-700 dark:text-white text-center"
            >
              {nowLabel}
            </time>
            <WeatherWidget variant="large" />
          </div>
        </div>
      </header>

      <div className="flex justify-end">
        <button
          className="mt-1 px-2 py-1 rounded border flex items-center gap-2"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
        {/* 未完了 */}
        <section className="border rounded p-4 border-[var(--border)] flex flex-col min-h-[320px] md:col-span-2">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">未完了 ({incompleteToday.length})</h2>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <PrimaryButton
                onClick={() => setOpenCreate(true)}
                label="タスク追加"
                iconLeft={<Plus size={16} />}
              />
            </div>
          </div>
          <TaskList title="" tasks={incompleteToday.slice(0,10)} showType tableMode showCreatedColumn={false} showPlannedColumn showTypeColumn showMilestoneColumn={false} enableSelection />
          <div className="mt-2 text-right">
            <Link href={{ pathname: "/tasks", query: { daily: "1", backlogToday: "1", scheduledToday: "1", onlyIncomplete: "1" } }} className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>

        {/* 積み上げ済み (毎日) */}
        <section className="border rounded p-4 border-[var(--border)] flex flex-col min-h-[320px]">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">積み上げ済み (毎日) ({dailyDoneFiltered.length})</h2>
            <div className="ml-auto flex items-center gap-2 text-xs" />
          </div>
          <TaskList title="" tasks={dailyDoneFiltered.slice(0,10)} showType tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} enableSelection />
          <div className="mt-2 text-right">
            <Link href="/tasks/daily" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>

        {/* 完了済み (特定曜日) */}
        <section className="border rounded p-4 border-[var(--border)] flex flex-col min-h-[320px]">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">完了済み (特定曜日) ({scheduledDoneFiltered.length})</h2>
          </div>
          <TaskList title="" tasks={scheduledDoneFiltered.slice(0,10)} showType tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} enableSelection />
          <div className="mt-2 text-right">
            <Link href="/tasks/scheduled" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>

        {/* 完了済み (積み上げ候補) */}
        <section className="border rounded p-4 border-[var(--border)] flex flex-col min-h-[320px] md:col-span-2">
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">完了済み (積み上げ候補) ({backlogDoneFiltered.length})</h2>
          </div>
          <TaskList title="" tasks={backlogDoneFiltered.slice(0,10)} showType tableMode showCreatedColumn={false} showPlannedColumn showTypeColumn showMilestoneColumn={false} enableSelection />
          <div className="mt-2 text-right">
            <Link href="/backlog" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </section>
      </div>

      {/* AddQiitaZenn は案内文削除のため一時的に非表示 */}
      <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規タスク">
        <TaskForm defaultType={defaultCreateType} onSubmitted={(mode)=>{ if (mode==='close') setOpenCreate(false); }} />
      </TaskDialog>
    </div>
  );
}



"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import TaskDialog from "@/components/TaskCreateDialog";
import TaskForm from "@/components/TaskForm";
import { useTodayTasks } from "@/hooks/useTodayTasks";
import NetworkSpeedIndicator from "@/components/NetworkSpeedIndicator";
import { Plus, RefreshCw, ChevronDown } from "lucide-react";
import { useConfirm } from "@/components/Providers";
import { useAppStore } from "@/lib/store";
import ActiveTasksQueue from "@/components/ActiveTasksQueue";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { PageLayout } from "@/components/ui/PageLayout";

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
  const [openCreate, setOpenCreate] = useState(false);
  const defaultCreateType = "backlog" as const;
  const [activeTab, setActiveTab] = useState<"incomplete" | "daily" | "scheduled" | "backlog">("incomplete");

  return (
    <PageLayout className="gap-4 sm:gap-6">
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
          <div className="hidden sm:flex items-center gap-3 md:gap-4 bg-card border border-border rounded-xl px-4 py-1.5 shadow-sm">
            <NetworkSpeedIndicator />
            <div className="w-px h-4 bg-border" />
            <time
              dateTime={new Date().toISOString()}
              className="font-medium opacity-70 tabular-nums"
              suppressHydrationWarning
            >
              {nowLabel}
            </time>
          </div>

          {/* Reload Button */}
          <IconButton
            icon={<RefreshCw size={18} className={hydrating ? "animate-spin" : ""} />}
            onClick={async () => {
              await hydrateFromDb();
            }}
            disabled={hydrating}
            aria-busy={hydrating}
            label="データを再読み込み"
            className="rounded-full"
          />
        </div>
      </header>

      <ActiveTasksQueue />

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide mt-2">
        {[
          { id: "incomplete", label: hydrating ? "未完了" : `未完了 (${incompleteToday.length})` },
          { id: "daily", label: hydrating ? "毎日" : `毎日 (${dailyDoneFiltered.length})` },
          { id: "scheduled", label: hydrating ? "特定曜日" : `特定曜日 (${scheduledDoneFiltered.length})` },
          { id: "backlog", label: hydrating ? "積み上げ" : `積み上げ (${backlogDoneFiltered.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "incomplete" | "daily" | "scheduled" | "backlog")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeTab === tab.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted opacity-70 hover:bg-muted/80"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {/* 未完了 */}
        <Card padding="md" className={`flex flex-col min-h-[320px] ${activeTab === "incomplete" ? "flex" : "hidden"}`}>
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">未完了 {!hydrating && `(${incompleteToday.length})`}</h2>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <Button
                onClick={() => setOpenCreate(true)}
                iconLeft={<Plus size={16} strokeWidth={2.5} />}
                iconRight={<ChevronDown size={14} className="opacity-70" />}
                size="sm"
              >
                <span className="hidden md:inline">新規</span>
              </Button>
            </div>
          </div>
          {hydrating ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <TaskList title="" tasks={incompleteToday.slice(0, 20)} showCreatedColumn={false} showPlannedColumn showTypeColumn showMilestoneColumn={false} enableSelection />
          )}
          <div className="mt-auto flex justify-end pt-4">
            <Link href={{ pathname: "/tasks", query: { daily: "1", backlogToday: "1", scheduledToday: "1", onlyIncomplete: "1" } }} className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </Card>

        {/* 積み上げ済み (毎日) */}
        <Card padding="md" className={`flex flex-col min-h-[150px] ${activeTab === "daily" ? "flex" : "hidden"}`}>
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">積み上げ済み (毎日) {!hydrating && `(${dailyDoneFiltered.length})`}</h2>
            <div className="ml-auto flex items-center gap-2 text-xs" />
          </div>
          {hydrating ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <TaskList title="" tasks={dailyDoneFiltered.slice(0, 10)} showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} enableSelection />
          )}
          <div className="mt-auto flex justify-end pt-4">
            <Link href="/tasks/daily" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </Card>

        {/* 完了済み (特定曜日) */}
        <Card padding="md" className={`flex flex-col min-h-[150px] ${activeTab === "scheduled" ? "flex" : "hidden"}`}>
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">完了済み (特定曜日) {!hydrating && `(${scheduledDoneFiltered.length})`}</h2>
          </div>
          {hydrating ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <TaskList title="" tasks={scheduledDoneFiltered.slice(0, 10)} showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} enableSelection />
          )}
          <div className="mt-auto flex justify-end pt-4">
            <Link href="/tasks/scheduled" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </Card>

        {/* 完了済み (積み上げ候補) */}
        <Card padding="md" className={`flex flex-col min-h-[150px] ${activeTab === "backlog" ? "flex" : "hidden"}`}>
          <div className="mb-2 flex gap-2 items-center">
            <h2 className="text-sm font-medium">完了済み (積み上げ候補) {!hydrating && `(${backlogDoneFiltered.length})`}</h2>
          </div>
          {hydrating ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <TaskList title="" tasks={backlogDoneFiltered.slice(0, 10)} showCreatedColumn={false} showPlannedColumn showTypeColumn showMilestoneColumn={false} enableSelection />
          )}
          <div className="mt-auto flex justify-end pt-4">
            <Link href="/tasks/backlog" className="text-sm underline opacity-80 hover:opacity-100">一覧へ</Link>
          </div>
        </Card>
      </div>

      <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規タスク">
        <TaskForm defaultType={defaultCreateType} onSubmitted={(mode) => { if (mode === 'close') setOpenCreate(false); }} />
      </TaskDialog>
    </PageLayout>
  );
}



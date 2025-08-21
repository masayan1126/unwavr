"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { useTodayTasks } from "@/hooks/useTodayTasks";
import WeatherWidget from "@/components/WeatherWidget";
import { Plus, Target, Timer, Rocket, Upload, Filter as FilterIcon, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import SectionLoader from "@/components/SectionLoader";
// import AddQiitaZenn from "@/components/AddQiitaZenn";

export default function Home() {
  const {
    incompleteToday,
    dailyDoneFiltered,
    scheduledDoneFiltered,
    backlogDoneFiltered,
    filterOpen,
    setFilterOpen,
    showIncomplete,
    setShowIncomplete,
    showCompleted,
    setShowCompleted,
    filterDaily,
    setFilterDaily,
    filterScheduled,
    setFilterScheduled,
    filterBacklog,
    setFilterBacklog,
    resetFilters,
  } = useTodayTasks();
  const dataSource = useAppStore((s) => s.dataSource);
  const setDataSource = useAppStore((s) => s.setDataSource);
  const hydrateFromDb = useAppStore((s) => s.hydrateFromDb);
  const hydrating = useAppStore((s) => s.hydrating);
  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{new Date().toLocaleDateString()}</span>
          <WeatherWidget variant="large" />
        </div>
      </div>

      <section className="border rounded p-4 border-black/10 dark:border-white/10">
        <div className="mb-2 flex gap-2">
          <Link href="/tasks/new" className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm">
            <Plus size={16} /> タスク追加
          </Link>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="opacity-70">データソース: db</span>
            <button
              className={`px-2 py-1 rounded border bg-foreground text-background`}
              onClick={async () => { await hydrateFromDb(); }}
            >再読み込み</button>
          </div>
        </div>
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <div className="text-[11px] opacity-70">対象: 今日該当(毎日/特定日) + バックログ(今日やる)</div>
            <div className="flex flex-wrap items-center gap-2 px-2 py-1 rounded border border-black/10 dark:border-white/10">
              <span className="text-[11px] opacity-70 mr-1">適用中</span>
              {showIncomplete && (
                <span className="px-2 py-0.5 rounded-full border">未実行</span>
              )}
              {showCompleted && (
                <span className="px-2 py-0.5 rounded-full border">完了表示</span>
              )}
              {filterDaily && (
                <span className="px-2 py-0.5 rounded-full border">毎日</span>
              )}
              {filterScheduled && (
                <span className="px-2 py-0.5 rounded-full border">特定日</span>
              )}
              {filterBacklog && (
                <span className="px-2 py-0.5 rounded-full border">バックログ</span>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="px-3 py-1.5 rounded border flex items-center gap-2"
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
            >
              <FilterIcon size={16} /> フィルター
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-72 border rounded bg-background text-foreground shadow-lg p-3 flex flex-col gap-3">
                  <div className="text-xs opacity-70">表示設定</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowIncomplete((v) => !v)}
                      className={`px-2 py-1 rounded-full border text-xs ${showIncomplete ? "bg-foreground text-background" : ""}`}
                    >未実行</button>
                    <button
                      type="button"
                      onClick={() => setShowCompleted((v) => !v)}
                      className={`px-2 py-1 rounded-full border text-xs ${showCompleted ? "bg-foreground text-background" : ""}`}
                    >完了表示</button>
                  </div>
                  <div className="text-xs opacity-70">種別</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFilterDaily((v) => !v)}
                      className={`px-2 py-1 rounded-full border text-xs ${filterDaily ? "bg-foreground text-background" : ""}`}
                    >毎日</button>
                    <button
                      type="button"
                      onClick={() => setFilterScheduled((v) => !v)}
                      className={`px-2 py-1 rounded-full border text-xs ${filterScheduled ? "bg-foreground text-background" : ""}`}
                    >特定日</button>
                    <button
                      type="button"
                      onClick={() => setFilterBacklog((v) => !v)}
                      className={`px-2 py-1 rounded-full border text-xs ${filterBacklog ? "bg-foreground text-background" : ""}`}
                    >バックログ</button>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 rounded border text-xs"
                    onClick={resetFilters}
                    >リセット</button>
                    <button type="button" className="px-2 py-1 rounded bg-foreground text-background text-xs" onClick={() => setFilterOpen(false)}>閉じる</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {hydrating ? (
          <SectionLoader label="今日のタスクを読み込み中..." lines={5} />
        ) : (
          <>
            {showIncomplete && (
              <TaskList 
                title={`未実行 (${incompleteToday.length})`} 
                tasks={incompleteToday} 
                showType 
                tableMode 
                showCreatedColumn={false} 
                showPlannedColumn 
                showTypeColumn 
                showMilestoneColumn={false} 
              />
            )}
          </>
        )}
        {showCompleted && !hydrating && (
          <>
            <div className="mt-3">
              <TaskList title={`積み上げ済み (毎日) (${dailyDoneFiltered.length})`} tasks={dailyDoneFiltered} showType tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} />
            </div>
            <div className="mt-3">
              <TaskList 
                title={`完了済み (特定日) (${scheduledDoneFiltered.length})`} 
                tasks={scheduledDoneFiltered} 
                showType 
                tableMode 
                showCreatedColumn={false} 
                showPlannedColumn={false} 
                showTypeColumn 
                showMilestoneColumn={false} 
              />
            </div>
            <div className="mt-3">
              <TaskList 
                title={`完了済み (バックログ) (${backlogDoneFiltered.length})`} 
                tasks={backlogDoneFiltered} 
                showType 
                tableMode 
                showCreatedColumn={false} 
                showPlannedColumn 
                showTypeColumn 
                showMilestoneColumn={false} 
              />
            </div>
          </>
        )}
      </section>

      <section className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col gap-3">
        <div className="text-sm font-medium">クイックアクション</div>
        <div className="flex gap-2 flex-wrap">
          <Link className="px-3 py-2 rounded border text-sm flex items-center gap-2" href="/tasks">
            <Plus size={16} />
            タスク管理
          </Link>
          <Link className="px-3 py-2 rounded border text-sm flex items-center gap-2" href="/milestones">
            <Target size={16} />
            マイルストーン
          </Link>
          <Link className="px-3 py-2 rounded border text-sm flex items-center gap-2" href="/pomodoro">
            <Timer size={16} />
            ポモドーロ
          </Link>
          <Link className="px-3 py-2 rounded border text-sm flex items-center gap-2" href="/launcher">
            <Rocket size={16} />
            ランチャー
          </Link>
          <Link className="px-3 py-2 rounded border text-sm flex items-center gap-2" href="/tasks/import-export">
            <Upload size={16} />
            インポート/エクスポート
          </Link>
          <Link className="px-3 py-2 rounded border text-sm flex items-center gap-2" href="/tasks/incomplete">
            <AlertTriangle size={16} />
            未完了タスク
          </Link>
        </div>
      </section>

      {/* AddQiitaZenn は案内文削除のため一時的に非表示 */}
    </div>
  );
}

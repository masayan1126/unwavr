"use client";
import Link from "next/link";
import AddTaskButton from "@/components/AddTaskButton";
import TaskList from "@/components/TaskList";
import TaskDialog from "@/components/TaskCreateDialog";
import TaskForm from "@/components/TaskForm";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import SimpleTaskListPageSkeleton from "@/components/SimpleTaskListPageSkeleton";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import TaskCreateDialog from "@/components/TaskCreateDialog";
import StylishSelect from "@/components/StylishSelect";
import FilterBar from "@/components/FilterBar";

export default function DailyTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const daily = useMemo(() => tasks.filter((t) => t.type === "daily"), [tasks]);
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortKey, setSortKey] = useState<"title" | "createdAt" | "type" | "milestone">("createdAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all");
  const [openCreate, setOpenCreate] = useState(false);
  const total = daily.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const offset = (page - 1) * pageSize;
    return daily.slice(offset, offset + pageSize);
  }, [daily, page, pageSize]);

  if (hydrating) {
    return <SimpleTaskListPageSkeleton />;
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <header className="mb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">毎日</h1>
          <AddTaskButton
            onClick={() => setOpenCreate(true)}
          />
        </div>
      </header>
      {(
        <>
          <div className="mb-4 px-1">
            <div className="flex items-center justify-between">
              <div className="text-xs opacity-70">{page} / {totalPages}（全 {total} 件）</div>
              <FilterBar>
                <StylishSelect
                  label="ソート"
                  value={sortKey}
                  onChange={(v) => setSortKey(v as any)}
                  options={[
                    { value: "createdAt", label: "日付" },
                    { value: "title", label: "タイトル" },
                    { value: "type", label: "種別" },
                    { value: "milestone", label: "マイルストーン" },
                  ]}
                />
                <button
                  className="px-3 py-1.5 rounded-lg border text-sm bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  onClick={() => setSortAsc((v) => !v)}
                >
                  {sortAsc ? "昇順" : "降順"}
                </button>
                <StylishSelect
                  label="ステータス"
                  value={filterStatus}
                  onChange={(v) => {
                    setFilterStatus(v as any);
                    setPage(1);
                  }}
                  options={[
                    { value: "all", label: "すべて" },
                    { value: "incomplete", label: "未完了" },
                    { value: "completed", label: "完了" },
                  ]}
                />
                <StylishSelect
                  label="1ページあたり"
                  value={pageSize}
                  onChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                  options={[10, 20, 50, 100].map((n) => ({ value: n, label: String(n) }))}
                />
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    className="px-3 py-1.5 rounded-lg border text-sm bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    前へ
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border text-sm bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    次へ
                  </button>
                </div>
              </FilterBar>
            </div>
          </div>
          <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
            <TaskList title="毎日" tasks={pageItems} tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} sortKey={sortKey} sortAsc={sortAsc} filterStatus={filterStatus} enableSelection />
          </section>
        </>
      )}
      <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規タスク">
        <TaskForm defaultType="daily" onSubmitted={(mode) => { if (mode === 'close') setOpenCreate(false); }} />
      </TaskDialog>
    </div>
  );
}



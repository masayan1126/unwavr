"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import SectionLoader from "@/components/SectionLoader";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import TaskCreateDialog from "@/components/TaskCreateDialog";

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
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">毎日積み上げ</h1>
        <button
          type="button"
          className="px-3 py-1.5 rounded border text-sm flex items-center gap-2"
          onClick={() => setOpenCreate(true)}
        >
          <Plus size={16} /> タスク追加
        </button>
      </div>
      {hydrating ? (
        <SectionLoader label="毎日タスクを読み込み中..." lines={5} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs opacity-70">{page} / {totalPages}（全 {total} 件）</div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <span className="opacity-70">ソート</span>
                <select className="border rounded px-2 py-1 bg-transparent" value={sortKey} onChange={(e)=>setSortKey(e.target.value as "title" | "createdAt" | "type" | "milestone")}>
                  <option value="createdAt">日付</option>
                  <option value="title">タイトル</option>
                  <option value="type">種別</option>
                  <option value="milestone">マイルストーン</option>
                </select>
                <button className="px-2 py-1 rounded border" onClick={()=>setSortAsc(v=>!v)}>{sortAsc? '昇順' : '降順'}</button>
              </label>
              <label className="flex items-center gap-2">
                <span className="opacity-70">ステータス</span>
                <select className="border rounded px-2 py-1 bg-transparent" value={filterStatus} onChange={(e)=>{ setFilterStatus(e.target.value as "all" | "completed" | "incomplete"); setPage(1); }}>
                  <option value="all">すべて</option>
                  <option value="incomplete">未完了</option>
                  <option value="completed">完了</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="opacity-70">1ページあたり</span>
                <select className="border rounded px-2 py-1 bg-transparent" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {[10,20,50,100].map(n => (<option key={n} value={n}>{n}</option>))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 rounded border text-sm disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p)=>Math.max(1,p-1))}>前へ</button>
                <button className="px-2 py-1 rounded border text-sm disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p)=>Math.min(totalPages,p+1))}>次へ</button>
              </div>
            </div>
          </div>
          <TaskList title="毎日積み上げ" tasks={pageItems} tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} sortKey={sortKey} sortAsc={sortAsc} filterStatus={filterStatus} enableSelection />
        </>
      )}
      <TaskCreateDialog open={openCreate} onClose={() => setOpenCreate(false)} />
    </div>
  );
}



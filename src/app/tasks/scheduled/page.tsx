"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import SectionLoader from "@/components/SectionLoader";

export default function ScheduledTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const scheduled = useMemo(() => tasks.filter((t) => t.type === "scheduled"), [tasks]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortKey, setSortKey] = useState<"title" | "createdAt" | "scheduled" | "type" | "milestone">("createdAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all");
  const total = scheduled.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const offset = (page - 1) * pageSize;
    return scheduled.slice(offset, offset + pageSize);
  }, [scheduled, page, pageSize]);
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">特定曜日だけ積み上げ</h1>
        <Link className="text-sm underline opacity-80" href={{ pathname: "/tasks", query: { new: "1" } }}>タスク追加</Link>
      </div>
      {hydrating ? (
        <SectionLoader label="特定曜日タスクを読み込み中..." lines={5} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs opacity-70">{page} / {totalPages}（全 {total} 件）</div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <span className="opacity-70">ソート</span>
                <select className="border rounded px-2 py-1 bg-transparent" value={sortKey} onChange={(e)=>setSortKey(e.target.value as "title" | "createdAt" | "scheduled" | "type" | "milestone")}>
                  <option value="createdAt">日付</option>
                  <option value="title">タイトル</option>
                  <option value="scheduled">設定（曜日/期間）</option>
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
          <TaskList title="特定曜日" tasks={pageItems} tableMode showCreatedColumn={false} showPlannedColumn={false} showScheduledColumn showTypeColumn showMilestoneColumn={false} sortKey={sortKey} sortAsc={sortAsc} filterStatus={filterStatus} enableSelection />
        </>
      )}
    </div>
  );
}



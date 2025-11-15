"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import TaskList from "@/components/TaskList";
import PrimaryButton from "@/components/PrimaryButton";
import TaskDialog from "@/components/TaskCreateDialog";
import TaskForm from "@/components/TaskForm";
import { useAppStore } from "@/lib/store";
import { Filter as FilterIcon } from "lucide-react";
import BacklogPageSkeleton from "@/components/BacklogPageSkeleton";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import TaskCreateDialog from "@/components/TaskCreateDialog";

export default function BacklogPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const milestones = useAppStore((s) => s.milestones);
  const backlog = useMemo(() => tasks.filter((t) => t.type === "backlog"), [tasks]);
  const router = useRouter();
  const [openCreate, setOpenCreate] = useState(false);
  // フィルター状態
  const [showIncomplete, setShowIncomplete] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // 実行済みと未完了に分ける
  const incompleteBacklog = useMemo(() => backlog.filter((t) => !t.completed), [backlog]);
  const completedBacklog = useMemo(() => backlog.filter((t) => t.completed), [backlog]);
  const [pageInc, setPageInc] = useState(1);
  const [pageCom, setPageCom] = useState(1);
  const [pageSizeInc, setPageSizeInc] = useState(10);
  const [pageSizeCom, setPageSizeCom] = useState(10);
  const [sortKeyInc, setSortKeyInc] = useState<"title" | "createdAt" | "planned" | "type" | "milestone">("planned");
  const [sortAscInc, setSortAscInc] = useState(true);
  const [sortKeyCom, setSortKeyCom] = useState<"title" | "createdAt" | "planned" | "type" | "milestone">("planned");
  const [sortAscCom, setSortAscCom] = useState(true);
  const totalInc = incompleteBacklog.length;
  const totalCom = completedBacklog.length;
  const totalPagesInc = Math.max(1, Math.ceil(totalInc / pageSizeInc));
  const totalPagesCom = Math.max(1, Math.ceil(totalCom / pageSizeCom));
  const sortedIncompleteBacklog = useMemo(() => {
    const list = incompleteBacklog.slice();
    const dir = sortAscInc ? 1 : -1;
    list.sort((a, b) => {
      if (sortKeyInc === "title") {
        return dir * (a.title ?? "").localeCompare(b.title ?? "");
      }
      if (sortKeyInc === "createdAt") {
        return dir * ((a.createdAt ?? 0) - (b.createdAt ?? 0));
      }
      if (sortKeyInc === "planned") {
        const pa = (a.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ?? Number.MAX_SAFE_INTEGER;
        const pb = (b.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ?? Number.MAX_SAFE_INTEGER;
        return dir * (pa - pb);
      }
      if (sortKeyInc === "type") {
        const order: Record<string, number> = { daily: 0, scheduled: 1, backlog: 2 };
        return dir * ((order[a.type] ?? 9) - (order[b.type] ?? 9));
      }
      if (sortKeyInc === "milestone") {
        const ma = milestones.find((m) => m.id === a.milestoneId)?.title ?? "";
        const mb = milestones.find((m) => m.id === b.milestoneId)?.title ?? "";
        return dir * ma.localeCompare(mb);
      }
      return 0;
    });
    return list;
  }, [incompleteBacklog, sortKeyInc, sortAscInc, milestones]);
  const sortedCompletedBacklog = useMemo(() => {
    const list = completedBacklog.slice();
    const dir = sortAscCom ? 1 : -1;
    list.sort((a, b) => {
      if (sortKeyCom === "title") {
        return dir * (a.title ?? "").localeCompare(b.title ?? "");
      }
      if (sortKeyCom === "createdAt") {
        return dir * ((a.createdAt ?? 0) - (b.createdAt ?? 0));
      }
      if (sortKeyCom === "planned") {
        const pa = (a.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ?? Number.MAX_SAFE_INTEGER;
        const pb = (b.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ?? Number.MAX_SAFE_INTEGER;
        return dir * (pa - pb);
      }
      if (sortKeyCom === "type") {
        const order: Record<string, number> = { daily: 0, scheduled: 1, backlog: 2 };
        return dir * ((order[a.type] ?? 9) - (order[b.type] ?? 9));
      }
      if (sortKeyCom === "milestone") {
        const ma = milestones.find((m) => m.id === a.milestoneId)?.title ?? "";
        const mb = milestones.find((m) => m.id === b.milestoneId)?.title ?? "";
        return dir * ma.localeCompare(mb);
      }
      return 0;
    });
    return list;
  }, [completedBacklog, sortKeyCom, sortAscCom, milestones]);
  const incItems = useMemo(() => {
    const offset = (pageInc - 1) * pageSizeInc;
    return sortedIncompleteBacklog.slice(offset, offset + pageSizeInc);
  }, [sortedIncompleteBacklog, pageInc, pageSizeInc]);
  const comItems = useMemo(() => {
    const offset = (pageCom - 1) * pageSizeCom;
    return sortedCompletedBacklog.slice(offset, offset + pageSizeCom);
  }, [sortedCompletedBacklog, pageCom, pageSizeCom]);

  if (hydrating) {
    return <BacklogPageSkeleton />;
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <header className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">積み上げ候補</h1>
          <div className="flex items-center gap-4">
            <PrimaryButton
              onClick={() => setOpenCreate(true)}
              label="タスク追加"
              iconLeft={<Plus size={16} />}
            />
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
                      >未完了</button>
                      <button
                        type="button"
                        onClick={() => setShowCompleted((v) => !v)}
                        className={`px-2 py-1 rounded-full border text-xs ${showCompleted ? "bg-foreground text-background" : ""}`}
                      >実行済み</button>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 rounded border text-xs"
                        onClick={() => {
                          setShowIncomplete(true);
                          setShowCompleted(true);
                        }}
                      >リセット</button>
                      <button type="button" className="px-2 py-1 rounded bg-foreground text-background text-xs" onClick={() => setFilterOpen(false)}>閉じる</button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <Link className="text-sm underline opacity-80" href="/">
              ホーム
            </Link>
          </div>
        </div>
      </header>
      
      {/* 適用中のフィルター表示 */}
      <div className="flex flex-wrap items-center gap-2 px-2 py-1 rounded border border-black/10 dark:border-white/10">
        <span className="text-[11px] opacity-70 mr-1">適用中</span>
        {showIncomplete && (
          <span className="px-2 py-0.5 rounded-full border">未完了</span>
        )}
        {showCompleted && (
          <span className="px-2 py-0.5 rounded-full border">実行済み</span>
        )}
      </div>
      
      {/* 未完了の積み上げ候補 */}
      {showIncomplete ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs opacity-70">{pageInc} / {totalPagesInc}（全 {totalInc} 件）</div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <span className="opacity-70">ソート</span>
                <select className="border rounded px-2 py-1 bg-transparent" value={sortKeyInc} onChange={(e)=>setSortKeyInc(e.target.value as "title" | "createdAt" | "planned" | "type" | "milestone")}>
                  <option value="createdAt">日付</option>
                  <option value="title">タイトル</option>
                  <option value="planned">実行日</option>
                  <option value="type">種別</option>
                  <option value="milestone">マイルストーン</option>
                </select>
                <button className="px-2 py-1 rounded border" onClick={()=>setSortAscInc(v=>!v)}>{sortAscInc? '昇順' : '降順'}</button>
              </label>
              <label className="flex items-center gap-2">
                <span className="opacity-70">1ページあたり</span>
                <select className="border rounded px-2 py-1 bg-transparent" value={pageSizeInc} onChange={(e)=>{ setPageSizeInc(Number(e.target.value)); setPageInc(1); }}>
                  {[10,20,50,100].map(n => (<option key={n} value={n}>{n}</option>))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 rounded border text-sm disabled:opacity-50" disabled={pageInc<=1} onClick={()=>setPageInc(p=>Math.max(1,p-1))}>前へ</button>
                <button className="px-2 py-1 rounded border text-sm disabled:opacity-50" disabled={pageInc>=totalPagesInc} onClick={()=>setPageInc(p=>Math.min(totalPagesInc,p+1))}>次へ</button>
              </div>
            </div>
          </div>
          <TaskList 
            title={`未完了 (${incItems.length})`}
            tasks={incItems} 
            showPlannedDates 
            tableMode 
            showCreatedColumn={false} 
            showPlannedColumn 
            showTypeColumn 
            showMilestoneColumn={false}
            enableSelection
          />
        </>
      ) : null}
      
      {/* 実行済みの積み上げ候補 */}
      {showCompleted && completedBacklog.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2 mt-4">
            <div className="text-xs opacity-70">{pageCom} / {totalPagesCom}（全 {totalCom} 件）</div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <span className="opacity-70">ソート</span>
                <select className="border rounded px-2 py-1 bg-transparent" value={sortKeyCom} onChange={(e)=>setSortKeyCom(e.target.value as "title" | "createdAt" | "planned" | "type" | "milestone")}>
                  <option value="createdAt">日付</option>
                  <option value="title">タイトル</option>
                  <option value="planned">実行日</option>
                  <option value="type">種別</option>
                  <option value="milestone">マイルストーン</option>
                </select>
                <button className="px-2 py-1 rounded border" onClick={()=>setSortAscCom(v=>!v)}>{sortAscCom? '昇順' : '降順'}</button>
              </label>
              <label className="flex items-center gap-2">
                <span className="opacity-70">1ページあたり</span>
                <select className="border rounded px-2 py-1 bg-transparent" value={pageSizeCom} onChange={(e)=>{ setPageSizeCom(Number(e.target.value)); setPageCom(1); }}>
                  {[10,20,50,100].map(n => (<option key={n} value={n}>{n}</option>))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 rounded border text-sm disabled:opacity-50" disabled={pageCom<=1} onClick={()=>setPageCom(p=>Math.max(1,p-1))}>前へ</button>
                <button className="px-2 py-1 rounded border text-sm disabled:opacity-50" disabled={pageCom>=totalPagesCom} onClick={()=>setPageCom(p=>Math.min(totalPagesCom,p+1))}>次へ</button>
              </div>
            </div>
          </div>
          <TaskList 
            title={`実行済み (${comItems.length})`} 
            tasks={comItems} 
            showPlannedDates 
            tableMode 
            showCreatedColumn={false} 
            showPlannedColumn 
            showTypeColumn 
            showMilestoneColumn={false}
            enableSelection
          />
        </>
      )}
      <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規タスク">
        <TaskForm onSubmitted={(mode)=>{ if (mode==='close') setOpenCreate(false); }} />
      </TaskDialog>
    </div>
  );
}



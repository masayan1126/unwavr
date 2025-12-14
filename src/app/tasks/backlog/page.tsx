"use client";
import { useState } from "react";
import TaskList from "@/components/TaskList";
import AddTaskButton from "@/components/AddTaskButton";
import TaskDialog from "@/components/TaskCreateDialog";
import TaskForm from "@/components/TaskForm";
import { Filter as FilterIcon } from "lucide-react";
import StylishSelect from "@/components/StylishSelect";
import FilterBar from "@/components/FilterBar";
import FilterChip from "@/components/FilterChip";
import { useBacklogTasks } from "@/hooks/useBacklogTasks";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";

export default function BacklogPage() {
  const {
    hydrating,
    showIncomplete,
    setShowIncomplete,
    showCompleted,
    setShowCompleted,
    filterOpen,
    setFilterOpen,
    incItems,
    totalInc,
    pageInc,
    setPageInc,
    pageSizeInc,
    setPageSizeInc,
    totalPagesInc,
    sortKeyInc,
    setSortKeyInc,
    sortAscInc,
    setSortAscInc,
    comItems,
    totalCom,
    pageCom,
    setPageCom,
    pageSizeCom,
    setPageSizeCom,
    totalPagesCom,
    sortKeyCom,
    setSortKeyCom,
    sortAscCom,
    setSortAscCom,
  } = useBacklogTasks();

  const [openCreate, setOpenCreate] = useState(false);

  return (
    <PageLayout>
      <PageHeader
        title="積み上げ候補"
        actions={
          <>
            <AddTaskButton onClick={() => setOpenCreate(true)} />
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilterOpen((v) => !v)}
                aria-haspopup="dialog"
                aria-expanded={filterOpen}
                iconLeft={<FilterIcon size={14} className="opacity-70" />}
              >
                フィルター
              </Button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                  <Card padding="sm" className="absolute right-0 mt-2 z-50 w-72 shadow-lg flex flex-col gap-3">
                    <div className="text-xs opacity-70">表示設定</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant={showIncomplete ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setShowIncomplete((v) => !v)}
                        className="rounded-full"
                      >
                        未完了
                      </Button>
                      <Button
                        variant={showCompleted ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setShowCompleted((v) => !v)}
                        className="rounded-full"
                      >
                        実行済み
                      </Button>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowIncomplete(true);
                          setShowCompleted(true);
                        }}
                      >
                        リセット
                      </Button>
                      <Button size="sm" onClick={() => setFilterOpen(false)}>閉じる</Button>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </>
        }
      />

      {/* 適用中のフィルター表示 */}
      <div className="flex flex-wrap items-center gap-2 px-1 py-2 mb-2">
        <span className="text-[11px] opacity-70 mr-1">表示切替</span>
        <FilterChip
          label="未完了"
          active={showIncomplete}
          onClick={() => setShowIncomplete((v) => !v)}
        />
        <FilterChip
          label="実行済み"
          active={showCompleted}
          onClick={() => setShowCompleted((v) => !v)}
        />
      </div>

      {/* 未完了の積み上げ候補 */}
      {showIncomplete ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs opacity-70">{hydrating ? "-" : `${pageInc} / ${totalPagesInc}（全 ${totalInc} 件）`}</div>
            <FilterBar>
              <StylishSelect
                label="ソート"
                value={sortKeyInc}
                onChange={(v) => setSortKeyInc(v as "title" | "createdAt" | "planned" | "type" | "milestone")}
                options={[
                  { value: "createdAt", label: "日付" },
                  { value: "title", label: "タイトル" },
                  { value: "planned", label: "実行日" },
                  { value: "type", label: "種別" },
                  { value: "milestone", label: "マイルストーン" },
                ]}
              />
              <Button variant="secondary" size="sm" onClick={() => setSortAscInc((v) => !v)}>
                {sortAscInc ? "昇順" : "降順"}
              </Button>
              <StylishSelect
                label="1ページあたり"
                value={pageSizeInc}
                onChange={(v) => {
                  setPageSizeInc(Number(v));
                  setPageInc(1);
                }}
                options={[10, 20, 50, 100].map((n) => ({ value: n, label: String(n) }))}
              />
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="secondary" size="sm" disabled={pageInc <= 1} onClick={() => setPageInc((p) => Math.max(1, p - 1))}>
                  前へ
                </Button>
                <Button variant="secondary" size="sm" disabled={pageInc >= totalPagesInc} onClick={() => setPageInc((p) => Math.min(totalPagesInc, p + 1))}>
                  次へ
                </Button>
              </div>
            </FilterBar>
          </div>
          <Card padding="md">
            {hydrating ? (
              <div className="space-y-2">
                <div className="text-sm font-medium mb-4">未完了</div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <TaskList
                title={`未完了 (${incItems.length})`}
                tasks={incItems}
                showCreatedColumn={false}
                showPlannedColumn
                showTypeColumn
                showMilestoneColumn={false}
                enableSelection
              />
            )}
          </Card>
        </>
      ) : null}

      {/* 実行済みの積み上げ候補 */}
      {showCompleted && (hydrating || totalCom > 0) && (
        <>
          <div className="flex items-center justify-between mb-2 mt-4">
            <div className="text-xs opacity-70">{hydrating ? "-" : `${pageCom} / ${totalPagesCom}（全 ${totalCom} 件）`}</div>
            <FilterBar>
              <StylishSelect
                label="ソート"
                value={sortKeyCom}
                onChange={(v) => setSortKeyCom(v as "title" | "createdAt" | "planned" | "type" | "milestone")}
                options={[
                  { value: "createdAt", label: "日付" },
                  { value: "title", label: "タイトル" },
                  { value: "planned", label: "実行日" },
                  { value: "type", label: "種別" },
                  { value: "milestone", label: "マイルストーン" },
                ]}
              />
              <Button variant="secondary" size="sm" onClick={() => setSortAscCom((v) => !v)}>
                {sortAscCom ? "昇順" : "降順"}
              </Button>
              <StylishSelect
                label="1ページあたり"
                value={pageSizeCom}
                onChange={(v) => {
                  setPageSizeCom(Number(v));
                  setPageCom(1);
                }}
                options={[10, 20, 50, 100].map((n) => ({ value: n, label: String(n) }))}
              />
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="secondary" size="sm" disabled={pageCom <= 1} onClick={() => setPageCom((p) => Math.max(1, p - 1))}>
                  前へ
                </Button>
                <Button variant="secondary" size="sm" disabled={pageCom >= totalPagesCom} onClick={() => setPageCom((p) => Math.min(totalPagesCom, p + 1))}>
                  次へ
                </Button>
              </div>
            </FilterBar>
          </div>
          <Card padding="md">
            {hydrating ? (
              <div className="space-y-2">
                <div className="text-sm font-medium mb-4">実行済み</div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <TaskList
                title={`実行済み (${comItems.length})`}
                tasks={comItems}
                showCreatedColumn={false}
                showPlannedColumn
                showTypeColumn
                showMilestoneColumn={false}
                enableSelection
              />
            )}
          </Card>
        </>
      )}
      <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規タスク">
        <TaskForm onSubmitted={(mode) => { if (mode === 'close') setOpenCreate(false); }} />
      </TaskDialog>
    </PageLayout>
  );
}



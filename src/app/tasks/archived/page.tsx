"use client";
import React, { useEffect, useMemo, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { useConfirm, useToast } from "@/components/Providers";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";
import StylishSelect from "@/components/StylishSelect";
import FilterBar from "@/components/FilterBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";
import { TaskTable, PRESETS, mergeConfig, BulkAction } from "@/components/TaskTable";

export default function ArchivedTasksPage(): React.ReactElement {
  const [items, setItems] = useState<Task[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const { updateTask, hydrateFromDb } = useAppStore();
  const confirm = useConfirm();
  const toast = useToast();

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total, pageSize]);

  // 並び替え
  const [sortKey, setSortKey] = useState<'title' | 'archivedAt'>('archivedAt');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const offset = (page - 1) * pageSize;
    fetch(`/api/db/tasks?archived=only&limit=${pageSize}&offset=${offset}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { setItems((d.items ?? []) as Task[]); setTotal(Number(d.total ?? 0)); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  const handleBulkRestore = async (ids: string[]) => {
    if (ids.length === 0) return;
    await Promise.all(ids.map((id) =>
      fetch(`/api/db/tasks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false, archivedAt: null }),
      }).catch(() => { })
    ));
    setItems((prev) => prev.filter((t) => !ids.includes(t.id)));
    for (const id of ids) {
      updateTask(id, { archived: false, archivedAt: undefined });
    }
    hydrateFromDb();
    toast.show(`${ids.length}件を復元しました`, 'success');
  };

  const handleBulkPermanentDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    const ok = await confirm(`${ids.length}件を完全に削除しますか？この操作は取り消せません。`, { tone: 'danger', confirmText: '削除' });
    if (!ok) return;
    await Promise.all(ids.map((id) => fetch(`/api/db/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => { })));
    setItems((prev) => prev.filter((t) => !ids.includes(t.id)));
    hydrateFromDb();
    toast.show(`${ids.length}件を削除しました`, 'success');
  };

  // 一括操作アクション
  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: "restore",
      label: "復元",
      icon: <RotateCcw size={14} />,
      onClick: (ids) => handleBulkRestore(ids),
    },
    {
      id: "delete",
      label: "完全削除",
      icon: <Trash2 size={14} />,
      onClick: (ids) => handleBulkPermanentDelete(ids),
      variant: "danger" as const,
    },
  ], []);

  // TaskTableの設定
  const tableConfig = useMemo(() => mergeConfig(PRESETS.archived, {
    sorting: {
      key: sortKey,
      ascending: sortAsc,
      onSortChange: (key, asc) => {
        setSortKey(key as 'title' | 'archivedAt');
        setSortAsc(asc);
      },
    },
    bulkActions: {
      enabled: true,
      actions: bulkActions,
    },
  }), [sortKey, sortAsc, bulkActions]);

  return (
    <PageLayout>
      <PageHeader title="アーカイブ済みタスク" />

      {/* フィルターバー */}
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-70">{loading ? "-" : `${page} / ${totalPages}（全 ${total} 件）`}</div>
          <FilterBar>
            <StylishSelect
              label="ソート"
              value={sortKey}
              onChange={(v) => setSortKey(v as 'title' | 'archivedAt')}
              options={[
                { value: 'archivedAt', label: 'アーカイブ日' },
                { value: 'title', label: 'タイトル' },
              ]}
            />
            <Button variant="secondary" size="sm" onClick={() => setSortAsc((v) => !v)}>
              {sortAsc ? "昇順" : "降順"}
            </Button>
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
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                前へ
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                次へ
              </Button>
            </div>
          </FilterBar>
        </div>
      </div>

      {/* テーブル */}
      {loading ? (
        <Card padding="md">
          <div className="space-y-2">
            <div className="text-sm font-medium mb-4">アーカイブ済み</div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </Card>
      ) : (
        <TaskTable
          title="アーカイブ済み"
          tasks={items}
          config={tableConfig}
          emptyMessage="アーカイブ済みのタスクはありません。"
        />
      )}
    </PageLayout>
  );
}

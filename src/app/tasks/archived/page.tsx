"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/components/Providers";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";

export default function ArchivedTasksPage(): React.ReactElement {
  const [items, setItems] = useState<Task[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const { updateTask, hydrateFromDb } = useAppStore();

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total, pageSize]);

  useEffect(() => {
    const offset = (page - 1) * pageSize;
    fetch(`/api/db/tasks?archived=only&limit=${pageSize}&offset=${offset}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { setItems((d.items ?? []) as Task[]); setTotal(Number(d.total ?? 0)); })
      .catch(() => { setItems([]); setTotal(0); });
  }, [page, pageSize]);

  const restore = async (task: Task) => {
    await fetch(`/api/db/tasks/${encodeURIComponent(task.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: false, archivedAt: null }),
    }).catch(() => {});
    setItems((prev) => prev.filter((t) => t.id !== task.id));
    updateTask(task.id, { archived: false, archivedAt: undefined });
    hydrateFromDb();
  };

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allChecked = useMemo(() => items.length > 0 && items.every((t) => selected[t.id]), [items, selected]);
  const toggleAll = (checked: boolean) => setSelected(Object.fromEntries(items.map((t) => [t.id, checked])));
  const toggleOne = (id: string, checked: boolean) => setSelected((s) => ({ ...s, [id]: checked }));
  const selectedIds = useMemo(() => items.filter((t) => selected[t.id]).map((t) => t.id), [items, selected]);
  const confirm = useConfirm();
  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm(`${selectedIds.length}件を削除しますか？この操作は取り消せません。`, { tone: 'danger', confirmText: '削除' });
    if (!ok) return;
    // 個別DELETE（RLS適用のため）
    await Promise.all(selectedIds.map((id) => fetch(`/api/db/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})));
    setItems((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
    setSelected({});
    hydrateFromDb();
  };

  // 並び替え（タイトル/アーカイブ日時）
  const [sortKey, setSortKey] = useState<'title' | 'archivedAt'>('archivedAt');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const sorted = useMemo(() => {
    const arr = items.slice();
    arr.sort((a, b) => {
      if (sortKey === 'title') {
        const res = (a.title ?? '').localeCompare(b.title ?? '');
        return sortAsc ? res : -res;
      }
      const av = a.archivedAt ?? 0;
      const bv = b.archivedAt ?? 0;
      return sortAsc ? av - bv : bv - av;
    });
    return arr;
  }, [items, sortKey, sortAsc]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">アーカイブ済みタスク</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm flex items-center gap-2">
            <span className="opacity-70">1ページあたり</span>
            <select
              className="border rounded px-2 py-1 bg-transparent"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {[10,20,50,100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            className="px-3 py-2 rounded border text-sm disabled:opacity-50"
            onClick={bulkDelete}
            disabled={selectedIds.length === 0}
            title="選択したタスクを削除"
          >選択削除</button>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">アーカイブ済みのタスクはありません。</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} /> 全選択</label>
            <span className="text-xs opacity-70">{selectedIds.length} 件選択中</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table-fixed w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-[12px] font-medium opacity-70">
                  <th className="w-[40px] px-2 py-1 text-left"></th>
                  <th className="px-2 py-1 text-left">タイトル
                    <button className="ml-2 text-[11px] underline opacity-70" onClick={() => { setSortKey('title'); setSortAsc((v)=> sortKey==='title' ? !v : true); }}>並び替え{sortKey==='title' ? (sortAsc ? '▲' : '▼') : ''}</button>
                  </th>
                  <th className="w-[120px] px-2 py-1 text-left">種別</th>
                  <th className="w-[140px] px-2 py-1 text-left">アーカイブ日
                    <button className="ml-2 text-[11px] underline opacity-70" onClick={() => { setSortKey('archivedAt'); setSortAsc((v)=> sortKey==='archivedAt' ? !v : false); }}>並び替え{sortKey==='archivedAt' ? (sortAsc ? '▲' : '▼') : ''}</button>
                  </th>
                  <th className="w-[120px] px-2 py-1 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {sorted.map((t) => (
                  <tr key={t.id} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-2 py-1"><input type="checkbox" checked={!!selected[t.id]} onChange={(e) => toggleOne(t.id, e.target.checked)} /></td>
                    <td className="px-2 py-1 overflow-hidden"><div className="truncate font-medium">{t.title}</div></td>
                    <td className="px-2 py-1 text-xs opacity-80">{t.type}</td>
                    <td className="px-2 py-1 text-xs opacity-80">{t.archivedAt ? new Date(t.archivedAt).toLocaleDateString() : '-'}</td>
                    <td className="px-2 py-1">
                      <button className="px-3 py-1.5 text-sm rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors" onClick={() => restore(t)}>復元</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between pt-4">
            <button className="px-3 py-1 rounded border text-sm disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>前へ</button>
            <div className="text-xs opacity-70">{page} / {totalPages}（全 {total} 件）</div>
            <button className="px-3 py-1 rounded border text-sm disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>次へ</button>
          </div>
        </div>
      )}
    </div>
  );
}



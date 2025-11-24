"use client";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useMemo, useState } from "react";
import IconPicker from "@/components/IconPicker";

export default function LauncherGrid() {
  const shortcuts = useAppStore((s) => s.launcherShortcuts);
  const categories = useAppStore((s) => s.launcherCategories);
  const remove = useAppStore((s) => s.removeLauncherShortcut);
  const update = useAppStore((s) => s.updateLauncherShortcut);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const editing = useMemo(
    () => (editingId ? shortcuts.find((s) => s.id === editingId) : undefined),
    [editingId, shortcuts]
  );

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [iconName, setIconName] = useState("Globe");
  const [color, setColor] = useState("#0ea5e9");

  function openEdit(id: string) {
    const sc = shortcuts.find((s) => s.id === id);
    if (!sc) return;
    setEditingId(id);
    setLabel(sc.label);
    setUrl(sc.url);
    setIconName(sc.iconName);
    setColor(sc.color ?? "#0ea5e9");
  }

  function closeEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editingId) return;
    update(editingId, { label: label.trim(), url: url.trim(), iconName, color });
    closeEdit();
  }

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }
  function selectAll() {
    const next: Record<string, boolean> = {};
    for (const sc of shortcuts) next[sc.id] = true;
    setSelected(next);
  }
  function clearAll() {
    setSelected({});
  }
  function selectCategoryAll(categoryId?: string) {
    const next = { ...selected };
    for (const sc of shortcuts) {
      if ((categoryId && sc.categoryId === categoryId) || (!categoryId && !sc.categoryId)) next[sc.id] = true;
    }
    setSelected(next);
  }
  function clearCategoryAll(categoryId?: string) {
    const next = { ...selected };
    for (const sc of shortcuts) {
      if ((categoryId && sc.categoryId === categoryId) || (!categoryId && !sc.categoryId)) delete next[sc.id];
    }
    setSelected(next);
  }
  function bulkDelete() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    for (const id of ids) remove(id);
    clearAll();
  }

  const groups = useMemo(() => {
    const map = new Map<string, typeof shortcuts>();
    const rest: typeof shortcuts = [];
    for (const s of shortcuts) {
      if (s.categoryId) {
        const key = s.categoryId;
        if (!map.has(key)) map.set(key, [] as typeof shortcuts);
        (map.get(key) as typeof shortcuts).push(s);
      } else {
        rest.push(s);
      }
    }
    return { map, rest };
  }, [shortcuts]);

  return (
    <>
      <div className="flex items-center justify-end gap-2 mb-2">
        <span className="text-xs opacity-70">選択: {selectedCount}</span>
        <button className="text-xs underline opacity-80" onClick={selectAll}>全選択</button>
        <button className="text-xs underline opacity-80" onClick={clearAll}>全解除</button>
        <button
          className="text-xs px-2 py-1 rounded border"
          onClick={bulkDelete}
          disabled={selectedCount === 0}
          aria-disabled={selectedCount === 0}
        >
          選択を削除
        </button>
      </div>

      {categories.map((c) => {
        const list = groups.map.get(c.id) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={c.id} className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm mb-4">
            <h2 className="text-sm font-medium mb-4 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c.color ?? "#888" }} />
                {c.name}
              </span>
              <span className="flex items-center gap-2">
                <button className="text-[10px] underline opacity-80" onClick={() => selectCategoryAll(c.id)}>全選択</button>
                <button className="text-[10px] underline opacity-80" onClick={() => clearCategoryAll(c.id)}>全解除</button>
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {list.map((sc) => {
                const Ico = (Icons as unknown as Record<string, LucideIcon>)[sc.iconName];
                const style = { backgroundColor: `${sc.color ?? "#0ea5e9"}20`, borderColor: sc.color ?? "#0ea5e9" } as React.CSSProperties;
                return (
                  sc.kind === "web" ? (
                    <a
                      key={sc.id}
                      href={sc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative flex flex-col items-center gap-2 p-3 bg-card rounded-lg shadow-sm hover:opacity-90 transition"
                      style={style}
                      title={sc.label}
                    >
                      <input
                        type="checkbox"
                        className="absolute top-2 right-2"
                        checked={Boolean(selected[sc.id])}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSelect(sc.id);
                        }}
                      />
                      <div className="w-10 h-10 rounded flex items-center justify-center border" style={{ borderColor: sc.color }}>
                        {Ico ? <Ico size={20} /> : sc.iconName}
                      </div>
                      <div className="text-sm text-center line-clamp-2">{sc.label}</div>
                      <div className="flex gap-2">
                        <button
                          className="text-[10px] opacity-60 underline"
                          onClick={(e) => {
                            e.preventDefault();
                            openEdit(sc.id);
                          }}
                        >
                          編集
                        </button>
                        <button
                          className="text-[10px] opacity-60 underline"
                          onClick={(e) => {
                            e.preventDefault();
                            remove(sc.id);
                          }}
                        >
                          削除
                        </button>
                      </div>
                    </a>
                  ) : (
                    <div
                      key={sc.id}
                      className="group relative flex flex-col items-center gap-2 p-3 bg-card rounded-lg shadow-sm hover:opacity-90 transition cursor-default"
                      style={style}
                      title={sc.label}
                    >
                      <input
                        type="checkbox"
                        className="absolute top-2 right-2"
                        checked={Boolean(selected[sc.id])}
                        onChange={() => toggleSelect(sc.id)}
                      />
                      <div className="w-10 h-10 rounded flex items-center justify-center border" style={{ borderColor: sc.color }}>
                        {Ico ? <Ico size={20} /> : sc.iconName}
                      </div>
                      <div className="text-sm text-center line-clamp-2">{sc.label}</div>
                      <div className="flex gap-2 flex-wrap items-center justify-center">
                        {sc.url && (
                          <button
                            className="text-[10px] opacity-60 underline"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(sc.url);
                              } catch { }
                            }}
                          >
                            スキームをコピー
                          </button>
                        )}
                        {sc.nativePath && (
                          <button
                            className="text-[10px] opacity-60 underline"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(sc.nativePath!);
                              } catch { }
                            }}
                          >
                            パスをコピー
                          </button>
                        )}
                        <button
                          className="text-[10px] opacity-60 underline"
                          onClick={() => openEdit(sc.id)}
                        >
                          編集
                        </button>
                        <button
                          className="text-[10px] opacity-60 underline"
                          onClick={() => remove(sc.id)}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm mb-2">
        <h2 className="text-sm font-medium mb-4 flex items-center justify-between">
          <span>未分類</span>
          <span className="flex items-center gap-2">
            <button className="text-[10px] underline opacity-80" onClick={() => selectCategoryAll(undefined)}>全選択</button>
            <button className="text-[10px] underline opacity-80" onClick={() => clearCategoryAll(undefined)}>全解除</button>
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {groups.rest.length === 0 ? (
            <div className="text-sm opacity-70 col-span-full">ショートカットがありません。下のフォームから追加してください。</div>
          ) : (
            groups.rest.map((sc) => {
              const Ico = (Icons as unknown as Record<string, LucideIcon>)[sc.iconName];
              const style = { backgroundColor: `${sc.color ?? "#0ea5e9"}20`, borderColor: sc.color ?? "#0ea5e9" } as React.CSSProperties;
              return (
                sc.kind === "web" ? (
                  <a
                    key={sc.id}
                    href={sc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative flex flex-col items-center gap-2 p-3 bg-card rounded-lg shadow-sm hover:opacity-90 transition"
                    style={style}
                    title={sc.label}
                  >
                    <input
                      type="checkbox"
                      className="absolute top-2 right-2"
                      checked={Boolean(selected[sc.id])}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelect(sc.id);
                      }}
                    />
                    <div className="w-10 h-10 rounded flex items-center justify-center border" style={{ borderColor: sc.color }}>
                      {Ico ? <Ico size={20} /> : sc.iconName}
                    </div>
                    <div className="text-sm text-center line-clamp-2">{sc.label}</div>
                    <div className="flex gap-2">
                      <button
                        className="text-[10px] opacity-60 underline"
                        onClick={(e) => {
                          e.preventDefault();
                          openEdit(sc.id);
                        }}
                      >
                        編集
                      </button>
                      <button
                        className="text-[10px] opacity-60 underline"
                        onClick={(e) => {
                          e.preventDefault();
                          remove(sc.id);
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </a>
                ) : (
                  <div
                    key={sc.id}
                    className="group relative flex flex-col items-center gap-2 p-3 bg-card rounded-lg shadow-sm hover:opacity-90 transition cursor-default"
                    style={style}
                    title={sc.label}
                  >
                    <input
                      type="checkbox"
                      className="absolute top-2 right-2"
                      checked={Boolean(selected[sc.id])}
                      onChange={() => toggleSelect(sc.id)}
                    />
                    <div className="w-10 h-10 rounded flex items-center justify-center border" style={{ borderColor: sc.color }}>
                      {Ico ? <Ico size={20} /> : sc.iconName}
                    </div>
                    <div className="text-sm text-center line-clamp-2">{sc.label}</div>
                    <div className="flex gap-2 flex-wrap items-center justify-center">
                      {sc.url && (
                        <button
                          className="text-[10px] opacity-60 underline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(sc.url);
                            } catch { }
                          }}
                        >
                          スキームをコピー
                        </button>
                      )}
                      {sc.nativePath && (
                        <button
                          className="text-[10px] opacity-60 underline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(sc.nativePath!);
                            } catch { }
                          }}
                        >
                          パスをコピー
                        </button>
                      )}
                      <button
                        className="text-[10px] opacity-60 underline"
                        onClick={() => openEdit(sc.id)}
                      >
                        編集
                      </button>
                      <button
                        className="text-[10px] opacity-60 underline"
                        onClick={() => remove(sc.id)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )
              );
            })
          )}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-background text-foreground rounded shadow border border-black/10 dark:border-white/10 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">ショートカットを編集</div>
              <button className="text-sm underline opacity-80" onClick={closeEdit}>
                閉じる
              </button>
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded px-2 py-1 bg-transparent border-black/10 dark:border-white/10"
                placeholder="ラベル"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <input
                className="flex-1 border rounded px-2 py-1 bg-transparent border-black/10 dark:border-white/10"
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm">色</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="text-sm opacity-70">アイコンを選択</div>
            </div>
            <IconPicker value={iconName} onChange={setIconName} />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded border text-sm" onClick={closeEdit}>
                キャンセル
              </button>
              <button className="px-3 py-1 rounded bg-foreground text-background text-sm" onClick={saveEdit}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



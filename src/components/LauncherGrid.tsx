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
  const [args, setArgs] = useState("");
  const [iconName, setIconName] = useState("Globe");
  const [color, setColor] = useState("#0ea5e9");

  function openEdit(id: string) {
    const sc = shortcuts.find((s) => s.id === id);
    if (!sc) return;
    setEditingId(id);
    setLabel(sc.label);
    setUrl(sc.url);
    setArgs(sc.args ?? "");
    setIconName(sc.iconName);
    setColor(sc.color ?? "#0ea5e9");
  }

  function closeEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editingId) return;
    update(editingId, { label: label.trim(), url: url.trim(), args: args.trim() || undefined, iconName, color });
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
      <div className={`flex items-center justify-between h-12 px-4 bg-muted/50 rounded-lg mb-4 transition-all duration-300 ${selectedCount > 0 ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-0'}`}>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shortcuts.length > 0 && selectedCount === shortcuts.length}
              onChange={(e) => e.target.checked ? selectAll() : clearAll()}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="font-medium">{selectedCount} 選択中</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              onClick={bulkDelete}
            >
              <Icons.Trash2 size={14} />
              削除
            </button>
          )}
        </div>
      </div>

      {categories.map((c) => {
        const list = groups.map.get(c.id) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={c.id} className="bg-background rounded-xl p-5 shadow-sm mb-4">
            <h2 className="text-sm font-medium mb-4 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c.color ?? "#888" }} />
                {c.name}
              </span>
              <span className="flex items-center gap-1">
                <button
                  className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title="全選択"
                  onClick={() => selectCategoryAll(c.id)}
                >
                  <Icons.CheckSquare size={16} className="opacity-70" />
                </button>
                <button
                  className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title="全解除"
                  onClick={() => clearCategoryAll(c.id)}
                >
                  <Icons.Square size={16} className="opacity-70" />
                </button>
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {list.map((sc) => {
                const Ico = (Icons as unknown as Record<string, LucideIcon>)[sc.iconName];
                const style = { backgroundColor: `${sc.color ?? "#0ea5e9"}20` } as React.CSSProperties;
                const isSelected = Boolean(selected[sc.id]);
                return (
                  sc.kind === "web" ? (
                    <a
                      key={sc.id}
                      href={sc.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`group relative flex flex-col items-center gap-3 p-4 bg-card/50 hover:bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${isSelected ? 'ring-2 ring-primary/50' : ''}`}
                      style={{ ...style, border: 'none' }}
                      title={sc.label}
                    >
                      <button
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30 hover:border-primary/50 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                          }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSelect(sc.id);
                        }}
                      >
                        {isSelected && <Icons.Check size={14} strokeWidth={3} className="text-white" />}
                      </button>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-background shadow-inner text-foreground/80 group-hover:text-foreground transition-colors overflow-hidden">
                        {sc.customIconUrl ? (
                          <img src={sc.customIconUrl} alt={sc.label} className="w-full h-full object-cover" />
                        ) : (
                          Ico ? <Ico size={24} /> : sc.iconName
                        )}
                      </div>
                      <div className="text-sm text-center line-clamp-2">{sc.label}</div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2">
                        <button
                          className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:opacity-100 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            openEdit(sc.id);
                          }}
                          title="編集"
                        >
                          <Icons.Edit2 size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            remove(sc.id);
                          }}
                          title="削除"
                        >
                          <Icons.Trash2 size={14} />
                        </button>
                      </div>
                    </a>
                  ) : (
                    <div
                      key={sc.id}
                      className={`group relative flex flex-col items-center gap-3 p-4 bg-card/50 hover:bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer ${isSelected ? 'ring-2 ring-primary/50' : ''}`}
                      style={{ ...style, border: 'none' }}
                      title={sc.label}
                      onClick={async () => {
                        try {
                          const path = sc.url || sc.nativePath;
                          if (!path) return;
                          await fetch("/api/system/launch", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ path, args: sc.args }),
                          });
                        } catch (e) {
                          console.error(e);
                          alert("起動に失敗しました");
                        }
                      }}
                    >
                      <button
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30 hover:border-primary/50 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(sc.id);
                        }}
                      >
                        {isSelected && <Icons.Check size={14} strokeWidth={3} className="text-white" />}
                      </button>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-background shadow-inner text-foreground/80 group-hover:text-foreground transition-colors overflow-hidden">
                        {sc.customIconUrl ? (
                          <img src={sc.customIconUrl} alt={sc.label} className="w-full h-full object-cover" />
                        ) : (
                          Ico ? <Ico size={24} /> : sc.iconName
                        )}
                      </div>
                      <div className="text-sm text-center line-clamp-2">{sc.label}</div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2">
                        <button
                          className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:opacity-100 transition-colors"
                          onClick={(e) => { e.stopPropagation(); openEdit(sc.id); }}
                          title="編集"
                        >
                          <Icons.Edit2 size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={(e) => { e.stopPropagation(); remove(sc.id); }}
                          title="削除"
                        >
                          <Icons.Trash2 size={14} />
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

      <section className="bg-background rounded-xl p-5 shadow-sm mb-2">
        <h2 className="text-sm font-medium mb-4 flex items-center justify-between">
          <span>未分類</span>
          <span className="flex items-center gap-1">
            <button
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="全選択"
              onClick={() => selectCategoryAll(undefined)}
            >
              <Icons.CheckSquare size={16} className="opacity-70" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="全解除"
              onClick={() => clearCategoryAll(undefined)}
            >
              <Icons.Square size={16} className="opacity-70" />
            </button>
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {groups.rest.length === 0 ? (
            <div className="text-sm opacity-70 col-span-full">ショートカットがありません。下のフォームから追加してください。</div>
          ) : (
            groups.rest.map((sc) => {
              const Ico = (Icons as unknown as Record<string, LucideIcon>)[sc.iconName];
              const style = { backgroundColor: `${sc.color ?? "#0ea5e9"}20` } as React.CSSProperties;
              const isSelected = Boolean(selected[sc.id]);
              return (
                sc.kind === "web" ? (
                  <a
                    key={sc.id}
                    href={sc.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`group relative flex flex-col items-center gap-3 p-4 bg-card/50 hover:bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${isSelected ? 'ring-2 ring-primary/50' : ''}`}
                    style={{ ...style, border: 'none' }}
                    title={sc.label}
                  >
                    <button
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary/50 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                        }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelect(sc.id);
                      }}
                    >
                      {isSelected && <Icons.Check size={14} strokeWidth={3} className="text-white" />}
                    </button>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-background shadow-inner text-foreground/80 group-hover:text-foreground transition-colors overflow-hidden">
                      {sc.customIconUrl ? (
                        <img src={sc.customIconUrl} alt={sc.label} className="w-full h-full object-cover" />
                      ) : (
                        Ico ? <Ico size={24} /> : sc.iconName
                      )}
                    </div>
                    <div className="text-sm text-center line-clamp-2">{sc.label}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2">
                      <button
                        className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:opacity-100 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          openEdit(sc.id);
                        }}
                        title="編集"
                      >
                        <Icons.Edit2 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          remove(sc.id);
                        }}
                        title="削除"
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    </div>
                  </a>
                ) : (
                  <div
                    key={sc.id}
                    className={`group relative flex flex-col items-center gap-3 p-4 bg-card/50 hover:bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer ${isSelected ? 'ring-2 ring-primary/50' : ''}`}
                    style={{ ...style, border: 'none' }}
                    title={sc.label}
                    onClick={async () => {
                      try {
                        const path = sc.url || sc.nativePath;
                        if (!path) return;
                        await fetch("/api/system/launch", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ path, args: sc.args }),
                        });
                      } catch (e) {
                        console.error(e);
                        alert("起動に失敗しました");
                      }
                    }}
                  >
                    <button
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary/50 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(sc.id);
                      }}
                    >
                      {isSelected && <Icons.Check size={14} strokeWidth={3} className="text-white" />}
                    </button>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-background shadow-inner text-foreground/80 group-hover:text-foreground transition-colors overflow-hidden">
                      {sc.customIconUrl ? (
                        <img src={sc.customIconUrl} alt={sc.label} className="w-full h-full object-cover" />
                      ) : (
                        Ico ? <Ico size={24} /> : sc.iconName
                      )}
                    </div>
                    <div className="text-sm text-center line-clamp-2">{sc.label}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2">
                      <button
                        className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:opacity-100 transition-colors"
                        onClick={(e) => { e.stopPropagation(); openEdit(sc.id); }}
                        title="編集"
                      >
                        <Icons.Edit2 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={(e) => { e.stopPropagation(); remove(sc.id); }}
                        title="削除"
                      >
                        <Icons.Trash2 size={14} />
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
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded px-2 py-1 bg-transparent border-black/10 dark:border-white/10"
                  placeholder="ラベル"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
                <input
                  className="flex-1 border rounded px-2 py-1 bg-transparent border-black/10 dark:border-white/10"
                  placeholder="URL / パス"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              {editing.kind === "app" && (
                <input
                  className="w-full border rounded px-2 py-1 bg-transparent border-black/10 dark:border-white/10"
                  placeholder="引数 (任意)"
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                />
              )}
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



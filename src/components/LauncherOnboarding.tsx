"use client";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import * as Icons from "lucide-react";

type Template = {
  label: string;
  url: string;
  iconName: string;
  color?: string;
  category?: string;
};

const TEMPLATES: Template[] = [
  { label: "Gmail", url: "https://mail.google.com/", iconName: "Mail", color: "#ef4444", category: "コミュニケーション" },
  { label: "YouTube", url: "https://www.youtube.com/", iconName: "Youtube", color: "#ef4444", category: "YouTube" },
  { label: "YouTube Studio", url: "https://studio.youtube.com/", iconName: "Video", color: "#ef4444", category: "YouTube" },
  { label: "CMS", url: "https://example-cms.com/admin", iconName: "Server", category: "CMS" },
  { label: "Google ドライブ", url: "https://drive.google.com/", iconName: "Folder", color: "#10b981", category: "Google" },
  { label: "Google カレンダー", url: "https://calendar.google.com/", iconName: "Calendar", color: "#3b82f6", category: "Google" },
  { label: "GitHub", url: "https://github.com/", iconName: "Github", color: "#111827", category: "開発" },
  { label: "X (Twitter)", url: "https://x.com/", iconName: "Bird", color: "#0ea5e9", category: "SNS" },
  { label: "Canva", url: "https://www.canva.com/", iconName: "Palette", color: "#a855f7", category: "デザイン" },
  { label: "画像変換サイト", url: "https://squoosh.app/", iconName: "Image", color: "#0ea5e9", category: "デザイン" },
];

export default function LauncherOnboarding({ onClose }: { onClose?: () => void } = {}) {
  const add = useAppStore((s) => s.addLauncherShortcut);
  const categories = useAppStore((s) => s.launcherCategories);
  const addCategory = useAppStore((s) => s.addLauncherCategory);
  const setOnboarded = useAppStore((s) => s.setLauncherOnboarded);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const map = new Map<string, Template[]>();
    for (const t of TEMPLATES) {
      const key = t.category ?? "その他";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries());
  }, []);

  function toggle(label: string) {
    setSelected((s) => ({ ...s, [label]: !s[label] }));
  }

  function selectAll() {
    const next: Record<string, boolean> = {};
    for (const t of TEMPLATES) next[t.label] = true;
    setSelected(next);
  }

  function clearAll() {
    setSelected({});
  }

  function selectCategory(name: string) {
    const next = { ...selected };
    const items = TEMPLATES.filter((t) => (t.category ?? "その他") === name);
    for (const t of items) next[t.label] = true;
    setSelected(next);
  }

  function clearCategory(name: string) {
    const next = { ...selected };
    const items = TEMPLATES.filter((t) => (t.category ?? "その他") === name);
    for (const t of items) delete next[t.label];
    setSelected(next);
  }

  function apply() {
    // 事前にカテゴリを作成
    const nameToId = new Map<string, string>();
    for (const [name] of grouped) {
      if (!name) continue;
      const existing = categories.find((c) => c.name === name);
      if (existing) {
        nameToId.set(name, existing.id);
      } else {
        addCategory({ name });
      }
    }
    // 最新のカテゴリIDはpersistのタイミングで反映されるため、今回はcategoryIdなしで追加（後で編集可能）
    for (const t of TEMPLATES) {
      if (!selected[t.label]) continue;
      add({ label: t.label, url: t.url, iconName: t.iconName, color: t.color, kind: "web" });
    }
    setOnboarded(true);
    onClose?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setOnboarded(true);
          onClose?.();
        }
      }}
    >
      <div className="max-w-3xl w-full bg-background text-foreground rounded shadow border border-black/10 dark:border-white/10 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">よく使うサービスをまとめて登録</div>
          <div className="flex items-center gap-3">
            <button className="text-xs underline opacity-80" onClick={selectAll}>全選択</button>
            <button className="text-xs underline opacity-80" onClick={clearAll}>全解除</button>
            <button className="text-sm underline opacity-80" onClick={() => { setOnboarded(true); onClose?.(); }}>
              スキップ
            </button>
          </div>
        </div>
        <div className="text-xs opacity-70">初回のみ表示します。必要なサービスにチェックを入れて「登録」を押してください（後から編集可能）。</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-auto">
          {grouped.map(([name, items]) => (
            <div key={name} className="border rounded p-3">
              <div className="text-xs font-medium mb-2 flex items-center justify-between">
                <span>{name}</span>
                <span className="flex items-center gap-2">
                  <button className="text-[10px] underline opacity-80" onClick={() => selectCategory(name)}>全選択</button>
                  <button className="text-[10px] underline opacity-80" onClick={() => clearCategory(name)}>全解除</button>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {items.map((t) => {
                  const Ico = (Icons as Record<string, React.ComponentType<{ size?: number }>>)[t.iconName];
                  return (
                    <label key={t.label} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={Boolean(selected[t.label])} onChange={() => toggle(t.label)} />
                      {Ico ? <Ico size={16} /> : null}
                      <span>{t.label}</span>
                      <span className="ml-auto text-xs opacity-70">{t.url}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded border text-sm" onClick={() => { setOnboarded(true); onClose?.(); }}>後で</button>
          <button className="px-3 py-1 rounded bg-foreground text-background text-sm" onClick={apply}>登録</button>
        </div>
      </div>
    </div>
  );
}



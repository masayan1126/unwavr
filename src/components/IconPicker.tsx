"use client";
import { useMemo, useState } from "react";
import * as Icons from "lucide-react";

type IconName = keyof typeof Icons;

export default function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const iconNames = useMemo(() => Object.keys(Icons).filter((k) => /^[A-Z]/.test(k)), []);
  const filtered = useMemo(
    () => iconNames.filter((n) => n.toLowerCase().includes(query.toLowerCase())).slice(0, 200),
    [iconNames, query]
  );
  return (
    <div className="flex flex-col gap-2">
      <input
        className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
        placeholder="アイコン検索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-64 overflow-auto">
        {filtered.map((name) => {
          const Ico = (Icons as any)[name] as React.ComponentType<{ size?: number }>;
          const active = value === name;
          return (
            <button
              type="button"
              key={name}
              className={`flex items-center justify-center h-10 rounded border text-xs ${
                active ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              title={name}
              onClick={() => onChange(name)}
            >
              {Ico ? <Ico size={18} /> : name}
            </button>
          );
        })}
      </div>
    </div>
  );
}



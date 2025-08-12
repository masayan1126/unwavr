"use client";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function GlobalLauncherBar() {
  const { status } = useSession();
  const pathname = usePathname();
  const shortcuts = useAppStore((s) => s.launcherShortcuts);
  const [collapsed, setCollapsed] = useState(false);

  const visibleShortcuts = shortcuts.slice(0, 10);
  const shouldHide = status !== "authenticated" || pathname.startsWith("/unwavr");
  if (shouldHide) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[99999] md:bottom-4 bottom-20 pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-auto">
        <div className="flex items-end gap-2">
          <button
            aria-label={collapsed ? "ランチャー展開" : "ランチャー折りたたみ"}
            onClick={() => setCollapsed((v) => !v)}
            className="h-8 px-2 rounded border text-xs bg-background/90 backdrop-blur shadow"
          >
            {collapsed ? "▲" : "▼"}
          </button>
          {!collapsed && (
            <div className="max-w-[92vw] overflow-x-auto">
              <div className="flex items-center gap-2 px-2 py-2 rounded border bg-background/90 backdrop-blur shadow">
                {visibleShortcuts.length === 0 ? (
                  <div className="text-[11px] opacity-70 px-2">ランチャーにショートカットを追加してください</div>
                ) : (
                  visibleShortcuts.map((sc) => {
                    const Ico = (Icons as unknown as Record<string, LucideIcon>)[sc.iconName];
                    const style: React.CSSProperties = {
                      backgroundColor: `${sc.color ?? "#0ea5e9"}20`,
                      borderColor: sc.color ?? "#0ea5e9",
                    };
                    if (sc.kind === "web") {
                      return (
                        <a
                          key={sc.id}
                          href={sc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex flex-col items-center gap-1 px-2 py-2 border rounded hover:opacity-90 transition"
                          style={style}
                          title={sc.label}
                        >
                          <div className="w-8 h-8 rounded flex items-center justify-center border" style={{ borderColor: sc.color }}>
                            {Ico ? <Ico size={16} /> : sc.iconName}
                          </div>
                          <div className="text-[10px] max-w-[6rem] truncate">{sc.label}</div>
                        </a>
                      );
                    }
                    return (
                      <button
                        key={sc.id}
                        className="group flex flex-col items-center gap-1 px-2 py-2 border rounded hover:opacity-90 transition"
                        style={style}
                        title={sc.label}
                        onClick={async () => {
                          try {
                            const text = sc.nativePath || sc.url || "";
                            if (text) await navigator.clipboard.writeText(text);
                          } catch {}
                        }}
                      >
                        <div className="w-8 h-8 rounded flex items-center justify-center border" style={{ borderColor: sc.color }}>
                          {Ico ? <Ico size={16} /> : sc.iconName}
                        </div>
                        <div className="text-[10px] max-w-[6rem] truncate">{sc.label}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



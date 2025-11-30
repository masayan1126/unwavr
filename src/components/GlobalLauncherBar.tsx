"use client";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function GlobalLauncherBar() {
  const { status } = useSession();
  const pathname = usePathname();
  const shortcuts = useAppStore((s) => s.launcherShortcuts);
  const isLauncherOpen = useAppStore((s) => s.isLauncherOpen);
  const toggleLauncher = useAppStore((s) => s.toggleLauncher);

  const shouldHide = status !== "authenticated" || pathname.startsWith("/unwavr");
  if (shouldHide) return null;

  return (
    <>
      {/* Toggle Button - Fixed to the right edge, visible when closed or open */}
      <button
        aria-label={isLauncherOpen ? "ランチャーを閉じる" : "ランチャーを開く"}
        onClick={toggleLauncher}
        className={`fixed z-[100000] top-1/2 -translate-y-1/2 transition-all duration-300 hidden xl:flex
          ${isLauncherOpen ? 'right-[260px]' : 'right-0'}
          w-6 h-12 bg-background/80 backdrop-blur-md border border-r-0 border-white/10 shadow-lg
          rounded-l-xl items-center justify-center hover:bg-background text-xs opacity-50 hover:opacity-100
        `}
      >
        {isLauncherOpen ? "▶" : "◀"}
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 right-0 h-full z-[99999] bg-background/95 backdrop-blur-xl border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out hidden xl:block
          ${isLauncherOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width: '260px' }}
      >
        <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
          <h2 className="text-sm font-medium opacity-70 px-2">Launcher</h2>

          {shortcuts.length === 0 ? (
            <div className="text-sm opacity-50 px-2">ショートカットがありません</div>
          ) : (
            <div className="flex flex-col gap-2">
              {shortcuts.map((sc) => {
                const Ico = (Icons as unknown as Record<string, LucideIcon>)[sc.iconName];
                const iconColor = sc.color ?? "#0ea5e9";

                const Content = () => (
                  <>
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all border border-white/10"
                      style={{ backgroundColor: `${iconColor}20`, color: iconColor }}
                    >
                      {Ico ? <Ico size={20} /> : sc.iconName}
                    </div>
                    <div className="text-sm font-medium truncate opacity-80 group-hover:opacity-100">{sc.label}</div>
                  </>
                );

                if (sc.kind === "web") {
                  return (
                    <a
                      key={sc.id}
                      href={sc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
                      title={sc.label}
                    >
                      <Content />
                    </a>
                  );
                }
                return (
                  <button
                    key={sc.id}
                    className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-200 w-full text-left"
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
                    <Content />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

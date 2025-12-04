"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CalendarDays, ListTodo, AlertTriangle, Home, Archive, Rocket, Target, Timer, Calendar, Music, Lock, MessageSquare, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import AuthButtons from "@/components/AuthButtons";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/", label: "ホーム", icon: <Home size={16} /> },
  { href: "/launcher", label: "ランチャー", icon: <Rocket size={16} /> },
  { href: "/milestones", label: "マイルストーン", icon: <Target size={16} /> },
  { href: "/calendar", label: "カレンダー", icon: <Calendar size={16} /> },
  { href: "/pricing", label: "料金プラン", icon: <span className="inline-block w-4 h-4">¥</span> },
  { href: "/settings", label: "設定", icon: <Settings size={16} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { status, data: session } = useSession();
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState<number>(224);
  const [tasksOpen, setTasksOpen] = useState<boolean>(true);
  const startXRef = useRef<number | null>(null);
  const startWRef = useRef<number>(width);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = Number(localStorage.getItem("sidebar:w") ?? 224);
    const o = localStorage.getItem("sidebar:o");
    if (w) setWidth(Math.max(160, Math.min(360, w)));
    if (o != null) setOpen(o === "1");
    setTasksOpen(true); // 常時展開（フラット表示）
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar:w", String(width));
    localStorage.setItem("sidebar:o", open ? "1" : "0");
    localStorage.setItem("sidebar:tasks:o", tasksOpen ? "1" : "0");
  }, [width, open, tasksOpen]);
  if (pathname.startsWith("/unwavr")) return null;
  if (status === "unauthenticated") return null;
  return (
    <aside className="hidden md:flex border-r border-border h-[100svh] sticky top-0 bg-sidebar text-muted-foreground" style={{ width: open ? width : 48 }}>
      <div className="flex flex-col p-3 gap-6 flex-1 overflow-y-auto">
        <div className={`flex items-center ${open ? "justify-between px-2" : "justify-center"} pt-2`}>
          {open && (
            <div className="flex items-center gap-3 min-w-0 group cursor-pointer">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Image src="/unwavr-logo.svg" alt="unwavr logo" width={24} height={24} className="w-6 h-6 shrink-0" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-bold tracking-tight text-foreground truncate" title="unwavr">unwavr</div>
                <div className="text-xxs text-muted-foreground truncate">Workspace</div>
              </div>
            </div>
          )}
          <button
            aria-label={open ? "サイドバーを閉じる" : "サイドバーを開く"}
            title={open ? "閉じる" : "開く"}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>
        {open && (
          <nav className="flex-1 flex flex-col gap-0.5" suppressHydrationWarning={true}>
            {/* ホーム */}
            {(() => {
              const item = navItems.find((n) => n.href === "/");
              if (!item) return null;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <span className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })()}

            {/* マイルストーン */}
            {(() => {
              const item = navItems.find((n) => n.href === "/milestones");
              if (!item) return null;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  data-guide-key="milestones"
                >
                  <span className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })()}


            {/* タスク（トップレベルのショートカット） */}
            {(() => {
              const isImportExport = pathname.startsWith("/tasks/import-export");
              const isBacklog = pathname === "/tasks/backlog" || pathname.startsWith("/tasks/backlog/");
              const active = !isImportExport && (pathname === "/tasks" || pathname.startsWith("/tasks/") || isBacklog);
              return (
                <Link
                  href="/tasks"
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  data-guide-key="tasksTop"
                >
                  <span className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
                    <ListTodo size={16} />
                  </span>
                  <span className="truncate">タスク</span>
                </Link>
              );
            })()}

            {/* タスク 親メニュー（復活） */}
            <div className="mt-1">
              {tasksOpen && (
                <div id="sidebar-tasks-submenu" className="mt-1 flex flex-col gap-1">

                  <Link
                    href="/tasks/daily"
                    className={`ml-6 flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm transition-colors ${pathname.startsWith("/tasks/daily") ? "bg-black/5 dark:bg-white/5 text-foreground font-medium" : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                  >
                    <ListTodo size={16} />
                    <span className="truncate">毎日</span>
                  </Link>
                  <Link
                    href="/tasks/scheduled"
                    className={`ml-6 flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm transition-colors ${pathname.startsWith("/tasks/scheduled") ? "bg-black/5 dark:bg-white/5 text-foreground font-medium" : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                  >
                    <CalendarDays size={16} />
                    <span className="truncate">特定曜日</span>
                  </Link>
                  <Link
                    href="/tasks/backlog"
                    className={`ml-6 flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm transition-colors ${pathname.startsWith("/tasks/backlog") ? "bg-black/5 dark:bg-white/5 text-foreground font-medium" : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                  >
                    <Archive size={16} />
                    <span className="truncate">積み上げ候補</span>
                  </Link>

                  <Link
                    href="/tasks/incomplete"
                    className={`ml-6 flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm transition-colors ${pathname.startsWith("/tasks/incomplete") ? "bg-black/5 dark:bg-white/5 text-foreground font-medium" : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                  >
                    <AlertTriangle size={16} />
                    <span className="truncate">未完了タスク</span>
                  </Link>

                  <Link
                    href="/tasks/archived"
                    className={`ml-6 flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm transition-colors ${pathname.startsWith("/tasks/archived") ? "bg-black/5 dark:bg-white/5 text-foreground font-medium" : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                  >
                    <Archive size={16} />
                    <span className="truncate">アーカイブ</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 集中 親メニュー */}
            <div className="mt-4">
              <div className="px-3 py-1.5 text-xxs uppercase tracking-wider text-muted-foreground/60 font-semibold">Focus</div>
              <div className="flex flex-col gap-0.5">
                <Link
                  href="/pomodoro"
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname.startsWith("/pomodoro")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <span className={`transition-transform duration-200 ${pathname.startsWith("/pomodoro") ? "scale-110" : "group-hover:scale-110"}`}>
                    <Timer size={16} />
                  </span>
                  <span className="truncate">ポモドーロ</span>
                </Link>
                <Link
                  href="/bgm"
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname.startsWith("/bgm")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <span className={`transition-transform duration-200 ${pathname.startsWith("/bgm") ? "scale-110" : "group-hover:scale-110"}`}>
                    <Music size={16} />
                  </span>
                  <span className="truncate">BGMプレイリスト</span>
                </Link>
              </div>
            </div>

            {/* AI Assistant Section */}
            <div className="mt-4">
              <div className="px-3 py-1.5 text-xxs uppercase tracking-wider text-muted-foreground/60 font-semibold">AI Support</div>
              <div className="flex flex-col gap-0.5">
                <Link
                  href="/assistant"
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname.startsWith("/assistant")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <span className={`transition-transform duration-200 ${pathname.startsWith("/assistant") ? "scale-110" : "group-hover:scale-110"}`}>
                    <MessageSquare size={16} />
                  </span>
                  <span className="truncate">Unwavr AI</span>
                </Link>
              </div>
            </div>

            {/* 残りのメニュー（ホーム/マイルストーン以外） */}
            {navItems
              .filter((n) => n.href !== "/" && n.href !== "/milestones")
              .map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                // Googleログインでのみカレンダーを有効化
                if (item.href === "/calendar") {
                  const isGoogle = (session as unknown as { provider?: string } | null)?.provider === "google";
                  if (!isGoogle) {
                    return (
                      <div
                        key={item.href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm opacity-70 cursor-not-allowed select-none ${active ? "bg-black/5 dark:bg-white/5 text-foreground/80" : "bg-transparent"
                          }`}
                        title="Googleログインが必要です"
                        aria-disabled
                      >
                        <div className="flex items-center gap-1">
                          {item.icon}
                          <Lock size={14} className="opacity-80" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>
                    );
                  }
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <span className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}

            <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 text-xs opacity-80 flex flex-col gap-1">
              <Link href="/terms" className="hover:underline">利用規約</Link>
              <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
            </div>
          </nav>
        )}
        {open && (
          <div className="mt-auto flex flex-col gap-3">
            <AuthButtons />
            <Link
              href="/unwavr"
              className="text-xxs opacity-70 hover:opacity-100 underline underline-offset-4"
            >
              プロダクトサイト
            </Link>
            <div className="text-xxs opacity-60">v0.1.0</div>
          </div>
        )}
      </div>
      {open && (
        <div
          className="w-1 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10"
          onMouseDown={(e) => {
            startXRef.current = e.clientX;
            startWRef.current = width;
            const onMove = (ev: MouseEvent) => {
              if (startXRef.current == null) return;
              const dx = ev.clientX - startXRef.current;
              setWidth(Math.max(160, Math.min(360, startWRef.current + dx)));
            };
            const onUp = () => {
              startXRef.current = null;
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
          title="ドラッグで幅を変更"
        />
      )}
    </aside>
  );
}

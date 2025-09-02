"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ListTodo, Upload, Plus, ChevronLeft, ChevronRight, AlertTriangle, Home, Archive, Rocket, Target, Timer, Calendar, Music, Lock, MessageSquare } from "lucide-react";
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
  { href: "/tasks/import-export", label: "インポート/エクスポート", icon: <Upload size={16} /> },
  { href: "/launcher", label: "ランチャー", icon: <Rocket size={16} /> },
  { href: "/milestones", label: "マイルストーン", icon: <Target size={16} /> },
  { href: "/calendar", label: "カレンダー", icon: <Calendar size={16} /> },
  { href: "/assistant", label: "AIアシスタント", icon: <MessageSquare size={16} /> },
  { href: "/pricing", label: "料金プラン", icon: <span className="inline-block w-4 h-4">¥</span> },
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
  if (status !== "authenticated") return null;
  return (
    <aside className="hidden md:flex border-r border-black/10 dark:border-white/10 h-[100svh] sticky top-0" style={{ width: open ? width : 48 }}>
      <div className="flex flex-col p-4 gap-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/unwavr-logo.svg" alt="unwavr logo" className="w-5 h-5 shrink-0" />
            <div className="text-base md:text-lg font-semibold tracking-wide truncate" title="unwavr">{open ? "unwavr" : ""}</div>
          </div>
          <button
            aria-label={open ? "サイドバーを閉じる" : "サイドバーを開く"}
            title={open ? "閉じる" : "開く"}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
        {/* ホーム */}
        {(() => {
          const item = navItems.find((n) => n.href === "/");
          if (!item) return null;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                active ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {item.icon}
              {open && <span className="truncate">{item.label}</span>}
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
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                active ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              data-guide-key="milestones"
            >
              {item.icon}
              {open && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })()}

        {/* タスク（トップレベルのショートカット） */}
        {(() => {
          const isImportExport = pathname.startsWith("/tasks/import-export");
          const isBacklog = pathname === "/backlog" || pathname.startsWith("/backlog/");
          const active = !isImportExport && (pathname === "/tasks" || pathname.startsWith("/tasks/") || isBacklog);
          return (
            <Link
              href="/tasks"
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                active ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              data-guide-key="tasksTop"
            >
              <ListTodo size={16} />
              {open && <span className="truncate">タスク</span>}
            </Link>
          );
        })()}

        {/* タスク 親メニュー（復活） */}
        <div className="mt-1">
          {open && tasksOpen && (
            <div id="sidebar-tasks-submenu" className="mt-1 flex flex-col gap-1">
              
              <Link
                href="/tasks/daily"
                className={`ml-6 flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  pathname.startsWith("/tasks/daily") ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <ListTodo size={16} />
                <span className="truncate">毎日</span>
              </Link>
              <Link
                href="/tasks/scheduled"
                className={`ml-6 flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  pathname.startsWith("/tasks/scheduled") ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <CalendarDays size={16} />
                <span className="truncate">特定曜日</span>
              </Link>
              <Link
                href="/backlog"
                className={`ml-6 flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  pathname.startsWith("/backlog") ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <Archive size={16} />
                <span className="truncate">積み上げ候補</span>
              </Link>
              <Link
                href="/tasks/incomplete"
                className={`ml-6 flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  pathname.startsWith("/tasks/incomplete") ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <AlertTriangle size={16} />
                <span className="truncate">未完了タスク</span>
              </Link>
              
              <Link
                href="/tasks/archived"
                className={`ml-6 flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  pathname.startsWith("/tasks/archived") ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <Archive size={16} />
                <span className="truncate">アーカイブ</span>
              </Link>
            </div>
          )}
        </div>

        {/* 集中 親メニュー */}
        <div className="mt-2">
          {open && (
            <>
              <div className="px-3 py-1 text-[11px] uppercase tracking-wide opacity-60">集中</div>
              <div className="mt-1 flex flex-col gap-1">
                <Link
                  href="/pomodoro"
                  className={`ml-6 flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    pathname.startsWith("/pomodoro") ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <Timer size={16} />
                  <span className="truncate">ポモドーロ</span>
                </Link>
                <Link
                  href="/bgm"
                  className={`ml-6 flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    pathname.startsWith("/bgm") ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <Music size={16} />
                  <span className="truncate">BGMプレイリスト</span>
                </Link>
              </div>
            </>
          )}
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
                      className={`flex items-center gap-2 px-3 py-2 rounded text-sm opacity-70 cursor-not-allowed select-none ${
                        active ? "bg-foreground text-background/80" : "bg-transparent"
                      }`}
                      title="Googleログインが必要です"
                      aria-disabled
                    >
                      <div className="flex items-center gap-1">
                        {item.icon}
                        <Lock size={14} className="opacity-80" />
                      </div>
                      {open && <span className="truncate">{item.label}</span>}
                    </div>
                  );
                }
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    active ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                  {open && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          {open && (
            <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 text-[12px] opacity-80 flex flex-col gap-1">
              <Link href="/terms" className="hover:underline">利用規約</Link>
              <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
            </div>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
        <AuthButtons />
          {open && (
            <Link
          href="/unwavr"
          className="text-[11px] opacity-70 hover:opacity-100 underline underline-offset-4"
            >
              プロダクトサイト
            </Link>
          )}
          {open && <div className="text-[10px] opacity-60">v0.1.0</div>}
        </div>
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



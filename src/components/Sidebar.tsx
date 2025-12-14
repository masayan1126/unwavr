"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CalendarDays, ListTodo, AlertTriangle, Home, Archive, Rocket, Target, Timer, Calendar, Music, Lock, MessageSquare, Settings, PanelLeftClose, PanelLeftOpen, Sun, BarChart2 } from "lucide-react";
import AuthButtons from "@/components/AuthButtons";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import DailyBriefingDialog from "./DailyBriefingDialog";
import { IconButton } from "@/components/ui/IconButton";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/", label: "ホーム", icon: <Home size={16} /> },
  { href: "/launcher", label: "ランチャー", icon: <Rocket size={16} /> },
  { href: "/settings", label: "設定", icon: <Settings size={16} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { status, data: session } = useSession();
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState<number>(224);
  const [showBriefing, setShowBriefing] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startWRef = useRef<number>(width);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = Number(localStorage.getItem("sidebar:w") ?? 224);
    const o = localStorage.getItem("sidebar:o");
    if (w) setWidth(Math.max(160, Math.min(360, w)));
    if (o != null) setOpen(o === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar:w", String(width));
    localStorage.setItem("sidebar:o", open ? "1" : "0");
  }, [width, open]);

  if (pathname.startsWith("/unwavr")) return null;
  if (status === "unauthenticated") return null;

  const NavLink = ({ href, label, icon, exact = false }: { href: string; label: string; icon: React.ReactNode; exact?: boolean }) => {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
      >
        <span className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="px-3 py-1.5 mt-4 text-xxs uppercase tracking-wider text-muted-foreground/60 font-semibold">
      {label}
    </div>
  );

  return (
    <aside className="hidden md:flex border-r border-border h-[100svh] sticky top-0 bg-sidebar text-muted-foreground" style={{ width: open ? width : 48 }}>
      <div className="flex flex-col p-3 gap-1 flex-1 overflow-y-auto">
        <div className={`flex items-center ${open ? "justify-between px-2" : "justify-center"} pt-2 mb-4`}>
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
          <IconButton
            icon={open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            variant="ghost"
            size="sm"
            label={open ? "サイドバーを閉じる" : "サイドバーを開く"}
            onClick={() => setOpen((v) => !v)}
          />
        </div>

        {open && (
          <nav className="flex-1 flex flex-col gap-0.5" suppressHydrationWarning={true}>
            {/* Home & Launcher */}
            <NavLink href="/" label="ホーム" icon={<Home size={16} />} exact={true} />
            <NavLink href="/launcher" label="ランチャー" icon={<Rocket size={16} />} />

            {/* Tasks Section */}
            <SectionHeader label="Tasks & Planning" />
            <NavLink href="/tasks" label="すべてのタスク" icon={<ListTodo size={16} />} exact={true} />
            {/* 一時的に非表示
            <NavLink href="/tasks/daily" label="毎日" icon={<ListTodo size={16} />} />
            <NavLink href="/tasks/scheduled" label="特定曜日" icon={<CalendarDays size={16} />} />
            <NavLink href="/tasks/backlog" label="積み上げ候補" icon={<Archive size={16} />} />
            */}
            <NavLink href="/milestones" label="マイルストーン" icon={<Target size={16} />} />
            <NavLink href="/analysis" label="分析" icon={<BarChart2 size={16} />} />

            {/* Calendar (Google Login Check) */}
            {(() => {
              const isGoogle = (session as unknown as { provider?: string } | null)?.provider === "google";
              const active = pathname.startsWith("/calendar");
              if (!isGoogle) {
                return (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm opacity-70 cursor-not-allowed select-none ${active ? "bg-black/5 dark:bg-white/5 text-foreground/80" : "bg-transparent"}`} title="Googleログインが必要です">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} className="opacity-80" />
                      <Lock size={14} className="opacity-80" />
                    </div>
                    <span className="truncate">カレンダー</span>
                  </div>
                );
              }
              return <NavLink href="/calendar" label="カレンダー" icon={<Calendar size={16} />} />;
            })()}

            <NavLink href="/tasks/archived" label="アーカイブ" icon={<Archive size={16} />} />

            {/* Focus Section */}
            <SectionHeader label="Focus" />
            <NavLink href="/pomodoro" label="ポモドーロ" icon={<Timer size={16} />} />
            <NavLink href="/bgm" label="BGMプレイリスト" icon={<Music size={16} />} />

            {/* AI Support Section */}
            <SectionHeader label="AI Support" />
            <NavLink href="/assistant" label="Unwavr AI" icon={<MessageSquare size={16} />} />
            <button
              onClick={() => setShowBriefing(true)}
              className="group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground text-left w-full"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">
                <Sun size={16} />
              </span>
              <span className="truncate">Daily Briefing</span>
            </button>

            {/* System Section */}
            <SectionHeader label="System" />
            <NavLink href="/settings" label="設定" icon={<Settings size={16} />} />
          </nav>
        )}

        {open && (
          <div className="mt-auto pt-3 border-t border-black/10 dark:border-white/10 flex flex-col gap-3">
            <AuthButtons />
            <div className="flex items-center justify-between text-xxs opacity-60">
              <div className="flex gap-3">
                <Link href="/terms" className="hover:opacity-100 hover:underline">利用規約</Link>
                <Link href="/privacy" className="hover:opacity-100 hover:underline">プライバシー</Link>
              </div>
              <span>v0.1.0</span>
            </div>
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
      <DailyBriefingDialog isOpen={showBriefing} onClose={() => setShowBriefing(false)} />
    </aside>
  );
}

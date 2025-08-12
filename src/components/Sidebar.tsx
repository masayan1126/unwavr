"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, ListTodo, Calendar, Rocket, Upload, Plus, Target, Timer, Music } from "lucide-react";
import AuthButtons from "@/components/AuthButtons";
import { useSession } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/", label: "ホーム", icon: <Home size={16} /> },
  { href: "/today", label: "今日", icon: <CalendarDays size={16} /> },
  { href: "/backlog", label: "バックログ", icon: <ListTodo size={16} /> },
  { href: "/weekend", label: "週末・連休", icon: <Calendar size={16} /> },
  { href: "/launcher", label: "ランチャー", icon: <Rocket size={16} /> },
  { href: "/tasks/import-export", label: "インポート/エクスポート", icon: <Upload size={16} /> },
  { href: "/tasks/new", label: "タスク追加", icon: <Plus size={16} /> },
  { href: "/milestones", label: "マイルストーン", icon: <Target size={16} /> },
  { href: "/pomodoro", label: "ポモドーロ", icon: <Timer size={16} /> },
  { href: "/calendar", label: "カレンダー", icon: <Calendar size={16} /> },
  { href: "/bgm", label: "BGMプレイリスト", icon: <Music size={16} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { status } = useSession();
  if (pathname.startsWith("/unwavr")) return null;
  if (status !== "authenticated") return null;
  return (
    <aside className="hidden md:flex md:flex-col md:w-56 border-r border-black/10 dark:border-white/10 h-[100svh] sticky top-0 p-4 gap-4">
      <div className="text-base md:text-lg font-semibold tracking-wide">unwavr</div>
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                active ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              data-guide-key={
                item.href === "/launcher"
                  ? "launcher"
                  : item.href === "/tasks/import-export"
                  ? "importExport"
                  : item.href === "/tasks/new"
                  ? "tasksNew"
                  : item.href === "/milestones"
                  ? "milestones"
                  : item.href === "/pomodoro"
                  ? "pomodoro"
                  : undefined
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <AuthButtons />
        <Link
          href="/unwavr"
          className="text-[11px] opacity-70 hover:opacity-100 underline underline-offset-4"
        >
          プロダクトサイト
        </Link>
        <div className="text-[10px] opacity-60">v0.1.0</div>
      </div>
    </aside>
  );
}



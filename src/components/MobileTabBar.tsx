"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Calendar, Rocket, Music } from "lucide-react";
import { useSession } from "next-auth/react";

type Item = { href: string; label: string; icon: React.ReactNode };

const items: Item[] = [
  { href: "/", label: "ホーム", icon: <Home size={18} /> },
  { href: "/today", label: "今日", icon: <CalendarDays size={18} /> },
  { href: "/calendar", label: "予定", icon: <Calendar size={18} /> },
  { href: "/launcher", label: "ランチャー", icon: <Rocket size={18} /> },
  { href: "/bgm", label: "BGM", icon: <Music size={18} /> },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { status } = useSession();

  const shouldHide = status !== "authenticated" || pathname.startsWith("/unwavr");
  if (shouldHide) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex flex-col items-center justify-center py-2 text-[11px] ${
                  active ? "text-foreground" : "opacity-70"
                }`}
              >
                <span>{it.icon}</span>
                <span className="mt-0.5">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}



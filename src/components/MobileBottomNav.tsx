"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Target, Calendar, Rocket, Music } from "lucide-react";
import { useSession } from "next-auth/react";

type Item = { href: string; label: string; icon: React.ReactNode };

const items: Item[] = [
    { href: "/", label: "ホーム", icon: <Home size={20} /> },
    { href: "/tasks", label: "タスク", icon: <ListTodo size={20} /> },
    { href: "/milestones", label: "目標", icon: <Target size={20} /> },
    { href: "/calendar", label: "予定", icon: <Calendar size={20} /> },
    { href: "/bgm", label: "BGM", icon: <Music size={20} /> },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { status } = useSession();

    const shouldHide = status !== "authenticated" || pathname.startsWith("/unwavr");
    if (shouldHide) return null;

    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-[9999] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
            <ul className="grid grid-cols-5 h-14">
                {items.map((it) => {
                    const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
                    return (
                        <li key={it.href} className="h-full">
                            <Link
                                href={it.href}
                                className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <span className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                                    {it.icon}
                                </span>
                                <span className="text-[10px] font-medium">{it.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

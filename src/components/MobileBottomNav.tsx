"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, MessageSquare, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

type Item = { href: string; label: string; icon: React.ReactNode };

const items: Item[] = [
    { href: "/", label: "ホーム", icon: <Home size={22} strokeWidth={2} /> },
    { href: "/tasks", label: "タスク", icon: <ListTodo size={22} strokeWidth={2} /> },
    { href: "/assistant", label: "AI", icon: <MessageSquare size={22} strokeWidth={2} /> },
    { href: "/settings", label: "設定", icon: <Settings size={22} strokeWidth={2} /> },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { status } = useSession();

    const shouldHide = status !== "authenticated" || pathname.startsWith("/unwavr");
    if (shouldHide) return null;

    return (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-[9999] pointer-events-none pb-[env(safe-area-inset-bottom)]">
            <nav className="pointer-events-auto bg-[var(--sidebar)] border-t border-border">
                <ul className="grid grid-cols-4 h-14 items-center relative">
                    {items.map((it) => {
                        const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
                        return (
                            <li key={it.href} className="flex-1 h-full relative">
                                <Link
                                    href={it.href}
                                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer select-none"
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        className={`${active ? "text-primary" : "text-muted-foreground"}`}
                                    >
                                        {it.icon}
                                    </motion.div>
                                    <span
                                        className={`text-[10px] font-medium mt-0.5 ${active ? "text-primary" : "text-muted-foreground"}`}
                                    >
                                        {it.label}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, MessageSquare, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

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
        <div className="md:hidden fixed bottom-6 inset-x-4 z-[9999] pointer-events-none">
            <nav className="pointer-events-auto bg-black/80 dark:bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                <ul className="grid grid-cols-4 h-16 items-center relative">
                    {items.map((it) => {
                        const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
                        return (
                            <li key={it.href} className="flex-1 h-full relative z-10">
                                <Link
                                    href={it.href}
                                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer select-none"
                                >
                                    <div className="relative p-1">
                                        <AnimatePresence mode="popLayout">
                                            {active && (
                                                <motion.div
                                                    layoutId="activeTabIndicator"
                                                    className="absolute inset-0 bg-white/20 blur-md rounded-full"
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                                                />
                                            )}
                                        </AnimatePresence>
                                        <motion.div
                                            animate={{
                                                scale: active ? 1.1 : 1,
                                                y: active ? -2 : 0,
                                            }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                            className={`relative z-10 ${active ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/40"}`}
                                        >
                                            {it.icon}
                                        </motion.div>
                                    </div>
                                    <motion.span
                                        initial={false}
                                        animate={{
                                            opacity: active ? 1 : 0.4,
                                            y: active ? 0 : 2
                                        }}
                                        className={`text-[10px] font-medium mt-0.5 ${active ? "text-white" : "text-white/40"}`}
                                    >
                                        {it.label}
                                    </motion.span>
                                    {active && (
                                        <motion.div
                                            layoutId="activeTabBottomLine"
                                            className="absolute bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}

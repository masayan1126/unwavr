"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, ListTodo, Sparkles, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

type NavItem = { href: string; label: string; icon: React.ReactNode; isAI?: boolean };

const items: NavItem[] = [
    { href: "/", label: "ホーム", icon: <Home size={22} strokeWidth={2} /> },
    { href: "/milestones", label: "目標", icon: <Target size={22} strokeWidth={2} /> },
    { href: "/tasks", label: "タスク", icon: <ListTodo size={22} strokeWidth={2} /> },
    { href: "#ai", label: "AI", icon: <Sparkles size={22} strokeWidth={2} />, isAI: true },
    { href: "/settings", label: "設定", icon: <Settings size={22} strokeWidth={2} /> },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { status } = useSession();
    const { aiChatOpen, toggleAIChat } = useAppStore();

    const shouldHide = status !== "authenticated" || pathname.startsWith("/unwavr");
    if (shouldHide) return null;

    return (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-[9999] pointer-events-none">
            <nav className="pointer-events-auto bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
                <ul className="flex justify-evenly items-stretch py-2">
                    {items.map((it) => {
                        const active = it.isAI
                            ? aiChatOpen
                            : pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));

                        const content = (
                            <>
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    className={`flex items-center justify-center ${active ? "text-primary" : ""}`}
                                >
                                    {it.icon}
                                </motion.div>
                                <span
                                    className={`text-[10px] font-medium mt-1 ${active ? "text-primary" : ""}`}
                                >
                                    {it.label}
                                </span>
                            </>
                        );

                        if (it.isAI) {
                            return (
                                <li key={it.href} className="flex-1 min-w-0">
                                    <button
                                        onClick={toggleAIChat}
                                        className="flex flex-col items-center justify-center w-full py-1 cursor-pointer select-none"
                                    >
                                        {content}
                                    </button>
                                </li>
                            );
                        }

                        return (
                            <li key={it.href} className="flex-1 min-w-0">
                                <Link
                                    href={it.href}
                                    className="flex flex-col items-center justify-center w-full py-1 cursor-pointer select-none"
                                >
                                    {content}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}

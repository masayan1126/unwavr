"use client";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function MobileHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();

    // 非表示条件
    const shouldHide =
        status !== "authenticated" ||
        pathname?.startsWith("/unwavr") ||
        pathname?.startsWith("/auth") ||
        pathname?.startsWith("/terms") ||
        pathname?.startsWith("/privacy");

    if (shouldHide) return null;

    const isHome = pathname === "/";

    return (
        <div className="md:hidden sticky top-0 z-[100] bg-background border-b border-border">
            <div className="h-12 flex items-center justify-between px-2">
                {/* 左側: 戻るボタン（ホーム以外） */}
                <div className="w-10">
                    {!isHome && (
                        <button
                            onClick={() => router.back()}
                            className="p-1 text-primary active:opacity-60 transition-opacity"
                            aria-label="戻る"
                        >
                            <ChevronLeft size={28} strokeWidth={2} />
                        </button>
                    )}
                </div>

                {/* 右側: ユーザー情報 + ログアウト */}
                <div className="flex items-center gap-2">
                    {session?.user?.image ? (
                        <img
                            src={session.user.image}
                            alt="avatar"
                            className="w-7 h-7 rounded-full"
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/20" />
                    )}
                    <span className="text-xs opacity-80 truncate max-w-[120px]">
                        {session?.user?.email || session?.user?.name}
                    </span>
                    <button
                        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="ログアウト"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

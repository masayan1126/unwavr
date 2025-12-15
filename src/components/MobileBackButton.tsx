"use client";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useSession } from "next-auth/react";

export default function MobileBackButton() {
    const router = useRouter();
    const pathname = usePathname();
    const { status } = useSession();

    // ホーム画面、未認証、または特定ページでは非表示
    const shouldHide =
        status !== "authenticated" ||
        pathname === "/" ||
        pathname?.startsWith("/unwavr") ||
        pathname?.startsWith("/auth");

    if (shouldHide) return null;

    return (
        <button
            onClick={() => router.back()}
            className="md:hidden fixed top-3 left-3 z-[9998] w-9 h-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-sm active:scale-95 transition-transform"
            aria-label="戻る"
        >
            <ChevronLeft size={20} strokeWidth={2} />
        </button>
    );
}

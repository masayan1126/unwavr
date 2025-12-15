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
        <div className="md:hidden sticky top-0 z-[100] bg-background border-b border-border">
            <div className="h-12 flex items-center px-2">
                <button
                    onClick={() => router.back()}
                    className="p-1 text-primary active:opacity-60 transition-opacity"
                    aria-label="戻る"
                >
                    <ChevronLeft size={28} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}

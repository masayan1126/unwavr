"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { ReactNode, ReactElement } from "react";
import SidebarConditional from "@/components/SidebarConditional";
import NotificationBars from "@/components/NotificationBars";
import OnboardingGuide from "@/components/OnboardingGuide";
import GlobalLauncherBarConditional from "@/components/GlobalLauncherBarConditional";
import CookieConsentConditional from "@/components/CookieConsentConditional";
import MobileTabBar from "@/components/MobileTabBar";
import PomodoroTopBar from "@/components/PomodoroTopBar";
import QuickAddTaskModal from "@/components/QuickAddTaskModal";

export default function LayoutChrome({ children }: { children: ReactNode }): ReactElement {
  const pathname = usePathname();
  const isStandaloneEditor = /^\/tasks\/[^/]+\/description\/?$/.test(pathname ?? "");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // グローバルショートカット: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        // モーダルが既に開いている場合はスキップ
        if (isQuickAddOpen) return;

        // フォーム要素にフォーカスがある場合はスキップ
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isQuickAddOpen]);

  if (isStandaloneEditor) {
    return (
      <div className="min-h-screen motion-scope">
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen motion-scope">
      <div className="hidden md:block">
        <SidebarConditional />
      </div>
      <div className="flex-1 min-w-0 flex flex-col bg-background">
        <PomodoroTopBar />
        <NotificationBars />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <OnboardingGuide />
      <GlobalLauncherBarConditional />
      <CookieConsentConditional />
      <MobileTabBar />

      {/* クイックタスク追加モーダル */}
      <QuickAddTaskModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
}



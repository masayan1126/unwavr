"use client";
import { usePathname } from "next/navigation";
import type { ReactNode, ReactElement } from "react";
import SidebarConditional from "@/components/SidebarConditional";
import NotificationBars from "@/components/NotificationBars";
import OnboardingGuide from "@/components/OnboardingGuide";
import GlobalLauncherBarConditional from "@/components/GlobalLauncherBarConditional";
import CookieConsentConditional from "@/components/CookieConsentConditional";
import MobileTabBar from "@/components/MobileTabBar";
import PomodoroTopBar from "@/components/PomodoroTopBar";

export default function LayoutChrome({ children }: { children: ReactNode }): ReactElement {
  const pathname = usePathname();
  const isStandaloneEditor = /^\/tasks\/[^/]+\/description\/?$/.test(pathname ?? "");

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
      <div className="flex-1 min-w-0 flex flex-col">
        <PomodoroTopBar />
        <NotificationBars />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <OnboardingGuide />
      <GlobalLauncherBarConditional />
      <CookieConsentConditional />
      <MobileTabBar />
    </div>
  );
}



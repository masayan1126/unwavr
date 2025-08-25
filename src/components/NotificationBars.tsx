"use client";

import { usePathname } from "next/navigation";
import CalendarNotificationBar from "@/components/CalendarNotificationBar";
import OverdueNotificationBar from "@/components/OverdueNotificationBar";

export default function NotificationBars(): React.ReactElement | null {
  const pathname = usePathname();
  const excluded = pathname.startsWith("/terms") || pathname.startsWith("/privacy") || pathname.startsWith("/unwavr");
  if (excluded) return null;
  return (
    <>
      <CalendarNotificationBar />
      <OverdueNotificationBar />
    </>
  );
}



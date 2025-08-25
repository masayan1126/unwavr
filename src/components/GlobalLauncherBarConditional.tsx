"use client";

import { usePathname } from "next/navigation";
import GlobalLauncherBar from "@/components/GlobalLauncherBar";

export default function GlobalLauncherBarConditional(): React.ReactElement | null {
  const pathname = usePathname();
  const excluded = pathname.startsWith("/terms") || pathname.startsWith("/privacy") || pathname.startsWith("/unwavr");
  if (excluded) return null;
  return <GlobalLauncherBar />;
}



"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function SidebarConditional(): React.ReactElement | null {
  const pathname = usePathname();
  const hide = pathname.startsWith("/terms") || pathname.startsWith("/privacy");
  if (hide) return null;
  return <Sidebar />;
}



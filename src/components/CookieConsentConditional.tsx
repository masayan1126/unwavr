"use client";

import { usePathname } from "next/navigation";
import CookieConsent from "@/components/CookieConsent";

export default function CookieConsentConditional(): React.ReactElement | null {
  const pathname = usePathname();
  const excluded = pathname.startsWith("/terms") || pathname.startsWith("/privacy") || pathname.startsWith("/unwavr");
  if (excluded) return null;
  return <CookieConsent />;
}



"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

function AuthHydrator() {
  const { status } = useSession();
  const hydrate = useAppStore((s) => s.hydrateFromDb);
  const clearAll = useAppStore((s) => s.clearTasksMilestonesLaunchers);

  useEffect(() => {
    if (status === "authenticated") {
      // ログイン直後にDBから再取得
      hydrate().catch(() => {});
    } else if (status === "unauthenticated") {
      // サインアウト時にローカル状態をクリア
      clearAll();
    }
  }, [status, hydrate, clearAll]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <AuthHydrator />
    </SessionProvider>
  );
}



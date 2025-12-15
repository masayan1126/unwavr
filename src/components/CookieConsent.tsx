"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie-consent";

type ConsentStatus = "accepted" | "rejected" | "unset";

export default function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>("unset");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "accepted" || v === "rejected") setStatus(v);
    } catch {}
  }, []);

  function save(next: ConsentStatus) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setStatus(next);
  }

  if (status !== "unset") return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 inset-x-0 z-[1000] pb-[env(safe-area-inset-bottom)] md:pb-0">
      <div className="mx-auto max-w-5xl m-4 p-4 rounded-lg border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-sm leading-6 flex-1">
            本サイトでは、サービスの提供・改善およびセキュリティのためにクッキーを使用します。詳しくは
            <Link href="/privacy" className="underline underline-offset-4 ml-1">プライバシーポリシー</Link>
            をご確認ください。
          </div>
          <div className="flex gap-2">
            <button onClick={() => save("rejected")} className="px-3 py-1.5 text-sm rounded border">拒否</button>
            <button onClick={() => save("accepted")} className="px-3 py-1.5 text-sm rounded bg-foreground text-background">同意する</button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import LauncherGrid from "@/components/LauncherGrid";
import LauncherForm from "@/components/LauncherForm";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import LauncherOnboarding from "@/components/LauncherOnboarding";

export default function LauncherPage() {
  const onboarded = useAppStore((s) => s.launcherOnboarded);
  const hasShortcuts = useAppStore((s) => s.launcherShortcuts.length > 0);
  const [show, setShow] = useState(false);
  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ランチャー</h1>
        <div className="flex items-center gap-3">
          <button className="text-sm underline opacity-80" onClick={() => setShow(true)}>
            一括登録
          </button>
          <Link className="text-sm underline opacity-80" href="/">ホーム</Link>
        </div>
      </div>
      <LauncherGrid />
      <LauncherForm />
      {show && <LauncherOnboarding onClose={() => setShow(false)} />}
      {!onboarded && !hasShortcuts && !show && <LauncherOnboarding onClose={() => setShow(false)} />}
    </div>
  );
}



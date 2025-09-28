"use client";
import Link from "next/link";
import LauncherGrid from "@/components/LauncherGrid";
import LauncherForm from "@/components/LauncherForm";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import LauncherOnboarding from "@/components/LauncherOnboarding";
import SectionLoader from "@/components/SectionLoader";

export default function LauncherPage() {
  const onboarded = useAppStore((s) => s.launcherOnboarded);
  const hasShortcuts = useAppStore((s) => s.launcherShortcuts.length > 0);
  const exportLaunchers = useAppStore((s) => s.exportLaunchers);
  const importLaunchers = useAppStore((s) => s.importLaunchers);
  const hydrating = useAppStore((s) => s.hydrating);
  const [show, setShow] = useState(false);
  const [importing, setImporting] = useState(false);
  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ランチャー</h1>
        <div className="flex items-center gap-3">
          <button className="text-sm underline opacity-80" onClick={() => setShow(true)}>
            一括登録
          </button>
          <button
            className="px-3 py-1.5 rounded border text-sm flex items-center gap-2 bg-[var(--primary)] text-[#0f172a] border-transparent hover:opacity-80"
            onClick={() => exportLaunchers()}
            title="JSONとしてエクスポート"
          >
            エクスポート
          </button>
          <button
            className="text-sm underline opacity-80"
            onClick={() => setImporting(true)}
            title="JSONをインポート"
          >
            インポート
          </button>
          <Link className="text-sm underline opacity-80" href="/">ホーム</Link>
        </div>
      </div>
      {hydrating ? <SectionLoader label="ランチャーを読み込み中..." lines={6} /> : <LauncherGrid />}
      <LauncherForm />
      {show && <LauncherOnboarding onClose={() => setShow(false)} />}
      {importing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setImporting(false)}>
          <div className="bg-background text-foreground rounded-md border border-black/10 dark:border-white/10 p-6 w-full max-w-md" onClick={(e)=>e.stopPropagation()}>
            <div className="text-sm font-medium mb-3">ランチャーのインポート</div>
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const text = await f.text();
                importLaunchers(text, true);
                setImporting(false);
              }}
            />
            <div className="mt-3 text-xs opacity-70">選択したJSONで上書きインポートします。</div>
          </div>
        </div>
      )}
      {!onboarded && !hasShortcuts && !show && <LauncherOnboarding onClose={() => setShow(false)} />}
    </div>
  );
}



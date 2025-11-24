"use client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { useToast, useConfirm } from "@/components/Providers";
import { Type } from "lucide-react";

export default function SettingsPage() {
  const clearAll = useAppStore((s) => s.clearTasksMilestonesLaunchers);
  const toast = useToast();
  const confirm = useConfirm();
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">設定</h1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>

      <div className="bg-card border border-black/10 dark:border-white/10 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
          <Type size={18} className="opacity-70" />
          <h2 className="font-medium">表示設定</h2>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-80">文字サイズ</span>
            <span className="font-mono bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-xs">
              {useAppStore((s) => s.fontSize)}%
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs opacity-60 font-medium">A</span>
            <input
              type="range"
              min="80"
              max="120"
              step="5"
              value={useAppStore((s) => s.fontSize)}
              onChange={(e) => useAppStore.getState().setFontSize(Number(e.target.value))}
              className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
            />
            <span className="text-lg opacity-80 font-medium">A</span>
          </div>
          <p className="text-xs opacity-60 mt-1">
            アプリケーション全体の文字サイズを調整します（標準: 100%）
          </p>
        </div>
      </div>
      <div className="bg-[var(--danger)]/5 rounded-xl p-5 flex flex-col gap-3">
        <div className="text-sm font-medium text-[var(--danger)]">危険な操作</div>
        <div className="text-xs opacity-80">タスク・マイルストーン・ランチャーの設定をすべて削除します。この操作は取り消せません。</div>
        <div>
          <button
            className="px-3 py-2 rounded-[3px] bg-[var(--danger)] text-white text-sm hover:opacity-90 transition-opacity"
            onClick={async () => {
              const ok = await confirm('本当に全て削除しますか？この操作は取り消せません。', { tone: 'danger', confirmText: '削除' });
              if (!ok) return;
              clearAll();
              toast.show('すべて削除しました', 'success');
            }}
          >
            すべて削除（タスク/マイルストーン/ランチャー）
          </button>
        </div>
      </div>
    </div>
  );
}

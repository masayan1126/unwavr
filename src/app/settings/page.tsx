"use client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { useToast, useConfirm } from "@/components/Providers";

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

      <div className="border rounded p-4 border-[var(--danger)]/30 bg-[var(--danger)]/5 flex flex-col gap-3">
        <div className="text-sm font-medium text-[var(--danger)]">危険な操作</div>
        <div className="text-xs opacity-80">タスク・マイルストーン・ランチャーの設定をすべて削除します。この操作は取り消せません。</div>
        <div>
          <button
            className="px-3 py-2 rounded bg-[var(--danger)] text-white text-sm"
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

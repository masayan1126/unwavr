"use client";

/**
 * ホームページのスケルトンローディングコンポーネント
 */
export default function HomePageSkeleton() {
  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-[1400px] mx-auto flex flex-col gap-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-6 w-48 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-8 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* 再読み込みボタン */}
      <div className="flex justify-end">
        <div className="h-9 w-32 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
      </div>

      {/* グリッドレイアウト */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
        {/* 未完了セクション（大きめ） */}
        <section className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col min-h-[320px] md:col-span-2">
          <div className="mb-3 flex gap-2 items-center">
            <div className="h-5 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="ml-auto h-9 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="space-y-2 flex-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-5 w-5 rounded border-2 border-black/20 dark:border-white/20 animate-pulse" />
                <div className="h-5 flex-1 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                <div className="h-5 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <div className="h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        </section>

        {/* 毎日タスクセクション */}
        <section className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col min-h-[320px]">
          <div className="mb-3">
            <div className="h-5 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="space-y-2 flex-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-5 w-5 rounded border-2 border-black/20 dark:border-white/20 animate-pulse" />
                <div className="h-5 flex-1 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <div className="h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        </section>

        {/* 特定曜日セクション */}
        <section className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col min-h-[320px]">
          <div className="mb-3">
            <div className="h-5 w-44 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="space-y-2 flex-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-5 w-5 rounded border-2 border-black/20 dark:border-white/20 animate-pulse" />
                <div className="h-5 flex-1 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <div className="h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        </section>

        {/* 積み上げ候補セクション（大きめ） */}
        <section className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col min-h-[320px] md:col-span-2">
          <div className="mb-3">
            <div className="h-5 w-52 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="space-y-2 flex-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-5 w-5 rounded border-2 border-black/20 dark:border-white/20 animate-pulse" />
                <div className="h-5 flex-1 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                <div className="h-5 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <div className="h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

/**
 * バックログページのスケルトンローディングコンポーネント
 */
export default function BacklogPageSkeleton() {
  return (
    <div className="p-6 sm:p-10 max-w-[1400px] mx-auto flex flex-col gap-4">
      {/* ヘッダー */}
      <header className="mb-2">
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-8 w-20 rounded bg-[#2383E2]/30 animate-pulse" />
            <div className="h-8 w-24 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
          </div>
        </div>
      </header>

      {/* フィルター表示 */}
      <div className="flex flex-wrap items-center gap-2 px-1 py-2 mb-2">
        <div className="h-4 w-14 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="h-6 w-16 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="h-6 w-20 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
      </div>

      {/* ページネーションとソート */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-14 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-14 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* タスクリスト */}
      <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
        <div className="h-5 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse mb-4" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center py-2">
              <div className="h-5 w-5 rounded border-2 border-black/20 dark:border-white/20 animate-pulse" />
              <div className="h-5 flex-1 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-5 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

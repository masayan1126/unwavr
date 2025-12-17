"use client";

/**
 * 週末ページのスケルトンローディングコンポーネント
 */
export default function WeekendPageSkeleton() {
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      {/* ヘッダー */}
      <header className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-36 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-5 w-14 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </header>

      {/* タスクリスト */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-3 px-4 bg-background rounded-xl shadow-sm">
            <div className="h-5 w-5 rounded border-2 border-black/20 dark:border-white/20 animate-pulse" />
            <div className="h-5 flex-1 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-5 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

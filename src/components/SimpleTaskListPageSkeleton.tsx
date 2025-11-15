"use client";

/**
 * シンプルなタスクリストページのスケルトンローディングコンポーネント
 * /tasks/daily, /tasks/scheduled などで使用
 */
export default function SimpleTaskListPageSkeleton() {
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="h-10 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
      </div>

      {/* ページネーションとソート */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* タスクリスト */}
      <div className="border rounded border-black/10 dark:border-white/10 overflow-hidden">
        {/* テーブルヘッダー */}
        <div className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 p-3">
          <div className="flex gap-4">
            <div className="h-4 w-8 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse flex-1" />
            <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        </div>

        {/* タスク行 */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="border-b border-black/10 dark:border-white/10 last:border-b-0 p-3">
            <div className="flex gap-4 items-center">
              <div className="h-5 w-5 rounded border-2 border-black/20 dark:border-white/20 animate-pulse" />
              <div className="h-5 flex-1 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-5 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

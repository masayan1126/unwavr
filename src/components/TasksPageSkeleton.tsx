"use client";

/**
 * タスクページのスケルトンローディングコンポーネント
 * データ読み込み中に表示される
 */
export default function TasksPageSkeleton() {
  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto flex flex-col gap-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-10 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-5 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* フィルターと検索 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-24 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>

        <div className="flex-1 sm:max-w-md w-full">
          <div className="h-10 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded p-3 border-black/10 dark:border-white/10">
            <div className="h-4 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse mb-2" />
            <div className="h-6 w-12 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>

      {/* タスクリスト */}
      <div className="space-y-6">
        {[...Array(3)].map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-3">
            {/* セクションタイトル */}
            <div className="h-6 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />

            {/* タスクテーブル */}
            <div className="border rounded border-black/10 dark:border-white/10 overflow-hidden">
              {/* テーブルヘッダー */}
              <div className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 p-3">
                <div className="flex gap-4">
                  <div className="h-4 w-8 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse flex-1" />
                  <div className="h-4 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </div>
              </div>

              {/* タスク行 */}
              {[...Array(4)].map((_, rowIndex) => (
                <div key={rowIndex} className="border-b border-black/10 dark:border-white/10 last:border-b-0 p-3">
                  <div className="flex gap-4 items-center">
                    <div className="h-5 w-5 rounded border-2 border-black/20 dark:border-white/20 animate-pulse" />
                    <div className="h-5 w-3/5 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                    <div className="h-5 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                    <div className="h-5 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

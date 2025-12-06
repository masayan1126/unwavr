"use client";

/**
 * タスクページのスケルトンローディングコンポーネント
 * データ読み込み中に表示される
 */
export default function TasksPageSkeleton() {
  return (
    <div className="p-6 sm:p-10 pb-24 sm:pb-10 max-w-[1400px] mx-auto flex flex-col gap-6">
      {/* ヘッダー */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-8 w-20 rounded bg-[#2383E2]/30 animate-pulse" />
            <div className="h-5 w-14 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        </div>
      </header>

      {/* フィルターと検索 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          ))}
        </div>
        <div className="flex-1 sm:max-w-md w-full">
          <div className="h-10 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--sidebar)] rounded-xl p-4 shadow-sm">
            <div className="h-4 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse mb-2" />
            <div className="h-6 w-12 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>

      {/* タスクリスト */}
      <div className="space-y-6">
        {[...Array(2)].map((_, sectionIndex) => (
          <section key={sectionIndex} className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
            {/* セクションタイトル */}
            <div className="h-5 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse mb-4" />
            {/* タスク行 */}
            <div className="space-y-2">
              {[...Array(4)].map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 items-center py-2">
                  <div className="h-5 w-5 rounded border-2 border-black/20 dark:border-white/20 animate-pulse" />
                  <div className="h-5 flex-1 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-5 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

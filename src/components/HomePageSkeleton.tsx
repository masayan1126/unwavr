"use client";

/**
 * ホームページのスケルトンローディングコンポーネント
 */
export default function HomePageSkeleton() {
  return (
    <div className="min-h-screen p-3 sm:p-10 max-w-[1400px] mx-auto flex flex-col gap-4 sm:gap-6">
      {/* ヘッダー */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-4 md:gap-6 text-sm">
          {/* Status Bar */}
          <div className="hidden sm:flex items-center gap-3 md:gap-4 bg-card border border-border rounded-xl px-4 py-1.5 shadow-sm">
            <div className="h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="w-px h-4 bg-border" />
            <div className="h-4 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="w-px h-4 bg-border" />
            <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
          {/* Reload Button */}
          <div className="h-8 w-8 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </header>

      {/* ActiveTasksQueue placeholder */}
      <div className="h-12 rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-3 px-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-7 w-24 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
        ))}
      </div>

      {/* Content Section */}
      <section className="relative flex flex-col min-h-[320px] bg-[var(--sidebar)] rounded-xl p-3 sm:p-5 pb-16 shadow-sm">
        <div className="mb-2 flex gap-2 items-center">
          <div className="h-5 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="ml-auto">
            <div className="h-8 w-20 rounded bg-[#2383E2]/30 animate-pulse" />
          </div>
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
        <div className="absolute bottom-3 right-5">
          <div className="h-4 w-12 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </section>
    </div>
  );
}

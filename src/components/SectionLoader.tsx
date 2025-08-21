"use client";

type SectionLoaderProps = {
  label?: string;
  lines?: number;
  height?: number | string;
  className?: string;
};

export default function SectionLoader({ label = "読み込み中...", lines = 3, height, className = "" }: SectionLoaderProps): JSX.Element {
  const placeholders = Array.from({ length: Math.max(1, Math.min(lines, 8)) });
  return (
    <div className={`border rounded p-4 border-black/10 dark:border-white/10 ${className}`} style={height ? { minHeight: typeof height === "number" ? `${height}px` : String(height) } : undefined}>
      <div className="flex items-center gap-2 mb-3 opacity-70 text-sm">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span>{label}</span>
      </div>
      <div className="flex flex-col gap-2">
        {placeholders.map((_, i) => (
          <div key={i} className="h-4 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        ))}
      </div>
    </div>
  );
}



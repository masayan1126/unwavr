"use client";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center border rounded-lg p-8 border-[var(--border)] bg-background">
        <div className="flex justify-center mb-4">
          <img src="/unwavr-logo.svg" alt="unwavr" className="w-14 h-14" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">問題が発生しました</h1>
        <p className="text-sm opacity-80 mb-4">一時的なエラーが発生しました。時間をおいて再度お試しください。</p>
        {error?.digest && (
          <div className="text-xs opacity-60 mb-6">エラーID: {error.digest}</div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="px-4 py-2 rounded border text-sm">再試行</button>
          <Link href="/" className="px-4 py-2 rounded bg-foreground text-background text-sm">ホームへ戻る</Link>
        </div>
      </div>
    </div>
  );
}



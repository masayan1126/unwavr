import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center border rounded-lg p-8 border-[var(--border)] bg-background">
        <div className="flex justify-center mb-4">
          <img src="/unwavr-logo.svg" alt="unwavr" className="w-14 h-14" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">ページが見つかりません</h1>
        <p className="text-sm opacity-80 mb-6">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn">ホームへ戻る</Link>
          <Link href="/tasks" className="btn btn-primary">タスクを見る</Link>
        </div>
      </div>
    </div>
  );
}



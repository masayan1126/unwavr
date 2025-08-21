"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { useSession } from "next-auth/react";

function ResetConfirmInner() {
  const { status } = useSession();
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(undefined);
    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "confirm failed");
      setMsg("パスワードを更新しました。ログインしてください。");
      setTimeout(() => router.replace("/auth/signin"), 1200);
    } catch (e) {
      setMsg("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80svh] grid place-items-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 flex flex-col gap-3">
        <div className="text-lg font-semibold">パスワード再設定（確認）</div>
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="新しいパスワード" className="px-3 py-2 border rounded" required />
          <button disabled={loading} className="px-4 py-2 rounded border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50">更新する</button>
        </form>
        {msg && <div className="text-xs opacity-70">{msg}</div>}
      </div>
    </div>
  );
}

export default function ResetConfirmPage() {
  return (
    <Suspense>
      <ResetConfirmInner />
    </Suspense>
  );
}



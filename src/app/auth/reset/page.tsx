"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ResetRequestPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | undefined>();
  const [msg, setMsg] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(undefined);
    try {
      const res = await fetch("/api/auth/reset-password/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "request failed");
      setToken(data.token as string | undefined);
      setMsg("メールに記載のURLから再設定してください（開発用にトークンを表示しています）。");
    } catch (e) {
      setMsg("送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80svh] grid place-items-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 flex flex-col gap-3">
        <div className="text-lg font-semibold">パスワード再設定</div>
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="メールアドレス" className="px-3 py-2 border rounded" required />
          <button disabled={loading} className="px-4 py-2 rounded border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50">送信</button>
        </form>
        {msg && <div className="text-xs opacity-70">{msg}</div>}
        {token && (
          <div className="text-xs break-all">
            開発用トークン: {token}
            <br />
            確認ページ: <a className="underline" href={`/auth/reset/confirm?token=${encodeURIComponent(token)}`}>こちら</a>
          </div>
        )}
      </div>
    </div>
  );
}



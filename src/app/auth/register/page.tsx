"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { ErrorToast, NoticeToast } from "@/components/Toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.7-2.6-5.7-5.7S8.9 6 12 6c1.8 0 3 .8 3.7 1.5l2.5-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6 0 9.3-4.2 9.3-8.4 0-.6-.1-1-.2-1.5H12z"/>
    </svg>
  );
}

export default function RegisterPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [toast, setToast] = useState<{ message: string; type?: "info" | "success" | "warning" | "error" } | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(undefined);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.status === 409 || data?.error === "already_exists") {
        setToast({ message: "すでにアカウントが存在します。ログインしてください。", type: "warning" });
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "register failed");
      // 登録成功 → 自動サインイン
      // 登録直後はDBの整合にタイムラグが出ることがあるため、少しリトライ
      async function trySignIn(): Promise<boolean> {
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.ok) return true;
        return false;
      }

      let signedIn = await trySignIn();
      if (!signedIn) {
        await new Promise((r) => setTimeout(r, 300));
        signedIn = await trySignIn();
      }
      if (!signedIn) {
        await new Promise((r) => setTimeout(r, 300));
        signedIn = await trySignIn();
      }

      if (signedIn) {
        router.replace("/");
        return;
      }
      setToast({ message: "登録しました。続けてログインしてください。", type: "success" });
    } catch {
      setToast({ message: "登録に失敗しました", type: "error" });
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-[80svh] grid place-items-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 flex flex-col gap-4">
        <div className="text-lg font-semibold">会員登録</div>
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="メールアドレス" className="px-3 py-2 border rounded" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="パスワード" className="px-3 py-2 border rounded" required />
          <button disabled={loading} className="px-4 py-2 rounded border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50">
            メールで登録
          </button>
          {message && <div className="text-xs opacity-70">{message}</div>}
        </form>
        <button
          onClick={() => signIn("google")}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded border hover:bg-black/5 dark:hover:bg-white/10"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 bg-white rounded"><GoogleIcon /></span>
          <span>Googleで新規登録</span>
        </button>
        <div className="text-xs opacity-70">
          すでにアカウントをお持ちの方は<Link href="/auth/signin" className="underline underline-offset-4 ml-1">ログイン</Link>
        </div>
      </div>
      {toast && (
        toast.type === "error" ? (
          <ErrorToast message={toast.message} onClose={() => setToast(null)} />
        ) : (
          <NoticeToast message={toast.message} onClose={() => setToast(null)} />
        )
      )}
    </div>
  );
}



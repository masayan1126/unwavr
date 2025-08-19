"use client";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.7-2.6-5.7-5.7S8.9 6 12 6c1.8 0 3 .8 3.7 1.5l2.5-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6 0 9.3-4.2 9.3-8.4 0-.6-.1-1-.2-1.5H12z"/>
    </svg>
  );
}

function SignInInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  return (
    <div className="min-h-[80svh] grid place-items-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 flex flex-col gap-4">
        <div className="text-lg font-semibold">ログイン</div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setMessage(undefined);
            setLoading(true);
            try {
              const res = await signIn("credentials", { redirect: false, email, password, callbackUrl });
              if (res?.error) throw new Error(res.error);
              router.replace(callbackUrl);
            } catch {
              setMessage("メールまたはパスワードが正しくありません");
            } finally {
              setLoading(false);
            }
          }}
          className="flex flex-col gap-2"
        >
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="メールアドレス" className="px-3 py-2 border rounded" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="パスワード" className="px-3 py-2 border rounded" required />
          <button disabled={loading} className="px-4 py-2 rounded border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50">
            メールでログイン
          </button>
          {message && <div className="text-xs opacity-70">{message}</div>}
        </form>
        <div className="text-xs opacity-70">
          <a href="/auth/reset" className="underline underline-offset-4">パスワードをお忘れですか？</a>
        </div>
        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded border hover:bg-black/5 dark:hover:bg-white/10"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 bg-white rounded"><GoogleIcon /></span>
          <span>Googleでログイン</span>
        </button>
        <div className="text-xs opacity-70">
          アカウントをお持ちでない方は<Link href="/auth/register" className="underline underline-offset-4 ml-1">会員登録</Link>
        </div>
        <div className="text-xs opacity-60">ログイン後、元のページに戻ります。</div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}



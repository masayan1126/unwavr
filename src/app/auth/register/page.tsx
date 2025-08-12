"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.7-2.6-5.7-5.7S8.9 6 12 6c1.8 0 3 .8 3.7 1.5l2.5-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6 0 9.3-4.2 9.3-8.4 0-.6-.1-1-.2-1.5H12z"/>
    </svg>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80svh] grid place-items-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 flex flex-col gap-4">
        <div className="text-lg font-semibold">会員登録</div>
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
    </div>
  );
}



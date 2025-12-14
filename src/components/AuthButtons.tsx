"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

function GoogleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.7-2.6-5.7-5.7S8.9 6 12 6c1.8 0 3 .8 3.7 1.5l2.5-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6 0 9.3-4.2 9.3-8.4 0-.6-.1-1-.2-1.5H12z" />
    </svg>
  );
}

export default function AuthButtons({ collapsed = false }: { collapsed?: boolean }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  if (loading) return <div className="text-xs opacity-70">認証確認中...</div>;
  if (!session) {
    if (collapsed) {
      return (
        <button
          onClick={() => signIn("google")}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Googleでログイン"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white">
            <GoogleIcon />
          </span>
        </button>
      );
    }
    return (
      <Button
        onClick={() => signIn("google")}
        variant="secondary"
        size="sm"
        title="Googleでログイン"
        iconLeft={
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white">
            <GoogleIcon />
          </span>
        }
      >
        Googleでログイン
      </Button>
    );
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        {session.user?.image ? (
          <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full" title={session.user?.email || session.user?.name || ""} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/20" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {session.user?.image ? (
          <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/20 flex-shrink-0" />
        )}
        <span className="text-xs opacity-80 truncate" title={session.user?.email ?? ""}>
          {session.user?.email || session.user?.name}
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="ログアウト"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}



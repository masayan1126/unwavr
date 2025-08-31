"use client";
import { SessionProvider, useSession } from "next-auth/react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";

function AuthHydrator() {
  const { status } = useSession();
  const hydrate = useAppStore((s) => s.hydrateFromDb);
  const clearAll = useAppStore((s) => s.clearTasksMilestonesLaunchers);

  useEffect(() => {
    if (status === "authenticated") {
      // ログイン直後にDBから再取得
      hydrate().catch(() => {});
    } else if (status === "unauthenticated") {
      // サインアウト時にローカル状態をクリア
      clearAll();
    }
  }, [status, hydrate, clearAll]);
  return null;
}

type ConfirmOptions = { title?: string; description?: string; confirmText?: string; cancelText?: string; tone?: 'danger' | 'default' };
type ConfirmContextValue = (message: string, options?: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

function ConfirmProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);
  const [opts, setOpts] = useState<ConfirmOptions>({});

  const confirm = useCallback<ConfirmContextValue>((msg, options) => {
    setMessage(msg);
    setOpts(options ?? {});
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const onClose = useCallback((v: boolean) => {
    setOpen(false);
    const r = resolver;
    setResolver(null);
    r && r(v);
  }, [resolver]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => onClose(false)} />
          <div className="relative w-full max-w-md bg-background text-foreground border border-black/10 dark:border-white/10 rounded-lg shadow-lg p-6 mx-4">
            <div className="text-sm font-semibold mb-2">{opts.title ?? '確認'}</div>
            <div className="text-sm whitespace-pre-wrap mb-4">{opts.description ?? message}</div>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded border text-sm" onClick={() => onClose(false)}>{opts.cancelText ?? 'キャンセル'}</button>
              <button className={`px-4 py-2 rounded text-sm ${opts.tone === 'danger' ? 'bg-[var(--danger)] text-white' : 'bg-foreground text-background'}`} onClick={() => onClose(true)}>{opts.confirmText ?? 'OK'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfirmProvider>
        {children}
        <AuthHydrator />
        {/* Pomodoro ticker: requestAnimationFrameで常時進行（バックグラウンドでもcatch-up可能）*/}
        <PomodoroTicker />
      </ConfirmProvider>
    </SessionProvider>
  );
}
function PomodoroTicker() {
  const isRunning = useAppStore((s) => s.pomodoro.isRunning);
  const tick = useAppStore((s) => s.tickPomodoro);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = window.requestAnimationFrame(loop);
      // 軽量化: およそ1秒ごとに実秒に追従（tickPomodoro内部でcatch-up）
      tick();
    };
    if (isRunning) {
      raf = window.requestAnimationFrame(loop);
      return () => window.cancelAnimationFrame(raf);
    }
    return () => {};
  }, [isRunning, tick]);
  return null;
}

// GlobalBgmPlayer removed per request



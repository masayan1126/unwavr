"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

type ToastProps = {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onClose?: () => void;
  durationMs?: number;
  position?: "top" | "bottom";
  offsetPx?: number;
};

export default function Toast({ message, type = "info", onClose, durationMs = 3000, position = "bottom", offsetPx = 0 }: ToastProps) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const inId = window.setTimeout(() => setShown(true), 0);
    const outId = window.setTimeout(() => {
      setShown(false);
      // 退場アニメーション分の遅延後にアンマウント
      const after = window.setTimeout(() => onClose?.(), 200);
      return () => window.clearTimeout(after);
    }, durationMs);
    return () => {
      window.clearTimeout(inId);
      window.clearTimeout(outId);
    };
  }, [onClose, durationMs]);

  const accent =
    type === "success" ? "bg-[var(--primary)]" :
      type === "warning" ? "bg-[var(--warning)]" :
        type === "error" ? "bg-[var(--danger)]" :
          "bg-[var(--primary)]";

  const Icon =
    type === "success" ? CheckCircle2 :
      type === "warning" ? AlertTriangle :
        type === "error" ? XCircle :
          Info;

  const isError = type === "error";
  const baseContainer = "pointer-events-auto flex items-start gap-3 rounded-lg backdrop-blur shadow-lg px-4 py-3 w-[320px] sm:w-[360px] border";
  const normalContainer = "border-[var(--border)] bg-white/90 dark:bg-neutral-900/90";
  const errorContainer = "bg-[var(--danger)] text-white border-[var(--danger)]";

  // スマートフォン: 上部中央、デスクトップ: 指定位置（右寄せ）
  // sm以上では指定のpositionに従う（bottom指定時はbottom、top指定時はtop）
  const positionClass = position === "top"
    ? "top-4 sm:top-4"
    : "top-4 sm:top-auto sm:bottom-4";

  return (
    <div
      className={`fixed z-[250000] pointer-events-none left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 ${positionClass}`}
      style={{ ...(offsetPx ? (position === "top" ? { marginTop: offsetPx } : { marginBottom: offsetPx }) : {}) }}
    >
      <div
        role="alert"
        aria-live="assertive"
        className={`${baseContainer} ${isError ? errorContainer : normalContainer} transition-all duration-200 ease-out transform ${shown ? 'opacity-100 translate-y-0 scale-100 [filter:blur(0px)]' : `${position === 'top' ? '-translate-y-2' : 'translate-y-2'} opacity-0 scale-95 [filter:blur(2px)]`}`}
      >
        <div className={`w-1 rounded-full ${accent}`} />
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Icon size={18} className={`mt-0.5 ${isError ? 'text-white/90' : 'opacity-80'}`} />
          <div className="text-[13px] leading-6 truncate">{message}</div>
        </div>
      </div>
    </div>
  );
}

export function ErrorToast({ message, onClose, durationMs }: Omit<ToastProps, "type">) {
  return <Toast message={message} type="error" onClose={onClose} durationMs={durationMs} />;
}

export function NoticeToast({ message, onClose, durationMs, position }: Omit<ToastProps, "type">) {
  return <Toast message={message} type="info" onClose={onClose} durationMs={durationMs} position={position} />;
}



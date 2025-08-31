"use client";
import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

type ToastProps = {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onClose?: () => void;
  durationMs?: number;
  position?: "top" | "bottom";
};

export default function Toast({ message, type = "info", onClose, durationMs = 3000, position = "bottom" }: ToastProps) {
  useEffect(() => {
    const id = window.setTimeout(() => onClose?.(), durationMs);
    return () => window.clearTimeout(id);
  }, [onClose, durationMs]);

  const accent =
    type === "success" ? "bg-[var(--success)]" :
    type === "warning" ? "bg-[var(--warning)]" :
    type === "error" ? "bg-[var(--danger)]" :
    "bg-[var(--primary)]";

  const Icon =
    type === "success" ? CheckCircle2 :
    type === "warning" ? AlertTriangle :
    type === "error" ? XCircle :
    Info;

  const isError = type === "error";
  const baseContainer = "pointer-events-auto flex items-start gap-3 rounded-lg backdrop-blur shadow-lg px-4 py-3 max-w-xs border";
  const normalContainer = "border-[var(--border)] bg-white/90 dark:bg-neutral-900/90";
  const errorContainer = "bg-[var(--danger)] text-white border-[var(--danger)]";

  const posCls = position === "top" ? "top-4" : "bottom-4";

  return (
    <div className={`fixed ${posCls} right-4 z-[1000] pointer-events-none`}>
      <div role="alert" aria-live="assertive" className={`${baseContainer} ${isError ? errorContainer : normalContainer}`}>
        <div className={`w-1 rounded-full ${accent}`} />
        <div className="flex items-start gap-2">
          <Icon size={18} className={`mt-0.5 ${isError ? 'text-white/90' : 'opacity-80'}`} />
          <div className="text-sm leading-6">{message}</div>
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



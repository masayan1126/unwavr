"use client";
import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

type ToastProps = {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onClose?: () => void;
  durationMs?: number;
};

export default function Toast({ message, type = "info", onClose, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    const id = window.setTimeout(() => onClose?.(), durationMs);
    return () => window.clearTimeout(id);
  }, [onClose, durationMs]);

  const accent =
    type === "success" ? "bg-emerald-500" :
    type === "warning" ? "bg-amber-500" :
    type === "error" ? "bg-rose-500" :
    "bg-blue-500";

  const Icon =
    type === "success" ? CheckCircle2 :
    type === "warning" ? AlertTriangle :
    type === "error" ? XCircle :
    Info;

  const isError = type === "error";
  const baseContainer = "pointer-events-auto flex items-start gap-3 rounded-lg backdrop-blur shadow-lg px-4 py-3 max-w-xs border";
  const normalContainer = "border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90";
  const errorContainer = "bg-rose-600 text-white border-rose-700";

  return (
    <div className="fixed bottom-4 right-4 z-[1000] pointer-events-none">
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

export function NoticeToast({ message, onClose, durationMs }: Omit<ToastProps, "type">) {
  return <Toast message={message} type="info" onClose={onClose} durationMs={durationMs} />;
}



"use client";
import React, { useEffect, useState } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onBeforeClose?: () => void | Promise<void>;
};

export default function TaskDialog({ open, onClose, title = "タスク", children, onBeforeClose }: Props): React.ReactElement | null {
  const [isMaximized, setIsMaximized] = useState(false);
  const isLauncherOpen = useAppStore((s) => s.isLauncherOpen);

  useEffect(() => {
    if (open) {
      // 背面スクロールの抑止（iOS含む）
      const prev = document.body.style.overflow;
      const prevTop = document.body.style.top;
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = prev;
        document.body.style.position = '';
        document.body.style.top = prevTop;
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    } else {
      setIsMaximized(false); // Reset on close
    }
  }, [open]);

  if (!open) return null;

  const handleClose = async () => {
    if (onBeforeClose) {
      await onBeforeClose();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`z-10 bg-card text-foreground shadow-2xl flex flex-col overflow-hidden ${isMaximized
          ? `fixed inset-0 rounded-none ${isLauncherOpen ? "xl:right-[260px]" : ""}`
          : "relative w-full max-w-4xl h-[90vh] rounded-xl"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 shrink-0 z-20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors"
              onClick={() => setIsMaximized(!isMaximized)}
              aria-label={isMaximized ? "元に戻す" : "最大化"}
              title={isMaximized ? "元に戻す" : "最大化"}
            >
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors"
              onClick={handleClose}
              aria-label="閉じる"
              title="閉じる"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 md:px-16 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}



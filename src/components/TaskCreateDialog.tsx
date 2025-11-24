"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onBeforeClose?: () => void | Promise<void>;
};

export default function TaskDialog({ open, onClose, title = "タスク", children, onBeforeClose }: Props): React.ReactElement | null {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setShown(true);
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
    }
  }, [open]);
  if (!open) return null;
  const handleClose = async () => {
    setShown(false);
    try {
      if (onBeforeClose) {
        await onBeforeClose();
      }
    } finally {
      setTimeout(() => onClose(), 180);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/50 transition-all duration-300 ${shown ? "opacity-100 backdrop-blur-[2px]" : "opacity-0 backdrop-blur-0"}`} />
      <div className={`relative z-10 bg-card text-foreground shadow-2xl transition-all duration-300 ease-out transform-gpu w-full max-w-4xl h-[90vh] flex flex-col rounded-xl overflow-hidden ${shown ? "opacity-100 scale-100" : "opacity-0 scale-95"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 shrink-0 z-20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* Breadcrumbs placeholder */}
          </div>
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
        <div className="flex-1 overflow-y-auto px-8 md:px-16 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}



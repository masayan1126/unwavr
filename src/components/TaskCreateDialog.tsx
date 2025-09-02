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
  useEffect(() => { if (open) { setShown(true); } }, [open]);
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
      <div className={`relative z-10 dialog-card mx-4 text-foreground shadow-xl transition-all duration-300 ease-out transform max-h-[85vh] overflow-y-auto ${shown ? "opacity-100 translate-y-0 scale-100 [filter:blur(0px)]" : "opacity-0 translate-y-2 scale-95 [filter:blur(2px)]"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
          <h2 className="text-sm font-medium">{title}</h2>
          <button
            type="button"
            className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10"
            onClick={handleClose}
            aria-label="閉じる"
            title="閉じる"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}



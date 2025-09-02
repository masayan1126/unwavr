"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import TaskForm from "./TaskForm";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultType?: "daily" | "scheduled" | "backlog";
};

export default function TaskCreateDialog({ open, onClose, defaultType }: Props): React.ReactElement | null {
  const [shown, setShown] = useState(false);
  useEffect(() => { if (open) { setShown(true); } }, [open]);
  if (!open) return null;
  const handleClose = () => {
    setShown(false);
    setTimeout(() => onClose(), 180);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`} />
      <div className={`relative z-10 dialog-card mx-4 text-foreground shadow-xl transition-all duration-200 ease-out transform max-h-[85vh] overflow-y-auto ${shown ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
          <h2 className="text-sm font-medium">新規タスク</h2>
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
          <TaskForm defaultType={defaultType} onSubmitted={(mode)=>{ if (mode === 'close') handleClose(); }} />
        </div>
      </div>
    </div>
  );
}



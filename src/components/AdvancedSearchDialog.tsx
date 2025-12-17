"use client";

import { useState, useEffect } from "react";
import { X, Filter, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";

export type MilestoneFilter = "all" | "with" | "without" | string; // string for specific milestone ID

interface AdvancedSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneFilter: MilestoneFilter;
  onMilestoneFilterChange: (filter: MilestoneFilter) => void;
}

export default function AdvancedSearchDialog({
  isOpen,
  onClose,
  milestoneFilter,
  onMilestoneFilterChange,
}: AdvancedSearchDialogProps) {
  const milestones = useAppStore((state) => state.milestones);
  const [localFilter, setLocalFilter] = useState<MilestoneFilter>(milestoneFilter);

  // Sync local state when prop changes
  useEffect(() => {
    setLocalFilter(milestoneFilter);
  }, [milestoneFilter]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleApply = () => {
    onMilestoneFilterChange(localFilter);
    onClose();
  };

  const handleReset = () => {
    setLocalFilter("all");
    onMilestoneFilterChange("all");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-200 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-start justify-center pt-[15vh] z-[9999] pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="advanced-search-title"
          className="bg-background border border-[var(--border)] rounded-lg shadow-2xl w-full max-w-md mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={18} />
              <h2 id="advanced-search-title" className="text-lg font-semibold">
                詳細検索
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="閉じる"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-6">
            {/* マイルストーンフィルター */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target size={16} />
                <span>マイルストーン</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="milestoneFilter"
                    value="all"
                    checked={localFilter === "all"}
                    onChange={() => setLocalFilter("all")}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm">すべて表示</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="milestoneFilter"
                    value="with"
                    checked={localFilter === "with"}
                    onChange={() => setLocalFilter("with")}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm">マイルストーン紐付け済み</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="milestoneFilter"
                    value="without"
                    checked={localFilter === "without"}
                    onChange={() => setLocalFilter("without")}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm text-amber-600 dark:text-amber-400">マイルストーン未紐付け（惰性タスク）</span>
                </label>

                {/* 特定のマイルストーンで絞り込み */}
                {milestones.length > 0 && (
                  <>
                    <div className="border-t border-black/10 dark:border-white/10 my-3" />
                    <div className="text-xs mb-2">特定のマイルストーンで絞り込み</div>
                    {milestones.map((m) => (
                      <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="milestoneFilter"
                          value={m.id}
                          checked={localFilter === m.id}
                          onChange={() => setLocalFilter(m.id)}
                          className="w-4 h-4 accent-[var(--primary)]"
                        />
                        <span className="text-sm truncate">
                          {m.title} ({m.currentUnits}/{m.targetUnits})
                        </span>
                      </label>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 flex justify-between">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              リセット
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                キャンセル
              </Button>
              <Button variant="primary" size="sm" onClick={handleApply}>
                適用
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

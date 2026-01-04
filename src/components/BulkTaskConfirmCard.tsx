"use client";

import { useState } from "react";
import { Check, X, Sparkles, Trash2 } from "lucide-react";
import { TaskType } from "@/lib/types";

export type BulkTaskConfirmOptions = {
  tasks: { title: string }[];
  recommendedType: TaskType;
  options: {
    types: { value: TaskType; label: string }[];
    milestones: { id: string; title: string; targetUnits: number; currentUnits: number }[];
  };
  onConfirm: (confirmedTasks: {
    tasks: { title: string }[];
    type: TaskType;
    milestoneIds: string[];
  }) => void;
  onCancel: () => void;
};

export default function BulkTaskConfirmCard({
  tasks: initialTasks,
  recommendedType,
  options,
  onConfirm,
  onCancel,
}: BulkTaskConfirmOptions) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedType, setSelectedType] = useState<TaskType>(recommendedType);
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);

  const toggleMilestone = (id: string) => {
    setSelectedMilestones((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (tasks.length === 0) return;
    onConfirm({
      tasks,
      type: selectedType,
      milestoneIds: selectedMilestones,
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-muted/50 rounded-xl p-3 text-center text-sm opacity-70">
        すべてのタスクが削除されました
      </div>
    );
  }

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-3">
      {/* タスク一覧 */}
      <div className="space-y-1.5">
        <div className="text-xs opacity-70 flex items-center justify-between">
          <span>タスク一覧 ({tasks.length}件)</span>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {tasks.map((task, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 text-sm"
            >
              <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
              <span className="flex-1 truncate">{task.title}</span>
              <button
                onClick={() => removeTask(idx)}
                className="p-1 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"
                title="削除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* タイプ選択（全タスク共通） */}
      <div className="space-y-1.5">
        <div className="text-xs opacity-70">タイプ（全タスク共通）</div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {options.types.map((t) => {
            const isRecommended = t.value === recommendedType;
            const isSelected = t.value === selectedType;
            return (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isRecommended
                      ? "bg-muted ring-1 ring-primary/50 hover:bg-muted/80"
                      : "bg-muted hover:bg-muted/80"
                }`}
              >
                {t.label}
                {isRecommended && !isSelected && (
                  <Sparkles size={10} className="text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* マイルストーン選択（任意・全タスク共通） */}
      {options.milestones.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs opacity-70">マイルストーン（任意・全タスク共通）</div>
          <div className="flex gap-2 flex-wrap">
            {options.milestones.map((m) => {
              const isSelected = selectedMilestones.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMilestone(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {m.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-muted hover:bg-muted/80 transition-colors"
        >
          <X size={14} />
          <span>キャンセル</span>
        </button>
        <button
          onClick={handleConfirm}
          disabled={tasks.length === 0}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
        >
          <Check size={14} />
          <span>{tasks.length}件を作成</span>
        </button>
      </div>
    </div>
  );
}

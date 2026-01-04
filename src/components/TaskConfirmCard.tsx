"use client";

import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { TaskType } from "@/lib/types";

export type TaskConfirmOptions = {
  task: {
    title: string;
    recommendedType: TaskType;
    recommendedMilestoneIds: string[];
    recommendedParentTaskId: string | null;
  };
  options: {
    types: { value: TaskType; label: string }[];
    milestones: { id: string; title: string; targetUnits: number; currentUnits: number }[];
    parentTasks: { id: string; title: string }[];
  };
  onConfirm: (confirmedTask: {
    title: string;
    type: TaskType;
    milestoneIds: string[];
    parentTaskId: string | null;
  }) => void;
  onCancel: () => void;
};

export default function TaskConfirmCard({
  task,
  options,
  onConfirm,
  onCancel,
}: TaskConfirmOptions) {
  const [selectedType, setSelectedType] = useState<TaskType>(task.recommendedType);
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>(
    task.recommendedMilestoneIds
  );
  const [selectedParentTask, setSelectedParentTask] = useState<string | null>(
    task.recommendedParentTaskId
  );

  const toggleMilestone = (id: string) => {
    setSelectedMilestones((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm({
      title: task.title,
      type: selectedType,
      milestoneIds: selectedMilestones,
      parentTaskId: selectedParentTask,
    });
  };

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-3">
      {/* タスクタイトル */}
      <div className="text-sm font-medium">{task.title}</div>

      {/* タイプ選択 */}
      <div className="space-y-1.5">
        <div className="text-xs opacity-70">タイプ</div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {options.types.map((t) => {
            const isRecommended = t.value === task.recommendedType;
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

      {/* マイルストーン選択 */}
      {options.milestones.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs opacity-70">マイルストーン（任意・複数可）</div>
          <div className="flex gap-2 flex-wrap">
            {options.milestones.map((m) => {
              const isRecommended = task.recommendedMilestoneIds.includes(m.id);
              const isSelected = selectedMilestones.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMilestone(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    isSelected
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : isRecommended
                        ? "bg-muted ring-1 ring-accent/50 hover:bg-muted/80"
                        : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {m.title}
                  {isRecommended && !isSelected && (
                    <Sparkles size={10} className="text-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 親タスク選択 */}
      {options.parentTasks.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs opacity-70">親タスク（任意）</div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {/* なしボタン */}
            <button
              onClick={() => setSelectedParentTask(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedParentTask === null
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              なし
            </button>
            {options.parentTasks.map((pt) => {
              const isRecommended = task.recommendedParentTaskId === pt.id;
              const isSelected = selectedParentTask === pt.id;
              return (
                <button
                  key={pt.id}
                  onClick={() => setSelectedParentTask(pt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isRecommended
                        ? "bg-muted ring-1 ring-primary/50 hover:bg-muted/80"
                        : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {pt.title}
                  {isRecommended && !isSelected && (
                    <Sparkles size={10} className="text-primary" />
                  )}
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
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <Check size={14} />
          <span>タスクを作成</span>
        </button>
      </div>
    </div>
  );
}

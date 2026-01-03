"use client";

import { useState, useMemo } from "react";
import { Plus, Check, X, ChevronRight } from "lucide-react";
import { Task, createTaskId } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/Providers";
import Link from "next/link";

interface SubtaskListProps {
    parentTaskId: string;
    parentTaskType?: Task["type"];
    onSubtaskClick?: (subtask: Task) => void;
    showAddButton?: boolean;
}

export function SubtaskList({
    parentTaskId,
    parentTaskType = "backlog",
    onSubtaskClick,
    showAddButton = true,
}: SubtaskListProps) {
    const tasks = useAppStore((s) => s.tasks);
    const subtasks = useMemo(() => {
        return tasks.filter(t => t.parentTaskId === parentTaskId && t.archived !== true);
    }, [tasks, parentTaskId]);
    const addTask = useAppStore((s) => s.addTask);
    const toggleTask = useAppStore((s) => s.toggleTask);
    const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
    const toast = useToast();

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");

    const handleAddSubtask = () => {
        if (!newTitle.trim()) {
            setIsAdding(false);
            return;
        }

        addTask({
            title: newTitle.trim(),
            type: parentTaskType,
            parentTaskId,
            milestoneIds: [],
            order: Date.now(),
        });

        toast.show("サブタスクを追加しました", "success");
        setNewTitle("");
        setIsAdding(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddSubtask();
        } else if (e.key === "Escape") {
            setIsAdding(false);
            setNewTitle("");
        }
    };

    const handleToggle = (task: Task) => {
        if (task.type === "daily") {
            toggleDailyToday(task.id);
        } else {
            toggleTask(task.id);
        }
    };

    const isDoneToday = (task: Task): boolean => {
        if (task.type !== "daily") return task.completed;
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        const today = d.getTime();
        return (task.dailyDoneDates ?? []).includes(today);
    };

    if (subtasks.length === 0 && !showAddButton) {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80">
                    サブタスク {subtasks.length > 0 && `(${subtasks.length})`}
                </h3>
            </div>

            {/* サブタスク一覧 */}
            {subtasks.length > 0 && (
                <div className="space-y-1">
                    {subtasks.map((subtask) => {
                        const isCompleted = isDoneToday(subtask);
                        return (
                            <div
                                key={subtask.id}
                                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleToggle(subtask)}
                                    className={`flex-shrink-0 w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                                        isCompleted
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-muted-foreground/40 hover:border-primary"
                                    }`}
                                >
                                    {isCompleted && (
                                        <Check size={10} strokeWidth={3} />
                                    )}
                                </button>

                                {onSubtaskClick ? (
                                    <button
                                        type="button"
                                        onClick={() => onSubtaskClick(subtask)}
                                        className={`flex-1 text-left text-sm truncate ${
                                            isCompleted ? "line-through opacity-60" : ""
                                        }`}
                                    >
                                        {subtask.title}
                                    </button>
                                ) : (
                                    <Link
                                        href={`/tasks/${subtask.id}`}
                                        className={`flex-1 text-sm truncate hover:text-primary ${
                                            isCompleted ? "line-through opacity-60" : ""
                                        }`}
                                    >
                                        {subtask.title}
                                    </Link>
                                )}

                                <ChevronRight
                                    size={14}
                                    className="opacity-0 group-hover:opacity-50 transition-opacity"
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 追加フォーム */}
            {showAddButton && (
                <>
                    {isAdding ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="サブタスクのタイトル"
                                className="flex-1 px-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={handleAddSubtask}
                                className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewTitle("");
                                }}
                                className="p-1.5 rounded-md border hover:bg-muted"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Plus size={14} />
                            <span>サブタスクを追加</span>
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

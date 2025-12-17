"use client";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";
import { Reorder } from "framer-motion";
import { GripVertical, X, Play, Pause, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Providers";

export default function ActiveTasksQueue({ className }: { className?: string }) {
    const tasks = useAppStore((s) => s.tasks);
    const activeTaskIds = useAppStore((s) => s.pomodoro.activeTaskIds);
    const activeTaskId = useAppStore((s) => s.pomodoro.activeTaskId);
    const isRunning = useAppStore((s) => s.pomodoro.isRunning);
    const removeActiveTask = useAppStore((s) => s.removeActiveTask);
    const reorderActiveTasks = useAppStore((s) => s.reorderActiveTasks);
    const setActiveTask = useAppStore((s) => s.setActiveTask);
    const startPomodoro = useAppStore((s) => s.startPomodoro);
    const stopPomodoro = useAppStore((s) => s.stopPomodoro);
    const toggleTask = useAppStore((s) => s.toggleTask);
    const toast = useToast();

    const [activeTasks, setActiveTasks] = useState<Task[]>([]);

    useEffect(() => {
        // Filter and sort tasks based on activeTaskIds order
        const filtered = activeTaskIds
            .map((id) => tasks.find((t) => t.id === id))
            .filter((t): t is Task => !!t);
        setActiveTasks(filtered);
    }, [tasks, activeTaskIds]);

    if (activeTasks.length === 0) return null;

    const handleReorder = (newOrder: Task[]) => {
        setActiveTasks(newOrder);
        reorderActiveTasks(newOrder.map((t) => t.id));
    };

    const getBorderColor = (index: number) => {
        const colors = [
            "border-l-[4px] border-l-primary",
            "border-l-[4px] border-l-blue-500",
            "border-l-[4px] border-l-green-500",
            "border-l-[4px] border-l-yellow-500",
            "border-l-[4px] border-l-purple-500",
        ];
        return colors[index % colors.length];
    };

    return (
        <div className={`flex flex-col gap-2 mb-6 ${className || ""}`}>
            <h2 className="text-sm font-medium opacity-80 px-1">着手中・並列タスク</h2>
            <Reorder.Group axis="y" values={activeTasks} onReorder={handleReorder} className="flex flex-col gap-2">
                {activeTasks.map((task, index) => {
                    const isTimerTarget = activeTaskId === task.id;
                    const isTimerRunning = isTimerTarget && isRunning;

                    return (
                        <Reorder.Item key={task.id} value={task}>
                            <div
                                className={`relative flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-sm transition-all ${getBorderColor(index)} ${isTimerTarget ? "bg-primary/5" : ""}`}
                            >
                                <div className="cursor-grab active:cursor-grabbing p-1 opacity-50 hover:opacity-100">
                                    <GripVertical size={14} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium truncate">{task.title}</span>
                                        {isTimerTarget && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                                                TIMER
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            if (isTimerRunning) {
                                                stopPomodoro();
                                            } else {
                                                if (activeTaskId !== task.id) setActiveTask(task.id);
                                                startPomodoro();
                                            }
                                        }}
                                        className={`p-1.5 rounded-full transition-colors ${isTimerRunning
                                            ? "bg-primary text-primary-foreground hover:opacity-90"
                                            : "bg-muted hover:bg-muted/80 opacity-70"
                                            }`}
                                        title={isTimerRunning ? "一時停止" : "タイマー開始"}
                                    >
                                        {isTimerRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                    </button>

                                    <button
                                        onClick={() => {
                                            toggleTask(task.id);
                                            toast.show(`「${task.title}」を完了しました`, "success");
                                        }}
                                        className="p-1.5 rounded-full hover:bg-green-500/10 opacity-70 hover:text-green-500 transition-colors"
                                        title="完了にする"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>

                                    <button
                                        onClick={() => removeActiveTask(task.id)}
                                        className="p-1.5 rounded-full hover:bg-destructive/10 opacity-70 hover:text-destructive transition-colors"
                                        title="着手中から外す"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>
        </div>
    );
}

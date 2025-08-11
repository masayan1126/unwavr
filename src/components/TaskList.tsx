"use client";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";

function TaskRow({ task }: { task: Task }) {
  const toggle = useAppStore((s) => s.toggleTask);
  const setActive = useAppStore((s) => s.setActiveTask);
  const activeId = useAppStore((s) => s.pomodoro.activeTaskId);
  const milestones = useAppStore((s) => s.milestones);
  const milestone = task.milestoneId ? milestones.find((m) => m.id === task.milestoneId) : undefined;
  return (
    <div className="flex items-center gap-2 py-1">
      <input type="checkbox" checked={task.completed} onChange={() => toggle(task.id)} />
      <button
        className={`text-left flex-1 ${task.completed ? "line-through opacity-60" : ""}`}
        onClick={() => setActive(task.id === activeId ? undefined : task.id)}
      >
        <div className="text-sm font-medium">{task.title}</div>
        {task.description && <div className="text-xs opacity-70">{task.description}</div>}
      </button>
      <div className="flex items-center gap-2">
        {task.estimatedPomodoros != null && (
          <div className="text-xs opacity-70">
            {task.completedPomodoros ?? 0}/{task.estimatedPomodoros}
          </div>
        )}
        {milestone && (
          <div className="text-[10px] opacity-70 border rounded px-1 py-0.5">
            {milestone.title}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskList({ title, tasks }: { title: string; tasks: Task[] }) {
  return (
    <div className="border border-black/10 dark:border-white/10 rounded-md p-3">
      <div className="text-xs uppercase tracking-wide opacity-70 mb-2">{title}</div>
      <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
        {tasks.length === 0 ? (
          <div className="text-sm opacity-60 py-2">タスクなし</div>
        ) : (
          tasks.map((t) => <TaskRow key={t.id} task={t} />)
        )}
      </div>
    </div>
  );
}



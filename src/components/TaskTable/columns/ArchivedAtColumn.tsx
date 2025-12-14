import { Task } from "@/lib/types";

interface ArchivedAtColumnProps {
  task: Task;
}

export function ArchivedAtColumn({ task }: ArchivedAtColumnProps) {
  return (
    <div className="hidden sm:block w-[120px] text-xs opacity-80 whitespace-nowrap flex-shrink-0 px-2">
      {task.archivedAt ? (
        new Date(task.archivedAt).toLocaleDateString()
      ) : (
        <span className="opacity-40">-</span>
      )}
    </div>
  );
}

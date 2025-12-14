import { Task } from "@/lib/types";

interface CreatedColumnProps {
  task: Task;
}

export function CreatedColumn({ task }: CreatedColumnProps) {
  return (
    <div className="hidden sm:block w-[120px] text-xs opacity-80 whitespace-nowrap flex-shrink-0 px-2">
      {new Date(task.createdAt).toLocaleDateString()}
    </div>
  );
}

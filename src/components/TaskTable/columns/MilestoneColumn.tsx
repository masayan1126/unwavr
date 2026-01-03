import { Task, Milestone } from "@/lib/types";

// 文字列を省略するユーティリティ関数
function truncateText(
  text: string | null | undefined,
  maxLength: number = 20
): string {
  if (!text) return "";
  const stripped = text.replace(/<[^>]*>?/gm, "");
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength) + "...";
}

interface MilestoneColumnProps {
  task: Task;
  milestones: Milestone[];
}

export function MilestoneColumn({ task, milestones }: MilestoneColumnProps) {
  const taskMilestones = (task.milestoneIds ?? [])
    .map(id => milestones.find(m => m.id === id))
    .filter((m): m is Milestone => m !== undefined);

  return (
    <div
      className="hidden sm:block w-[160px] text-xs opacity-80 truncate flex-shrink-0 px-2"
      title={taskMilestones.map(m => m.title).join(", ")}
    >
      {taskMilestones.length > 0 ? (
        taskMilestones.length === 1
          ? truncateText(taskMilestones[0].title, 20)
          : `${taskMilestones.length}件`
      ) : (
        <span className="opacity-40">-</span>
      )}
    </div>
  );
}

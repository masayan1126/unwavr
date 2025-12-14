import { Task } from "@/lib/types";

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

interface TitleColumnProps {
  task: Task;
  onClick: () => void;
  isActive?: boolean;
  activeIndex?: number;
}

export function TitleColumn({
  task,
  onClick,
  isActive,
  activeIndex,
}: TitleColumnProps) {
  return (
    <button
      className={`text-left flex-1 min-w-0 ${
        task.completed ? "line-through opacity-60" : ""
      }`}
      onClick={onClick}
      title={task.title}
    >
      <div className="text-sm font-medium truncate flex items-center gap-2">
        {truncateText(task.title, 20)}
        {isActive && typeof activeIndex === "number" && (
          <span className="inline-flex items-center gap-1.5 text-xxs font-medium border rounded-full px-2 py-0.5 whitespace-nowrap bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30">
            着手中 #{activeIndex + 1}
          </span>
        )}
      </div>
      {task.description && (
        <div className="text-xs opacity-70 truncate">
          {truncateText(task.description, 20)}
        </div>
      )}
    </button>
  );
}

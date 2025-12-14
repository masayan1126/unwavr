import { Task } from "@/lib/types";
import { TypeBadge } from "@/components/TaskList/TypeBadge";

interface TypeColumnProps {
  task: Task;
}

const DOW_SHORT = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function TypeColumn({ task }: TypeColumnProps) {
  const scheduledDaysLabel =
    task.type === "scheduled" && (task.scheduled?.daysOfWeek?.length ?? 0) > 0
      ? task.scheduled!.daysOfWeek.map((d: number) => DOW_SHORT[d]).join("・")
      : undefined;

  const label =
    task.type === "daily"
      ? "毎日"
      : task.type === "scheduled"
        ? scheduledDaysLabel
          ? `特定曜日（${scheduledDaysLabel}）`
          : "特定曜日"
        : "積み上げ候補";

  return (
    <div className="hidden sm:block w-[128px] whitespace-nowrap flex-shrink-0 px-2">
      <TypeBadge type={task.type} label={label} />
    </div>
  );
}

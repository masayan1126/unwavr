import { Task } from "@/lib/types";

interface ScheduledColumnProps {
  task: Task;
}

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

export function ScheduledColumn({ task }: ScheduledColumnProps) {
  const scheduledDays =
    task.type === "scheduled" ? (task.scheduled?.daysOfWeek ?? []) : [];
  const scheduledRanges =
    task.type === "scheduled" ? (task.scheduled?.dateRanges ?? []) : [];

  return (
    <div className="hidden sm:block w-[160px] overflow-hidden flex-shrink-0 px-2">
      <div className="flex items-center gap-1 flex-wrap text-[10px] opacity-80">
        {scheduledDays.length > 0 && (
          <span className="border rounded px-1 py-0.5">
            {scheduledDays.map((d: number) => DOW[d]).join("・")}
          </span>
        )}
        {scheduledRanges.length > 0
          ? scheduledRanges.map(
              (r: { start: number; end: number }, idx: number) => (
                <span
                  key={`${r.start}-${r.end}-${idx}`}
                  className="border rounded px-1 py-0.5"
                >
                  {new Date(r.start).toLocaleDateString()}〜
                  {new Date(r.end).toLocaleDateString()}
                </span>
              )
            )
          : scheduledDays.length === 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                曜日未指定
              </span>
            )}
      </div>
    </div>
  );
}

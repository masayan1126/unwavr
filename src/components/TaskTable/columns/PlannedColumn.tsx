import { Task } from "@/lib/types";

interface PlannedColumnProps {
  task: Task;
  isEditing: boolean;
  tempDate: string;
  onTempDateChange: (date: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
}

export function PlannedColumn({
  task,
  isEditing,
  tempDate,
  onTempDateChange,
  onSave,
  onCancel,
  onStartEdit,
}: PlannedColumnProps) {
  const planned =
    task.type === "backlog"
      ? (task.plannedDates ?? []).slice().sort((a: number, b: number) => a - b)
      : [];

  if (task.type !== "backlog") {
    return (
      <div className="hidden sm:block w-[120px] overflow-hidden flex-shrink-0 px-2">
        <div className="flex items-center gap-1 flex-wrap text-[10px] opacity-80">
          <span className="opacity-40">-</span>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="hidden sm:block w-[120px] overflow-hidden flex-shrink-0 px-2">
        <input
          type="date"
          className="w-full border rounded px-1 py-0.5 text-xxs bg-transparent"
          value={tempDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onTempDateChange(e.target.value)
          }
          onBlur={onSave}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              onSave();
            } else if (e.key === "Escape") {
              onCancel();
            }
          }}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="hidden sm:block w-[120px] overflow-hidden flex-shrink-0 px-2">
      <div className="flex items-center gap-1 flex-wrap text-xxs opacity-80">
        <button
          type="button"
          className="border rounded px-1 py-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          onClick={onStartEdit}
        >
          {planned.length > 0
            ? new Date(planned[0]).toLocaleDateString()
            : "日付を設定"}
        </button>
      </div>
    </div>
  );
}

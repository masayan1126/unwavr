import { ListTodo, CalendarDays, Archive } from "lucide-react";

export function TypeBadge({ type, label }: { type: "daily" | "scheduled" | "backlog"; label?: string }) {
    const map = {
        daily: { label: "毎日", classes: "bg-[var(--tag-daily)] text-foreground", Icon: ListTodo },
        scheduled: { label: "特定曜日", classes: "bg-[var(--tag-scheduled)] text-foreground", Icon: CalendarDays },
        backlog: { label: "積み上げ候補", classes: "bg-[var(--tag-backlog)] text-foreground", Icon: Archive },
    } as const;
    const info = map[type];
    const Icon = info.Icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xxs font-medium rounded px-1.5 py-0.5 whitespace-nowrap ${info.classes}`}>
            <Icon size={12} className="shrink-0 opacity-70" />
            {label ?? info.label}
        </span>
    );
}

import { z } from "zod";

export const TaskTypeSchema = z.enum(["daily", "backlog", "scheduled"]);
export type TaskType = z.infer<typeof TaskTypeSchema>;

export const DateRangeSchema = z.object({
  start: z.number().int(),
  end: z.number().int(),
});
export type DateRange = z.infer<typeof DateRangeSchema>;

export const ScheduledSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  dateRanges: z.array(DateRangeSchema).optional(),
});
export type Scheduled = z.infer<typeof ScheduledSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: TaskTypeSchema,
  createdAt: z.number().int(),
  completed: z.boolean().default(false),
  scheduled: ScheduledSchema.optional(),
  estimatedPomodoros: z.number().int().min(0).default(0).optional(),
  completedPomodoros: z.number().int().min(0).default(0).optional(),
  milestoneId: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  targetUnits: z.number().int().min(1),
  currentUnits: z.number().int().min(0).default(0),
  dueDate: z.number().int().optional(),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

export function isWeekend(date: Date): boolean {
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

export function isWithinDateRanges(date: Date, ranges?: DateRange[]): boolean {
  if (!ranges || ranges.length === 0) return false;
  const t = date.setHours(0, 0, 0, 0);
  return ranges.some((r) => t >= r.start && t <= r.end);
}

export function isTaskForToday(task: Task, referenceDate: Date = new Date()): boolean {
  if (task.type === "daily") return true;
  if (task.type === "scheduled") {
    const dow = referenceDate.getDay();
    const byDow = Boolean(task.scheduled?.daysOfWeek?.includes(dow));
    const byRange = isWithinDateRanges(referenceDate, task.scheduled?.dateRanges);
    return byDow || byRange;
  }
  return false;
}

export function createTaskId(): string {
  return `tsk_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function createMilestoneId(): string {
  return `mls_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}


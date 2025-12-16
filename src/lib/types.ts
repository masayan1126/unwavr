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

export const TaskPomodoroSettingSchema = z.object({
  workDurationSec: z.number().int().min(1).optional(),
});
export type TaskPomodoroSetting = z.infer<typeof TaskPomodoroSettingSchema>;

// 時間スロット（カレンダーでの時間指定スケジュール用）
export const TimeSlotSchema = z.object({
  date: z.number().int(),           // UTC 0時のタイムスタンプ
  startTime: z.string(),            // "09:00" 形式
  endTime: z.string(),              // "10:30" 形式
});
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

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
  pomodoroSetting: TaskPomodoroSettingSchema.optional(),
  // 毎日タスクの「今日実行」状態を日単位で保持（UTC 0時のタイムスタンプ）
  // Scheduledタスクも同様に、完了した日をここに記録することで履歴を追跡する
  dailyDoneDates: z.array(z.number().int()).optional(),
  // 積み上げ候補を「今日やる」に設定した日を保持（UTC 0時のタイムスタンプ）
  plannedDates: z.array(z.number().int()).optional(),
  // アーカイブ機能
  archived: z.boolean().optional(),
  archivedAt: z.number().int().optional(),
  // 完了日時（Backlogなどの単発完了タスク用）
  completedAt: z.number().int().optional(),
  order: z.number().default(0),
  // 時間スロット（カレンダーでの時間指定スケジュール）
  timeSlots: z.array(TimeSlotSchema).optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const PomodoroStateSchema = z.object({
  isRunning: z.boolean(),
  isBreak: z.boolean(),
  secondsLeft: z.number().int().min(0),
  workDurationSec: z.number().int().min(1),
  shortBreakSec: z.number().int().min(1),
  longBreakSec: z.number().int().min(1),
  cyclesUntilLongBreak: z.number().int().min(1),
  completedWorkSessions: z.number().int().min(0),
  activeTaskId: z.string().optional(),
  activeTaskIds: z.array(z.string()).default([]),
  lastTickAtMs: z.number().int().optional(),
});
export type PomodoroState = z.infer<typeof PomodoroStateSchema>;

export const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  targetUnits: z.number().int().min(1),
  currentUnits: z.number().int().min(0).default(0),
  dueDate: z.number().int().optional(),
  tag: z.string().optional(),
  order: z.number().default(0),
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
  if (task.type === "backlog") {
    const todayUtc = Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate());
    return (task.plannedDates ?? []).includes(todayUtc);
  }
  return false;
}

export function createTaskId(): string {
  return `tsk_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function createMilestoneId(): string {
  return `mls_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}


export type LauncherShortcut = {
  id: string;
  label: string;
  url: string;
  iconName: string;
  color?: string;
  categoryId?: string;
  kind?: "web" | "app" | "native";
  nativePath?: string;
  args?: string;
  customIconUrl?: string;
};

export type LauncherCategory = {
  id: string;
  name: string;
  color?: string;
};

export type ImportHistoryEntry = {
  id: string;
  fileName: string;
  imported: number;
  failed: number;
  errors: string[];
  timestamp: number;
};

export type BgmTrack = {
  id: string;
  videoId: string;
  title: string;
  url: string;
  createdAt: number;
  groupId?: string;
};

export type BgmGroup = {
  id: string;
  name: string;
  color?: string;
  parentId?: string;
};

export type BgmSearchResult = {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
};

// プラン管理
export type PlanType = 'free' | 'personal' | 'pro';

export type PlanLimits = {
  label: string;
  price: number;
  // AI
  messages: number;
  // リソース
  tasks: number;
  milestones: number;
  bgmTracks: number;
  bgmGroups: number;
  launcherShortcuts: number;
  launcherCategories: number;
};

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    label: 'Free',
    price: 0,
    messages: 3,
    tasks: 30,
    milestones: 5,
    bgmTracks: 20,
    bgmGroups: 3,
    launcherShortcuts: 10,
    launcherCategories: 3,
  },
  personal: {
    label: 'Personal',
    price: 600,
    messages: 30,
    tasks: 200,
    milestones: 30,
    bgmTracks: 200,
    bgmGroups: 20,
    launcherShortcuts: 100,
    launcherCategories: 20,
  },
  pro: {
    label: 'Pro',
    price: 1200,
    messages: 100,
    tasks: -1, // 無制限
    milestones: -1,
    bgmTracks: -1,
    bgmGroups: -1,
    launcherShortcuts: -1,
    launcherCategories: -1,
  },
};

export type AIUsage = {
  currentCount: number;
  limitCount: number;
  plan: PlanType;
  yearMonth: string;
};

export type AIUsageCheckResult = {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanType;
};

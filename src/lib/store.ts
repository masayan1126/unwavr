"use client";
import { create } from "zustand";
import { Task, Milestone, createTaskId, createMilestoneId, isTaskForToday } from "./types";

export type LauncherShortcut = {
  id: string;
  label: string;
  url: string;
  iconName: string;
  color?: string;
  categoryId?: string;
  kind?: "web" | "app" | "native";
  nativePath?: string;
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

export type PomodoroState = {
  isRunning: boolean;
  isBreak: boolean;
  secondsLeft: number;
  workDurationSec: number;
  shortBreakSec: number;
  longBreakSec: number;
  cyclesUntilLongBreak: number;
  completedWorkSessions: number;
  activeTaskId?: string;
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

export type AppState = {
  dataSource: 'db';
  tasks: Task[];
  milestones: Milestone[];
  launcherShortcuts: LauncherShortcut[];
  launcherCategories: LauncherCategory[];
  launcherOnboarded: boolean;
  importHistory: ImportHistoryEntry[];
  pomodoro: PomodoroState;
  bgmTracks: BgmTrack[];
  bgmGroups: BgmGroup[];
  // loading flags
  hydrating: boolean;
  // destructive ops
  clearTasks: () => void;
  clearMilestones: () => void;
  clearLaunchers: () => void;
  clearTasksMilestonesLaunchers: () => void;
  setDataSource: (src: 'db') => void;
  hydrateFromDb: () => Promise<void>;
  addTask: (input: Omit<Task, "id" | "createdAt" | "completed" | "completedPomodoros">) => string;
  toggleTask: (taskId: string) => void;
  toggleDailyDoneForToday: (taskId: string) => void;
  togglePlannedForToday: (taskId: string) => void;
  incrementTaskPomodoro: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, update: Partial<Omit<Task, "id" | "createdAt">>) => void;
  completeTasks: (taskIds: string[]) => void;
  resetDailyDoneForToday: (taskIds: string[]) => void;
  archiveDailyTasks: (taskIds: string[]) => void;
  archiveDailyTask: (taskId: string) => void;
  addMilestone: (input: Omit<Milestone, "id">) => void;
  updateMilestoneProgress: (milestoneId: string, delta: number) => void;
  removeMilestone: (milestoneId: string) => void;
  exportMilestones: () => string;
  importMilestones: (jsonData: string) => { success: boolean; imported: number; errors: string[] };
  setActiveTask: (taskId?: string) => void;
  startPomodoro: (isBreak?: boolean) => void;
  stopPomodoro: () => void;
  tickPomodoro: () => void;
  resetPomodoro: () => void;
  setPomodoroSettings: (settings: Partial<Pick<PomodoroState, "workDurationSec" | "shortBreakSec" | "longBreakSec" | "cyclesUntilLongBreak">>) => void;
  tasksForToday: () => Task[];
  backlogTasks: () => Task[];
  weekendOrHolidayTasks: () => Task[];
  addLauncherShortcut: (input: Omit<LauncherShortcut, "id">) => void;
  removeLauncherShortcut: (id: string) => void;
  updateLauncherShortcut: (id: string, update: Partial<Omit<LauncherShortcut, "id">>) => void;
  addLauncherCategory: (input: Omit<LauncherCategory, "id">) => void;
  removeLauncherCategory: (id: string) => void;
  updateLauncherCategory: (id: string, update: Partial<Omit<LauncherCategory, "id">>) => void;
  exportLaunchers: () => string;
  importLaunchers: (jsonData: string, replace?: boolean) => { success: boolean; importedShortcuts: number; importedCategories: number; errors: string[] };
  setLauncherOnboarded: (value: boolean) => void;
  addImportHistory: (entry: Omit<ImportHistoryEntry, "id">) => void;
  deleteImportHistory: (id: string) => void;
  clearImportHistory: () => void;
  addBgmTrack: (input: Omit<BgmTrack, "id" | "createdAt">) => void;
  removeBgmTrack: (id: string) => void;
  updateBgmTrack: (id: string, update: Partial<Omit<BgmTrack, "id">>) => void;
  moveBgmTrack: (fromIdx: number, toIdx: number) => void; // legacy
  moveBgmTrackWithinGroup: (trackId: string, beforeTrackId?: string) => void;
  setBgmTrackGroup: (trackId: string, groupId?: string) => void;
  clearBgmTracks: () => void;
  addBgmGroup: (input: Omit<BgmGroup, "id">) => void;
  updateBgmGroup: (id: string, update: Partial<Omit<BgmGroup, "id">>) => void;
  removeBgmGroup: (id: string) => void;
};

const defaultPomodoro: PomodoroState = {
  isRunning: false,
  isBreak: false,
  secondsLeft: 25 * 60,
  workDurationSec: 25 * 60,
  shortBreakSec: 5 * 60,
  longBreakSec: 15 * 60,
  cyclesUntilLongBreak: 4,
  completedWorkSessions: 0,
  activeTaskId: undefined,
};

function createShortcutId(): string {
  return `sct_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function createCategoryId(): string {
  return `cat_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function createHistoryId(): string {
  return `imh_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function createBgmId(): string {
  return `bgm_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}
function createBgmGroupId(): string {
  return `bgmg_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export const useAppStore = create<AppState>()(
  (set, get) => ({
      dataSource: 'db',
      tasks: [],
      milestones: [],
      hydrating: true,
      launcherShortcuts: [
        {
          id: createShortcutId(),
          label: "Qiita トレンド",
          url: "https://qiita.com/",
          iconName: "TrendingUp",
          color: "#55c500",
          kind: "web"
        },
        {
          id: createShortcutId(),
          label: "Zenn",
          url: "https://zenn.dev/",
          iconName: "BookOpen",
          color: "#3ea8ff",
          kind: "web"
        }
      ],
      launcherCategories: [],
      launcherOnboarded: false,
      importHistory: [],
      pomodoro: defaultPomodoro,
      bgmTracks: [],
      bgmGroups: [],
      setDataSource: (src) => set({ dataSource: src }),
      hydrateFromDb: async () => {
        set({ hydrating: true });
        try {
          const [tasksRes, milestonesRes, launchersRes, bgmRes] = await Promise.all([
            fetch('/api/db/tasks', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/db/milestones', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/db/launchers', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/db/bgm', { cache: 'no-store' }).then((r) => r.json()),
          ]);
          set({
            tasks: ((tasksRes.items ?? []) as Task[]).filter((t) => t.archived !== true),
            milestones: (milestonesRes.items ?? []) as Milestone[],
            launcherCategories: (launchersRes.categories ?? []) as LauncherCategory[],
            launcherShortcuts: (launchersRes.shortcuts ?? []) as LauncherShortcut[],
            bgmGroups: (Array.isArray(bgmRes.groups) ? (bgmRes.groups as BgmGroup[]).map((g) => ({
              ...g,
              parentId: (g as unknown as { parentId?: string | null }).parentId ?? undefined,
            })) : []) as BgmGroup[],
            bgmTracks: (Array.isArray(bgmRes.tracks) ? (bgmRes.tracks as BgmTrack[]).map((t) => ({
              ...t,
              groupId: (t as unknown as { groupId?: string | null }).groupId ?? undefined,
            })) : []) as BgmTrack[],
            hydrating: false,
          });
        } catch {
          console.warn('hydrateFromDb failed');
          set({ hydrating: false });
        }
      },
      // 初期起動時にDBからハイドレート
      ...(async () => {
        set({ hydrating: true });
        try {
          const [tasksRes, milestonesRes, launchersRes, bgmRes] = await Promise.all([
            fetch('/api/db/tasks', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/db/milestones', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/db/launchers', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/db/bgm', { cache: 'no-store' }).then((r) => r.json()),
          ]);
          set({
            tasks: ((tasksRes.items ?? []) as Task[]).filter((t) => t.archived !== true),
            milestones: (milestonesRes.items ?? []) as Milestone[],
            launcherCategories: (launchersRes.categories ?? []) as LauncherCategory[],
            launcherShortcuts: (launchersRes.shortcuts ?? []) as LauncherShortcut[],
            bgmGroups: (Array.isArray(bgmRes.groups) ? (bgmRes.groups as BgmGroup[]).map((g) => ({
              ...g,
              parentId: (g as unknown as { parentId?: string | null }).parentId ?? undefined,
            })) : []) as BgmGroup[],
            bgmTracks: (Array.isArray(bgmRes.tracks) ? (bgmRes.tracks as BgmTrack[]).map((t) => ({
              ...t,
              groupId: (t as unknown as { groupId?: string | null }).groupId ?? undefined,
            })) : []) as BgmTrack[],
            hydrating: false,
          });
        } catch {
          set({ hydrating: false });
        }
        return {} as Partial<AppState>;
      })(),
      clearTasks: () => set({ tasks: [] }),
      clearMilestones: () => set({ milestones: [] }),
      clearLaunchers: () => set({ launcherShortcuts: [], launcherCategories: [], launcherOnboarded: false }),
      clearTasksMilestonesLaunchers: () => set({ tasks: [], milestones: [], launcherShortcuts: [], launcherCategories: [], launcherOnboarded: false }),
      addTask: (input) => {
        let createdId = '';
        set((state) => {
          const newTask: Task = {
            ...(input as Task),
            id: createTaskId(),
            createdAt: Date.now(),
            completed: false,
            completedPomodoros: 0,
          };
          createdId = newTask.id;
          fetch('/api/db/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask) }).catch(() => {});
          return { tasks: [...state.tasks, newTask] };
        });
        return createdId;
      },
      toggleTask: (taskId) =>
        set((state) => {
          const tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
          const changed = tasks.find((t) => t.id === taskId);
          if (changed) fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: changed.completed }) }).catch(() => {});
          return { tasks };
        }),
      toggleDailyDoneForToday: (taskId) =>
        set((state) => {
          const startOfUtcDay = new Date();
          startOfUtcDay.setUTCHours(0, 0, 0, 0);
          const today = startOfUtcDay.getTime();
          const tasks = state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const arr = [...(t.dailyDoneDates ?? [])];
            const idx = arr.indexOf(today);
            if (idx >= 0) arr.splice(idx, 1); else arr.push(today);
            const next = { ...t, dailyDoneDates: arr } as Task;
            fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dailyDoneDates: next.dailyDoneDates }) }).catch(() => {});
            return next;
          });
          return { tasks };
        }),
      togglePlannedForToday: (taskId) =>
        set((state) => {
          const d = new Date();
          d.setUTCHours(0, 0, 0, 0);
          const today = d.getTime();
          const tasks = state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const arr = [...(t.plannedDates ?? [])];
            const idx = arr.indexOf(today);
            if (idx >= 0) arr.splice(idx, 1); else arr.push(today);
            const next = { ...t, plannedDates: arr } as Task;
            fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plannedDates: next.plannedDates }) }).catch(() => {});
            return next;
          });
          return { tasks };
        }),
      incrementTaskPomodoro: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, completedPomodoros: (t.completedPomodoros ?? 0) + 1 }
              : t
          ),
        })),
      removeTask: (taskId) =>
        set((state) => {
          fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' }).catch(() => {});
          return { tasks: state.tasks.filter((t) => t.id !== taskId) };
        }),
      updateTask: (taskId, update) =>
        set((state) => {
          const tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, ...update } : t));
          fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) }).catch(() => {});
          return { tasks };
        }),
      archiveDailyTask: (taskId) =>
        set((state) => {
          const now = Date.now();
          // 楽観的更新: まずローカルから除外
          const tasks = state.tasks.filter((t) => t.id !== taskId);
          fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archived: true, archivedAt: now })
          }).then(() => {
              try { if (typeof window !== 'undefined') { useAppStore.getState().hydrateFromDb(); } } catch {}
            })
            .catch(() => {});
          return { tasks };
        }),
      completeTasks: (taskIds) =>
        set((state) => {
          if (!Array.isArray(taskIds) || taskIds.length === 0) return state;
          const d = new Date();
          d.setUTCHours(0, 0, 0, 0);
          const todayUtc = d.getTime();

          const tasks = state.tasks.map((t) => {
            if (!taskIds.includes(t.id)) return t;
            if (t.type === 'daily') {
              const arr = Array.isArray(t.dailyDoneDates) ? [...t.dailyDoneDates] : [];
              if (!arr.includes(todayUtc)) arr.push(todayUtc);
              const next = { ...t, dailyDoneDates: arr } as Task;
              fetch(`/api/db/tasks/${encodeURIComponent(t.id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dailyDoneDates: next.dailyDoneDates })
              }).catch(() => {});
              return next;
            }
            const next = { ...t, completed: true } as Task;
            fetch(`/api/db/tasks/${encodeURIComponent(t.id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: true })
            }).catch(() => {});
            return next;
          });
          return { tasks };
        }),
      resetDailyDoneForToday: (taskIds) =>
        set((state) => {
          if (!Array.isArray(taskIds) || taskIds.length === 0) return state;
          const d = new Date();
          d.setUTCHours(0, 0, 0, 0);
          const todayUtc = d.getTime();
          const tasks = state.tasks.map((t) => {
            if (t.type !== 'daily') return t;
            if (!taskIds.includes(t.id)) return t;
            const arr = Array.isArray(t.dailyDoneDates) ? [...t.dailyDoneDates] : [];
            const idx = arr.indexOf(todayUtc);
            if (idx >= 0) arr.splice(idx, 1);
            const next = { ...t, dailyDoneDates: arr } as Task;
            fetch(`/api/db/tasks/${encodeURIComponent(t.id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dailyDoneDates: next.dailyDoneDates })
            }).catch(() => {});
            return next;
          });
          return { tasks };
        }),
      archiveDailyTasks: (taskIds) =>
        set((state) => {
          if (!Array.isArray(taskIds) || taskIds.length === 0) return state;
          // 楽観的更新: 指定のdailyタスクをローカルから除外
          const toArchive = new Set(taskIds);
          const tasks = state.tasks.filter((t) => !(t.type === 'daily' && toArchive.has(t.id)));
          // サーバーへPATCH
          const now = Date.now();
          taskIds.forEach((id) => {
            fetch(`/api/db/tasks/${encodeURIComponent(id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ archived: true, archivedAt: now })
            }).catch(() => {});
          });
          // 同期
          Promise.resolve().then(() => { try { if (typeof window !== 'undefined') { useAppStore.getState().hydrateFromDb(); } } catch {} });
          return { tasks };
        }),
      addMilestone: (input) =>
        set((state) => {
          const m: Milestone = { ...input, id: createMilestoneId(), currentUnits: input.currentUnits ?? 0 } as Milestone;
          fetch('/api/db/milestones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) }).catch(() => {});
          return { milestones: [...state.milestones, m] };
        }),
      updateMilestoneProgress: (milestoneId, delta) =>
        set((state) => {
          const milestones = state.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  currentUnits: Math.max(0, Math.min(m.targetUnits, m.currentUnits + delta)),
                }
              : m
          );
          const changed = milestones.find((m) => m.id === milestoneId);
          if (changed) fetch(`/api/db/milestones/${encodeURIComponent(milestoneId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentUnits: changed.currentUnits }) }).catch(() => {});
          return { milestones };
        }),
      removeMilestone: (milestoneId) =>
        set((state) => {
          fetch(`/api/db/milestones/${encodeURIComponent(milestoneId)}`, { method: 'DELETE' }).catch(() => {});
          return { milestones: state.milestones.filter((m) => m.id !== milestoneId) };
        }),
      exportMilestones: () => {
        // CSV（日本語ヘッダー）でエクスポート
        const milestones = get().milestones;
        const header = ["タイトル", "目標", "現在", "期限"];
        const formatDate = (ts?: number) => {
          if (!ts) return "-";
          const d = new Date(ts);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${dd}`;
        };
        const esc = (v: string) =>
          v.includes(",") || v.includes("\n") ? `"${v.replaceAll('"', '""')}"` : v;
        const rows = milestones.map((m) =>
          [
            esc(m.title),
            String(m.targetUnits),
            String(m.currentUnits ?? 0),
            formatDate(m.dueDate),
          ].join(",")
        );
        const csv = [header.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "milestones.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return csv;
      },
      importMilestones: (data) => {
        const errors: string[] = [];
        let imported = 0;

        // ユーティリティ: CSVパーサ（簡易・引用符対応）
        function parseCsv(text: string): string[][] {
          const rows: string[][] = [];
          let row: string[] = [];
          let field = "";
          let inQuotes = false;
          for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (inQuotes) {
              if (ch === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                  field += '"';
                  i++;
                } else {
                  inQuotes = false;
                }
              } else {
                field += ch;
              }
            } else {
              if (ch === '"') inQuotes = true;
              else if (ch === ',') { row.push(field.trim()); field = ""; }
              else if (ch === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ""; }
              else if (ch === '\r') { /* ignore */ }
              else { field += ch; }
            }
          }
          // last field
          row.push(field.trim());
          if (row.some((c) => c.length > 0)) rows.push(row);
          return rows;
        }

        // JSONとCSVの両対応
        const trimmed = data.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
          try {
            const parsed = JSON.parse(trimmed);
            const list: Partial<Milestone>[] = Array.isArray(parsed) ? parsed : [parsed];
            list.forEach((m, idx) => {
              const title = (m.title ?? "").toString().trim();
              const target = Number(m.targetUnits ?? 0);
              const current = Number(m.currentUnits ?? 0);
              if (!title) { errors.push(`JSON #${idx + 1}: タイトルが空です`); return; }
              if (!Number.isFinite(target) || target < 1) { errors.push(`JSON #${idx + 1}: 目標が不正です`); return; }
              const dueDate = typeof m.dueDate === 'number' ? m.dueDate : undefined;
              set((state) => ({
                milestones: [...state.milestones, { id: createMilestoneId(), title, targetUnits: Math.max(1, Math.floor(target)), currentUnits: Math.max(0, Math.floor(current)), dueDate }],
              }));
              imported++;
            });
            return { success: true, imported, errors };
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return { success: false, imported: 0, errors: [msg] };
          }
        }

        // CSVの想定ヘッダー: タイトル,目標,現在,期限（日本語） もしくは title,target,current,dueDate
        try {
          const rows = parseCsv(trimmed).filter((r) => r.length > 0);
          if (rows.length === 0) return { success: true, imported: 0, errors };
          const header = rows[0].map((h) => h.trim());
          const col = (...names: string[]) => {
            for (const n of names) { const i = header.indexOf(n); if (i !== -1) return i; }
            return -1;
          };
          const idxTitle = col("タイトル", "title");
          const idxTarget = col("目標", "target", "targetUnits");
          const idxCurrent = col("現在", "current", "currentUnits");
          const idxDue = col("期限", "dueDate");
          if (idxTitle === -1 || idxTarget === -1) {
            return { success: false, imported: 0, errors: ["CSVヘッダーが不正です（必要: タイトル, 目標）"] };
          }
          for (let i = 1; i < rows.length; i++) {
            const cells = rows[i];
            if (cells.every((c) => c.trim() === "")) continue;
            const title = (cells[idxTitle] ?? "").trim();
            const target = parseInt((cells[idxTarget] ?? "").trim(), 10);
            const current = parseInt((cells[idxCurrent] ?? "0").trim() || "0", 10);
            const dueStr = (idxDue >= 0 ? (cells[idxDue] ?? "").trim() : "");
            if (!title) { errors.push(`行${i + 1}: タイトルが空です`); continue; }
            if (!Number.isFinite(target) || target < 1) { errors.push(`行${i + 1}: 目標が不正です`); continue; }
            let dueDate: number | undefined = undefined;
            if (dueStr && dueStr !== "-") {
              const d = new Date(dueStr);
              if (!isNaN(d.getTime())) {
                const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                dueDate = local.getTime();
              }
            }
            set((state) => ({
              milestones: [
                ...state.milestones,
                { id: createMilestoneId(), title, targetUnits: Math.max(1, Math.floor(target)), currentUnits: Math.max(0, Math.min(target, Math.floor(current))), dueDate },
              ],
            }));
            imported++;
          }
          return { success: true, imported, errors };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return { success: false, imported: 0, errors: [msg] };
        }
      },
      setActiveTask: (taskId) =>
        set((state) => ({ pomodoro: { ...state.pomodoro, activeTaskId: taskId } })),
      startPomodoro: (isBreak) =>
        set((state) => {
          const nextIsBreak = Boolean(isBreak ?? state.pomodoro.isBreak);
          const secondsLeft = nextIsBreak
            ? state.pomodoro.shortBreakSec
            : state.pomodoro.workDurationSec;
          return {
            pomodoro: {
              ...state.pomodoro,
              isRunning: true,
              isBreak: nextIsBreak,
              secondsLeft,
            },
          };
        }),
      stopPomodoro: () =>
        set((state) => ({ pomodoro: { ...state.pomodoro, isRunning: false } })),
      tickPomodoro: () =>
        set((state) => {
          const s = state.pomodoro;
          if (!s.isRunning) return state;
          if (s.secondsLeft > 1) {
            return { pomodoro: { ...s, secondsLeft: s.secondsLeft - 1 } };
          }
          // Timer reached zero: switch modes
          if (!s.isBreak) {
            const completed = s.completedWorkSessions + 1;
            // reward active task
            const activeId = s.activeTaskId;
            const tasks = activeId
              ? state.tasks.map((t) =>
                  t.id === activeId
                    ? { ...t, completedPomodoros: (t.completedPomodoros ?? 0) + 1 }
                    : t
                )
              : state.tasks;
            const shouldLong = completed % s.cyclesUntilLongBreak === 0;
            return {
              tasks,
              pomodoro: {
                ...s,
                isBreak: true,
                isRunning: true,
                secondsLeft: shouldLong ? s.longBreakSec : s.shortBreakSec,
                completedWorkSessions: completed,
              },
            };
          }
          // end of break -> start work
          return {
            pomodoro: { ...s, isBreak: false, isRunning: true, secondsLeft: s.workDurationSec },
          };
        }),
      resetPomodoro: () =>
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            isRunning: false,
            isBreak: false,
            secondsLeft: state.pomodoro.workDurationSec,
            completedWorkSessions: 0,
          },
        })),
      setPomodoroSettings: (settings) =>
        set((state) => {
          const next = { ...state.pomodoro, ...settings } as PomodoroState;
          // タイマー停止中は現在モードのデフォルトに秒を合わせる
          if (!next.isRunning) {
            next.secondsLeft = next.isBreak ? next.shortBreakSec : next.workDurationSec;
          }
          return { pomodoro: next };
        }),
      tasksForToday: () => get().tasks.filter((t) => t.archived !== true && isTaskForToday(t)),
      backlogTasks: () => get().tasks.filter((t) => t.archived !== true && t.type === "backlog"),
      weekendOrHolidayTasks: () =>
        get().tasks.filter(
          (t) => t.archived !== true && t.type === "scheduled" && (t.scheduled?.daysOfWeek?.some((d) => d === 0 || d === 6) || (t.scheduled?.dateRanges?.length ?? 0) > 0)
        ),
      addLauncherShortcut: (input) =>
        set((state) => {
          const sc = { ...input, id: createShortcutId() } as LauncherShortcut;
          fetch('/api/db/launchers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts: [sc] }) }).catch(() => {});
          return { launcherShortcuts: [...state.launcherShortcuts, sc] };
        }),
      removeLauncherShortcut: (id) =>
        set((state) => {
          fetch(`/api/db/launchers/shortcuts/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
          return { launcherShortcuts: state.launcherShortcuts.filter((s) => s.id !== id) };
        }),
      updateLauncherShortcut: (id, update) =>
        set((state) => {
          const launcherShortcuts = state.launcherShortcuts.map((s) => (s.id === id ? { ...s, ...update } : s));
          fetch(`/api/db/launchers/shortcuts/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) }).catch(() => {});
          return { launcherShortcuts };
        }),
      addLauncherCategory: (input) =>
        set((state) => {
          const cat = { ...input, id: createCategoryId() } as LauncherCategory;
          fetch('/api/db/launchers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: [cat] }) }).catch(() => {});
          return { launcherCategories: [...state.launcherCategories, cat] };
        }),
      removeLauncherCategory: (id) =>
        set((state) => {
          fetch(`/api/db/launchers/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
          return {
            launcherCategories: state.launcherCategories.filter((c) => c.id !== id),
            launcherShortcuts: state.launcherShortcuts.map((s) => (s.categoryId === id ? { ...s, categoryId: undefined } : s)),
          };
        }),
      updateLauncherCategory: (id, update) =>
        set((state) => {
          const launcherCategories = state.launcherCategories.map((c) => (c.id === id ? { ...c, ...update } : c));
          fetch(`/api/db/launchers/categories/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) }).catch(() => {});
          return { launcherCategories };
        }),
      exportLaunchers: () => {
        const data = {
          categories: get().launcherCategories,
          shortcuts: get().launcherShortcuts,
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "launchers.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return json;
      },
      importLaunchers: (jsonData, replace) => {
        try {
          const parsed = JSON.parse(jsonData) as { categories?: LauncherCategory[]; shortcuts?: LauncherShortcut[] };
          const errors: string[] = [];
          const importedCategories = parsed.categories?.length ?? 0;
          const importedShortcuts = parsed.shortcuts?.length ?? 0;
          set((state) => ({
            launcherCategories: replace ? (parsed.categories ?? []) : [...state.launcherCategories, ...(parsed.categories ?? [])],
            launcherShortcuts: replace ? (parsed.shortcuts ?? []) : [...state.launcherShortcuts, ...(parsed.shortcuts ?? [])],
          }));
          return { success: true, importedShortcuts, importedCategories, errors };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return { success: false, importedShortcuts: 0, importedCategories: 0, errors: [msg] };
        }
      },
      setLauncherOnboarded: (value) => set({ launcherOnboarded: value }),
      addImportHistory: (entry) =>
        set((state) => ({ importHistory: [{ ...entry, id: createHistoryId() }, ...state.importHistory] })),
      deleteImportHistory: (id) =>
        set((state) => ({ importHistory: state.importHistory.filter((e) => e.id !== id) })),
      clearImportHistory: () => set({ importHistory: [] }),
      addBgmTrack: (input) =>
        set((state) => {
          const newTrack = { ...input, id: createBgmId(), createdAt: Date.now() } as BgmTrack;
          fetch('/api/db/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tracks: [newTrack] }) }).catch(() => {});
          return { bgmTracks: [...state.bgmTracks, newTrack] };
        }),
      removeBgmTrack: (id) => set((state) => ({ bgmTracks: state.bgmTracks.filter((t) => t.id !== id) })),
      updateBgmTrack: (id, update) =>
        set((state) => ({ bgmTracks: state.bgmTracks.map((t) => (t.id === id ? { ...t, ...update } : t)) })),
      moveBgmTrack: (fromIdx, toIdx) =>
        set((state) => {
          const list = [...state.bgmTracks];
          if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length) return state;
          const [item] = list.splice(fromIdx, 1);
          list.splice(toIdx, 0, item);
          return { bgmTracks: list };
        }),
      moveBgmTrackWithinGroup: (trackId, beforeTrackId) =>
        set((state) => {
          const tracks = [...state.bgmTracks];
          const srcIdx = tracks.findIndex((t) => t.id === trackId);
          if (srcIdx < 0) return state;
          const src = tracks[srcIdx];
          const groupId = src.groupId;
          const groupOrder = tracks
            .map((t, idx) => ({ t, idx }))
            .filter(({ t }) => t.groupId === groupId);
          const fromOrderIdx = groupOrder.findIndex(({ t }) => t.id === trackId);
          if (fromOrderIdx < 0) return state;
          let toOrderIdx = beforeTrackId
            ? groupOrder.findIndex(({ t }) => t.id === beforeTrackId)
            : groupOrder.length; // move to end of group
          if (toOrderIdx < 0) toOrderIdx = groupOrder.length;
          const fromAbs = groupOrder[fromOrderIdx].idx;
          // Compute absolute index to insert before
          const toAbs = toOrderIdx >= groupOrder.length ? (groupOrder.at(-1)?.idx ?? fromAbs) + 1 : groupOrder[toOrderIdx].idx;
          const [moved] = tracks.splice(fromAbs, 1);
          const adj = fromAbs < toAbs ? toAbs - 1 : toAbs;
          tracks.splice(adj, 0, moved);
          return { bgmTracks: tracks };
        }),
      setBgmTrackGroup: (trackId, groupId) =>
        set((state) => ({
          bgmTracks: state.bgmTracks.map((t) => (t.id === trackId ? { ...t, groupId } : t)),
        })),
      clearBgmTracks: () => set({ bgmTracks: [] }),
      addBgmGroup: (input) =>
        set((state) => {
          const newGroup = { ...input, id: createBgmGroupId() } as BgmGroup;
          fetch('/api/db/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groups: [newGroup] }) }).catch(() => {});
          return { bgmGroups: [...state.bgmGroups, newGroup] };
        }),
      updateBgmGroup: (id, update) =>
        set((state) => ({ bgmGroups: state.bgmGroups.map((g) => (g.id === id ? { ...g, ...update } : g)) })),
      removeBgmGroup: (id) =>
        set((state) => ({
          bgmGroups: state.bgmGroups.filter((g) => g.id !== id),
          bgmTracks: state.bgmTracks.map((t) => (t.groupId === id ? { ...t, groupId: undefined } : t)),
        })),
    })
);



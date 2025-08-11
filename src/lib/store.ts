"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export type AppState = {
  tasks: Task[];
  milestones: Milestone[];
  launcherShortcuts: LauncherShortcut[];
  launcherCategories: LauncherCategory[];
  launcherOnboarded: boolean;
  importHistory: ImportHistoryEntry[];
  pomodoro: PomodoroState;
  addTask: (input: Omit<Task, "id" | "createdAt" | "completed" | "completedPomodoros">) => void;
  toggleTask: (taskId: string) => void;
  incrementTaskPomodoro: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  addMilestone: (input: Omit<Milestone, "id">) => void;
  updateMilestoneProgress: (milestoneId: string, delta: number) => void;
  removeMilestone: (milestoneId: string) => void;
  setActiveTask: (taskId?: string) => void;
  startPomodoro: (isBreak?: boolean) => void;
  stopPomodoro: () => void;
  tickPomodoro: () => void;
  resetPomodoro: () => void;
  tasksForToday: () => Task[];
  backlogTasks: () => Task[];
  weekendOrHolidayTasks: () => Task[];
  addLauncherShortcut: (input: Omit<LauncherShortcut, "id">) => void;
  removeLauncherShortcut: (id: string) => void;
  updateLauncherShortcut: (id: string, update: Partial<Omit<LauncherShortcut, "id">>) => void;
  addLauncherCategory: (input: Omit<LauncherCategory, "id">) => void;
  removeLauncherCategory: (id: string) => void;
  updateLauncherCategory: (id: string, update: Partial<Omit<LauncherCategory, "id">>) => void;
  setLauncherOnboarded: (value: boolean) => void;
  addImportHistory: (entry: Omit<ImportHistoryEntry, "id">) => void;
  deleteImportHistory: (id: string) => void;
  clearImportHistory: () => void;
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      milestones: [],
      launcherShortcuts: [],
      launcherCategories: [],
      launcherOnboarded: false,
      importHistory: [],
      pomodoro: defaultPomodoro,
      addTask: (input) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...input,
              id: createTaskId(),
              createdAt: Date.now(),
              completed: false,
              completedPomodoros: 0,
            },
          ],
        })),
      toggleTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        })),
      incrementTaskPomodoro: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, completedPomodoros: (t.completedPomodoros ?? 0) + 1 }
              : t
          ),
        })),
      removeTask: (taskId) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),
      addMilestone: (input) =>
        set((state) => ({
          milestones: [
            ...state.milestones,
            { ...input, id: createMilestoneId(), currentUnits: input.currentUnits ?? 0 },
          ],
        })),
      updateMilestoneProgress: (milestoneId, delta) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  currentUnits: Math.max(0, Math.min(m.targetUnits, m.currentUnits + delta)),
                }
              : m
          ),
        })),
      removeMilestone: (milestoneId) =>
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== milestoneId),
        })),
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
      resetPomodoro: () => set({ pomodoro: defaultPomodoro }),
      tasksForToday: () => get().tasks.filter((t) => isTaskForToday(t)),
      backlogTasks: () => get().tasks.filter((t) => t.type === "backlog"),
      weekendOrHolidayTasks: () =>
        get().tasks.filter(
          (t) => t.type === "scheduled" && (t.scheduled?.daysOfWeek?.some((d) => d === 0 || d === 6) || (t.scheduled?.dateRanges?.length ?? 0) > 0)
        ),
      addLauncherShortcut: (input) =>
        set((state) => ({ launcherShortcuts: [...state.launcherShortcuts, { ...input, id: createShortcutId() }] })),
      removeLauncherShortcut: (id) =>
        set((state) => ({ launcherShortcuts: state.launcherShortcuts.filter((s) => s.id !== id) })),
      updateLauncherShortcut: (id, update) =>
        set((state) => ({
          launcherShortcuts: state.launcherShortcuts.map((s) => (s.id === id ? { ...s, ...update } : s)),
        })),
      addLauncherCategory: (input) =>
        set((state) => ({ launcherCategories: [...state.launcherCategories, { ...input, id: createCategoryId() }] })),
      removeLauncherCategory: (id) =>
        set((state) => ({
          launcherCategories: state.launcherCategories.filter((c) => c.id !== id),
          // 削除されたカテゴリに属するショートカットは未分類へ
          launcherShortcuts: state.launcherShortcuts.map((s) => (s.categoryId === id ? { ...s, categoryId: undefined } : s)),
        })),
      updateLauncherCategory: (id, update) =>
        set((state) => ({
          launcherCategories: state.launcherCategories.map((c) => (c.id === id ? { ...c, ...update } : c)),
        })),
      setLauncherOnboarded: (value) => set({ launcherOnboarded: value }),
      addImportHistory: (entry) =>
        set((state) => ({ importHistory: [{ ...entry, id: createHistoryId() }, ...state.importHistory] })),
      deleteImportHistory: (id) =>
        set((state) => ({ importHistory: state.importHistory.filter((e) => e.id !== id) })),
      clearImportHistory: () => set({ importHistory: [] }),
    }),
    { name: "obsidian-tasks-store" }
  )
);



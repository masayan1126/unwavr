import { StateCreator } from "zustand";
import { PomodoroState, PomodoroStateSchema } from "../types";
import { AppState } from "../storeTypes";
import { PomodoroSlice } from "./sliceTypes";

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
    activeTaskIds: [],
};

const ACTIVE_TASK_STORAGE_KEY = 'pomodoro:activeTaskId';
const ACTIVE_TASK_IDS_STORAGE_KEY = 'pomodoro:activeTaskIds';

function safeLocalStorageGet(key: string): string | null {
    try {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
        }
    } catch { }
    return null;
}

function safeLocalStorageSet(key: string, value: string) {
    try {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
        }
    } catch { }
}

function safeLocalStorageRemove(key: string) {
    try {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
        }
    } catch { }
}


export const createPomodoroSlice: StateCreator<AppState, [], [], PomodoroSlice> = (set) => ({
    pomodoro: PomodoroStateSchema.parse({
        ...defaultPomodoro,
        activeTaskId: safeLocalStorageGet(ACTIVE_TASK_STORAGE_KEY) || undefined,
        activeTaskIds: JSON.parse(safeLocalStorageGet(ACTIVE_TASK_IDS_STORAGE_KEY) || "[]"),
    }),
    setActiveTask: (taskId) =>
        set((state) => {
            let nextIds = [...state.pomodoro.activeTaskIds];
            if (taskId) {
                if (!nextIds.includes(taskId)) {
                    nextIds = [taskId, ...nextIds];
                } else {
                    nextIds = [taskId, ...nextIds.filter((id) => id !== taskId)];
                }
            }
            if (taskId) safeLocalStorageSet(ACTIVE_TASK_STORAGE_KEY, taskId);
            else safeLocalStorageRemove(ACTIVE_TASK_STORAGE_KEY);
            safeLocalStorageSet(ACTIVE_TASK_IDS_STORAGE_KEY, JSON.stringify(nextIds));
            return { pomodoro: { ...state.pomodoro, activeTaskId: taskId, activeTaskIds: nextIds } };
        }),
    addActiveTask: (taskId) =>
        set((state) => {
            if (state.pomodoro.activeTaskIds.includes(taskId)) return state;
            const nextIds = [...state.pomodoro.activeTaskIds, taskId];
            const nextActiveId = state.pomodoro.activeTaskId || taskId;
            safeLocalStorageSet(ACTIVE_TASK_IDS_STORAGE_KEY, JSON.stringify(nextIds));
            safeLocalStorageSet(ACTIVE_TASK_STORAGE_KEY, nextActiveId);
            return { pomodoro: { ...state.pomodoro, activeTaskIds: nextIds, activeTaskId: nextActiveId } };
        }),
    removeActiveTask: (taskId) =>
        set((state) => {
            const nextIds = state.pomodoro.activeTaskIds.filter((id) => id !== taskId);
            let nextActiveId = state.pomodoro.activeTaskId;
            if (nextActiveId === taskId) {
                nextActiveId = nextIds.length > 0 ? nextIds[0] : undefined;
            }
            safeLocalStorageSet(ACTIVE_TASK_IDS_STORAGE_KEY, JSON.stringify(nextIds));
            if (nextActiveId) safeLocalStorageSet(ACTIVE_TASK_STORAGE_KEY, nextActiveId);
            else safeLocalStorageRemove(ACTIVE_TASK_STORAGE_KEY);
            return { pomodoro: { ...state.pomodoro, activeTaskIds: nextIds, activeTaskId: nextActiveId } };
        }),
    reorderActiveTasks: (newOrder) =>
        set((state) => {
            const currentSet = new Set(state.pomodoro.activeTaskIds);
            const validOrder = newOrder.filter((id) => currentSet.has(id));
            const missing = state.pomodoro.activeTaskIds.filter((id) => !validOrder.includes(id));
            const finalIds = [...validOrder, ...missing];
            safeLocalStorageSet(ACTIVE_TASK_IDS_STORAGE_KEY, JSON.stringify(finalIds));
            return { pomodoro: { ...state.pomodoro, activeTaskIds: finalIds } };
        }),
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
                    lastTickAtMs: Date.now(),
                },
            };
        }),
    stopPomodoro: () =>
        set((state) => ({ pomodoro: { ...state.pomodoro, isRunning: false } })),
    tickPomodoro: () =>
        set((state) => {
            const s = state.pomodoro;
            if (!s.isRunning) return state;
            const now = Date.now();
            const last = typeof s.lastTickAtMs === 'number' ? s.lastTickAtMs : now;
            const elapsedMs = Math.max(0, now - last);
            if (elapsedMs < 1000) {
                return state;
            }
            let secondsAdvance = Math.floor(elapsedMs / 1000);
            const remainderMs = elapsedMs % 1000;
            let secondsLeft = s.secondsLeft;
            let isBreak = s.isBreak;
            let completed = s.completedWorkSessions;
            let workSessionCompletions = 0;

            while (secondsAdvance > 0) {
                if (secondsLeft > secondsAdvance) {
                    secondsLeft -= secondsAdvance;
                    secondsAdvance = 0;
                    break;
                }
                secondsAdvance -= secondsLeft;
                if (!isBreak) {
                    completed += 1;
                    workSessionCompletions += 1;
                    const shouldLong = completed % s.cyclesUntilLongBreak === 0;
                    isBreak = true;
                    secondsLeft = shouldLong ? s.longBreakSec : s.shortBreakSec;
                } else {
                    isBreak = false;
                    secondsLeft = s.workDurationSec;
                }
            }

            const activeId = s.activeTaskId;
            const tasks = activeId && workSessionCompletions > 0
                ? state.tasks.map((t) => (
                    t.id === activeId
                        ? { ...t, completedPomodoros: (t.completedPomodoros ?? 0) + workSessionCompletions }
                        : t
                ))
                : state.tasks;

            return {
                tasks,
                pomodoro: {
                    ...s,
                    secondsLeft,
                    isBreak,
                    isRunning: true,
                    completedWorkSessions: completed,
                    lastTickAtMs: now - remainderMs,
                },
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
                lastTickAtMs: undefined,
            },
        })),
    setPomodoroSettings: (settings) =>
        set((state) => {
            const next = { ...state.pomodoro, ...settings } as PomodoroState;
            if (!next.isRunning) {
                next.secondsLeft = next.isBreak ? next.shortBreakSec : next.workDurationSec;
            }
            return { pomodoro: next };
        }),
});

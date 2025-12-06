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
const POMODORO_SETTINGS_STORAGE_KEY = 'pomodoro:settings';
const POMODORO_STATE_STORAGE_KEY = 'pomodoro:state';

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

// 設定値の保存
function savePomodoroSettings(pomodoro: PomodoroState) {
    const settings = {
        workDurationSec: pomodoro.workDurationSec,
        shortBreakSec: pomodoro.shortBreakSec,
        longBreakSec: pomodoro.longBreakSec,
        cyclesUntilLongBreak: pomodoro.cyclesUntilLongBreak,
    };
    safeLocalStorageSet(POMODORO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

// 実行状態の保存
function savePomodoroState(pomodoro: PomodoroState) {
    const state = {
        isRunning: pomodoro.isRunning,
        isBreak: pomodoro.isBreak,
        secondsLeft: pomodoro.secondsLeft,
        completedWorkSessions: pomodoro.completedWorkSessions,
        lastTickAtMs: pomodoro.lastTickAtMs,
    };
    safeLocalStorageSet(POMODORO_STATE_STORAGE_KEY, JSON.stringify(state));
}

// 保存された設定値の読み込み
function loadPomodoroSettings(): Partial<PomodoroState> {
    const raw = safeLocalStorageGet(POMODORO_SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return {
            workDurationSec: typeof parsed.workDurationSec === 'number' ? parsed.workDurationSec : undefined,
            shortBreakSec: typeof parsed.shortBreakSec === 'number' ? parsed.shortBreakSec : undefined,
            longBreakSec: typeof parsed.longBreakSec === 'number' ? parsed.longBreakSec : undefined,
            cyclesUntilLongBreak: typeof parsed.cyclesUntilLongBreak === 'number' ? parsed.cyclesUntilLongBreak : undefined,
        };
    } catch {
        return {};
    }
}

// 保存された実行状態の読み込み
function loadPomodoroState(): Partial<PomodoroState> {
    const raw = safeLocalStorageGet(POMODORO_STATE_STORAGE_KEY);
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return {
            isRunning: typeof parsed.isRunning === 'boolean' ? parsed.isRunning : undefined,
            isBreak: typeof parsed.isBreak === 'boolean' ? parsed.isBreak : undefined,
            secondsLeft: typeof parsed.secondsLeft === 'number' ? parsed.secondsLeft : undefined,
            completedWorkSessions: typeof parsed.completedWorkSessions === 'number' ? parsed.completedWorkSessions : undefined,
            lastTickAtMs: typeof parsed.lastTickAtMs === 'number' ? parsed.lastTickAtMs : undefined,
        };
    } catch {
        return {};
    }
}

// 初期状態を構築
function buildInitialPomodoro(): PomodoroState {
    const savedSettings = loadPomodoroSettings();
    const savedState = loadPomodoroState();

    return PomodoroStateSchema.parse({
        ...defaultPomodoro,
        ...savedSettings,
        ...savedState,
        activeTaskId: safeLocalStorageGet(ACTIVE_TASK_STORAGE_KEY) || undefined,
        activeTaskIds: JSON.parse(safeLocalStorageGet(ACTIVE_TASK_IDS_STORAGE_KEY) || "[]"),
    });
}

export const createPomodoroSlice: StateCreator<AppState, [], [], PomodoroSlice> = (set) => ({
    pomodoro: buildInitialPomodoro(),
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

            let workDuration = state.pomodoro.workDurationSec;
            if (state.pomodoro.activeTaskId) {
                const task = state.tasks.find(t => t.id === state.pomodoro.activeTaskId);
                if (task?.pomodoroSetting?.workDurationSec) {
                    workDuration = task.pomodoroSetting.workDurationSec;
                }
            }

            const secondsLeft = nextIsBreak
                ? state.pomodoro.shortBreakSec
                : workDuration;
            const nextPomodoro = {
                ...state.pomodoro,
                isRunning: true,
                isBreak: nextIsBreak,
                secondsLeft,
                lastTickAtMs: Date.now(),
            };
            savePomodoroState(nextPomodoro);
            return { pomodoro: nextPomodoro };
        }),
    stopPomodoro: () =>
        set((state) => {
            const nextPomodoro = { ...state.pomodoro, isRunning: false };
            savePomodoroState(nextPomodoro);
            return { pomodoro: nextPomodoro };
        }),
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
                    let workDuration = s.workDurationSec;
                    if (s.activeTaskId) {
                        const task = state.tasks.find(t => t.id === s.activeTaskId);
                        if (task?.pomodoroSetting?.workDurationSec) {
                            workDuration = task.pomodoroSetting.workDurationSec;
                        }
                    }
                    secondsLeft = workDuration;
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

            const nextPomodoro = {
                ...s,
                secondsLeft,
                isBreak,
                isRunning: true,
                completedWorkSessions: completed,
                lastTickAtMs: now - remainderMs,
            };
            // 5秒ごとに保存（パフォーマンス最適化）
            if (Math.floor(secondsLeft / 5) !== Math.floor(s.secondsLeft / 5) || workSessionCompletions > 0) {
                savePomodoroState(nextPomodoro);
            }
            return { tasks, pomodoro: nextPomodoro };
        }),
    resetPomodoro: () =>
        set((state) => {
            let workDuration = state.pomodoro.workDurationSec;
            if (state.pomodoro.activeTaskId) {
                const task = state.tasks.find(t => t.id === state.pomodoro.activeTaskId);
                if (task?.pomodoroSetting?.workDurationSec) {
                    workDuration = task.pomodoroSetting.workDurationSec;
                }
            }

            const nextPomodoro = {
                ...state.pomodoro,
                isRunning: false,
                isBreak: false,
                secondsLeft: workDuration,
                completedWorkSessions: 0,
                lastTickAtMs: undefined,
            };
            savePomodoroState(nextPomodoro);
            return { pomodoro: nextPomodoro };
        }),
    setPomodoroSettings: (settings) =>
        set((state) => {
            const next = { ...state.pomodoro, ...settings } as PomodoroState;
            if (!next.isRunning) {
                if (next.isBreak) {
                    next.secondsLeft = next.shortBreakSec;
                } else {
                    let workDuration = next.workDurationSec;
                    if (next.activeTaskId) {
                        const task = state.tasks.find(t => t.id === next.activeTaskId);
                        if (task?.pomodoroSetting?.workDurationSec) {
                            workDuration = task.pomodoroSetting.workDurationSec;
                        }
                    }
                    next.secondsLeft = workDuration;
                }
            }
            savePomodoroSettings(next);
            savePomodoroState(next);
            return { pomodoro: next };
        }),
});

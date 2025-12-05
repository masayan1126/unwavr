import { Task, Milestone, LauncherShortcut, LauncherCategory, BgmTrack, BgmGroup, PomodoroState, ImportHistoryEntry } from "../types";

export interface TaskSlice {
    tasks: Task[];
    addTask: (input: Omit<Task, "id" | "createdAt" | "completed" | "completedPomodoros">) => string;
    toggleTask: (taskId: string) => void;
    toggleDailyDoneForToday: (taskId: string) => void;
    togglePlannedForToday: (taskId: string) => void;
    incrementTaskPomodoro: (taskId: string) => void;
    removeTask: (taskId: string) => void;
    updateTask: (taskId: string, update: Partial<Omit<Task, "id" | "createdAt">>) => void;
    duplicateTask: (taskId: string) => string;
    completeTasks: (taskIds: string[]) => void;
    resetDailyDoneForToday: (taskIds: string[]) => void;
    archiveDailyTasks: (taskIds: string[]) => void;
    archiveDailyTask: (taskId: string) => void;
    updateTaskOrder: (taskId: string, newOrder: number) => void;
    tasksForToday: () => Task[];
    backlogTasks: () => Task[];
    weekendOrHolidayTasks: () => Task[];
    clearTasks: () => void;
    moveTasksToToday: (taskIds: string[]) => void;
}

export interface MilestoneSlice {
    milestones: Milestone[];
    addMilestone: (input: Omit<Milestone, "id">) => void;
    updateMilestoneProgress: (milestoneId: string, delta: number) => void;
    removeMilestone: (milestoneId: string) => void;
    exportMilestones: () => string;
    importMilestones: (jsonData: string) => { success: boolean; imported: number; errors: string[] };
    updateMilestoneOrder: (milestoneId: string, newOrder: number) => void;
    clearMilestones: () => void;
}

export interface LauncherSlice {
    launcherShortcuts: LauncherShortcut[];
    launcherCategories: LauncherCategory[];
    launcherOnboarded: boolean;
    addLauncherShortcut: (input: Omit<LauncherShortcut, "id">) => void;
    removeLauncherShortcut: (id: string) => void;
    updateLauncherShortcut: (id: string, update: Partial<Omit<LauncherShortcut, "id">>) => void;
    addLauncherCategory: (input: Omit<LauncherCategory, "id">) => void;
    removeLauncherCategory: (id: string) => void;
    updateLauncherCategory: (id: string, update: Partial<Omit<LauncherCategory, "id">>) => void;
    exportLaunchers: () => string;
    importLaunchers: (jsonData: string, replace?: boolean) => { success: boolean; importedShortcuts: number; importedCategories: number; errors: string[] };
    setLauncherOnboarded: (value: boolean) => void;
    clearLaunchers: () => void;
}

export interface BgmSlice {
    bgmTracks: BgmTrack[];
    bgmGroups: BgmGroup[];
    bgmCurrentTrackId?: string;
    bgmMiniPos?: { x: number; y: number };
    addBgmTrack: (input: Omit<BgmTrack, "id" | "createdAt">) => void;
    removeBgmTrack: (id: string) => void;
    updateBgmTrack: (id: string, update: Partial<Omit<BgmTrack, "id">>) => void;
    moveBgmTrack: (fromIdx: number, toIdx: number) => void;
    moveBgmTrackWithinGroup: (trackId: string, beforeTrackId?: string) => void;
    setBgmTrackGroup: (trackId: string, groupId?: string) => void;
    clearBgmTracks: () => void;
    addBgmGroup: (input: Omit<BgmGroup, "id">) => void;
    updateBgmGroup: (id: string, update: Partial<Omit<BgmGroup, "id">>) => void;
    removeBgmGroup: (id: string) => void;
    playBgmTrack: (trackId: string) => void;
    stopBgm: () => void;
    setBgmMiniPos: (pos: { x: number; y: number }) => void;
}

export interface PomodoroSlice {
    pomodoro: PomodoroState;
    setActiveTask: (taskId?: string) => void;
    addActiveTask: (taskId: string) => void;
    removeActiveTask: (taskId: string) => void;
    reorderActiveTasks: (newOrder: string[]) => void;
    startPomodoro: (isBreak?: boolean) => void;
    stopPomodoro: () => void;
    tickPomodoro: () => void;
    resetPomodoro: () => void;
    setPomodoroSettings: (settings: Partial<Pick<PomodoroState, "workDurationSec" | "shortBreakSec" | "longBreakSec" | "cyclesUntilLongBreak">>) => void;
}

export interface ImportHistorySlice {
    importHistory: ImportHistoryEntry[];
    addImportHistory: (entry: Omit<ImportHistoryEntry, "id">) => void;
    deleteImportHistory: (id: string) => void;
    clearImportHistory: () => void;
}

export interface UISlice {
    dataSource: 'db';
    hydrating: boolean;
    fontSize: number;
    setDataSource: (src: 'db') => void;
    hydrateFromDb: () => Promise<void>;
    setFontSize: (size: number) => void;
    clearTasksMilestonesLaunchers: () => void;
    isLauncherOpen: boolean;
    toggleLauncher: () => void;
    language: 'ja' | 'en';
    setLanguage: (lang: 'ja' | 'en') => void;
}

export interface AISlice {
    geminiApiKey: string;
    setGeminiApiKey: (key: string) => void;
}

import { Task, Milestone, LauncherShortcut, LauncherCategory, BgmTrack, BgmGroup, BgmSearchResult, PomodoroState, ImportHistoryEntry, TimeSlot } from "../types";

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
    // 時間スロット管理
    addTimeSlot: (taskId: string, slot: TimeSlot) => void;
    updateTimeSlot: (taskId: string, slotIndex: number, update: Partial<TimeSlot>) => void;
    removeTimeSlot: (taskId: string, slotIndex: number) => void;
    getTasksForDate: (date: number) => Task[];
}

export interface MilestoneSlice {
    milestones: Milestone[];
    addMilestone: (input: Omit<Milestone, "id">) => void;
    updateMilestone: (milestoneId: string, update: Partial<Omit<Milestone, "id">>) => void;
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
    bgmSearchResults: BgmSearchResult[];
    bgmSearchLoading: boolean;
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
    setBgmSearchResults: (results: BgmSearchResult[]) => void;
    setBgmSearchLoading: (loading: boolean) => void;
    clearBgmSearchResults: () => void;
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

export type GeminiModel = 'gemini-2.5-flash-preview-05-20' | 'gemini-3-pro-preview';

export const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
    { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash', description: '高速・軽量（推奨）' },
    { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro', description: '最高性能・高度な推論（Proプラン推奨）' },
];

export interface AISlice {
    geminiApiKey: string;
    setGeminiApiKey: (key: string) => void;
    aiModel: GeminiModel;
    setAIModel: (model: GeminiModel) => void;
}

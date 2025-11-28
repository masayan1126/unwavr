import { StateCreator } from "zustand";
import { AppState } from "../storeTypes";
import { Task, Milestone, LauncherCategory, LauncherShortcut, BgmGroup, BgmTrack } from "../types";
import { UISlice } from "./sliceTypes";

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set, get) => ({
    dataSource: 'db',
    hydrating: true,
    fontSize: (typeof window !== 'undefined' ? Number(safeLocalStorageGet("fontSize") || 100) : 100),
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
    setFontSize: (size) => {
        safeLocalStorageSet("fontSize", String(size));
        set({ fontSize: size });
    },
    clearTasksMilestonesLaunchers: () => {
        set({ tasks: [], milestones: [], launcherShortcuts: [], launcherCategories: [], launcherOnboarded: false });
        fetch('/api/db/clear', { method: 'POST' })
            .then(() => { try { if (typeof window !== 'undefined') { get().hydrateFromDb(); } } catch { } })
            .catch(() => { });
    },
    isLauncherOpen: true, // Default open as requested "always displayed"
    toggleLauncher: () => set((state) => ({ isLauncherOpen: !state.isLauncherOpen })),
});

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

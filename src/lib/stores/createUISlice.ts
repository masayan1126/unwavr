import { StateCreator } from "zustand";
import { AppState } from "../storeTypes";
import { Task, Milestone, LauncherCategory, LauncherShortcut, BgmGroup, BgmTrack } from "../types";

export interface UISlice {
    dataSource: 'db';
    hydrating: boolean;
    fontSize: number;
    setDataSource: (src: 'db') => void;
    hydrateFromDb: () => Promise<void>;
    setFontSize: (size: number) => void;
    clearTasksMilestonesLaunchers: () => void;
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set, get) => ({
    dataSource: 'db',
    hydrating: true,
    fontSize: (typeof window !== 'undefined' ? Number(localStorage.getItem("fontSize") || 100) : 100),
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
        if (typeof window !== 'undefined') localStorage.setItem("fontSize", String(size));
        set({ fontSize: size });
    },
    clearTasksMilestonesLaunchers: () => {
        set({ tasks: [], milestones: [], launcherShortcuts: [], launcherCategories: [], launcherOnboarded: false });
        fetch('/api/db/clear', { method: 'POST' })
            .then(() => { try { if (typeof window !== 'undefined') { get().hydrateFromDb(); } } catch { } })
            .catch(() => { });
    },
});

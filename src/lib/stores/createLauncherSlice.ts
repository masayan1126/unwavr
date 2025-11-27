import { StateCreator } from "zustand";
import { LauncherShortcut, LauncherCategory } from "../types";
import { AppState } from "../storeTypes";

function createShortcutId(): string {
    return `sct_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function createCategoryId(): string {
    return `cat_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
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

export const createLauncherSlice: StateCreator<AppState, [], [], LauncherSlice> = (set, get) => ({
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
    addLauncherShortcut: (input) =>
        set((state) => {
            const sc = { ...input, id: createShortcutId() } as LauncherShortcut;
            fetch('/api/db/launchers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts: [sc] }) }).catch(() => { });
            return { launcherShortcuts: [...state.launcherShortcuts, sc] };
        }),
    removeLauncherShortcut: (id) =>
        set((state) => {
            fetch(`/api/db/launchers/shortcuts/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => { });
            return { launcherShortcuts: state.launcherShortcuts.filter((s) => s.id !== id) };
        }),
    updateLauncherShortcut: (id, update) =>
        set((state) => {
            const launcherShortcuts = state.launcherShortcuts.map((s) => (s.id === id ? { ...s, ...update } : s));
            fetch(`/api/db/launchers/shortcuts/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) }).catch(() => { });
            return { launcherShortcuts };
        }),
    addLauncherCategory: (input) =>
        set((state) => {
            const cat = { ...input, id: createCategoryId() } as LauncherCategory;
            fetch('/api/db/launchers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: [cat] }) }).catch(() => { });
            return { launcherCategories: [...state.launcherCategories, cat] };
        }),
    removeLauncherCategory: (id) =>
        set((state) => {
            fetch(`/api/db/launchers/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => { });
            return {
                launcherCategories: state.launcherCategories.filter((c) => c.id !== id),
                launcherShortcuts: state.launcherShortcuts.map((s) => (s.categoryId === id ? { ...s, categoryId: undefined } : s)),
            };
        }),
    updateLauncherCategory: (id, update) =>
        set((state) => {
            const launcherCategories = state.launcherCategories.map((c) => (c.id === id ? { ...c, ...update } : c));
            fetch(`/api/db/launchers/categories/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) }).catch(() => { });
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
    clearLaunchers: () => set({ launcherShortcuts: [], launcherCategories: [], launcherOnboarded: false }),
});

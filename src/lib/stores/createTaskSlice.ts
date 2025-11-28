import { StateCreator } from "zustand";
import { Task, createTaskId, isTaskForToday } from "../types";
import { AppState } from "../storeTypes";

import { TaskSlice } from "./sliceTypes";


export const createTaskSlice: StateCreator<AppState, [], [], TaskSlice> = (set, get) => ({
    tasks: [],
    addTask: (input) => {
        let createdId = '';
        set((state) => {
            const newTask: Task = {
                ...(input as Task),
                id: createTaskId(),
                createdAt: Date.now(),
                completed: false,
                completedPomodoros: 0,
                order: Date.now(),
            };
            createdId = newTask.id;
            fetch('/api/db/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask) }).catch(() => { });
            return { tasks: [...state.tasks, newTask] };
        });
        return createdId;
    },
    toggleTask: (taskId) =>
        set((state) => {
            const tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
            const changed = tasks.find((t) => t.id === taskId);
            const justCompleted = Boolean(changed?.completed);
            if (changed) fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: changed.completed }) }).catch(() => { });

            // Interaction with Pomodoro slice
            if (justCompleted && state.pomodoro.activeTaskIds.includes(taskId)) {
                const nextActiveIds = state.pomodoro.activeTaskIds.filter((id) => id !== taskId);
                const nextActiveId = nextActiveIds.length > 0 ? nextActiveIds[0] : undefined;
                try {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('pomodoro:activeTaskIds', JSON.stringify(nextActiveIds));
                        if (nextActiveId) localStorage.setItem('pomodoro:activeTaskId', nextActiveId);
                        else localStorage.removeItem('pomodoro:activeTaskId');
                    }
                } catch { }
                return { tasks, pomodoro: { ...state.pomodoro, activeTaskId: nextActiveId, activeTaskIds: nextActiveIds } };
            }
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
                fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dailyDoneDates: next.dailyDoneDates }) }).catch(() => { });
                return next;
            });

            const updatedTask = tasks.find((t) => t.id === taskId);
            const isDoneToday = updatedTask?.dailyDoneDates?.includes(today);

            if (isDoneToday && state.pomodoro.activeTaskIds.includes(taskId)) {
                const nextActiveIds = state.pomodoro.activeTaskIds.filter((id) => id !== taskId);
                const nextActiveId = nextActiveIds.length > 0 ? nextActiveIds[0] : undefined;
                try {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('pomodoro:activeTaskIds', JSON.stringify(nextActiveIds));
                        if (nextActiveId) localStorage.setItem('pomodoro:activeTaskId', nextActiveId);
                        else localStorage.removeItem('pomodoro:activeTaskId');
                    }
                } catch { }
                return { tasks, pomodoro: { ...state.pomodoro, activeTaskId: nextActiveId, activeTaskIds: nextActiveIds } };
            }

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
                fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plannedDates: next.plannedDates }) }).catch(() => { });
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
            fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' }).catch(() => { });
            return { tasks: state.tasks.filter((t) => t.id !== taskId) };
        }),
    updateTask: (taskId, update) =>
        set((state) => {
            const tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, ...update } : t));
            fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) }).catch(() => { });
            return { tasks };
        }),
    duplicateTask: (taskId) => {
        let createdId = '';
        set((state) => {
            const source = state.tasks.find((t) => t.id === taskId);
            if (!source) return state;
            const copy: Task = {
                ...source,
                id: createTaskId(),
                createdAt: Date.now(),
                completed: false,
                completedPomodoros: 0,
                title: source.title ? `${source.title} (複製)` : '(複製)',
                order: Date.now(),
            } as Task;
            createdId = copy.id;
            fetch('/api/db/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(copy) }).catch(() => { });
            return { tasks: [...state.tasks, copy] };
        });
        return createdId;
    },
    archiveDailyTask: (taskId) =>
        set((state) => {
            const now = Date.now();
            const tasks = state.tasks.filter((t) => t.id !== taskId);
            fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived: true, archivedAt: now })
            }).then(() => {
                try { if (typeof window !== 'undefined') { get().hydrateFromDb(); } } catch { }
            })
                .catch(() => { });
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
                    }).catch(() => { });
                    return next;
                }
                const next = { ...t, completed: true } as Task;
                fetch(`/api/db/tasks/${encodeURIComponent(t.id)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completed: true })
                }).catch(() => { });
                return next;
            });
            const activeIdsSet = new Set(state.pomodoro.activeTaskIds);
            if (taskIds.some((id) => activeIdsSet.has(id))) {
                const nextActiveIds = state.pomodoro.activeTaskIds.filter((id) => !taskIds.includes(id));
                const nextActiveId = nextActiveIds.length > 0 ? nextActiveIds[0] : undefined;
                try {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('pomodoro:activeTaskIds', JSON.stringify(nextActiveIds));
                        if (nextActiveId) localStorage.setItem('pomodoro:activeTaskId', nextActiveId);
                        else localStorage.removeItem('pomodoro:activeTaskId');
                    }
                } catch { }
                return { tasks, pomodoro: { ...state.pomodoro, activeTaskId: nextActiveId, activeTaskIds: nextActiveIds } };
            }
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
                }).catch(() => { });
                return next;
            });
            return { tasks };
        }),
    archiveDailyTasks: (taskIds) =>
        set((state) => {
            if (!Array.isArray(taskIds) || taskIds.length === 0) return state;
            const toArchive = new Set(taskIds);
            const tasks = state.tasks.filter((t) => !(t.type === 'daily' && toArchive.has(t.id)));
            const now = Date.now();
            taskIds.forEach((id) => {
                fetch(`/api/db/tasks/${encodeURIComponent(id)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ archived: true, archivedAt: now })
                }).catch(() => { });
            });
            Promise.resolve().then(() => { try { if (typeof window !== 'undefined') { get().hydrateFromDb(); } } catch { } });
            return { tasks };
        }),
    updateTaskOrder: (taskId, newOrder) =>
        set((state) => {
            const tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, order: newOrder } : t));
            fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: newOrder }) }).catch(() => { });
            return { tasks };
        }),
    tasksForToday: () => {
        return get().tasks.filter((t) => t.archived !== true && isTaskForToday(t));
    },
    backlogTasks: () => get().tasks.filter((t) => t.archived !== true && t.type === "backlog"),
    weekendOrHolidayTasks: () =>
        get().tasks.filter(
            (t) => t.archived !== true && t.type === "scheduled" && (t.scheduled?.daysOfWeek?.some((d) => d === 0 || d === 6) || (t.scheduled?.dateRanges?.length ?? 0) > 0)
        ),
    clearTasks: () => set({ tasks: [] }),
    moveTasksToToday: (taskIds) =>
        set((state) => {
            if (!Array.isArray(taskIds) || taskIds.length === 0) return state;
            const d = new Date();
            const todayUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

            const tasks = state.tasks.map((t) => {
                if (!taskIds.includes(t.id)) return t;

                if (t.type === 'daily') return t; // Daily tasks are already for today if not archived

                let next = { ...t };
                let updated = false;

                if (t.type === 'scheduled') {
                    // Convert to backlog and set planned date to today
                    next = { ...next, type: 'backlog', plannedDates: [todayUtc] } as Task;
                    updated = true;
                } else if (t.type === 'backlog') {
                    // Update planned date to today
                    next = { ...next, plannedDates: [todayUtc] } as Task;
                    updated = true;
                }

                if (updated) {
                    fetch(`/api/db/tasks/${encodeURIComponent(t.id)}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: next.type, plannedDates: next.plannedDates })
                    }).catch(() => { });
                }
                return next;
            });
            return { tasks };
        }),
});

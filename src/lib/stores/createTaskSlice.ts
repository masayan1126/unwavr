import { StateCreator } from "zustand";
import { Task, createTaskId, isTaskForToday } from "../types";
import { getTodayUtc } from "../taskUtils";
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
            const now = Date.now();
            const d = new Date();
            d.setUTCHours(0, 0, 0, 0);
            const todayUtc = d.getTime();

            const tasks = state.tasks.map((t) => {
                if (t.id !== taskId) return t;

                const nextCompleted = !t.completed;
                let next = { ...t, completed: nextCompleted } as Task;

                if (t.type === 'scheduled') {
                    // Scheduled tasks use dailyDoneDates for history
                    const arr = Array.isArray(t.dailyDoneDates) ? [...t.dailyDoneDates] : [];
                    if (nextCompleted) {
                        if (!arr.includes(todayUtc)) arr.push(todayUtc);
                    } else {
                        const idx = arr.indexOf(todayUtc);
                        if (idx >= 0) arr.splice(idx, 1);
                    }
                    next = { ...next, dailyDoneDates: arr } as Task;
                    // Persist dailyDoneDates immediately
                    fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed: nextCompleted, dailyDoneDates: arr })
                    }).catch(() => { });
                } else if (t.type === 'backlog') {
                    // Backlog tasks use completedAt and get archived when completed
                    if (nextCompleted) {
                        next.completedAt = now;
                        next.archived = true;
                        next.archivedAt = now;
                    } else {
                        next.completedAt = undefined;
                        next.archived = false;
                        next.archivedAt = undefined;
                    }
                    fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed: nextCompleted, completedAt: next.completedAt, archived: next.archived, archivedAt: next.archivedAt })
                    }).catch(() => { });
                } else {
                    // Default logic (e.g. daily tasks shouldn't really use this toggle, but fail-safe)
                    fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed: nextCompleted })
                    }).catch(() => { });
                }
                return next;
            });

            const changed = tasks.find((t) => t.id === taskId);
            const justCompleted = Boolean(changed?.completed);

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
            // サブタスクをルートに昇格（parentTaskIdをundefinedに）
            const subtasks = state.tasks.filter(t => t.parentTaskId === taskId);
            subtasks.forEach(subtask => {
                fetch(`/api/db/tasks/${encodeURIComponent(subtask.id)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ parentTaskId: null })
                }).catch(() => { });
            });

            fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' }).catch(() => { });

            // サブタスクのparentTaskIdをundefinedに更新し、親タスクを削除
            const updatedTasks = state.tasks.map(t => {
                if (t.parentTaskId === taskId) {
                    return { ...t, parentTaskId: undefined };
                }
                return t;
            }).filter((t) => t.id !== taskId);

            return { tasks: updatedTasks };
        }),
    updateTask: (taskId, update) =>
        set((state) => {
            const tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, ...update } : t));
            // undefinedをnullに変換してから送信（parentTaskIdのクリアなどに対応）
            const sanitizedUpdate = Object.fromEntries(
                Object.entries(update).map(([k, v]) => [k, v === undefined ? null : v])
            );
            fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sanitizedUpdate) }).catch(() => { });
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
            const todayUtc = getTodayUtc();

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
    // 時間スロット管理
    addTimeSlot: (taskId, slot) =>
        set((state) => {
            const tasks = state.tasks.map((t) => {
                if (t.id !== taskId) return t;
                const timeSlots = [...(t.timeSlots ?? []), slot];
                const next = { ...t, timeSlots } as Task;
                fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeSlots })
                }).catch(() => { });
                return next;
            });
            return { tasks };
        }),
    updateTimeSlot: (taskId, slotIndex, update) =>
        set((state) => {
            const tasks = state.tasks.map((t) => {
                if (t.id !== taskId) return t;
                const timeSlots = [...(t.timeSlots ?? [])];
                if (slotIndex < 0 || slotIndex >= timeSlots.length) return t;
                timeSlots[slotIndex] = { ...timeSlots[slotIndex], ...update };
                const next = { ...t, timeSlots } as Task;
                fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeSlots })
                }).catch(() => { });
                return next;
            });
            return { tasks };
        }),
    removeTimeSlot: (taskId, slotIndex) =>
        set((state) => {
            const tasks = state.tasks.map((t) => {
                if (t.id !== taskId) return t;
                const timeSlots = [...(t.timeSlots ?? [])];
                if (slotIndex < 0 || slotIndex >= timeSlots.length) return t;
                timeSlots.splice(slotIndex, 1);
                const next = { ...t, timeSlots } as Task;
                fetch(`/api/db/tasks/${encodeURIComponent(taskId)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeSlots })
                }).catch(() => { });
                return next;
            });
            return { tasks };
        }),
    getTasksForDate: (date) => {
        return get().tasks.filter((t) => {
            if (t.archived === true) return false;
            // タスクにtimeSlotsがあり、指定日に該当するスロットがあるか確認
            if (t.timeSlots?.some((slot) => slot.date === date)) return true;
            // または、plannedDatesに含まれるか確認
            if (t.type === 'backlog' && t.plannedDates?.includes(date)) return true;
            return false;
        });
    },
    // サブタスク関連
    getSubtasks: (parentId) => {
        return get().tasks.filter(t => t.parentTaskId === parentId && t.archived !== true);
    },
    getParentTask: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task?.parentTaskId) return undefined;
        return get().tasks.find(t => t.id === task.parentTaskId);
    },
    getRootTasks: () => {
        return get().tasks.filter(t => !t.parentTaskId && t.archived !== true);
    },
});

import { useAppStore } from "../store";
import { act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock fetch
global.fetch = vi.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({}),
    })
) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

describe("useAppStore", () => {
    beforeEach(() => {
        useAppStore.setState({
            tasks: [],
            milestones: [],
            pomodoro: {
                isRunning: false,
                isBreak: false,
                secondsLeft: 1500,
                workDurationSec: 1500,
                shortBreakSec: 300,
                longBreakSec: 900,
                cyclesUntilLongBreak: 4,
                completedWorkSessions: 0,
                activeTaskIds: [],
            },
        });
        vi.clearAllMocks();

    });

    it("should add a task", () => {
        const { tasks } = useAppStore.getState();
        expect(tasks).toHaveLength(0);

        let taskId = "";
        act(() => {
            taskId = useAppStore.getState().addTask({
                title: "Test Task",
                type: "daily",
                order: 0,
            });
        });

        const state = useAppStore.getState();
        expect(state.tasks).toHaveLength(1);
        expect(state.tasks[0].title).toBe("Test Task");
        expect(state.tasks[0].id).toBe(taskId);
    });

    it("should toggle a task", () => {
        let taskId = "";
        act(() => {
            taskId = useAppStore.getState().addTask({
                title: "Test Task",
                type: "daily",
                order: 0,
            });
        });

        expect(useAppStore.getState().tasks[0].completed).toBe(false);

        act(() => {
            useAppStore.getState().toggleTask(taskId);
        });

        expect(useAppStore.getState().tasks[0].completed).toBe(true);
    });

    it("should remove a task", () => {
        let taskId = "";
        act(() => {
            taskId = useAppStore.getState().addTask({
                title: "Test Task",
                type: "daily",
                order: 0,
            });
        });

        expect(useAppStore.getState().tasks).toHaveLength(1);

        act(() => {
            useAppStore.getState().removeTask(taskId);
        });

        expect(useAppStore.getState().tasks).toHaveLength(0);
    });

    it("should start and stop pomodoro", () => {
        expect(useAppStore.getState().pomodoro.isRunning).toBe(false);

        act(() => {
            useAppStore.getState().startPomodoro();
        });

        expect(useAppStore.getState().pomodoro.isRunning).toBe(true);

        act(() => {
            useAppStore.getState().stopPomodoro();
        });

        expect(useAppStore.getState().pomodoro.isRunning).toBe(false);
    });

    it("should tick pomodoro", () => {
        vi.useFakeTimers();

        act(() => {
            useAppStore.getState().startPomodoro();
        });

        // const initialSeconds = useAppStore.getState().pomodoro.secondsLeft;

        // Advance time by 1 second
        act(() => {
            vi.advanceTimersByTime(1000);

            useAppStore.getState().tickPomodoro();
        });

        vi.useRealTimers();

    });

    it("should add a milestone", () => {
        act(() => {
            useAppStore.getState().addMilestone({
                title: "Milestone 1",
                targetUnits: 10,
                currentUnits: 0,
                order: 0,
            });
        });

        expect(useAppStore.getState().milestones).toHaveLength(1);
        expect(useAppStore.getState().milestones[0].title).toBe("Milestone 1");
    });

    it("should move backlog tasks to today", () => {
        let taskId = "";
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const pastDateUtc = Date.UTC(pastDate.getUTCFullYear(), pastDate.getUTCMonth(), pastDate.getUTCDate());

        act(() => {
            taskId = useAppStore.getState().addTask({
                title: "Overdue Task",
                type: "backlog",
                plannedDates: [pastDateUtc],
                order: 0,
            });
        });

        act(() => {
            useAppStore.getState().moveTasksToToday([taskId]);
        });

        const task = useAppStore.getState().tasks.find((t) => t.id === taskId);
        const today = new Date();
        const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
        expect(task?.plannedDates).toContain(todayUtc);
    });

    it("should convert scheduled tasks to backlog and move to today", () => {
        let taskId = "";
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const pastDateUtc = Date.UTC(pastDate.getUTCFullYear(), pastDate.getUTCMonth(), pastDate.getUTCDate());

        act(() => {
            taskId = useAppStore.getState().addTask({
                title: "Overdue Scheduled Task",
                type: "scheduled",
                scheduled: {
                    daysOfWeek: [],
                    dateRanges: [{ start: pastDateUtc, end: pastDateUtc }],
                },
                order: 0,
            });
        });

        act(() => {
            useAppStore.getState().moveTasksToToday([taskId]);
        });

        const task = useAppStore.getState().tasks.find((t) => t.id === taskId);
        const today = new Date();
        const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

        expect(task?.type).toBe("backlog");
        expect(task?.plannedDates).toContain(todayUtc);
    });
});

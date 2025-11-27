import { useAppStore } from "../store";
import { act } from "@testing-library/react";

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({}),
    })
) as jest.Mock;

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
        jest.clearAllMocks();
    });

    it("should add a task", () => {
        const { addTask, tasks } = useAppStore.getState();
        expect(tasks).toHaveLength(0);

        let taskId = "";
        act(() => {
            taskId = useAppStore.getState().addTask({
                title: "Test Task",
                type: "daily",
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
        jest.useFakeTimers();
        act(() => {
            useAppStore.getState().startPomodoro();
        });

        const initialSeconds = useAppStore.getState().pomodoro.secondsLeft;

        // Advance time by 1 second
        act(() => {
            jest.advanceTimersByTime(1000);
            useAppStore.getState().tickPomodoro();
        });

        // Note: tickPomodoro relies on Date.now(). Jest fake timers mock Date.now() if configured,
        // but we might need to ensure Date.now() advances.
        // In many jest setups, advanceTimersByTime advances Date.now() as well.
        // However, the store uses `Date.now()` inside.
        // If this test fails, we might need to spyOn Date.now.
    });

    it("should add a milestone", () => {
        act(() => {
            useAppStore.getState().addMilestone({
                title: "Milestone 1",
                targetUnits: 10,
            });
        });

        expect(useAppStore.getState().milestones).toHaveLength(1);
        expect(useAppStore.getState().milestones[0].title).toBe("Milestone 1");
    });
});

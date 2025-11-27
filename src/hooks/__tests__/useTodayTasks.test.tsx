import { renderHook, act } from "@testing-library/react";
import { useTodayTasks } from "../useTodayTasks";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isTaskForToday } from "@/lib/types";
import { isOverdue } from "@/lib/taskUtils";

// Mock dependencies
vi.mock("@/lib/types", () => ({
    isTaskForToday: vi.fn(),
}));

vi.mock("@/lib/taskUtils", () => ({
    isOverdue: vi.fn(),
}));

// Mock store state
let mockStoreState = {
    tasks: [] as unknown[],
    hydrating: false,
};

vi.mock("@/lib/store", () => ({
    useAppStore: (selector: (state: unknown) => unknown) => selector(mockStoreState),
}));

describe("useTodayTasks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Reset store state
        mockStoreState = {
            tasks: [],
            hydrating: false,
        };

        // Default mock implementations
        (isTaskForToday as unknown as { mockReturnValue: (val: boolean) => void }).mockReturnValue(true);
        (isOverdue as unknown as { mockReturnValue: (val: boolean) => void }).mockReturnValue(false);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should categorize tasks correctly", () => {
        const today = new Date();
        const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

        mockStoreState.tasks = [
            // Incomplete Daily
            { id: "1", title: "Daily 1", type: "daily", dailyDoneDates: [] },
            // Completed Daily (done today)
            { id: "2", title: "Daily 2", type: "daily", dailyDoneDates: [todayLocal] },
            // Incomplete Scheduled
            { id: "3", title: "Scheduled 1", type: "scheduled", completed: false },
            // Completed Scheduled
            { id: "4", title: "Scheduled 2", type: "scheduled", completed: true },
            // Incomplete Backlog (planned for today)
            { id: "5", title: "Backlog 1", type: "backlog", completed: false, plannedDates: [todayLocal] },
            // Completed Backlog
            { id: "6", title: "Backlog 2", type: "backlog", completed: true, plannedDates: [todayLocal] },
        ];

        const { result } = renderHook(() => useTodayTasks());

        // Check incomplete tasks (Daily 1, Scheduled 1, Backlog 1)
        expect(result.current.incompleteToday).toHaveLength(3);
        expect(result.current.incompleteToday.map(t => t.id)).toEqual(expect.arrayContaining(["1", "3", "5"]));

        // Check daily done
        expect(result.current.dailyDoneFiltered).toHaveLength(1);
        expect(result.current.dailyDoneFiltered[0].id).toBe("2");

        // Check scheduled done
        expect(result.current.scheduledDoneFiltered).toHaveLength(1);
        expect(result.current.scheduledDoneFiltered[0].id).toBe("4");

        // Check backlog done
        expect(result.current.backlogDoneFiltered).toHaveLength(1);
        expect(result.current.backlogDoneFiltered[0].id).toBe("6");
    });

    it("should filter out overdue tasks from incomplete list", () => {
        mockStoreState.tasks = [
            { id: "1", title: "Normal Task", type: "daily" },
            { id: "2", title: "Overdue Task", type: "daily" },
        ];

        // Mock isOverdue to return true for task 2
        (isOverdue as unknown as { mockImplementation: (fn: (task: { id: string }) => boolean) => void }).mockImplementation((task: { id: string }) => task.id === "2");

        const { result } = renderHook(() => useTodayTasks());

        expect(result.current.incompleteToday).toHaveLength(1);
        expect(result.current.incompleteToday[0].id).toBe("1");
    });

    it("should handle filter toggles", () => {
        mockStoreState.tasks = [
            { id: "1", title: "Daily", type: "daily" },
            { id: "2", title: "Scheduled", type: "scheduled", completed: false },
            { id: "3", title: "Backlog", type: "backlog", completed: false, plannedDates: [Date.now()] },
        ];

        const { result } = renderHook(() => useTodayTasks());

        // Initially all included
        expect(result.current.incompleteToday).toHaveLength(3);

        // Turn off Daily filter
        act(() => {
            result.current.setFilterDaily(false);
        });
        expect(result.current.incompleteToday).toHaveLength(2);
        expect(result.current.incompleteToday.find(t => t.type === "daily")).toBeUndefined();

        // Turn off Scheduled filter
        act(() => {
            result.current.setFilterScheduled(false);
        });
        expect(result.current.incompleteToday).toHaveLength(1);
        expect(result.current.incompleteToday[0].type).toBe("backlog");

        // Reset filters
        act(() => {
            result.current.resetFilters();
        });
        expect(result.current.incompleteToday).toHaveLength(3);
    });

    it("should handle staggered loading state", () => {
        // Start with hydrating = true
        mockStoreState.hydrating = true;
        const { result, rerender } = renderHook(() => useTodayTasks());

        // Initially all loading
        expect(result.current.loading).toEqual({
            incomplete: true,
            dailyDone: true,
            scheduledDone: true,
            backlogDone: true,
        });

        // Finish hydration
        mockStoreState.hydrating = false;
        rerender();

        // Advance timers step by step

        // 100ms: incomplete done
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current.loading.incomplete).toBe(false);
        expect(result.current.loading.dailyDone).toBe(true);

        // 200ms: dailyDone done
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current.loading.dailyDone).toBe(false);
        expect(result.current.loading.scheduledDone).toBe(true);

        // 300ms: scheduledDone done
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current.loading.scheduledDone).toBe(false);
        expect(result.current.loading.backlogDone).toBe(true);

        // 400ms: backlogDone done
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current.loading.backlogDone).toBe(false);
    });
});

import { renderHook, act } from "@testing-library/react";
import { useTasksPage } from "../useTasksPage";
import { describe, it, expect, vi } from "vitest";

// Mock dependencies
vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(),
}));

// Mock store
const mockTasks = [
    { id: "1", title: "Daily Task", type: "daily", completed: false },
    { id: "2", title: "Backlog Task", type: "backlog", completed: false },
    { id: "3", title: "Scheduled Task", type: "scheduled", completed: false },
];

vi.mock("@/lib/store", () => ({
    useAppStore: (selector: (state: unknown) => unknown) => {
        const state = {
            tasks: mockTasks,
            hydrating: false,
        };
        return selector(state);
    },
}));

// Mock utils to simplify testing logic
vi.mock("@/lib/taskUtils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        isOverdue: () => false,
        isDailyDoneToday: () => false,
        isBacklogPlannedToday: () => false,
        isScheduledForToday: () => false,
    };
});

describe("useTasksPage", () => {
    it("should return all tasks by default", () => {
        const { result } = renderHook(() => useTasksPage());
        expect(result.current.filteredTasks).toHaveLength(3);
        expect(result.current.selectedType).toBe("all");
    });

    it("should filter by type", () => {
        const { result } = renderHook(() => useTasksPage());
        act(() => {
            result.current.setSelectedType("daily");
        });
        expect(result.current.filteredTasks).toHaveLength(1);
        expect(result.current.filteredTasks[0].title).toBe("Daily Task");
    });

    it("should filter by search query", () => {
        const { result } = renderHook(() => useTasksPage());
        act(() => {
            result.current.setSearchQuery("Backlog");
        });
        expect(result.current.filteredTasks).toHaveLength(1);
        expect(result.current.filteredTasks[0].title).toBe("Backlog Task");
    });

    it("should return correct counts", () => {
        const { result } = renderHook(() => useTasksPage());
        expect(result.current.taskCounts).toEqual({
            all: 3,
            daily: 1,
            backlog: 1,
            scheduled: 1,
        });
    });
});

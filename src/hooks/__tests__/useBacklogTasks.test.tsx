import { renderHook, act } from "@testing-library/react";
import { useBacklogTasks } from "../useBacklogTasks";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock store state
let mockStoreState = {
    tasks: [] as unknown[],
    milestones: [] as unknown[],
    hydrating: false,
};

vi.mock("@/lib/store", () => ({
    useAppStore: (selector: (state: unknown) => unknown) => selector(mockStoreState),
}));

describe("useBacklogTasks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreState = {
            tasks: [],
            milestones: [],
            hydrating: false,
        };
    });

    it("should separate incomplete and completed backlog tasks", () => {
        mockStoreState.tasks = [
            { id: "1", title: "Inc 1", type: "backlog", completed: false },
            { id: "2", title: "Com 1", type: "backlog", completed: true },
            { id: "3", title: "Daily", type: "daily", completed: false }, // Should be ignored
        ];

        const { result } = renderHook(() => useBacklogTasks());

        expect(result.current.totalInc).toBe(1);
        expect(result.current.incItems[0].title).toBe("Inc 1");
        expect(result.current.totalCom).toBe(1);
        expect(result.current.comItems[0].title).toBe("Com 1");
    });

    it("should handle pagination", () => {
        mockStoreState.tasks = Array.from({ length: 15 }, (_, i) => ({
            id: String(i),
            title: `Task ${i}`,
            type: "backlog",
            completed: false,
            plannedDates: [i], // for stable sort
        }));

        const { result } = renderHook(() => useBacklogTasks());

        // Default page size is 10
        expect(result.current.totalInc).toBe(15);
        expect(result.current.totalPagesInc).toBe(2);
        expect(result.current.incItems).toHaveLength(10);
        expect(result.current.incItems[0].title).toBe("Task 0");

        // Go to page 2
        act(() => {
            result.current.setPageInc(2);
        });
        expect(result.current.incItems).toHaveLength(5);
        expect(result.current.incItems[0].title).toBe("Task 10");

        // Change page size
        act(() => {
            result.current.setPageSizeInc(20);
            result.current.setPageInc(1);
        });
        expect(result.current.totalPagesInc).toBe(1);
        expect(result.current.incItems).toHaveLength(15);
    });

    it("should handle sorting", () => {
        mockStoreState.tasks = [
            { id: "1", title: "B", type: "backlog", completed: false, createdAt: 100 },
            { id: "2", title: "A", type: "backlog", completed: false, createdAt: 200 },
        ];

        const { result } = renderHook(() => useBacklogTasks());

        // Sort by title asc
        act(() => {
            result.current.setSortKeyInc("title");
            result.current.setSortAscInc(true);
        });
        expect(result.current.incItems[0].title).toBe("A");
        expect(result.current.incItems[1].title).toBe("B");

        // Sort by createdAt desc
        act(() => {
            result.current.setSortKeyInc("createdAt");
            result.current.setSortAscInc(false);
        });
        expect(result.current.incItems[0].title).toBe("A"); // 200
        expect(result.current.incItems[1].title).toBe("B"); // 100
    });

    it("should filter visibility", () => {
        const { result } = renderHook(() => useBacklogTasks());

        expect(result.current.showIncomplete).toBe(true);
        expect(result.current.showCompleted).toBe(true);

        act(() => {
            result.current.setShowIncomplete(false);
        });
        expect(result.current.showIncomplete).toBe(false);
    });
});

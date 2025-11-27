import { renderHook, act } from "@testing-library/react";
import { useScheduledTasks } from "../useScheduledTasks";
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

describe("useScheduledTasks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreState = {
            tasks: [],
            milestones: [],
            hydrating: false,
        };
    });

    it("should filter scheduled tasks", () => {
        mockStoreState.tasks = [
            { id: "1", title: "Scheduled 1", type: "scheduled" },
            { id: "2", title: "Daily 1", type: "daily" },
        ];

        const { result } = renderHook(() => useScheduledTasks());

        expect(result.current.total).toBe(1);
        expect(result.current.pageItems[0].title).toBe("Scheduled 1");
    });

    it("should handle status filtering", () => {
        mockStoreState.tasks = [
            { id: "1", title: "Done", type: "scheduled", completed: true },
            { id: "2", title: "Not Done", type: "scheduled", completed: false },
        ];

        const { result } = renderHook(() => useScheduledTasks());

        // Default all
        expect(result.current.total).toBe(2);

        // Filter completed
        act(() => {
            result.current.setFilterStatus("completed");
        });
        expect(result.current.total).toBe(1);
        expect(result.current.pageItems[0].title).toBe("Done");

        // Filter incomplete
        act(() => {
            result.current.setFilterStatus("incomplete");
        });
        expect(result.current.total).toBe(1);
        expect(result.current.pageItems[0].title).toBe("Not Done");
    });

    it("should handle pagination", () => {
        mockStoreState.tasks = Array.from({ length: 15 }, (_, i) => ({
            id: String(i),
            title: `Task ${i}`,
            type: "scheduled",
            completed: false,
            createdAt: i,
        }));

        const { result } = renderHook(() => useScheduledTasks());

        expect(result.current.total).toBe(15);
        expect(result.current.totalPages).toBe(2);
        expect(result.current.pageItems).toHaveLength(10);
        // Default sort is createdAt desc (implied by hook default state)
        // Task 14 (createdAt 14) should be first
        expect(result.current.pageItems[0].title).toBe("Task 14");

        // Go to page 2
        act(() => {
            result.current.setPage(2);
        });
        expect(result.current.pageItems).toHaveLength(5);
        expect(result.current.pageItems[0].title).toBe("Task 4");
    });
});

import { renderHook, act } from "@testing-library/react";
import { useDailyTasks } from "../useDailyTasks";
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

describe("useDailyTasks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreState = {
            tasks: [],
            milestones: [],
            hydrating: false,
        };
    });

    it("should filter daily tasks", () => {
        mockStoreState.tasks = [
            { id: "1", title: "Daily 1", type: "daily" },
            { id: "2", title: "Scheduled 1", type: "scheduled" },
        ];

        const { result } = renderHook(() => useDailyTasks());

        expect(result.current.total).toBe(1);
        expect(result.current.pageItems[0].title).toBe("Daily 1");
    });

    it("should handle status filtering", () => {
        mockStoreState.tasks = [
            { id: "1", title: "Done", type: "daily", completed: true },
            { id: "2", title: "Not Done", type: "daily", completed: false },
        ];

        const { result } = renderHook(() => useDailyTasks());

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
            type: "daily",
            completed: false,
            createdAt: i, // for stable sort
        }));

        const { result } = renderHook(() => useDailyTasks());

        // Default page size 10, sort createdAt desc (default in hook is false/desc? No, default is false/desc? Let's check hook code. default sortAsc is false. default sortKey is createdAt. So desc.)
        // Wait, hook default sortAsc is false.
        // createdAt desc means larger number first.
        // Task 14 has createdAt 14. Task 0 has createdAt 0.
        // So Task 14 should be first.

        expect(result.current.total).toBe(15);
        expect(result.current.totalPages).toBe(2);
        expect(result.current.pageItems).toHaveLength(10);
        expect(result.current.pageItems[0].title).toBe("Task 14");

        // Go to page 2
        act(() => {
            result.current.setPage(2);
        });
        expect(result.current.pageItems).toHaveLength(5);
        expect(result.current.pageItems[0].title).toBe("Task 4");
    });

    it("should handle sorting", () => {
        mockStoreState.tasks = [
            { id: "1", title: "B", type: "daily", createdAt: 100 },
            { id: "2", title: "A", type: "daily", createdAt: 200 },
        ];

        const { result } = renderHook(() => useDailyTasks());

        // Default: createdAt desc
        expect(result.current.pageItems[0].title).toBe("A");

        // Sort by title asc
        act(() => {
            result.current.setSortKey("title");
            result.current.setSortAsc(true);
        });
        expect(result.current.pageItems[0].title).toBe("A");
        expect(result.current.pageItems[1].title).toBe("B");
    });
});

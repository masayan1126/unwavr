import { renderHook, act } from "@testing-library/react";
import { useSettings } from "../useSettings";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockShowToast = vi.fn();
const mockConfirm = vi.fn();

vi.mock("@/components/Providers", () => ({
    useToast: () => ({ show: mockShowToast }),
    useConfirm: () => mockConfirm,
}));

// Mock store
const mockSetFontSize = vi.fn();
const mockClearAll = vi.fn();

vi.mock("@/lib/store", () => ({
    useAppStore: (selector: (state: unknown) => unknown) => {
        const state = {
            fontSize: 100,
            setFontSize: mockSetFontSize,
            clearTasksMilestonesLaunchers: mockClearAll,
        };
        return selector(state);
    },
}));

// We need to mock the store implementation slightly differently to allow updates if we were testing real store integration,
// but for unit testing the hook's interaction with the store, mocking the hook return is often enough.
// However, since useAppStore is a zustand hook, we might want to use the actual store or a mock that behaves like it.
// For simplicity in this unit test, let's stick to mocking the module if possible, or better, use the real store with a reset.
// But `useAppStore` is imported directly. Let's try to mock the module behavior more dynamically if needed.
// For now, let's assume the simple mock above works for the selector pattern used in the hook.

describe("useSettings", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return current font size", () => {
        const { result } = renderHook(() => useSettings());
        expect(result.current.fontSize).toBe(100);
    });

    it("should call setFontSize when setFontSize is called", () => {
        const { result } = renderHook(() => useSettings());
        act(() => {
            result.current.setFontSize(110);
        });
        expect(mockSetFontSize).toHaveBeenCalledWith(110);
    });

    it("should call clearAll and toast when handleClearAll is confirmed", async () => {
        mockConfirm.mockResolvedValue(true);
        const { result } = renderHook(() => useSettings());

        await act(async () => {
            await result.current.handleClearAll();
        });

        expect(mockConfirm).toHaveBeenCalled();
        expect(mockClearAll).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith("すべて削除しました", "success");
    });

    it("should NOT call clearAll when handleClearAll is cancelled", async () => {
        mockConfirm.mockResolvedValue(false);
        const { result } = renderHook(() => useSettings());

        await act(async () => {
            await result.current.handleClearAll();
        });

        expect(mockConfirm).toHaveBeenCalled();
        expect(mockClearAll).not.toHaveBeenCalled();
        expect(mockShowToast).not.toHaveBeenCalled();
    });
});

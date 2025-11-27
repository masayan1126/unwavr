import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { isDailyDoneToday, isBacklogPlannedToday, isScheduledForToday } from "../taskUtils";

describe("taskUtils", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("isDailyDoneToday", () => {
        it("should return true if done today (local)", () => {
            const today = new Date(2023, 10, 27); // Nov 27, 2023
            vi.setSystemTime(today);
            const doneDates = [today.getTime()];
            expect(isDailyDoneToday(doneDates)).toBe(true);
        });

        it("should return false if not done today", () => {
            const today = new Date(2023, 10, 27);
            vi.setSystemTime(today);
            const yesterday = new Date(2023, 10, 26).getTime();
            expect(isDailyDoneToday([yesterday])).toBe(false);
        });
    });

    describe("isBacklogPlannedToday", () => {
        it("should return true if planned for today", () => {
            const today = new Date(2023, 10, 27);
            vi.setSystemTime(today);
            const plannedDates = [today.getTime()];
            expect(isBacklogPlannedToday(plannedDates)).toBe(true);
        });
    });

    describe("isScheduledForToday", () => {
        it("should return true if day of week matches", () => {
            const today = new Date(2023, 10, 27); // Monday (1)
            vi.setSystemTime(today);
            expect(isScheduledForToday([1], [])).toBe(true);
        });

        it("should return false if day of week does not match", () => {
            const today = new Date(2023, 10, 27); // Monday (1)
            vi.setSystemTime(today);
            expect(isScheduledForToday([0, 2], [])).toBe(false);
        });
    });
});

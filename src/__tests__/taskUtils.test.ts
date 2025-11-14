import { getTodayUtc, isOverdue, getEarliestExecutionDate, htmlToMarkdown, getTodayDateInput, getTomorrowDateInput } from "@/lib/taskUtils";
import type { Task } from "@/lib/types";

function makeTask(partial: Partial<Task>): Task {
  return {
    id: partial.id ?? "t1",
    title: partial.title ?? "t",
    type: partial.type ?? "backlog",
    createdAt: partial.createdAt ?? Date.now(),
    completed: partial.completed ?? false,
    scheduled: partial.scheduled,
    plannedDates: partial.plannedDates,
    dailyDoneDates: partial.dailyDoneDates,
    description: partial.description,
    estimatedPomodoros: partial.estimatedPomodoros,
    completedPomodoros: partial.completedPomodoros,
    milestoneId: partial.milestoneId,
  };
}

describe("タスクユーティリティ taskUtils", () => {
  describe("getTodayUtc", () => {
    it("UTCの0時タイムスタンプを返す", () => {
      const t = getTodayUtc();
      const d = new Date(t);
      expect(d.getUTCHours()).toBe(0);
      expect(d.getUTCMinutes()).toBe(0);
      expect(d.getUTCSeconds()).toBe(0);
    });
  });

  describe("getTodayDateInput", () => {
    it("今日の日付をYYYY-MM-DDで返す", () => {
      const actual = getTodayDateInput();
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      expect(actual).toBe(expected);
    });
  });

  describe("getTomorrowDateInput", () => {
    it("明日の日付をYYYY-MM-DDで返す", () => {
      const actual = getTomorrowDateInput();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expected = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
      expect(actual).toBe(expected);
    });
  });

  describe("isOverdue", () => {
    it("daily は期限切れにならない", () => {
      const task = makeTask({ type: "daily" });
      expect(isOverdue(task, getTodayUtc())).toBe(false);
    });

    it("scheduled の期間が過去なら期限切れ", () => {
      const today = getTodayUtc();
      const yesterday = today - 24 * 60 * 60 * 1000;
      const twoDaysAgo = today - 2 * 24 * 60 * 60 * 1000;
      const task = makeTask({
        type: "scheduled",
        scheduled: { daysOfWeek: [], dateRanges: [{ start: twoDaysAgo, end: yesterday }] },
      });
      expect(isOverdue(task, today)).toBe(true);
    });

    it("backlog の plannedDates が過去なら期限切れ", () => {
      const today = getTodayUtc();
      const yesterday = today - 24 * 60 * 60 * 1000;
      const task = makeTask({ type: "backlog", plannedDates: [yesterday] });
      expect(isOverdue(task, today)).toBe(true);
    });

    it("completed は期限切れ扱いしない", () => {
      const today = getTodayUtc();
      const yesterday = today - 24 * 60 * 60 * 1000;
      const task = makeTask({ type: "backlog", plannedDates: [yesterday], completed: true });
      expect(isOverdue(task, today)).toBe(false);
    });
  });

  describe("getEarliestExecutionDate", () => {
    it("daily は null を返す", () => {
      const task = makeTask({ type: "daily" });
      expect(getEarliestExecutionDate(task)).toBeNull();
    });

    it("scheduled は dateRanges の最小 start を返す", () => {
      const now = Date.now();
      const task = makeTask({ type: "scheduled", scheduled: { daysOfWeek: [], dateRanges: [
        { start: now - 10, end: now + 10 },
        { start: now - 20, end: now - 15 },
      ] } });
      expect(getEarliestExecutionDate(task)).toBe(now - 20);
    });

    it("backlog は plannedDates の最小値を返す", () => {
      const now = getTodayUtc();
      const task = makeTask({ type: "backlog", plannedDates: [now, now - 86400000, now + 86400000] });
      expect(getEarliestExecutionDate(task)).toBe(now - 86400000);
    });
  });

  it("HTMLをMarkdownに変換できる", () => {
    const html = "<h1>見出し</h1><p>テキストと<a href='https://example.com'>リンク</a></p><ul><li>一</li><li>二</li></ul>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("# 見出し");
    expect(md).toContain("テキストと[リンク](https://example.com)");
    expect(md).toContain("- 一");
    expect(md).toContain("- 二");
  });
});



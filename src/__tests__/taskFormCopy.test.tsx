import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TaskForm from "@/components/TaskForm";
import type { Task } from "@/lib/types";
import { vi } from "vitest";

vi.mock("@/lib/store", () => {
  const actual = vi.importActual("@/lib/store");
  const state = {
    addTask: vi.fn().mockReturnValue("new-id"),
    updateTask: vi.fn(),
    milestones: [],
  };
  return {
    __esModule: true,
    ...actual,
    useAppStore: vi.fn((selector) => selector(state)),
  };
});

vi.mock("@/components/Providers", () => {
  return {
    __esModule: true,
    useToast: () => ({ show: vi.fn() }),
  };
});

describe("TaskFormの説明コピー", () => {
  it("説明をコピーできる", async () => {
    // @ts-expect-error - JSDOMでclipboardをモック
    navigator.clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const sampleTask: Task = {
      id: "t1",
      title: "テストタスク",
      description: "<p>説明テキスト</p>",
      type: "backlog",
      createdAt: Date.now(),
      plannedDates: [],
      completed: false,
      order: 0,
    };
    render(<TaskForm task={sampleTask} />);
    const editorLabel = screen.getByText("詳細");
    expect(editorLabel).toBeInTheDocument();
    const copyButtons = screen.getAllByRole("button", { name: "コピー" });
    fireEvent.click(copyButtons[0]);
    const item = await screen.findByRole("button", { name: "テキストでコピー" });
    fireEvent.click(item);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});



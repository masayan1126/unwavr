import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TaskForm from "@/components/TaskForm";
import type { Task } from "@/lib/types";

jest.mock("@/lib/store", () => {
  const actual = jest.requireActual("@/lib/store");
  const state = {
    addTask: jest.fn().mockReturnValue("new-id"),
    updateTask: jest.fn(),
    milestones: [],
  };
  return {
    __esModule: true,
    ...actual,
    useAppStore: jest.fn((selector) => selector(state)),
  };
});

jest.mock("@/components/Providers", () => {
  return {
    __esModule: true,
    useToast: () => ({ show: jest.fn() }),
  };
});

describe("TaskFormの説明コピー", () => {
  it("説明をコピーできる", async () => {
    // @ts-expect-error - JSDOMでclipboardをモック
    navigator.clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
    const sampleTask: Task = {
      id: "t1",
      title: "テストタスク",
      description: "<p>説明テキスト</p>",
      type: "backlog",
      createdAt: Date.now(),
      plannedDates: [],
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



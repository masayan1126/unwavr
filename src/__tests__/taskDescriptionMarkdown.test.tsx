import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TaskDetail from "@/components/TaskDetail";

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/store", () => {
  const actual = jest.requireActual("@/lib/store");
  const sampleTask = {
    id: "t1",
    title: "サンプル",
    description: "<h1>見出し</h1><ul><li>箇条書き</li></ul>",
    type: "daily",
    createdAt: Date.now(),
    plannedDates: [],
  };
  const state = {
    tasks: [sampleTask],
    milestones: [],
    pomodoro: { activeTaskId: undefined },
    toggleTask: jest.fn(),
    removeTask: jest.fn(),
    setActiveTask: jest.fn(),
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

describe("タスク詳細のリッチテキスト描画", () => {
  it("HTML見出しがレンダリングされる", () => {
    render(<TaskDetail taskId="t1" backHref="/" />);
    expect(screen.getByRole("heading", { name: "見出し" })).toBeInTheDocument();
  });

  it("説明をコピーボタンでクリップボードにコピーできる", async () => {
    // @ts-expect-error - JSDOM で clipboard をモック
    navigator.clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
    render(<TaskDetail taskId="t1" backHref="/" />);
    const btn = screen.getByRole("button", { name: "説明をコピー" });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});



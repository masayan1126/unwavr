import { render, screen } from "@testing-library/react";
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

describe("タスク説明のリッチテキスト描画", () => {
  it("HTML見出しがレンダリングされる", () => {
    render(<TaskDetail taskId="t1" backHref="/" />);
    expect(screen.getByRole("heading", { name: "見出し" })).toBeInTheDocument();
  });
});



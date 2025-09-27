import { useAppStore } from "@/lib/store";
import type { Task } from "@/lib/types";

const ACTIVE_STORAGE_KEY = "pomodoro:activeTaskId";

function createBaseTask(args: { id: string; completed: boolean }): Task {
  const now = Date.now();
  return {
    id: args.id,
    title: "テストタスク",
    type: "backlog",
    createdAt: now,
    completed: args.completed,
    plannedDates: [],
  };
}

function initializeActiveTaskState(args: { completed: boolean }): string {
  const taskId = `task-${args.completed ? "done" : "todo"}`;
  const task = createBaseTask({ id: taskId, completed: args.completed });
  useAppStore.setState((state) => ({
    tasks: [task],
    pomodoro: { ...state.pomodoro, activeTaskId: taskId },
  }));
  localStorage.setItem(ACTIVE_STORAGE_KEY, taskId);
  return taskId;
}

beforeEach(() => {
  (global.fetch as unknown as jest.Mock) = jest.fn(() => Promise.resolve({ ok: true }));
  localStorage.clear();
  useAppStore.setState((state) => ({
    tasks: [],
    pomodoro: { ...state.pomodoro, activeTaskId: undefined },
  }));
});

afterEach(() => {
  (global.fetch as jest.Mock).mockClear();
  localStorage.clear();
  useAppStore.setState((state) => ({
    tasks: [],
    pomodoro: { ...state.pomodoro, activeTaskId: undefined },
  }));
});

describe("着手中タスク完了時の自動解除", () => {
  it("単体の完了トグルで着手中が解除される", () => {
    const taskId = initializeActiveTaskState({ completed: false });

    useAppStore.getState().toggleTask(taskId);

    const state = useAppStore.getState();
    expect(state.tasks[0]?.completed).toBe(true);
    expect(state.pomodoro.activeTaskId).toBeUndefined();
    expect(localStorage.getItem(ACTIVE_STORAGE_KEY)).toBeNull();
  });

  it("一括完了処理で着手中が解除される", () => {
    const taskId = initializeActiveTaskState({ completed: false });

    useAppStore.getState().completeTasks([taskId]);

    const state = useAppStore.getState();
    expect(state.tasks[0]?.completed).toBe(true);
    expect(state.pomodoro.activeTaskId).toBeUndefined();
    expect(localStorage.getItem(ACTIVE_STORAGE_KEY)).toBeNull();
  });
});



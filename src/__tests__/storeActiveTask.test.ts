import { useAppStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { vi } from "vitest";

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
    order: 0,
  };
}

function initializeActiveTaskState(args: { completed: boolean }): string {
  const taskId = `task-${args.completed ? "done" : "todo"}`;
  const task = createBaseTask({ id: taskId, completed: args.completed });
  useAppStore.setState((state) => ({
    tasks: [task],
    pomodoro: { ...state.pomodoro, activeTaskId: taskId, activeTaskIds: [taskId] },
  }));
  localStorage.setItem(ACTIVE_STORAGE_KEY, taskId);
  return taskId;
}

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as unknown as typeof fetch;

  // Mock localStorage
  const storage: Record<string, string> = {};
  global.localStorage = {
    getItem: vi.fn((key) => storage[key] || null),
    setItem: vi.fn((key, value) => { storage[key] = value; }),
    removeItem: vi.fn((key) => { delete storage[key]; }),
    clear: vi.fn(() => { for (const key in storage) delete storage[key]; }),
    key: vi.fn(),
    length: 0,
  } as unknown as Storage;

  useAppStore.setState((state) => ({
    tasks: [],
    pomodoro: { ...state.pomodoro, activeTaskId: undefined, activeTaskIds: [] },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAppStore.setState((state) => ({
    tasks: [],
    pomodoro: { ...state.pomodoro, activeTaskId: undefined, activeTaskIds: [] },
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



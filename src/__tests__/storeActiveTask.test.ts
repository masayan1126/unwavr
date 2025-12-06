import { useAppStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { vi } from "vitest";

const ACTIVE_STORAGE_KEY = "pomodoro:activeTaskId";
const POMODORO_SETTINGS_STORAGE_KEY = "pomodoro:settings";
const POMODORO_STATE_STORAGE_KEY = "pomodoro:state";

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

let storage: Record<string, string> = {};

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as unknown as typeof fetch;

  // Mock localStorage
  storage = {};
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

describe("ポモドーロ設定・状態の永続化", () => {
  it("設定変更時にlocalStorageに保存される", () => {
    useAppStore.getState().setPomodoroSettings({
      workDurationSec: 30 * 60,
      shortBreakSec: 10 * 60,
    });

    const savedSettings = JSON.parse(storage[POMODORO_SETTINGS_STORAGE_KEY] || "{}");
    expect(savedSettings.workDurationSec).toBe(30 * 60);
    expect(savedSettings.shortBreakSec).toBe(10 * 60);
  });

  it("タイマー開始時に状態が保存される", () => {
    useAppStore.getState().startPomodoro(false);

    const savedState = JSON.parse(storage[POMODORO_STATE_STORAGE_KEY] || "{}");
    expect(savedState.isRunning).toBe(true);
    expect(savedState.isBreak).toBe(false);
    expect(typeof savedState.lastTickAtMs).toBe("number");
  });

  it("タイマー停止時に状態が保存される", () => {
    useAppStore.getState().startPomodoro(false);
    useAppStore.getState().stopPomodoro();

    const savedState = JSON.parse(storage[POMODORO_STATE_STORAGE_KEY] || "{}");
    expect(savedState.isRunning).toBe(false);
  });

  it("リセット時に状態が保存される", () => {
    useAppStore.getState().startPomodoro(false);
    useAppStore.getState().resetPomodoro();

    const savedState = JSON.parse(storage[POMODORO_STATE_STORAGE_KEY] || "{}");
    expect(savedState.isRunning).toBe(false);
    expect(savedState.isBreak).toBe(false);
    expect(savedState.completedWorkSessions).toBe(0);
  });
});

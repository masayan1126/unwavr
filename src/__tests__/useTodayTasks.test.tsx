import { renderHook, act } from '@testing-library/react';
import { useTodayTasks } from '@/hooks/useTodayTasks';
import { useAppStore } from '@/lib/store';
import type { AppState } from '@/lib/store';

// Minimal task shape for tests
type MinimalTask = {
  id: string;
  title: string;
  type: 'daily' | 'scheduled' | 'backlog';
  createdAt: number;
  completed: boolean;
  plannedDates?: number[];
  scheduled?: { daysOfWeek: number[]; dateRanges: { start: number; end: number }[] };
};

function setTasks(tasks: MinimalTask[]) {
  const { getState, setState } = (useAppStore as unknown as {
    getState: () => AppState;
    setState: (s: AppState | Partial<AppState>) => void;
  });
  const currentState = getState();
  setState({ ...currentState, tasks });
}

describe('今日のタスク用フック useTodayTasks', () => {
  it('毎日/曜日指定/今日に計画したバックログが含まれ、期限切れは除外される', () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const withinToday = start + 60 * 60 * 1000; // 今日の1:00
    const yesterday = start - 60 * 60 * 1000; // 昨日の23:00（期限切れ扱い）
    setTasks([
      { id: '1', title: 'daily', type: 'daily', createdAt: Date.now(), completed: false },
      { id: '2', title: 'scheduled by dow', type: 'scheduled', createdAt: Date.now(), completed: false, scheduled: { daysOfWeek: [today.getDay()], dateRanges: [] } },
      { id: '3', title: 'backlog planned today', type: 'backlog', createdAt: Date.now(), completed: false, plannedDates: [withinToday] },
      { id: '4', title: 'backlog overdue', type: 'backlog', createdAt: Date.now(), completed: false, plannedDates: [yesterday] },
    ]);

    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.incompleteToday.length).toBeGreaterThanOrEqual(3);
    expect(result.current.incompleteToday.find(t => t.title === 'backlog overdue')).toBeUndefined();

    act(() => result.current.setFilterDaily(false));
    expect(result.current.incompleteToday.find(t => t.type === 'daily')).toBeUndefined();
  });
});



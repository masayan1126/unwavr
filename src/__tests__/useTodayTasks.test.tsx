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
  it('毎日/曜日指定/今日に計画したバックログが含まれる', () => {
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    setTasks([
      { id: '1', title: 'daily', type: 'daily', createdAt: Date.now(), completed: false },
      { id: '2', title: 'scheduled by dow', type: 'scheduled', createdAt: Date.now(), completed: false, scheduled: { daysOfWeek: [today.getDay()], dateRanges: [] } },
      { id: '3', title: 'backlog planned', type: 'backlog', createdAt: Date.now(), completed: false, plannedDates: [todayUtc] },
    ]);

    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.incompleteToday.length).toBeGreaterThanOrEqual(3);

    act(() => result.current.setFilterDaily(false));
    expect(result.current.incompleteToday.find(t => t.type === 'daily')).toBeUndefined();
  });
});



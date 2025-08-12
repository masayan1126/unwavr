import { renderHook, act } from '@testing-library/react';
import { useTodayTasks } from '@/hooks/useTodayTasks';
import { useAppStore } from '@/lib/store';

function setTasks(tasks: any[]) {
  const { getState, setState } = (useAppStore as any);
  const s = getState();
  setState({ ...s, tasks });
}

describe('useTodayTasks', () => {
  it('filters daily and scheduled and backlog planned for today', () => {
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
    expect(result.current.incompleteToday.find(t => (t as any).type === 'daily')).toBeUndefined();
  });
});



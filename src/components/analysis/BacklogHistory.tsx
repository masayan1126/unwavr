import React from 'react';
import { Task } from '@/lib/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface BacklogHistoryProps {
    tasks: Task[];
}

export function BacklogHistory({ tasks }: BacklogHistoryProps) {
    // Filter completed backlog tasks (and maybe scheduled ones that were done?)
    // User asked: "backlog candidate tasks... what kind of things were done... analysis info"

    // Sort by completedAt descending
    const history = React.useMemo(() => {
        return tasks
            .filter(t => t.type === 'backlog' && t.completed && t.completedAt)
            .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    }, [tasks]);

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium opacity-70">積み上げタスク完了履歴</h3>
            {history.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 text-center border rounded-md border-dashed">
                    完了した積み上げタスクはまだありません。
                </div>
            ) : (
                <div className="space-y-2">
                    {history.map(task => (
                        <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md bg-card/50 hover:bg-card/80 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{task.title}</div>
                                {task.description && <div className="text-xs text-muted-foreground truncate">{task.description}</div>}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap mt-2 sm:mt-0 sm:ml-4">
                                {task.completedAt ? format(task.completedAt, 'yyyy/MM/dd (E) HH:mm', { locale: ja }) : '-'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

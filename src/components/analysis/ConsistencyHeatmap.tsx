import React, { useMemo, useState } from 'react';
import { Task } from '@/lib/types';

interface ConsistencyHeatmapProps {
    tasks: Task[];
    range?: '1m' | '3m' | '6m' | '1y';
}

export function ConsistencyHeatmap({ tasks, range = '3m' }: ConsistencyHeatmapProps) {
    // Only care about Daily and Scheduled tasks for consistency
    const targetTasks = useMemo(() => tasks.filter(t => t.type === 'daily' || t.type === 'scheduled'), [tasks]);

    const daysToShow = useMemo(() => {
        switch (range) {
            case '1m': return 30;
            case '3m': return 90;
            case '6m': return 180;
            case '1y': return 365;
            default: return 90;
        }
    }, [range]);

    // Generate dates
    const dates = useMemo(() => {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        const result = [];
        for (let i = 0; i < daysToShow; i++) {
            result.push(new Date(d.getTime() - i * 86400000));
        }
        return result.reverse(); // Oldest first
    }, [daysToShow]);

    // Calculate completion metrics per day
    // Map<timestamp, { total: number, completed: number }>
    const stats = useMemo(() => {
        const map = new Map<number, { total: number, completed: number }>();

        targetTasks.forEach(task => {
            // For daily tasks, assuming they are "expected" every day
            // For scheduled tasks, they are "expected" on specific days
            // We need to calculate availability for each day in range.

            dates.forEach(date => {
                const ts = date.getTime();
                let isExpected = false;

                if (task.type === 'daily') {
                    // Daily tasks are expected every day (unless archived before? Simplification: count all active dailies)
                    // If archived, check archivedAt.
                    if (task.archived && task.archivedAt && task.archivedAt < ts) {
                        isExpected = false;
                    } else if (task.createdAt > ts + 86400000) {
                        // Task created after this day
                        isExpected = false;
                    } else {
                        isExpected = true;
                    }
                } else if (task.type === 'scheduled') {
                    // Check if scheduled for this day
                    const dow = date.getDay();
                    if (task.scheduled?.daysOfWeek?.includes(dow)) {
                        // Same archiving/creation check
                        if (task.archived && task.archivedAt && task.archivedAt < ts) {
                            isExpected = false;
                        } else if (task.createdAt > ts + 86400000) {
                            isExpected = false;
                        } else {
                            isExpected = true;
                        }
                    }
                }

                if (isExpected) {
                    const current = map.get(ts) || { total: 0, completed: 0 };
                    current.total += 1;

                    if (task.dailyDoneDates?.includes(ts)) {
                        current.completed += 1;
                    }
                    map.set(ts, current);
                }
            });
        });

        return map;
    }, [targetTasks, dates]);

    // Render Grid
    // We'll use a simple flex wrap or grid layout
    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
                {dates.map(date => {
                    const ts = date.getTime();
                    const stat = stats.get(ts);
                    const percentage = stat && stat.total > 0 ? stat.completed / stat.total : 0;

                    // Color scale
                    let colorClass = 'bg-secondary/30';
                    if (stat && stat.total > 0) {
                        if (percentage === 0) colorClass = 'bg-secondary/50';
                        else if (percentage < 0.4) colorClass = 'bg-emerald-500/30';
                        else if (percentage < 0.7) colorClass = 'bg-emerald-500/60';
                        else if (percentage < 1) colorClass = 'bg-emerald-500/80';
                        else colorClass = 'bg-emerald-500';
                    } else {
                        // No tasks expected
                        colorClass = 'bg-transparent border border-dashed border-border/30';
                    }

                    return (
                        <div
                            key={ts}
                            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-[2px] ${colorClass}`}
                            title={`${date.toLocaleDateString()}: ${stat?.completed ?? 0}/${stat?.total ?? 0} (${Math.round(percentage * 100)}%)`}
                        />
                    );
                })}
            </div>
            <div className="mt-2 text-xs flex gap-4">
                <span>Total Days: {daysToShow}</span>
                <span>Average Consistency: {Math.round(Array.from(stats.values()).reduce((acc, curr) => acc + (curr.total > 0 ? curr.completed / curr.total : 0), 0) / (stats.size || 1) * 100)}%</span>
            </div>
        </div>
    );
}

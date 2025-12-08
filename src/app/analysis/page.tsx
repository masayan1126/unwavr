"use client";
import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ConsistencyHeatmap } from '@/components/analysis/ConsistencyHeatmap';
import { CompletionStats } from '@/components/analysis/CompletionStats';
import { BacklogHistory } from '@/components/analysis/BacklogHistory';

type Range = '1m' | '3m' | '6m' | '1y';

export default function AnalysisPage() {
    const tasks = useAppStore((s) => s.tasks);
    const [range, setRange] = useState<Range>('3m');

    return (
        <div className="flex-1 overflow-auto bg-background text-foreground h-screen">
            <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
                <header>
                    <h1 className="text-2xl font-bold mb-2">Analysis</h1>
                    <p className="text-muted-foreground text-sm">
                        毎日の積み上げとタスク完了状況の分析
                    </p>
                </header>

                <div className="flex items-center gap-2 p-1 bg-secondary/30 rounded-lg w-fit">
                    {(['1m', '3m', '6m', '1y'] as Range[]).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${range === r
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                        >
                            {r === '1m' ? '1ヶ月' : r === '3m' ? '3ヶ月' : r === '6m' ? '半年' : '1年'}
                        </button>
                    ))}
                </div>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                        継続の一貫性 (Daily & Scheduled)
                    </h2>
                    <div className="p-4 border rounded-xl bg-card">
                        <ConsistencyHeatmap tasks={tasks} range={range} />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="w-1 h-5 bg-blue-500 rounded-full" />
                        完了タスク数推移
                    </h2>
                    <div className="p-4 border rounded-xl bg-card">
                        <CompletionStats tasks={tasks} range={range} />
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            ※ 指定期間内に完了したタスクの数（日次・特定曜日・積み上げ含む）
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="w-1 h-5 bg-purple-500 rounded-full" />
                        積み上げ履歴 (Backlog Completed)
                    </h2>
                    <div className="p-4 border rounded-xl bg-card">
                        <BacklogHistory tasks={tasks} />
                    </div>
                </section>
            </div>
        </div>
    );
}

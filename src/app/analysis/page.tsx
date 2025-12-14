"use client";
import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ConsistencyHeatmap } from '@/components/analysis/ConsistencyHeatmap';
import { CompletionStats } from '@/components/analysis/CompletionStats';
import { BacklogHistory } from '@/components/analysis/BacklogHistory';
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { H2, Text } from "@/components/ui/Typography";

type Range = '1m' | '3m' | '6m' | '1y';

export default function AnalysisPage() {
    const tasks = useAppStore((s) => s.tasks);
    const [range, setRange] = useState<Range>('3m');

    return (
        <PageLayout maxWidth="lg">
            <PageHeader title="Analysis" />
            <Text className="text-muted-foreground -mt-2">
                毎日の積み上げとタスク完了状況の分析
            </Text>

            <div className="flex items-center gap-2 p-1 bg-secondary/30 rounded-lg w-fit">
                {(['1m', '3m', '6m', '1y'] as Range[]).map((r) => (
                    <Button
                        key={r}
                        onClick={() => setRange(r)}
                        variant={range === r ? "primary" : "ghost"}
                        size="sm"
                    >
                        {r === '1m' ? '1ヶ月' : r === '3m' ? '3ヶ月' : r === '6m' ? '半年' : '1年'}
                    </Button>
                ))}
            </div>

            <section className="space-y-4">
                <H2 className="flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                    継続の一貫性 (Daily & Scheduled)
                </H2>
                <Card padding="md">
                    <ConsistencyHeatmap tasks={tasks} range={range} />
                </Card>
            </section>

            <section className="space-y-4">
                <H2 className="flex items-center gap-2">
                    <span className="w-1 h-5 bg-blue-500 rounded-full" />
                    完了タスク数推移
                </H2>
                <Card padding="md">
                    <CompletionStats tasks={tasks} range={range} />
                    <Text className="text-xs text-muted-foreground mt-4 text-center">
                        ※ 指定期間内に完了したタスクの数（日次・特定曜日・積み上げ含む）
                    </Text>
                </Card>
            </section>

            <section className="space-y-4">
                <H2 className="flex items-center gap-2">
                    <span className="w-1 h-5 bg-purple-500 rounded-full" />
                    積み上げ履歴 (Backlog Completed)
                </H2>
                <Card padding="md">
                    <BacklogHistory tasks={tasks} />
                </Card>
            </section>
        </PageLayout>
    );
}

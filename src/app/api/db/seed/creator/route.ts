import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createTaskId, createMilestoneId } from '@/lib/types';

export async function POST() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const now = Date.now();
  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);
  const todayUtc = startOfUtcDay.getTime();

  const dailyTitles = [
    '撮影準備（機材チェック/バッテリー充電）',
    'コメント返信 / コミュニティ対応',
    'ネタリサーチ（YouTube/TikTok 20分）',
    '台本ブラッシュアップ 20分',
  ];

  const scheduledTitles: Array<{ title: string; daysOfWeek: number[] }> = [
    { title: '撮影日', daysOfWeek: [6] }, // 土
    { title: '編集日', daysOfWeek: [0, 2] }, // 日/火
    { title: '公開/サムネ調整', daysOfWeek: [3] }, // 水
  ];

  const backlogTitles = [
    'サムネ案 10 個スケッチ',
    'B ロールのストック撮影',
    '効果音/音楽のライブラリ整理',
    'ショート動画の再編集（縦型最適化）',
    'スポンサー用メディアキット更新',
  ];

  const dailyTasks = dailyTitles.map((title, i) => ({
    id: createTaskId(),
    title,
    type: 'daily' as const,
    createdAt: now - (i + 1) * 1000,
    completed: false,
    estimatedPomodoros: (i % 3),
    user_id: userId,
  }));

  const scheduledTasks = scheduledTitles.map((s, i) => ({
    id: createTaskId(),
    title: s.title,
    type: 'scheduled' as const,
    createdAt: now - (i + 1) * 1000,
    completed: false,
    scheduled: { daysOfWeek: s.daysOfWeek },
    estimatedPomodoros: 1 + (i % 2),
    user_id: userId,
  }));

  const backlogTasks = backlogTitles.map((title, i) => ({
    id: createTaskId(),
    title,
    type: 'backlog' as const,
    createdAt: now - (i + 1) * 2000,
    completed: false,
    plannedDates: i % 2 === 0 ? [todayUtc] : undefined,
    estimatedPomodoros: (i % 4),
    user_id: userId,
  }));

  const tasksPayload = [...dailyTasks, ...scheduledTasks, ...backlogTasks];
  const tasksRes = await supabaseAdmin.from('tasks').insert(tasksPayload);
  if (tasksRes.error) return NextResponse.json({ error: tasksRes.error.message }, { status: 500 });

  const milestonesPayload = [
    { id: createMilestoneId(), title: '今月 8 本公開', targetUnits: 8, currentUnits: 0, user_id: userId },
    { id: createMilestoneId(), title: '登録者 +1,000', targetUnits: 1000, currentUnits: 0, user_id: userId },
  ];
  const mRes = await supabaseAdmin.from('milestones').insert(milestonesPayload);
  if (mRes.error) return NextResponse.json({ error: mRes.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: { tasks: tasksPayload.length, milestones: milestonesPayload.length } });
}



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
    'デザインレビュー（PR/画面）',
    'Figma コンポーネント整理',
    'デザインシステムのドキュメント更新',
    'インスピレーション収集（Dribbble / Behance 15分）',
    'スケッチでアイデア出し 15分',
  ];

  const scheduledTitles: Array<{ title: string; daysOfWeek: number[] }> = [
    { title: '週次 UI 棚卸し', daysOfWeek: [5] }, // 金
    { title: 'アクセシビリティ軽監査', daysOfWeek: [2] }, // 火
    { title: 'ユーザーテスト観察ノート作成', daysOfWeek: [4] }, // 木
  ];

  const backlogTitles = [
    'LP ヒーローセクションの再設計（コピー/ビジュアル）',
    'ボタン/入力のステート設計（hover/active/disabled）',
    '空状態（Empty state）イラスト作成',
    'モーション仕様策定（ページ遷移/フィードバック）',
    'Figma 変数導入とトークン整理',
    'カラーパレット/アクセシビリティの見直し',
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
    { id: createMilestoneId(), title: 'デザインシステム v1 完了', targetUnits: 1, currentUnits: 0, user_id: userId },
    { id: createMilestoneId(), title: '主要画面のアクセシビリティ AA 準拠', targetUnits: 1, currentUnits: 0, user_id: userId },
  ];
  const mRes = await supabaseAdmin.from('milestones').insert(milestonesPayload);
  if (mRes.error) return NextResponse.json({ error: mRes.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: { tasks: tasksPayload.length, milestones: milestonesPayload.length } });
}



import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createTaskId, createMilestoneId } from '@/lib/types';

type ArrayElement<T> = T extends Array<infer U> ? U : never;

export async function POST() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const now = Date.now();
  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);
  const todayUtc = startOfUtcDay.getTime();

  const createCategoryId = (): string => `cat_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  const createShortcutId = (): string => `sct_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

  // tasks
  const dailyTitles = [
    'デイリースタンドアップ参加',
    'PR レビュー（最低1件）',
    'メール/Slackの未読整理（Inbox Zero）',
    '学習: 公式ドキュメント30分',
    '技術ブログ1記事読む'
  ];
  const scheduledTitles: Array<{ title: string; daysOfWeek: number[] }> = [
    { title: '週次レトロスペクティブの準備', daysOfWeek: [4] },
    { title: 'チームテックトーク参加', daysOfWeek: [2] },
    { title: 'ライブラリアップデート確認', daysOfWeek: [1, 3] },
  ];
  const backlogTitles = [
    'ストーリーポイント見直しと見積もりリファインメント',
    'エラーハンドリング方針のドキュメント化',
    '監視メトリクス追加（p95, p99 レイテンシ）',
    'E2E テストのカバレッジ拡大',
    'パフォーマンスプロファイリングと改善案作成',
    'API スキーマのバージョニング戦略検討',
    'アクセシビリティ改善（キーボード操作/コントラスト）',
    'CI/CD 高速化（並列化/キャッシュ最適化）',
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

  // milestones
  const milestonesPayload = [
    { id: createMilestoneId(), title: 'TypeScript 上級: 公式ハンドブック読破', targetUnits: 30, currentUnits: 0, dueDate: now + 1000 * 60 * 60 * 24 * 30, user_id: userId },
    { id: createMilestoneId(), title: 'E2E テスト 50 本作成', targetUnits: 50, currentUnits: 5, user_id: userId },
    { id: createMilestoneId(), title: 'パフォーマンス改善: p95 300ms 達成', targetUnits: 1, currentUnits: 0, user_id: userId },
  ];
  const mRes = await supabaseAdmin.from('milestones').insert(milestonesPayload);
  if (mRes.error) return NextResponse.json({ error: mRes.error.message }, { status: 500 });

  // launchers
  const categoriesSeed = [
    { id: createCategoryId(), name: '開発', color: '#3b82f6', user_id: userId },
    { id: createCategoryId(), name: 'ドキュメント', color: '#10b981', user_id: userId },
    { id: createCategoryId(), name: 'コミュニケーション', color: '#8b5cf6', user_id: userId },
    { id: createCategoryId(), name: 'ツール', color: '#f59e0b', user_id: userId },
  ];
  const catInsert = await supabaseAdmin.from('launcher_categories').insert(categoriesSeed).select('*');
  if (catInsert.error) return NextResponse.json({ error: catInsert.error.message }, { status: 500 });
  const categories = (catInsert.data ?? categoriesSeed) as Array<{ id: string; name: string }>;
  const getCatId = (name: string): string | undefined => (categories.find((c) => c.name === name) ?? categoriesSeed.find((c) => c.name === name))?.id;

  const shortcutsSeed = [
    { label: 'GitHub', url: 'https://github.com', iconName: 'Github', color: '#000000', category: '開発' },
    { label: 'StackOverflow', url: 'https://stackoverflow.com', iconName: 'MessageSquare', color: '#f48024', category: '開発' },
    { label: 'MDN', url: 'https://developer.mozilla.org', iconName: 'BookOpen', color: '#000000', category: 'ドキュメント' },
    { label: 'Notion', url: 'https://www.notion.so', iconName: 'NotebookPen', color: '#000000', category: 'ドキュメント' },
    { label: 'Slack', url: 'slack://open', iconName: 'MessageCircle', color: '#611f69', category: 'コミュニケーション', kind: 'app' },
    { label: 'Zoom', url: 'zoommtg://', iconName: 'Video', color: '#0B5CFF', category: 'コミュニケーション', kind: 'app' },
    { label: 'Jira', url: 'https://yourcompany.atlassian.net', iconName: 'Kanban', color: '#2684FF', category: 'ツール' },
    { label: 'Sentry', url: 'https://sentry.io', iconName: 'AlertTriangle', color: '#362D59', category: 'ツール' },
  ];
  const shortcutsPayload = shortcutsSeed.map((s) => ({
    id: createShortcutId(),
    label: s.label,
    url: s.url,
    iconName: s.iconName,
    color: s.color,
    kind: (s as { kind?: 'web' | 'app' }).kind ?? 'web',
    categoryId: getCatId(s.category),
    user_id: userId,
  }));
  const scRes = await supabaseAdmin.from('launcher_shortcuts').insert(shortcutsPayload);
  if (scRes.error) return NextResponse.json({ error: scRes.error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    created: {
      tasks: tasksPayload.length,
      milestones: milestonesPayload.length,
      categories: categories.length,
      shortcuts: shortcutsPayload.length,
    },
  });
}



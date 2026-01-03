import { NextRequest, NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { checkResourceLimit, getResourceLimitMessage } from '@/lib/resourceLimits';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ items: [] });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const archived = req.nextUrl.searchParams.get('archived');
  const limitParam = req.nextUrl.searchParams.get('limit');
  const offsetParam = req.nextUrl.searchParams.get('offset');
  const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam) || 0)) : undefined;
  const offset = offsetParam ? Math.max(0, Number(offsetParam) || 0) : undefined;

  const selectOpts: { count?: 'exact' | 'planned' | 'estimated' } = {};
  if (limit != null) selectOpts.count = 'exact';
  let query = supabaseAdmin.from('tasks').select('*', selectOpts).eq('user_id', userId);
  if (archived === 'only') {
    query = query.eq('archived', true).order('archivedAt', { ascending: false, nullsFirst: false });
  } else if (archived === 'all') {
    // すべて返す（フィルタなし）
  } else {
    // デフォルト: アーカイブ除外（NULL/未設定は非アーカイブ扱い）
    query = query.or('archived.is.null,archived.eq.false');
  }
  if (limit != null) {
    const from = offset ?? 0;
    const to = from + limit - 1;
    query = query.range(from, to);
  }
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 後方互換性: milestoneId → milestoneIds への変換
  const normalizedData = (data ?? []).map((task: Record<string, unknown>) => {
    // milestoneIdsが未設定で、旧milestoneIdがある場合は変換
    if ((!task.milestoneIds || (Array.isArray(task.milestoneIds) && task.milestoneIds.length === 0)) && task.milestoneId) {
      return { ...task, milestoneIds: [task.milestoneId], milestoneId: undefined };
    }
    return task;
  });

  return NextResponse.json({ items: normalizedData, total: count ?? undefined });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // リソース制限チェック
  const limitCheck = await checkResourceLimit(userId, 'tasks');
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: 'limit_exceeded',
      message: getResourceLimitMessage(limitCheck),
      current: limitCheck.current,
      limit: limitCheck.limit,
      plan: limitCheck.plan,
    }, { status: 429 });
  }

  const raw = await req.json();
  // 最小限の必須カラムに限定し、undefinedは送らない
  const payload: Record<string, unknown> = {};
  const allow = [
    'id', 'title', 'type', 'createdAt', 'completed', 'completedPomodoros',
    'description', 'estimatedPomodoros', 'milestoneIds',
    'plannedDates', 'dailyDoneDates', 'scheduled', 'timeSlots',
    'plannedDateGoogleEvents', 'parentTaskId',
  ];
  for (const k of allow) {
    if (raw[k] !== undefined) payload[k] = raw[k];
  }
  if (payload.createdAt == null) payload.createdAt = Date.now();
  if (payload.completed == null) payload.completed = false;
  if (payload.completedPomodoros == null) payload.completedPomodoros = 0;
  if (payload.type !== 'daily' && payload.type !== 'scheduled' && payload.type !== 'backlog') {
    payload.type = 'backlog';
  }
  payload.user_id = userId;

  const { data, error } = await supabaseAdmin.from('tasks').insert(payload).select('*').single();
  if (error) {
    const err = error as PostgrestError;
    console.error('Supabase insert error (tasks):', { message: err.message, details: err.details, hint: err.hint, code: err.code });
    return NextResponse.json({ error: err.message, details: err.details, hint: err.hint, code: err.code }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}



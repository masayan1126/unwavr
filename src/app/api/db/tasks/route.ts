import { NextRequest, NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  if (!supabase) return NextResponse.json({ items: [] });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const raw = await req.json();
  // 最小限の必須カラムに限定し、undefinedは送らない
  const payload: Record<string, unknown> = {};
  const allow = [
    'id', 'title', 'type', 'createdAt', 'completed', 'completedPomodoros',
    'description', 'estimatedPomodoros', 'milestoneId',
    'plannedDates', 'dailyDoneDates', 'scheduled',
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

  const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();
  if (error) {
    const err = error as PostgrestError;
    console.error('Supabase insert error (tasks):', { message: err.message, details: err.details, hint: err.hint, code: err.code });
    return NextResponse.json({ error: err.message, details: err.details, hint: err.hint, code: err.code }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}



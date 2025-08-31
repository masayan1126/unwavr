import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // 依存関係順序: 子→親の順に削除
  const ops: Array<Promise<unknown>> = [];
  // tasks
  ops.push(supabaseAdmin.from('tasks').delete().eq('user_id', userId));
  // launcher shortcuts then categories
  ops.push(supabaseAdmin.from('launcher_shortcuts').delete().eq('user_id', userId));
  ops.push(supabaseAdmin.from('launcher_categories').delete().eq('user_id', userId));
  // milestones
  ops.push(supabaseAdmin.from('milestones').delete().eq('user_id', userId));

  const results = await Promise.all(ops);
  type SupaResp = { error: { message: string } | null } | { error?: { message: string } | null } | null;
  const failed = (results as SupaResp[]).find((r) => r && (r as { error?: { message: string } | null }).error);
  if (failed && (failed as { error?: { message: string } | null }).error) {
    const err = (failed as { error?: { message: string } | null }).error;
    return NextResponse.json({ error: err?.message || 'unknown error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}



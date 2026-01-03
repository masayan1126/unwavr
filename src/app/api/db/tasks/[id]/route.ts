import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(_: Request, ctx: unknown) {
  if (!supabaseAdmin) return NextResponse.json({ item: null });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .or('archived.is.null,archived.eq.false')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: Request, ctx: unknown) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const body = await req.json();
  // undefinedをnullに変換（parentTaskIdなどの明示的なクリアに対応）
  const sanitizedBody = Object.fromEntries(
    Object.entries(body).map(([k, v]) => [k, v === undefined ? null : v])
  );
  const { data, error } = await supabaseAdmin.from('tasks').update(sanitizedBody).eq('id', id).eq('user_id', userId).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'task not found' }, { status: 404 });
  return NextResponse.json({ item: data });
}

export async function DELETE(_: Request, ctx: unknown) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id).eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}



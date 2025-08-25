import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(_: Request, ctx: unknown) {
  if (!supabase) return NextResponse.json({ item: null });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { params } = await (ctx as Promise<{ params: { id: string } }>);
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .or('archived.is.null,archived.eq.false')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: Request, ctx: unknown) {
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { params } = await (ctx as Promise<{ params: { id: string } }>);
  const body = await req.json();
  const { data, error } = await supabase.from('tasks').update(body).eq('id', params.id).eq('user_id', userId).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(_: Request, ctx: unknown) {
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { params } = await (ctx as Promise<{ params: { id: string } }>);
  const { error } = await supabase.from('tasks').delete().eq('id', params.id).eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}



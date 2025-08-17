import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(_: Request, ctx: unknown) {
  if (!supabase) return NextResponse.json({ item: null });
  const { params } = ctx as { params: { id: string } };
  const { data, error } = await supabase.from('tasks').select('*').eq('id', params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: Request, ctx: unknown) {
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const { params } = ctx as { params: { id: string } };
  const body = await req.json();
  const { data, error } = await supabase.from('tasks').update(body).eq('id', params.id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(_: Request, ctx: unknown) {
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const { params } = ctx as { params: { id: string } };
  const { error } = await supabase.from('tasks').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}



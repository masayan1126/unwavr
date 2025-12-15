import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function DELETE(_: Request, ctx: unknown) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { error } = await supabaseAdmin.from('bgm_tracks').delete().eq('id', id).eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}



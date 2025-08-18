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
  const { data, error } = await supabase.from('milestones').select('*').eq('user_id', userId);
  if (error) {
    const err = error as PostgrestError;
    return NextResponse.json({ error: err.message, details: err.details, hint: err.hint, code: err.code }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const payload = { ...body, user_id: userId } as Record<string, unknown>;
  const { data, error } = await supabase.from('milestones').insert(payload).select('*').single();
  if (error) {
    const err = error as PostgrestError;
    return NextResponse.json({ error: err.message, details: err.details, hint: err.hint, code: err.code }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}



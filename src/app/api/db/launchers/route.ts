import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  if (!supabase) return NextResponse.json({ categories: [], shortcuts: [] });
  const { data: categories, error: catErr } = await supabase.from('launcher_categories').select('*');
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });
  const { data: shortcuts, error: scErr } = await supabase.from('launcher_shortcuts').select('*');
  if (scErr) return NextResponse.json({ error: scErr.message }, { status: 500 });
  return NextResponse.json({ categories: categories ?? [], shortcuts: shortcuts ?? [] });
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const body = await req.json();
  const { categories, shortcuts } = body as { categories?: unknown[]; shortcuts?: unknown[] };
  if (categories) {
    const { error } = await supabase.from('launcher_categories').insert(categories);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (shortcuts) {
    const { error } = await supabase.from('launcher_shortcuts').insert(shortcuts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}



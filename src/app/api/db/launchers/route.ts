import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { checkResourceLimit, getResourceLimitMessage } from '@/lib/resourceLimits';

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ categories: [], shortcuts: [] });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: categories, error: catErr } = await supabaseAdmin.from('launcher_categories').select('*').eq('user_id', userId);
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });
  const { data: shortcuts, error: scErr } = await supabaseAdmin.from('launcher_shortcuts').select('*').eq('user_id', userId);
  if (scErr) return NextResponse.json({ error: scErr.message }, { status: 500 });
  return NextResponse.json({ categories: categories ?? [], shortcuts: shortcuts ?? [] });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const { categories, shortcuts } = body as { categories?: Record<string, unknown>[]; shortcuts?: Record<string, unknown>[] };

  // カテゴリ追加の制限チェック
  if (categories && categories.length > 0) {
    const limitCheck = await checkResourceLimit(userId, 'launcherCategories', categories.length);
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: 'limit_exceeded',
        message: getResourceLimitMessage(limitCheck),
        current: limitCheck.current,
        limit: limitCheck.limit,
        plan: limitCheck.plan,
      }, { status: 429 });
    }

    const payload = categories.map((c) => ({ ...c, user_id: userId }));
    const { error } = await supabaseAdmin.from('launcher_categories').insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ショートカット追加の制限チェック
  if (shortcuts && shortcuts.length > 0) {
    const limitCheck = await checkResourceLimit(userId, 'launcherShortcuts', shortcuts.length);
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: 'limit_exceeded',
        message: getResourceLimitMessage(limitCheck),
        current: limitCheck.current,
        limit: limitCheck.limit,
        plan: limitCheck.plan,
      }, { status: 429 });
    }

    const payload = shortcuts.map((s) => ({ ...s, user_id: userId }));
    const { error } = await supabaseAdmin.from('launcher_shortcuts').insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}



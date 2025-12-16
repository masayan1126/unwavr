import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { checkResourceLimit, getResourceLimitMessage } from '@/lib/resourceLimits';

type JsonObject = Record<string, unknown>;

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ groups: [], tracks: [] });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: groups, error: gErr } = await supabaseAdmin
    .from('bgm_groups')
    .select('*')
    .eq('user_id', userId);
  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });

  const { data: tracks, error: tErr } = await supabaseAdmin
    .from('bgm_tracks')
    .select('*')
    .eq('user_id', userId)
    .order('createdAt', { ascending: true, nullsFirst: true });
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  return NextResponse.json({ groups: groups ?? [], tracks: tracks ?? [] });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json()) as { groups?: JsonObject[]; tracks?: JsonObject[] };

  // グループ追加の制限チェック
  if (Array.isArray(body.groups) && body.groups.length > 0) {
    const limitCheck = await checkResourceLimit(userId, 'bgmGroups', body.groups.length);
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: 'limit_exceeded',
        message: getResourceLimitMessage(limitCheck),
        current: limitCheck.current,
        limit: limitCheck.limit,
        plan: limitCheck.plan,
      }, { status: 429 });
    }

    const allowed = ['id', 'name', 'color', 'parentId'];
    const payload = body.groups.map((g) => {
      const row: JsonObject = { user_id: userId };
      for (const k of allowed) if (g[k] !== undefined) row[k] = g[k];
      return row;
    });
    const { error } = await supabaseAdmin.from('bgm_groups').insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // トラック追加の制限チェック
  if (Array.isArray(body.tracks) && body.tracks.length > 0) {
    const limitCheck = await checkResourceLimit(userId, 'bgmTracks', body.tracks.length);
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: 'limit_exceeded',
        message: getResourceLimitMessage(limitCheck),
        current: limitCheck.current,
        limit: limitCheck.limit,
        plan: limitCheck.plan,
      }, { status: 429 });
    }

    const allowed = ['id', 'videoId', 'title', 'url', 'createdAt', 'groupId'];
    const payload = body.tracks.map((t) => {
      const row: JsonObject = { user_id: userId };
      for (const k of allowed) if (t[k] !== undefined) row[k] = t[k];
      return row;
    });
    const { error } = await supabaseAdmin.from('bgm_tracks').insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}



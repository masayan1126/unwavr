import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

// 毎日00:00(UTC)に「daily」タスクの当日フラグをリセット
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined;
  const secret = process.env.CRON_SECRET;
  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  // UTCの「今日」の0時タイムスタンプ
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const todayUtc = now.getTime();

  // dailyタスクの今日分(dailyDoneDatesにtodayUtcが含まれている)を削除
  // SupabaseのJSONB配列更新: サーバ側で行うため、シンプルに全dailyを取得し更新する
  const { data: tasks, error: fetchError } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('type', 'daily')
    .or('archived.is.null,archived.eq.false');

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let updated = 0;
  for (const t of tasks ?? []) {
    const arr: number[] = Array.isArray(t.dailyDoneDates) ? [...t.dailyDoneDates] : [];
    const idx = arr.indexOf(todayUtc);
    if (idx >= 0) {
      arr.splice(idx, 1);
      await supabaseAdmin
        .from('tasks')
        .update({ dailyDoneDates: arr })
        .eq('id', t.id);
      updated++;
    }
  }

  return NextResponse.json({ ok: true, updated });
}



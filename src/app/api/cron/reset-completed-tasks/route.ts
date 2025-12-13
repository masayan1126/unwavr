import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

/**
 * 指定されたタイムゾーンでの「今日」に対応する可能性のあるUTCタイムスタンプを取得
 * フロントエンドがUTC基準で保存している可能性があるため、両方のパターンを返す
 * @param timezone IANAタイムゾーン名（例: 'Asia/Tokyo', 'UTC'）
 * @returns 検索対象となるタイムスタンプの配列
 */
function getTodayTimestamps(timezone: string): number[] {
    const now = new Date();
    const timestamps: number[] = [];

    // 1. UTCの今日0時（フロントエンドがUTC基準で保存している場合）
    const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    timestamps.push(utcMidnight);

    // 2. 指定タイムゾーンでの今日0時をUTCタイムスタンプに変換
    if (timezone !== 'UTC') {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        const parts = formatter.formatToParts(now);
        const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
        const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
        const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');

        // そのタイムゾーンの0時をUTCタイムスタンプに変換
        const offsetFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'longOffset',
        });
        const offsetParts = offsetFormatter.formatToParts(now);
        const offsetStr = offsetParts.find(p => p.type === 'timeZoneName')?.value || 'GMT';

        const offsetMatch = offsetStr.match(/GMT([+-])(\d{2}):(\d{2})/);
        let offsetMinutes = 0;
        if (offsetMatch) {
            const sign = offsetMatch[1] === '+' ? 1 : -1;
            const hours = parseInt(offsetMatch[2]);
            const minutes = parseInt(offsetMatch[3]);
            offsetMinutes = sign * (hours * 60 + minutes);
        }

        const tzMidnightUtc = Date.UTC(year, month, day, 0, 0, 0, 0) - offsetMinutes * 60 * 1000;
        if (!timestamps.includes(tzMidnightUtc)) {
            timestamps.push(tzMidnightUtc);
        }
    }

    // 3. ローカル時間での0時（setHours(0,0,0,0)パターン）
    // フロントエンドがローカル時間で保存している場合
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (!timestamps.includes(localMidnight)) {
        timestamps.push(localMidnight);
    }

    return timestamps;
}

/**
 * 毎日タスク（daily）と特定曜日タスク（scheduled）の完了状態をリセットするエンドポイント
 * - dailyタスク: dailyDoneDatesから今日の日付を削除
 * - scheduledタスク: completedをfalseに、dailyDoneDatesから今日の日付を削除
 * 
 * クエリパラメータ:
 * - timezone: IANAタイムゾーン名（例: 'Asia/Tokyo'）。指定しない場合はUTC
 * 
 * 外部から定期実行（cron, launchd等）で呼び出すことを想定
 */
export async function POST(req: NextRequest) {
    // 認証（既存のdaily-resetと同様）
    const auth = req.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined;
    const secret = process.env.CRON_SECRET;

    // CRON_SECRETが設定されている場合のみ認証を要求
    if (secret && token !== secret) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'not configured' }, { status: 500 });
    }

    // タイムゾーンパラメータを取得（デフォルトはUTC）
    const timezone = req.nextUrl.searchParams.get('timezone') || 'UTC';

    // 今日に該当する可能性のあるタイムスタンプを取得
    let todayTimestamps: number[];
    try {
        todayTimestamps = getTodayTimestamps(timezone);
    } catch {
        return NextResponse.json({
            error: 'invalid timezone',
            message: `Invalid timezone: ${timezone}. Use IANA timezone names like 'Asia/Tokyo' or 'UTC'`
        }, { status: 400 });
    }

    console.log(`[reset-completed-tasks] Using timezone: ${timezone}`);
    console.log(`[reset-completed-tasks] Searching for timestamps: ${todayTimestamps.map(t => new Date(t).toISOString()).join(', ')}`);

    // 1. Daily タスクのリセット
    // dailyDoneDatesから今日の日付を削除することで「未完了」状態に戻す
    let dailyUpdated = 0;
    const { data: dailyTasks, error: dailyError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('type', 'daily')
        .or('archived.is.null,archived.eq.false');

    if (dailyError) {
        console.error('[reset-completed-tasks] Failed to fetch daily tasks:', dailyError.message);
    }

    if (!dailyError && dailyTasks) {
        for (const t of dailyTasks) {
            const arr: number[] = Array.isArray(t.dailyDoneDates) ? [...t.dailyDoneDates] : [];
            let modified = false;

            // 今日に該当する可能性のあるすべてのタイムスタンプを検索して削除
            for (const ts of todayTimestamps) {
                const idx = arr.indexOf(ts);
                if (idx >= 0) {
                    arr.splice(idx, 1);
                    modified = true;
                }
            }

            if (modified) {
                const { error: updateError } = await supabaseAdmin
                    .from('tasks')
                    .update({ dailyDoneDates: arr })
                    .eq('id', t.id);
                if (updateError) {
                    console.error(`[reset-completed-tasks] Failed to update daily task ${t.id}:`, updateError.message);
                } else {
                    dailyUpdated++;
                }
            }
        }
    }

    // 2. Scheduled タスクのリセット
    // completedをfalseに、dailyDoneDatesから今日の日付を削除
    let scheduledUpdated = 0;
    const { data: scheduledTasks, error: scheduledError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('type', 'scheduled')
        .or('archived.is.null,archived.eq.false');

    if (scheduledError) {
        console.error('[reset-completed-tasks] Failed to fetch scheduled tasks:', scheduledError.message);
    }

    if (!scheduledError && scheduledTasks) {
        for (const t of scheduledTasks) {
            const arr: number[] = Array.isArray(t.dailyDoneDates) ? [...t.dailyDoneDates] : [];
            let modified = false;

            // 今日に該当する可能性のあるすべてのタイムスタンプを検索して削除
            for (const ts of todayTimestamps) {
                const idx = arr.indexOf(ts);
                if (idx >= 0) {
                    arr.splice(idx, 1);
                    modified = true;
                }
            }

            const needsReset = t.completed === true || modified;

            if (needsReset) {
                const { error: updateError } = await supabaseAdmin
                    .from('tasks')
                    .update({
                        completed: false,
                        dailyDoneDates: arr
                    })
                    .eq('id', t.id);
                if (updateError) {
                    console.error(`[reset-completed-tasks] Failed to update scheduled task ${t.id}:`, updateError.message);
                } else {
                    scheduledUpdated++;
                }
            }
        }
    }

    console.log(`[reset-completed-tasks] Reset completed. Daily: ${dailyUpdated}, Scheduled: ${scheduledUpdated}`);

    return NextResponse.json({
        ok: true,
        dailyUpdated,
        scheduledUpdated,
        timezone,
        searchedTimestamps: todayTimestamps.map(t => new Date(t).toISOString()),
        timestamp: new Date().toISOString()
    });
}

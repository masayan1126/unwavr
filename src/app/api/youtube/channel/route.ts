import { NextRequest, NextResponse } from 'next/server';

type YouTubeSearchItem = {
  id: { kind: string; videoId?: string; channelId?: string };
  snippet?: { title?: string };
};

export async function GET(req: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  const handle = req.nextUrl.searchParams.get('handle') ?? undefined;
  const channelIdParam = req.nextUrl.searchParams.get('channelId') ?? undefined;
  const maxParam = parseInt(req.nextUrl.searchParams.get('max') ?? '100', 10);
  const max = Number.isFinite(maxParam) ? Math.max(1, Math.min(500, maxParam)) : 100;
  const excludeShorts = (req.nextUrl.searchParams.get('excludeShorts') ?? '1') !== '0';

  let channelId = channelIdParam;
  try {
    if (!channelId) {
      if (!handle) return NextResponse.json({ error: 'missing handle or channelId' }, { status: 400 });
      // Resolve handle to channel via search (approximate)
      const q = encodeURIComponent(handle.replace(/^@/, ''));
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${q}&key=${apiKey}`);
      const searchJson: { items?: YouTubeSearchItem[] } = await searchRes.json();
      const ch = searchJson.items?.[0]?.id?.channelId;
      if (!ch) return NextResponse.json({ error: 'channel_not_found' }, { status: 404 });
      channelId = ch;
    }

    const items: Array<{ videoId: string; title: string; url: string }> = [];
    let pageToken: string | undefined = undefined;
    while (items.length < max) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('order', 'date');
      url.searchParams.set('channelId', channelId!);
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('key', apiKey);
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const res = await fetch(url.toString());
      const json: { items?: YouTubeSearchItem[]; nextPageToken?: string } = await res.json();
      const batch = (json.items ?? [])
        .map((it) => {
          const vid = it.id?.videoId;
          const title = it.snippet?.title ?? '';
          return vid ? { videoId: vid, title, url: `https://www.youtube.com/watch?v=${vid}` } : undefined;
        })
        .filter(Boolean) as Array<{ videoId: string; title: string; url: string }>;
      for (const it of batch) {
        if (items.length >= max) break;
        items.push(it);
      }
      if (!json.nextPageToken || batch.length === 0) break;
      pageToken = json.nextPageToken;
    }
    // 1. 収集重複排除
    const uniqueMap = new Map<string, { videoId: string; title: string; url: string }>();
    for (const it of items) uniqueMap.set(it.videoId, it);
    let list = Array.from(uniqueMap.values());
    // 2. shorts 除外（近似: 60秒未満の動画を除外）
    if (excludeShorts && list.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < list.length; i += 50) chunks.push(list.slice(i, i + 50).map((x) => x.videoId));
      const keepSet = new Set<string>();
      for (const ids of chunks) {
        const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids.join(',')}&key=${apiKey}`);
        const vJson = await vRes.json() as { items?: Array<{ id: string; contentDetails?: { duration?: string } }> };
        for (const v of vJson.items ?? []) {
          const dur = v.contentDetails?.duration ?? 'PT0S';
          const sec = iso8601DurationToSeconds(dur);
          if (sec >= 60) keepSet.add(v.id);
        }
      }
      list = list.filter((x) => keepSet.has(x.videoId));
    }
    return NextResponse.json({ channelId, items: list });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'fetch_failed', message: msg }, { status: 500 });
  }
}

function iso8601DurationToSeconds(dur: string): number {
  // Simple ISO8601 duration parser for YouTube formats like PT3M20S
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(dur);
  if (!m) return 0;
  const h = parseInt(m[1] ?? '0', 10);
  const mi = parseInt(m[2] ?? '0', 10);
  const s = parseInt(m[3] ?? '0', 10);
  return h * 3600 + mi * 60 + s;
}



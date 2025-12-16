import { NextRequest, NextResponse } from 'next/server';

type YouTubeSearchItem = {
  id: { kind: string; videoId?: string };
  snippet?: { title?: string; thumbnails?: { medium?: { url?: string } } };
};

export async function GET(req: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'not configured' }, { status: 400 });

  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'missing query parameter' }, { status: 400 });

  const maxParam = parseInt(req.nextUrl.searchParams.get('maxResults') ?? '5', 10);
  const maxResults = Number.isFinite(maxParam) ? Math.max(1, Math.min(10, maxParam)) : 5;
  const excludeShorts = (req.nextUrl.searchParams.get('excludeShorts') ?? '1') !== '0';

  try {
    // Fetch more than needed to account for shorts filtering
    const fetchCount = excludeShorts ? Math.min(maxResults * 3, 25) : maxResults;

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('q', query);
    url.searchParams.set('maxResults', String(fetchCount));
    url.searchParams.set('key', apiKey);
    url.searchParams.set('videoDuration', 'medium'); // Filter out very short videos

    const res = await fetch(url.toString());
    const json: { items?: YouTubeSearchItem[] } = await res.json();

    let items = (json.items ?? [])
      .map((it) => {
        const videoId = it.id?.videoId;
        const title = it.snippet?.title ?? '';
        const thumbnail = it.snippet?.thumbnails?.medium?.url ?? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        return videoId ? { videoId, title, thumbnail, duration: 0 } : undefined;
      })
      .filter(Boolean) as Array<{ videoId: string; title: string; thumbnail: string; duration: number }>;

    // Get video durations to filter shorts and provide duration info
    if (items.length > 0) {
      const ids = items.map((x) => x.videoId).join(',');
      const vRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${apiKey}`
      );
      const vJson = (await vRes.json()) as {
        items?: Array<{ id: string; contentDetails?: { duration?: string } }>;
      };

      const durationMap = new Map<string, number>();
      for (const v of vJson.items ?? []) {
        const dur = v.contentDetails?.duration ?? 'PT0S';
        const sec = iso8601DurationToSeconds(dur);
        durationMap.set(v.id, sec);
      }

      // Update durations and filter shorts (< 60 seconds)
      items = items
        .map((item) => ({
          ...item,
          duration: durationMap.get(item.videoId) ?? 0,
        }))
        .filter((item) => !excludeShorts || item.duration >= 60)
        .slice(0, maxResults);
    }

    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'fetch_failed', message: msg }, { status: 500 });
  }
}

function iso8601DurationToSeconds(dur: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(dur);
  if (!m) return 0;
  const h = parseInt(m[1] ?? '0', 10);
  const mi = parseInt(m[2] ?? '0', 10);
  const s = parseInt(m[3] ?? '0', 10);
  return h * 3600 + mi * 60 + s;
}

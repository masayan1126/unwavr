import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inputUrl = searchParams.get("url");
  const id = searchParams.get("id");
  const targetUrl = inputUrl || (id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : null);
  if (!targetUrl) return NextResponse.json({ error: "missing url or id" }, { status: 400 });
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ error: text || "oembed fetch failed" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({
      title: data?.title ?? null,
      author_name: data?.author_name ?? null,
      author_url: data?.author_url ?? null,
      thumbnail_url: data?.thumbnail_url ?? null,
      provider_name: data?.provider_name ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}



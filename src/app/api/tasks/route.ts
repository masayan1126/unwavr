import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // 1. タスクリスト取得
  const listsRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const listsData = await listsRes.json();
  if (!listsRes.ok) return NextResponse.json(listsData, { status: listsRes.status });
  const lists = (listsData.items ?? []) as Array<{ id: string; title: string }>;
  const out: Array<Record<string, unknown>> = [];
  for (const l of lists) {
    const itemsRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(l.id)}/tasks?showCompleted=false&showDeleted=false&maxResults=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const itemsData = await itemsRes.json();
    const items = (itemsData.items ?? []).map((t: unknown) => ({ ...(t as object), _list: l }));
    out.push(...items);
  }
  return NextResponse.json({ items: out });
}



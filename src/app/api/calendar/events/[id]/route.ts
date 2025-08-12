import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ error: data }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await req.json();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: res.status });
  }
  return NextResponse.json(data);
}



import { NextRequest, NextResponse } from "next/server";

async function fetchGoogle<T>(path: string, init: RequestInit) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, init);
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: res.status });
  }
  return NextResponse.json(data as T);
}

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin") ?? new Date(Date.now() - 7 * 86400000).toISOString();
  const timeMax = searchParams.get("timeMax") ?? new Date(Date.now() + 30 * 86400000).toISOString();
  const calendarId = searchParams.get("calendarId") ?? "primary";
  return fetchGoogle(`/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

export async function POST(req: NextRequest) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const calendarId = "primary";
  return fetchGoogle(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}



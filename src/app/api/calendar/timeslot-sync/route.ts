import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// timeSlotをGoogleカレンダーに作成
export async function POST(req: NextRequest) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { taskTitle, taskDescription, date, startTime, endTime } = body as {
    taskTitle: string;
    taskDescription?: string;
    date: number; // UTC 0時のタイムスタンプ
    startTime: string; // "09:00" 形式
    endTime: string; // "10:30" 形式
  };

  if (!taskTitle || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  // UTC日付からローカル日付文字列を生成
  const dateObj = new Date(date);
  const dateStr = format(dateObj, "yyyy-MM-dd");

  // Google Calendar APIのイベント形式に変換
  // タイムゾーンはユーザーのローカル（Asia/Tokyo）を想定
  const eventBody = {
    summary: `📋 ${taskTitle}`,
    description: taskDescription || undefined,
    start: {
      dateTime: `${dateStr}T${startTime}:00`,
      timeZone: "Asia/Tokyo",
    },
    end: {
      dateTime: `${dateStr}T${endTime}:00`,
      timeZone: "Asia/Tokyo",
    },
  };

  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventBody),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: res.status });
  }

  return NextResponse.json({
    success: true,
    googleEventId: data.id,
    event: data,
  });
}

// timeSlotの更新をGoogleカレンダーに同期
export async function PATCH(req: NextRequest) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { googleEventId, taskTitle, taskDescription, date, startTime, endTime } = body as {
    googleEventId: string;
    taskTitle?: string;
    taskDescription?: string;
    date?: number;
    startTime?: string;
    endTime?: string;
  };

  if (!googleEventId) {
    return NextResponse.json({ error: "missing googleEventId" }, { status: 400 });
  }

  // 更新用のボディを構築
  const updateBody: Record<string, unknown> = {};

  if (taskTitle) {
    updateBody.summary = `📋 ${taskTitle}`;
  }
  if (taskDescription !== undefined) {
    updateBody.description = taskDescription || undefined;
  }
  if (date && startTime && endTime) {
    const dateObj = new Date(date);
    const dateStr = format(dateObj, "yyyy-MM-dd");
    updateBody.start = {
      dateTime: `${dateStr}T${startTime}:00`,
      timeZone: "Asia/Tokyo",
    };
    updateBody.end = {
      dateTime: `${dateStr}T${endTime}:00`,
      timeZone: "Asia/Tokyo",
    };
  }

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateBody),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: res.status });
  }

  return NextResponse.json({
    success: true,
    event: data,
  });
}

// timeSlotをGoogleカレンダーから削除
export async function DELETE(req: NextRequest) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const googleEventId = searchParams.get("googleEventId");

  if (!googleEventId) {
    return NextResponse.json({ error: "missing googleEventId" }, { status: 400 });
  }

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ error: data }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}

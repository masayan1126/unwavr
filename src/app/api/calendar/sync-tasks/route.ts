import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { format } from "date-fns";

type SyncableTask = {
  id: string;
  title: string;
  plannedDates: number[];
};

// GET: 同期対象のタスク数を取得
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  try {
    // バックログタスクでplannedDatesが設定されているものを取得
    const { data: tasks, error } = await supabaseAdmin
      .from("tasks")
      .select("id, title, plannedDates")
      .eq("user_id", userId)
      .eq("type", "backlog")
      .eq("completed", false)
      .or("archived.is.null,archived.eq.false")
      .not("plannedDates", "is", null);

    if (error) {
      console.error("Task fetch error:", error);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    // plannedDatesが空でないタスクをフィルタリング
    const syncableTasks: SyncableTask[] = (tasks || [])
      .filter((t) => {
        const dates = t.plannedDates as number[] | null;
        return dates && dates.length > 0;
      })
      .map((t) => ({
        id: t.id,
        title: t.title,
        plannedDates: t.plannedDates as number[],
      }));

    // 合計の予定日数をカウント
    const totalDates = syncableTasks.reduce(
      (sum, t) => sum + t.plannedDates.length,
      0
    );

    return NextResponse.json({
      taskCount: syncableTasks.length,
      dateCount: totalDates,
      tasks: syncableTasks,
    });
  } catch (err) {
    console.error("Sync tasks count error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// POST: タスクをGoogleカレンダーに同期
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const accessToken = (session as unknown as { access_token?: string })?.access_token;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: "google_not_connected" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  try {
    // バックログタスクでplannedDatesが設定されているものを取得
    const { data: tasks, error } = await supabaseAdmin
      .from("tasks")
      .select("id, title, description, plannedDates")
      .eq("user_id", userId)
      .eq("type", "backlog")
      .eq("completed", false)
      .or("archived.is.null,archived.eq.false")
      .not("plannedDates", "is", null);

    if (error) {
      console.error("Task fetch error:", error);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    // plannedDatesが空でないタスクをフィルタリング
    const syncableTasks = (tasks || []).filter((t) => {
      const dates = t.plannedDates as number[] | null;
      return dates && dates.length > 0;
    });

    const results: { taskId: string; date: string; success: boolean; error?: string }[] = [];

    // 各タスクの各予定日に対してGoogleカレンダーにイベントを作成
    for (const task of syncableTasks) {
      const plannedDates = task.plannedDates as number[];

      for (const dateTs of plannedDates) {
        const date = new Date(dateTs);
        const dateStr = format(date, "yyyy-MM-dd");

        // 終日イベントとして作成
        const body = {
          summary: `📋 ${task.title}`,
          description: task.description || undefined,
          start: { date: dateStr },
          end: { date: dateStr },
        };

        try {
          const res = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            }
          );

          if (res.ok) {
            results.push({ taskId: task.id, date: dateStr, success: true });
          } else {
            const errData = await res.json();
            results.push({
              taskId: task.id,
              date: dateStr,
              success: false,
              error: errData.error?.message || "Unknown error",
            });
          }
        } catch (e) {
          results.push({
            taskId: task.id,
            date: dateStr,
            success: false,
            error: String(e),
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      synced: successCount,
      failed: failCount,
      results,
    });
  } catch (err) {
    console.error("Sync tasks error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

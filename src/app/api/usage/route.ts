import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { PlanType, PLAN_LIMITS } from "@/lib/types";

export type ResourceUsage = {
  key: string;
  label: string;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
};

export type UsageResponse = {
  plan: PlanType;
  planLabel: string;
  yearMonth: string;
  resources: ResourceUsage[];
};

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
    // ユーザーのプランを取得
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("plan")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("User fetch error:", userError);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    const plan = (userData?.plan as PlanType) || "free";
    const limits = PLAN_LIMITS[plan];
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 各リソースの現在数を取得
    const [
      tasksResult,
      milestonesResult,
      bgmTracksResult,
      bgmGroupsResult,
      launcherShortcutsResult,
      launcherCategoriesResult,
      aiUsageResult,
    ] = await Promise.all([
      supabaseAdmin.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabaseAdmin.from("milestones").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabaseAdmin.from("bgm_tracks").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabaseAdmin.from("bgm_groups").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabaseAdmin.from("launcher_shortcuts").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabaseAdmin.from("launcher_categories").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabaseAdmin
        .from("ai_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("year_month", yearMonth)
        .maybeSingle(),
    ]);

    const taskCount = tasksResult.count ?? 0;
    const milestoneCount = milestonesResult.count ?? 0;
    const bgmTrackCount = bgmTracksResult.count ?? 0;
    const bgmGroupCount = bgmGroupsResult.count ?? 0;
    const launcherShortcutCount = launcherShortcutsResult.count ?? 0;
    const launcherCategoryCount = launcherCategoriesResult.count ?? 0;
    const aiMessageCount = aiUsageResult.data?.message_count ?? 0;

    const createResource = (
      key: string,
      label: string,
      current: number,
      limit: number
    ): ResourceUsage => {
      const isUnlimited = limit === -1;
      const percentage = isUnlimited ? 0 : limit > 0 ? Math.round((current / limit) * 100) : 0;
      return { key, label, current, limit, percentage, isUnlimited };
    };

    const resources: ResourceUsage[] = [
      createResource("messages", "AIメッセージ（今月）", aiMessageCount, limits.messages),
      createResource("tasks", "タスク", taskCount, limits.tasks),
      createResource("milestones", "マイルストーン", milestoneCount, limits.milestones),
      createResource("bgmTracks", "BGMトラック", bgmTrackCount, limits.bgmTracks),
      createResource("bgmGroups", "BGMグループ", bgmGroupCount, limits.bgmGroups),
      createResource("launcherShortcuts", "ランチャー", launcherShortcutCount, limits.launcherShortcuts),
      createResource("launcherCategories", "カテゴリ", launcherCategoryCount, limits.launcherCategories),
    ];

    const response: UsageResponse = {
      plan,
      planLabel: limits.label,
      yearMonth,
      resources,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Usage fetch error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

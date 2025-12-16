import { supabaseAdmin } from "./supabaseClient";
import { PlanType, PLAN_LIMITS, PlanLimits } from "./types";

export type ResourceType = 'tasks' | 'milestones' | 'bgmTracks' | 'bgmGroups' | 'launcherShortcuts' | 'launcherCategories';

export type ResourceLimitCheckResult = {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanType;
  resource: ResourceType;
};

/**
 * ユーザーのプランを取得
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
  if (!supabaseAdmin) return "free";

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("plan")
      .eq("id", userId)
      .single();

    if (error || !data) return "free";
    return (data.plan as PlanType) || "free";
  } catch {
    return "free";
  }
}

/**
 * リソース数をカウント
 */
async function countResource(userId: string, resource: ResourceType): Promise<number> {
  if (!supabaseAdmin) return 0;

  try {
    let count = 0;

    switch (resource) {
      case "tasks": {
        const { count: c } = await supabaseAdmin
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("archived", false);
        count = c ?? 0;
        break;
      }
      case "milestones": {
        const { count: c } = await supabaseAdmin
          .from("milestones")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        count = c ?? 0;
        break;
      }
      case "bgmTracks": {
        const { count: c } = await supabaseAdmin
          .from("bgm_tracks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        count = c ?? 0;
        break;
      }
      case "bgmGroups": {
        const { count: c } = await supabaseAdmin
          .from("bgm_groups")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        count = c ?? 0;
        break;
      }
      case "launcherShortcuts": {
        const { count: c } = await supabaseAdmin
          .from("launcher_shortcuts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        count = c ?? 0;
        break;
      }
      case "launcherCategories": {
        const { count: c } = await supabaseAdmin
          .from("launcher_categories")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        count = c ?? 0;
        break;
      }
    }

    return count;
  } catch {
    return 0;
  }
}

/**
 * リソース追加が許可されているかチェック
 */
export async function checkResourceLimit(
  userId: string,
  resource: ResourceType,
  addCount: number = 1
): Promise<ResourceLimitCheckResult> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const limit = limits[resource];

  // 無制限（-1）の場合は常に許可
  if (limit === -1) {
    return {
      allowed: true,
      current: 0,
      limit: -1,
      plan,
      resource,
    };
  }

  const current = await countResource(userId, resource);

  return {
    allowed: current + addCount <= limit,
    current,
    limit,
    plan,
    resource,
  };
}

/**
 * リソース制限エラーレスポンス用のメッセージを生成
 */
export function getResourceLimitMessage(result: ResourceLimitCheckResult): string {
  const resourceNames: Record<ResourceType, string> = {
    tasks: "タスク",
    milestones: "マイルストーン",
    bgmTracks: "BGMトラック",
    bgmGroups: "BGMグループ",
    launcherShortcuts: "ランチャーショートカット",
    launcherCategories: "ランチャーカテゴリ",
  };

  const name = resourceNames[result.resource];
  return `${name}の上限（${result.limit}件）に達しました。プランをアップグレードしてください。`;
}

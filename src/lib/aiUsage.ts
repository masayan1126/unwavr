import { supabaseAdmin } from "./supabaseClient";
import { AIUsageCheckResult, AIUsage, PlanType, PLAN_LIMITS } from "./types";

/**
 * AI使用量をチェックし、許可されていればインクリメントする
 * DBの関数 check_and_increment_ai_usage を呼び出す
 */
export async function checkAndIncrementAIUsage(
  userId: string
): Promise<AIUsageCheckResult> {
  if (!supabaseAdmin) {
    // Supabaseが設定されていない場合はフォールバック
    return { allowed: true, current: 0, limit: 20, plan: "free" };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("check_and_increment_ai_usage", {
      p_user_id: userId,
      p_messages: 1,
    });

    if (error) {
      console.error("AI usage check error:", error);
      // エラー時はフォールバック（制限なし）
      return { allowed: true, current: 0, limit: 20, plan: "free" };
    }

    const result = data?.[0];
    if (!result) {
      return { allowed: true, current: 0, limit: 20, plan: "free" };
    }

    return {
      allowed: result.allowed,
      current: result.current_count,
      limit: result.limit_count,
      plan: (result.plan_name || "free") as PlanType,
    };
  } catch (err) {
    console.error("AI usage check exception:", err);
    return { allowed: true, current: 0, limit: 20, plan: "free" };
  }
}

/**
 * AI使用量を取得する（読み取り専用）
 */
export async function getAIUsage(userId: string): Promise<AIUsage> {
  if (!supabaseAdmin) {
    return {
      currentCount: 0,
      limitCount: PLAN_LIMITS.free.messages,
      plan: "free",
      yearMonth: new Date().toISOString().slice(0, 7),
    };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("get_ai_usage", {
      p_user_id: userId,
    });

    if (error) {
      console.error("AI usage get error:", error);
      return {
        currentCount: 0,
        limitCount: PLAN_LIMITS.free.messages,
        plan: "free",
        yearMonth: new Date().toISOString().slice(0, 7),
      };
    }

    const result = data?.[0];
    if (!result) {
      return {
        currentCount: 0,
        limitCount: PLAN_LIMITS.free.messages,
        plan: "free",
        yearMonth: new Date().toISOString().slice(0, 7),
      };
    }

    return {
      currentCount: result.current_count,
      limitCount: result.limit_count,
      plan: (result.plan_name || "free") as PlanType,
      yearMonth: result.year_month,
    };
  } catch (err) {
    console.error("AI usage get exception:", err);
    return {
      currentCount: 0,
      limitCount: PLAN_LIMITS.free.messages,
      plan: "free",
      yearMonth: new Date().toISOString().slice(0, 7),
    };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { PlanType } from "@/lib/types";

const PLAN_ORDER: PlanType[] = ["free", "personal", "pro"];

export async function POST(request: NextRequest) {
  // 認証チェック
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { targetPlan } = body as { targetPlan: PlanType };

    // ターゲットプランのバリデーション
    if (!targetPlan || !PLAN_ORDER.includes(targetPlan)) {
      return NextResponse.json(
        { error: "invalid_plan", message: "無効なプランです" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "db_error", message: "データベース接続エラー" },
        { status: 500 }
      );
    }

    // 現在のプランを取得
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("plan")
      .eq("id", userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { error: "db_error", message: "ユーザー情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    const currentPlan = (userData.plan as PlanType) || "free";
    const currentIndex = PLAN_ORDER.indexOf(currentPlan);
    const targetIndex = PLAN_ORDER.indexOf(targetPlan);

    // ダウングレードの確認（同じまたは上位プランへの変更は不可）
    if (targetIndex >= currentIndex) {
      return NextResponse.json(
        {
          error: "invalid_downgrade",
          message: "ダウングレードは下位プランへのみ可能です",
        },
        { status: 400 }
      );
    }

    // プランを更新
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        plan: targetPlan,
        plan_expires_at: null, // TODO: Stripe連携時に処理
      })
      .eq("id", userId);

    if (error) {
      console.error("Plan downgrade error:", error);
      return NextResponse.json(
        { error: "db_error", message: "プランの更新に失敗しました" },
        { status: 500 }
      );
    }

    const planLabels: Record<PlanType, string> = {
      free: "Free",
      personal: "Personal",
      pro: "Pro",
    };

    return NextResponse.json({
      success: true,
      plan: targetPlan,
      message: `${planLabels[targetPlan]}プランに変更しました`,
    });
  } catch (err) {
    console.error("Plan downgrade exception:", err);
    return NextResponse.json(
      { error: "server_error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

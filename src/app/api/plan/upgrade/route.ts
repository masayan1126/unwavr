import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { PlanType } from "@/lib/types";

// 秘密のアップグレードコード（環境変数から取得）
// 形式: UPGRADE_CODE_PERSONAL=123456, UPGRADE_CODE_PRO=789012
const UPGRADE_CODES: Record<string, PlanType> = {
  [process.env.UPGRADE_CODE_PERSONAL || "111111"]: "personal",
  [process.env.UPGRADE_CODE_PRO || "222222"]: "pro",
};

export async function POST(request: NextRequest) {
  // 認証チェック
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code } = body;

    // コードのバリデーション（数字のみ）
    if (!code || !/^\d+$/.test(code)) {
      return NextResponse.json(
        { error: "invalid_code", message: "コードは数字のみで入力してください" },
        { status: 400 }
      );
    }

    // コードに対応するプランを取得
    const targetPlan = UPGRADE_CODES[code];
    if (!targetPlan) {
      return NextResponse.json(
        { error: "invalid_code", message: "無効なコードです" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "db_error", message: "データベース接続エラー" },
        { status: 500 }
      );
    }

    // ユーザーのプランを更新
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        plan: targetPlan,
        plan_expires_at: null, // TODO: Stripe連携時に有効期限を設定
      })
      .eq("id", userId);

    if (error) {
      console.error("Plan upgrade error:", error);
      return NextResponse.json(
        { error: "db_error", message: "プランの更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: targetPlan,
      message: `${targetPlan === "pro" ? "Pro" : "Personal"}プランにアップグレードしました！`,
    });
  } catch (err) {
    console.error("Plan upgrade exception:", err);
    return NextResponse.json(
      { error: "server_error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getAIUsage } from "@/lib/aiUsage";
import { PLAN_LIMITS } from "@/lib/types";

export async function GET() {
  // 認証チェック
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const usage = await getAIUsage(userId);
  const planInfo = PLAN_LIMITS[usage.plan];

  return NextResponse.json({
    current: usage.currentCount,
    limit: usage.limitCount,
    remaining: Math.max(0, usage.limitCount - usage.currentCount),
    percentage: Math.round((usage.currentCount / usage.limitCount) * 100),
    plan: usage.plan,
    planLabel: planInfo.label,
    yearMonth: usage.yearMonth,
  });
}

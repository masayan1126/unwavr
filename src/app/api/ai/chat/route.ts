import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { checkAndIncrementAIUsage } from "@/lib/aiUsage";
import { PLAN_LIMITS } from "@/lib/types";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

// 簡易コマンド: 自然言語からサーバー側でタスクを作成
async function maybeHandleCommand(messages: ChatMessage[]): Promise<Response | null> {
  try {
    const last = messages[messages.length - 1]?.content ?? "";
    // 例: 「タスク作って」「～のタスク追加」などを雑に検出
    const m = last.match(/(?:タスク|task).*?(?:作成|追加)[:：]?\s*(.+)/i) || last.match(/^\s*todo[:：]?\s*(.+)/i);
    if (!m) return null;
    const title = m[1].trim().slice(0, 120) || "無題のタスク";
    // DBへPOST（既存のtasks APIを利用）
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/db/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 最小限の必須カラム
      body: JSON.stringify({ id: `tsk_${Math.random().toString(36).slice(2)}`, title, type: "backlog", createdAt: Date.now(), completed: false }),
    }).catch(() => {});
    return NextResponse.json({ reply: `タスク「${title}」を追加しました。` });
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "not configured" }, { status: 400 });

  // 認証チェック
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // AI使用量チェック（上限に達していたら拒否）
  const usageCheck = await checkAndIncrementAIUsage(userId);
  if (!usageCheck.allowed) {
    const planInfo = PLAN_LIMITS[usageCheck.plan];
    return NextResponse.json({
      error: "limit_exceeded",
      message: `月間上限（${usageCheck.limit}回）に達しました。プランをアップグレードしてください。`,
      current: usageCheck.current,
      limit: usageCheck.limit,
      plan: usageCheck.plan,
      planLabel: planInfo.label,
    }, { status: 429 });
  }

  let body: { messages: ChatMessage[]; system?: string; model?: string; max_tokens?: number; temperature?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const inputMessages = Array.isArray(body.messages) ? body.messages : [];
  if (inputMessages.length === 0) return NextResponse.json({ error: "empty_messages" }, { status: 400 });

  // 先に簡易コマンド（自然言語→タスク作成）を処理
  const handled = await maybeHandleCommand(inputMessages);
  if (handled) return handled;

  // Anthropic Messages API payload
  // デフォルトは安価なHaikuに設定（環境変数で上書き可）
  const model = body.model || process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const maxTokens = typeof body.max_tokens === "number" ? body.max_tokens : 1024;
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.7;
  const system = typeof body.system === "string" ? body.system : undefined;

  // Convert to Anthropic role format (system is separate; only user/assistant in messages)
  const anthropicMessages = inputMessages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content })) as { role: "user" | "assistant"; content: string }[];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: anthropicMessages,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const rawMsg = (data?.error?.message ?? data?.error ?? data?.message ?? "upstream_error").toString();
      const isBilling = res.status === 402 || /credit balance|payment required|billing|insufficient funds/i.test(rawMsg);
      if (isBilling) {
        // 開発用モックを許可
        if (process.env.AI_MOCK === "1") {
          return NextResponse.json({ reply: "[MOCK] クレジット残高が不足しています。請求設定を行うか、別モデル/プロバイダを使用してください。" });
        }
        return NextResponse.json({ error: "billing_required", message: rawMsg }, { status: 402 });
      }
      return NextResponse.json({ error: rawMsg }, { status: res.status });
    }
    // Anthropic returns content as array of blocks
    const text = Array.isArray(data?.content)
      ? data.content.map((b: { text?: string }) => b?.text ?? "").join("")
      : "";
    return NextResponse.json({ reply: text, raw: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



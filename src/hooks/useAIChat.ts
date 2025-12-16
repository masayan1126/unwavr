import { useState, useCallback } from "react";
import { PlanType, PLAN_LIMITS } from "@/lib/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AILimitError = {
  type: "limit_exceeded";
  message: string;
  current: number;
  limit: number;
  plan: PlanType;
  planLabel: string;
};

type AIError = {
  type: "error";
  message: string;
};

type AISuccess = {
  type: "success";
  reply: string;
};

type AIResult = AISuccess | AILimitError | AIError;

export function useAIChat() {
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState<AILimitError | null>(null);

  const sendMessage = useCallback(
    async (
      messages: ChatMessage[],
      options?: {
        system?: string;
        model?: string;
        maxTokens?: number;
        temperature?: number;
      }
    ): Promise<AIResult> => {
      setLoading(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            system: options?.system,
            model: options?.model,
            max_tokens: options?.maxTokens,
            temperature: options?.temperature,
          }),
        });

        const data = await res.json();

        // 上限到達エラー
        if (res.status === 429 && data.error === "limit_exceeded") {
          const limitError: AILimitError = {
            type: "limit_exceeded",
            message: data.message,
            current: data.current,
            limit: data.limit,
            plan: data.plan,
            planLabel: data.planLabel,
          };
          setLimitReached(true);
          setLimitInfo(limitError);
          return limitError;
        }

        // 認証エラー
        if (res.status === 401) {
          return {
            type: "error",
            message: "ログインが必要です",
          };
        }

        // その他のエラー
        if (!res.ok) {
          return {
            type: "error",
            message: data.error || data.message || "エラーが発生しました",
          };
        }

        // 成功
        return {
          type: "success",
          reply: data.reply,
        };
      } catch (err) {
        return {
          type: "error",
          message: err instanceof Error ? err.message : "ネットワークエラー",
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const resetLimitState = useCallback(() => {
    setLimitReached(false);
    setLimitInfo(null);
  }, []);

  return {
    sendMessage,
    loading,
    limitReached,
    limitInfo,
    resetLimitState,
  };
}

// エラーメッセージを生成するユーティリティ
export function getLimitReachedMessage(limitInfo: AILimitError): string {
  const nextPlan = getNextPlan(limitInfo.plan);
  if (nextPlan) {
    const nextPlanInfo = PLAN_LIMITS[nextPlan];
    return `${limitInfo.message}\n\n${nextPlanInfo.label}プラン（¥${nextPlanInfo.price}/月）にアップグレードすると、月${nextPlanInfo.messages}回まで利用できます。`;
  }
  return limitInfo.message;
}

function getNextPlan(currentPlan: PlanType): PlanType | null {
  switch (currentPlan) {
    case "free":
      return "personal";
    case "personal":
      return "pro";
    case "pro":
      return null;
  }
}

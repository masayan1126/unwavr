import { useState, useEffect, useCallback } from "react";
import { PlanType } from "@/lib/types";

type AIUsageState = {
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
  plan: PlanType;
  planLabel: string;
  yearMonth: string;
  loading: boolean;
  error: string | null;
};

const initialState: AIUsageState = {
  current: 0,
  limit: 20,
  remaining: 20,
  percentage: 0,
  plan: "free",
  planLabel: "Free",
  yearMonth: "",
  loading: true,
  error: null,
};

export function useAIUsage() {
  const [state, setState] = useState<AIUsageState>(initialState);

  const fetchUsage = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const res = await fetch("/api/ai/usage");

      if (!res.ok) {
        if (res.status === 401) {
          // 未認証の場合はエラーを表示しない（ログインしていない）
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }
        throw new Error("Failed to fetch AI usage");
      }

      const data = await res.json();
      setState({
        current: data.current,
        limit: data.limit,
        remaining: data.remaining,
        percentage: data.percentage,
        plan: data.plan,
        planLabel: data.planLabel,
        yearMonth: data.yearMonth,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    ...state,
    refetch: fetchUsage,
    isLimitReached: state.current >= state.limit,
  };
}

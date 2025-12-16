"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PLAN_LIMITS, PlanType } from "@/lib/types";

export default function PricingPage() {
  const { data: session } = useSession();
  const [currentPlan, setCurrentPlan] = useState<PlanType>("free");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);

  // 現在のプランを取得
  useEffect(() => {
    if (session?.user) {
      fetch("/api/ai/usage")
        .then((res) => res.json())
        .then((data) => {
          if (data.plan) {
            setCurrentPlan(data.plan);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  const handleUpgrade = async () => {
    if (!code || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/plan/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setCurrentPlan(data.plan);
        setCode("");
        setShowCodeInput(false);
      } else {
        setMessage({ type: "error", text: data.message || "エラーが発生しました" });
      }
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLoading(false);
    }
  };

  const getPlanButtonText = (plan: PlanType) => {
    if (!session?.user) return "今すぐ使う";
    if (currentPlan === plan) return "現在のプラン";
    if (plan === "free") return "今すぐ使う";
    return "アップグレード";
  };

  const isPlanActive = (plan: PlanType) => currentPlan === plan && session?.user;

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">料金プラン</h1>
        <div className="text-xs opacity-70">価格は税別。年払い割引あり</div>
      </div>

      {session?.user && (
        <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-sm opacity-70">現在のプラン: </span>
            <span className="font-semibold">{PLAN_LIMITS[currentPlan].label}</span>
          </div>
          {currentPlan === "free" && (
            <button
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="text-sm px-3 py-1.5 rounded bg-foreground text-background hover:opacity-90"
            >
              コードでアップグレード
            </button>
          )}
        </div>
      )}

      {/* 秘密コード入力エリア */}
      {showCodeInput && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="text-sm font-medium">アップグレードコードを入力</div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="数字コードを入力"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="flex-1 px-3 py-2 border rounded text-sm"
              maxLength={10}
            />
            <button
              onClick={handleUpgrade}
              disabled={!code || loading}
              className="px-4 py-2 rounded bg-foreground text-background text-sm disabled:opacity-50"
            >
              {loading ? "処理中..." : "適用"}
            </button>
          </div>
          {message && (
            <div
              className={`text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Free */}
        <div className={`border rounded-lg p-5 flex flex-col ${isPlanActive("free") ? "ring-2 ring-foreground" : ""}`}>
          <div className="text-sm font-semibold mb-1">Free</div>
          <div className="text-3xl font-bold mb-1">¥0<span className="text-base font-medium opacity-70">/月</span></div>
          <div className="text-xs opacity-70 mb-4">個人向けお試し</div>
          <ul className="text-sm space-y-2 mb-5">
            <li>・タスク {PLAN_LIMITS.free.tasks}件 / マイルストーン {PLAN_LIMITS.free.milestones}件</li>
            <li>・Googleカレンダー 読み取り</li>
            <li>・Unwavr AI 月{PLAN_LIMITS.free.messages}メッセージ</li>
            <li>・BGM {PLAN_LIMITS.free.bgmTracks}トラック / ランチャー {PLAN_LIMITS.free.launcherShortcuts}件</li>
            <li>・サポート: コミュニティ</li>
          </ul>
          <div
            className={`mt-auto inline-flex items-center justify-center px-4 py-2 rounded border text-sm ${
              isPlanActive("free") ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {getPlanButtonText("free")}
          </div>
        </div>

        {/* Personal */}
        <div className={`border rounded-lg p-5 flex flex-col relative ${isPlanActive("personal") ? "ring-2 ring-foreground" : ""}`}>
          <div className="absolute -top-2 right-3 text-[10px] px-2 py-0.5 rounded bg-foreground text-background">おすすめ</div>
          <div className="text-sm font-semibold mb-1">Personal</div>
          <div className="text-3xl font-bold mb-1">¥600<span className="text-base font-medium opacity-70">/月</span></div>
          <div className="text-xs opacity-70 mb-1">年払い: ¥6,000（約2ヶ月分お得）</div>
          <ul className="text-sm space-y-2 mb-5 mt-3">
            <li>・タスク {PLAN_LIMITS.personal.tasks}件 / マイルストーン {PLAN_LIMITS.personal.milestones}件</li>
            <li>・Googleカレンダー 書き込み</li>
            <li>・Unwavr AI 月{PLAN_LIMITS.personal.messages}メッセージ</li>
            <li>・BGM {PLAN_LIMITS.personal.bgmTracks}トラック / ランチャー {PLAN_LIMITS.personal.launcherShortcuts}件</li>
            <li>・通知/サウンド強化、優先メールサポート</li>
          </ul>
          <div
            className={`mt-auto inline-flex items-center justify-center px-4 py-2 rounded text-sm ${
              isPlanActive("personal")
                ? "bg-foreground text-background"
                : "bg-foreground text-background opacity-50 cursor-not-allowed"
            }`}
          >
            {getPlanButtonText("personal")}
            {!isPlanActive("personal") && currentPlan === "free" && " (Coming Soon)"}
          </div>
        </div>

        {/* Pro */}
        <div className={`border rounded-lg p-5 flex flex-col ${isPlanActive("pro") ? "ring-2 ring-foreground" : ""}`}>
          <div className="text-sm font-semibold mb-1">Pro</div>
          <div className="text-3xl font-bold mb-1">¥1,200<span className="text-base font-medium opacity-70">/月</span></div>
          <div className="text-xs opacity-70 mb-1">年払い: ¥12,000</div>
          <ul className="text-sm space-y-2 mb-5 mt-3">
            <li>・タスク/マイルストーン/BGM/ランチャー 無制限</li>
            <li>・Unwavr AI 月{PLAN_LIMITS.pro.messages}メッセージ（上位モデル選択可）</li>
            <li>・テンプレ/自動化、エクスポート自動化、RAG準備</li>
            <li>・Googleタスク連携、優先サポート</li>
          </ul>
          <div
            className={`mt-auto inline-flex items-center justify-center px-4 py-2 rounded border text-sm ${
              isPlanActive("pro")
                ? "bg-foreground text-background border-foreground"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            {getPlanButtonText("pro")}
            {!isPlanActive("pro") && currentPlan !== "pro" && " (Coming Soon)"}
          </div>
        </div>
      </div>

      <div className="text-xs opacity-70">
        ・Stripe決済は現在準備中です。コードをお持ちの方はコードでアップグレードできます。<br />
        ・AIの上限に達した場合、追加クレジットを購入できます。利用状況に応じて最適なプランをご検討ください。<br />
        ・記載の機能/価格は変更される場合があります。
      </div>
    </div>
  );
}

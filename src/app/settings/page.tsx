"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Type, Database, Globe, Palette, Sparkles, Crown, ChevronDown, Cpu, Settings, AlertTriangle } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useAIUsage } from "@/hooks/useAIUsage";
import { Button } from "@/components/ui/Button";
import { H2, Text } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";
import { PlanType, PLAN_LIMITS } from "@/lib/types";
import { GEMINI_MODELS, GeminiModel } from "@/lib/stores/sliceTypes";

type TabId = "general" | "ai" | "data";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "一般", icon: <Settings size={16} /> },
  { id: "ai", label: "AI", icon: <Sparkles size={16} /> },
  { id: "data", label: "データ", icon: <Database size={16} /> },
];

export default function SettingsPage() {
  const { fontSize, setFontSize, handleClearAll, aiModel, setAIModel, language, setLanguage } = useSettings();
  const aiUsage = useAIUsage();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [upgradeCode, setUpgradeCode] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDowngrade, setShowDowngrade] = useState(false);
  const [downgradeLoading, setDowngradeLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleUpgrade = async () => {
    if (!upgradeCode.trim()) return;
    setUpgradeLoading(true);
    setUpgradeMessage(null);
    try {
      const res = await fetch("/api/plan/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: upgradeCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpgradeMessage({ type: "success", text: data.message });
        setUpgradeCode("");
        aiUsage.refetch();
      } else {
        setUpgradeMessage({ type: "error", text: data.message || "エラーが発生しました" });
      }
    } catch {
      setUpgradeMessage({ type: "error", text: "ネットワークエラーが発生しました" });
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleDowngrade = async (targetPlan: PlanType) => {
    if (!confirm(`${PLAN_LIMITS[targetPlan].label}プランにダウングレードしますか？`)) return;
    setDowngradeLoading(true);
    try {
      const res = await fetch("/api/plan/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpgradeMessage({ type: "success", text: data.message });
        aiUsage.refetch();
        setShowDowngrade(false);
      } else {
        setUpgradeMessage({ type: "error", text: data.message || "エラーが発生しました" });
      }
    } catch {
      setUpgradeMessage({ type: "error", text: "ネットワークエラーが発生しました" });
    } finally {
      setDowngradeLoading(false);
    }
  };

  const getDowngradeOptions = (): PlanType[] => {
    const planOrder: PlanType[] = ["free", "personal", "pro"];
    const currentIndex = planOrder.indexOf(aiUsage.plan);
    return planOrder.slice(0, currentIndex);
  };

  if (!mounted) return null;

  return (
    <PageLayout>
      <PageHeader
        title="設定"
        actions={
          <Link className="text-sm underline opacity-80" href="/">
            ホーム
          </Link>
        }
      />

      {/* タブナビゲーション */}
      <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 一般タブ */}
      {activeTab === "general" && (
        <div className="flex flex-col gap-4">
          {/* 表示設定 */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Type size={18} className="opacity-70" />
              <H2>表示設定</H2>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">文字サイズ</span>
                <span className="font-mono bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-xs">
                  {fontSize}%
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs opacity-60 font-medium">A</span>
                <div className="flex-1 relative h-6 flex items-center">
                  <input
                    type="range"
                    min="80"
                    max="150"
                    step="2"
                    list="fontsize-markers"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:scale-110 transition-all relative z-10"
                  />
                  <datalist id="fontsize-markers" className="absolute w-full flex justify-between px-[6px] pointer-events-none top-1/2 -translate-y-1/2">
                    {[80, 90, 100, 110, 120, 130, 140, 150].map((val) => (
                      <option key={val} value={val} className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/20" label={val === 100 ? "|" : ""} />
                    ))}
                  </datalist>
                  <div className="absolute w-full flex justify-between px-[6px] pointer-events-none h-1 top-1/2 -translate-y-1/2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${i === 2 ? "bg-primary/50 w-1.5 h-1.5 -ml-[1px]" : "bg-black/10 dark:bg-white/10"}`} />
                    ))}
                  </div>
                </div>
                <span className="text-lg opacity-80 font-medium">A</span>
              </div>
              <Text className="text-xs opacity-60 mt-1">
                アプリケーション全体の文字サイズを調整します（標準: 100%）
              </Text>
            </div>
          </Card>

          {/* 言語設定 */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Globe size={18} className="opacity-70" />
              <H2>言語設定 (Language)</H2>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="language"
                    value="ja"
                    checked={language === "ja"}
                    onChange={() => setLanguage("ja")}
                    className="accent-primary"
                  />
                  <span className="text-sm">日本語</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={language === "en"}
                    onChange={() => setLanguage("en")}
                    className="accent-primary"
                  />
                  <span className="text-sm">English</span>
                </label>
              </div>
              <Text className="text-xs opacity-60 mt-1">
                AI機能（Daily Briefingなど）の出力言語を切り替えます。
              </Text>
            </div>
          </Card>

          {/* テーマ・デザイン */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Palette size={18} className="opacity-70" />
              <H2>テーマ・デザイン</H2>
            </div>
            <div className="text-sm">
              <Text className="opacity-80 mb-3">
                カラーパレット、角の丸み、シャドウなどのデザインをカスタマイズできます。
              </Text>
              <Link href="/button-showcase">
                <Button variant="soft">
                  <Palette size={14} />
                  Design Systemを開く
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* AIタブ */}
      {activeTab === "ai" && (
        <div className="flex flex-col gap-4">
          {/* AI使用量 */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Sparkles size={18} className="opacity-70" />
              <H2>AI使用量</H2>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">今月の使用状況</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {aiUsage.planLabel}プラン
                </span>
              </div>
              {aiUsage.loading ? (
                <div className="text-xs opacity-60">読み込み中...</div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          aiUsage.isLimitReached
                            ? "bg-danger"
                            : aiUsage.percentage >= 80
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, aiUsage.percentage)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-20 text-right">
                      {aiUsage.current} / {aiUsage.limit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs opacity-60">
                    <span>残り {aiUsage.remaining} 回</span>
                    {aiUsage.isLimitReached && (
                      <Link href="/pricing" className="text-primary underline">
                        プランをアップグレード
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* AIモデル選択 */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Cpu size={18} className="opacity-70" />
              <H2>AIモデル</H2>
            </div>
            <div className="flex flex-col gap-2">
              {GEMINI_MODELS.map((model) => (
                <label
                  key={model.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    aiModel === model.value
                      ? "border-primary bg-primary/5"
                      : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="aiModel"
                    value={model.value}
                    checked={aiModel === model.value}
                    onChange={() => setAIModel(model.value as GeminiModel)}
                    className="accent-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{model.label}</div>
                    <div className="text-xs opacity-60">{model.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <Text className="text-xs opacity-60">
              使用するAIモデルを選択できます。Proモデルは高性能ですがレスポンスに時間がかかる場合があります。
            </Text>
          </Card>

          {/* プラン管理 */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Crown size={18} className="opacity-70" />
              <H2>プラン管理</H2>
            </div>
            <div className="flex flex-col gap-3">
              {/* メッセージ表示 */}
              {upgradeMessage && (
                <div
                  className={`text-sm px-3 py-2 rounded ${
                    upgradeMessage.type === "success"
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {upgradeMessage.text}
                </div>
              )}

              {/* アップグレードコード入力 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium opacity-70">アップグレードコード</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="コードを入力..."
                    className="border rounded px-3 py-2 text-sm bg-background flex-1 max-w-[200px] font-mono"
                    value={upgradeCode}
                    onChange={(e) => setUpgradeCode(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                  />
                  <Button
                    onClick={handleUpgrade}
                    disabled={upgradeLoading || !upgradeCode.trim()}
                    variant="soft"
                  >
                    {upgradeLoading ? "処理中..." : "適用"}
                  </Button>
                </div>
                <Text className="text-xs opacity-60">
                  アップグレードコードをお持ちの場合は入力してください
                </Text>
              </div>

              {/* ダウングレードオプション */}
              {aiUsage.plan !== "free" && (
                <div className="flex flex-col gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <button
                    onClick={() => setShowDowngrade(!showDowngrade)}
                    className="flex items-center gap-1 text-xs opacity-60 hover:opacity-80 transition-opacity"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${showDowngrade ? "rotate-180" : ""}`}
                    />
                    プランを変更する
                  </button>
                  {showDowngrade && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {getDowngradeOptions().map((plan) => (
                        <Button
                          key={plan}
                          variant="ghost"
                          onClick={() => handleDowngrade(plan)}
                          disabled={downgradeLoading}
                          className="text-xs"
                        >
                          {PLAN_LIMITS[plan].label}プランに変更
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* データタブ */}
      {activeTab === "data" && (
        <div className="flex flex-col gap-4">
          {/* データ管理 */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Database size={18} className="opacity-70" />
              <H2>データ管理</H2>
            </div>
            <div className="text-sm">
              <Text className="opacity-80 mb-3">タスク、マイルストーン、BGM設定のインポート・エクスポートが行えます。</Text>
              <Link href="/settings/data">
                <Button>データ管理画面へ</Button>
              </Link>
            </div>
          </Card>

          {/* 危険な操作 */}
          <Card padding="md" className="bg-danger/5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle size={18} />
              <span className="font-medium">危険な操作</span>
            </div>
            <Text className="text-xs opacity-80">
              タスク・マイルストーン・ランチャーの設定をすべて削除します。この操作は取り消せません。
            </Text>
            <div>
              <Button variant="danger" onClick={handleClearAll} className="w-full sm:w-auto h-auto">
                すべて削除（タスク/マイルストーン/ランチャー）
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}

"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Type, Database, Globe, Palette, Sparkles, Crown, Cpu, Settings, AlertTriangle } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useAIUsage } from "@/hooks/useAIUsage";
import { Button } from "@/components/ui/Button";
import { H2, Text } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";
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

  useEffect(() => setMounted(true), []);

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
          {/* AIモデル選択 */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Cpu size={18} className="opacity-70" />
              <H2>AIモデル</H2>
            </div>
            <div className="flex flex-col gap-2">
              {GEMINI_MODELS.map((model) => {
                const isProModel = model.value === "gemini-3-pro-preview";
                const isProPlan = aiUsage.plan === "pro";
                const isDisabled = isProModel && !isProPlan;

                return (
                  <label
                    key={model.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isDisabled
                        ? "cursor-not-allowed opacity-50 border-black/10 dark:border-white/10"
                        : aiModel === model.value
                        ? "cursor-pointer border-primary bg-primary/5"
                        : "cursor-pointer border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="aiModel"
                      value={model.value}
                      checked={aiModel === model.value}
                      onChange={() => !isDisabled && setAIModel(model.value as GeminiModel)}
                      disabled={isDisabled}
                      className="accent-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{model.label}</span>
                        {isProModel && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            Proプラン限定
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-60">{model.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <Text className="text-xs opacity-60">
              使用するAIモデルを選択できます。Gemini 3 ProはProプラン以上で利用可能です。
            </Text>
          </Card>

          {/* 使用量・プラン */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Crown size={18} className="opacity-70" />
              <H2>使用量・プラン</H2>
            </div>
            <div className="text-sm flex flex-col gap-3">
              <Text className="opacity-80">
                AI使用量やリソースの使用状況は使用量画面で確認できます。
              </Text>
              <div className="flex flex-wrap gap-2">
                <Link href="/usage">
                  <Button variant="soft">
                    <Sparkles size={14} />
                    使用量を確認
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="ghost">
                    <Crown size={14} />
                    料金プラン
                  </Button>
                </Link>
              </div>
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

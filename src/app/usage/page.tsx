"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ListTodo,
  Target,
  Music,
  FolderOpen,
  Rocket,
  Tag,
  Infinity,
  Crown,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";
import { H2, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { PlanType } from "@/lib/types";

type ResourceUsage = {
  key: string;
  label: string;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
};

type UsageData = {
  plan: PlanType;
  planLabel: string;
  yearMonth: string;
  resources: ResourceUsage[];
};

type ResourceTab = "tasks" | "milestones" | "bgm" | "launcher";

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  messages: <Sparkles size={18} />,
  tasks: <ListTodo size={18} />,
  milestones: <Target size={18} />,
  bgmTracks: <Music size={18} />,
  bgmGroups: <FolderOpen size={18} />,
  launcherShortcuts: <Rocket size={18} />,
  launcherCategories: <Tag size={18} />,
};

const TABS: { id: ResourceTab; label: string; icon: React.ReactNode; keys: string[] }[] = [
  { id: "tasks", label: "タスク", icon: <ListTodo size={16} />, keys: ["tasks"] },
  { id: "milestones", label: "マイルストーン", icon: <Target size={16} />, keys: ["milestones"] },
  { id: "bgm", label: "BGM", icon: <Music size={16} />, keys: ["bgmTracks", "bgmGroups"] },
  { id: "launcher", label: "ランチャー", icon: <Rocket size={16} />, keys: ["launcherShortcuts", "launcherCategories"] },
];

function UsageBar({ resource }: { resource: ResourceUsage }) {
  const { label, current, limit, percentage, isUnlimited, key } = resource;
  const icon = RESOURCE_ICONS[key] || <Sparkles size={18} />;

  const getBarColor = () => {
    if (isUnlimited) return "bg-primary";
    if (percentage >= 100) return "bg-danger";
    if (percentage >= 80) return "bg-warning";
    return "bg-primary";
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-black/5 dark:bg-white/5 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="opacity-70">{icon}</span>
          <span className="font-medium text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono">{current}</span>
          <span className="opacity-50">/</span>
          {isUnlimited ? (
            <Infinity size={16} className="opacity-70" />
          ) : (
            <span className="font-mono opacity-70">{limit}</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getBarColor()}`}
          style={{ width: isUnlimited ? "10%" : `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs opacity-60">
        {isUnlimited ? (
          <span>無制限</span>
        ) : (
          <>
            <span>残り {Math.max(0, limit - current)}</span>
            <span>{percentage}% 使用</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResourceTab>("tasks");

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch usage");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title="使用量" />
        <Card padding="md">
          <Text className="opacity-60">読み込み中...</Text>
        </Card>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout>
        <PageHeader title="使用量" />
        <Card padding="md">
          <Text className="text-danger">データの取得に失敗しました</Text>
        </Card>
      </PageLayout>
    );
  }

  const aiResource = data.resources.find((r) => r.key === "messages");
  const currentTabConfig = TABS.find((t) => t.id === activeTab);
  const filteredResources = data.resources.filter(
    (r) => currentTabConfig?.keys.includes(r.key)
  );

  return (
    <PageLayout>
      <PageHeader
        title="使用量"
        actions={
          <Link className="text-sm underline opacity-80" href="/">
            ホーム
          </Link>
        }
      />

      {/* プラン情報 */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-primary" />
            <H2>現在のプラン</H2>
          </div>
          <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {data.planLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <Text className="text-sm opacity-70">
            プランの変更やアップグレードは料金プラン画面から行えます。
          </Text>
          <Link href="/pricing">
            <Button variant="soft" className="text-sm">
              <Crown size={14} />
              料金プラン
            </Button>
          </Link>
        </div>
      </Card>

      {/* AI使用量 */}
      {aiResource && (
        <Card padding="md" className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
            <Sparkles size={18} className="opacity-70" />
            <H2>AI使用量</H2>
            <span className="text-xs opacity-50 ml-auto">{data.yearMonth}</span>
          </div>
          <UsageBar resource={aiResource} />
          {aiResource.percentage >= 80 && !aiResource.isUnlimited && (
            <div className="text-xs text-warning bg-warning/10 px-3 py-2 rounded">
              使用量が上限に近づいています。プランのアップグレードをご検討ください。
            </div>
          )}
        </Card>
      )}

      {/* リソース使用量 */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
          <ListTodo size={18} className="opacity-70" />
          <H2>リソース使用量</H2>
        </div>

        {/* タブナビゲーション */}
        <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* リソース表示 */}
        <div className="flex flex-col gap-3">
          {filteredResources.map((resource) => (
            <UsageBar key={resource.key} resource={resource} />
          ))}
        </div>
      </Card>
    </PageLayout>
  );
}

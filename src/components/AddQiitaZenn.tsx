"use client";
import { useAppStore } from "@/lib/store";
import { useState } from "react";

export default function AddQiitaZenn() {
  const addLauncherShortcut = useAppStore((s) => s.addLauncherShortcut);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    // Qiita トレンドを追加
    addLauncherShortcut({
      label: "Qiita トレンド",
      url: "https://qiita.com/",
      iconName: "TrendingUp",
      color: "#55c500",
      kind: "web"
    });

    // Zennを追加
    addLauncherShortcut({
      label: "Zenn",
      url: "https://zenn.dev/",
      iconName: "BookOpen",
      color: "#3ea8ff",
      kind: "web"
    });

    setIsAdded(true);
  };

  if (isAdded) {
    return (
      <div className="p-4 bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20 border border-[var(--primary)]/30 rounded-md">
        <div className="text-sm text-[var(--primary)]">
          ✅ Qiita トレンドとZennがランチャーに追加されました！
        </div>
        <div className="text-xs text-[var(--primary)] mt-1">
          ランチャーページで確認できます。
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20 border border-[var(--primary)]/30 rounded-md">
      {/* この案内文は削除要求により非表示 */}
      <button
        onClick={handleAdd}
        style={{ backgroundColor: "var(--primary)" }}
        className="px-4 py-2 text-white dark:text-background rounded-md text-sm hover:opacity-90 transition-colors"
      >
        追加する
      </button>
    </div>
  );
}

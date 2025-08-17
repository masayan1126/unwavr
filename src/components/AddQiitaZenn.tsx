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
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
        <div className="text-sm text-green-800 dark:text-green-200">
          ✅ Qiita トレンドとZennがランチャーに追加されました！
        </div>
        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
          ランチャーページで確認できます。
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
      {/* この案内文は削除要求により非表示 */}
      <button
        onClick={handleAdd}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
      >
        追加する
      </button>
    </div>
  );
}

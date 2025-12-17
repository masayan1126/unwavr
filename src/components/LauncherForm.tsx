"use client";
import { useState } from "react";
import { useLauncherForm } from "@/hooks/useLauncher";
import IconPicker from "@/components/IconPicker";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default function LauncherForm() {
  const [activeTab, setActiveTab] = useState<"icon" | "image">("icon");
  const {
    categories,
    label, setLabel, url, setUrl, iconName, setIconName, color, setColor,
    categoryId, setCategoryId, newCategory, setNewCategory, linkType, setLinkType,
    showHelp, setShowHelp, args, setArgs,
    customIconUrl, setCustomIconUrl,
    submit, pickNativeApp,
  } = useLauncherForm();

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 bg-background rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label className="text-sm">種類</label>
        <select
          className="bg-background/50 hover:bg-background transition-colors rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={linkType}
          onChange={(e) => setLinkType((e.target.value as "web" | "app"))}
        >
          <option value="web">Web URL</option>
          <option value="app">アプリ（カスタムスキーム）</option>
        </select>
        {linkType === "app" && (
          <button type="button" className="text-xs underline opacity-80" onClick={() => setShowHelp(true)}>
            アプリ登録のヘルプ
          </button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="flex-1 bg-background/50 hover:bg-background transition-colors rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="ラベル (例: YouTube)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          className="flex-1 bg-background/50 hover:bg-background transition-colors rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={linkType === "web" ? "URL (https://...)" : "アプリ名 または パス (例: Visual Studio Code)"}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {linkType === "app" && (
          <>
            <div className="flex-1 flex flex-col gap-1 w-full sm:w-auto">
              <input
                className="bg-background/50 hover:bg-background transition-colors rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="引数 (例: /Users/name/project)"
                value={args}
                onChange={(e) => setArgs(e.target.value)}
              />
              <div className="text-[10px] opacity-60 px-1">
                ※アプリに渡す引数（ファイルパスなど）を指定できます
              </div>
            </div>
            <button type="button" className="px-3 py-2 rounded-[3px] border text-xs w-full sm:w-auto hover:bg-black/5 dark:hover:bg-white/10 transition-colors h-[38px]" onClick={pickNativeApp}>
              アプリ選択
            </button>
          </>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">色</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
          <label className="text-sm">カテゴリ</label>
          <select
            className="bg-background/50 hover:bg-background transition-colors rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">未分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="bg-background/50 hover:bg-background transition-colors rounded-lg px-3 py-2 text-sm w-full sm:flex-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="新規カテゴリ名 (任意)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4 border-b border-border/50 mb-4">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "icon" ? "border-primary text-primary" : "border-transparent hover:opacity-100 opacity-70"}`}
            onClick={() => setActiveTab("icon")}
          >
            アイコン
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "image" ? "border-primary text-primary" : "border-transparent hover:opacity-100 opacity-70"}`}
            onClick={() => setActiveTab("image")}
          >
            画像
          </button>
        </div>

        {activeTab === "icon" ? (
          <div className="min-h-[280px]">
            <IconPicker value={iconName} onChange={setIconName} />
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border/50 min-h-[280px]">
            <div className="text-sm opacity-80">画像をアップロード</div>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer px-4 py-2 rounded-[3px] bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors shadow-sm">
                ファイルを選択
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const result = ev.target?.result as string;
                      if (result) setCustomIconUrl(result);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {customIconUrl && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border shadow-sm group">
                  <img src={customIconUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setCustomIconUrl("")}
                  >
                    <span className="text-white text-xs font-medium">削除</span>
                  </button>
                </div>
              )}
              {!customIconUrl && <div className="text-xs opacity-50">未選択</div>}
            </div>
            <div className="text-[10px] opacity-50">
              ※ 推奨サイズ: 128x128px 以上 (正方形)
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" iconLeft={<Plus size={16} />} className="w-full sm:w-auto">追加</Button>
      </div>

      {
        showHelp && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-background text-foreground rounded shadow border border-black/10 dark:border-white/10 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">アプリ登録のヘルプ</div>
                <button className="text-sm underline opacity-80" onClick={() => setShowHelp(false)}>
                  閉じる
                </button>
              </div>
              <div className="text-sm opacity-80 space-y-2">
                <p>アプリ名（例: <code>Visual Studio Code</code>）または絶対パス（例: <code>/Applications/Slack.app</code>）を入力してください。</p>
                <p>「引数」には、アプリで開きたいファイルやフォルダのパス、またはコマンドライン引数を指定できます。</p>
                <p>「アプリ選択」ボタンを押すと、Finderからアプリを選択して自動入力できます。</p>
                <p>サーバーサイドで <code>open</code> コマンドを実行してアプリを起動します。</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: "Slack", scheme: "slack://open" },
                  { label: "Obsidian", scheme: "obsidian://open" },
                  { label: "Notion", scheme: "notion://" },
                  { label: "Zoom", scheme: "zoommtg://" },
                  { label: "Spotify", scheme: "spotify://" },
                  { label: "VS Code", scheme: "vscode://" },
                ].map((i) => (
                  <button
                    key={i.scheme}
                    type="button"
                    className="px-2 py-1 rounded-[3px] border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    onClick={() => {
                      setLinkType("app");
                      setUrl(i.scheme);
                      setShowHelp(false);
                    }}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
              <div className="text-[11px] opacity-60">
                補足: 一部のブラウザ/セキュリティ設定ではカスタムスキーム起動がブロックされる場合があります。
              </div>
            </div>
          </div>
        )
      }
    </form >
  );
}



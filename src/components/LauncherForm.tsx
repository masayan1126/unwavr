"use client";
import { useLauncherForm } from "@/hooks/useLauncher";
import IconPicker from "@/components/IconPicker";

export default function LauncherForm() {
  const {
    categories,
    label, setLabel, url, setUrl, iconName, setIconName, color, setColor,
    categoryId, setCategoryId, newCategory, setNewCategory, linkType, setLinkType,
    showHelp, setShowHelp, nativePath,
    submit, pickNativeApp,
  } = useLauncherForm();

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label className="text-sm">種類</label>
        <select
          className="border border-black/10 dark:border-white/10 rounded px-2 py-2 bg-transparent text-sm w-full sm:w-auto"
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
          className="flex-1 border rounded px-2 py-2 bg-transparent border-black/10 dark:border-white/10 text-sm w-full sm:w-auto"
          placeholder="ラベル (例: YouTube)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          className="flex-1 border rounded px-2 py-2 bg-transparent border-black/10 dark:border-white/10 text-sm w-full sm:w-auto"
          placeholder={linkType === "web" ? "URL (https://...)" : "スキーム (例: slack://, obsidian://)"}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {linkType === "app" && (
          <button type="button" className="px-3 py-2 rounded border text-xs w-full sm:w-auto" onClick={pickNativeApp}>
            アプリ登録
          </button>
        )}
      </div>
      {linkType === "app" && nativePath && (
        <div className="text-[11px] opacity-70">選択されたアプリ: {nativePath}</div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">色</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
          <label className="text-sm">カテゴリ</label>
          <select
            className="border border-black/10 dark:border-white/10 rounded px-2 py-2 bg-transparent text-sm w-full sm:w-auto"
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
            className="border border-black/10 dark:border-white/10 rounded px-2 py-2 bg-transparent text-sm w-full sm:flex-1"
            placeholder="新規カテゴリ名 (任意)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </div>
        <div className="text-sm opacity-70">アイコンを選択</div>
      </div>
      <IconPicker value={iconName} onChange={setIconName} />
      <div className="flex justify-end">
        <button className="px-3 py-2 rounded bg-foreground text-background text-sm w-full sm:w-auto">追加</button>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-background text-foreground rounded shadow border border-black/10 dark:border-white/10 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">アプリ登録のヘルプ</div>
              <button className="text-sm underline opacity-80" onClick={() => setShowHelp(false)}>
                閉じる
              </button>
            </div>
            <div className="text-sm opacity-80 space-y-2">
              <p>ブラウザの制約により、Finder/Explorerからアプリ本体を選択して保存したり、任意のアプリを直接起動することはできません。</p>
              <p>多くのデスクトップアプリは「カスタムURLスキーム」を提供しており、例のような<code>app://</code>形式のリンクで起動できます。以下から選ぶか、各アプリのドキュメントでスキームをご確認ください。</p>
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
                  className="px-2 py-1 rounded border"
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
      )}
    </form>
  );
}



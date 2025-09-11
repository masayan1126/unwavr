# カラーインベントリ（現状洗い出し）

本ドキュメントは、現状のアプリ内で使用している色の出所と用途を整理したものです。今後デザインシステム化（トークン化）する際のベースとして活用します。

## グローバルテーマ（globals.css）
- ライトテーマ（:root）
  - `--background`: `#f9fafb` （gray-50） 背景
  - `--foreground`: `#1f2937` （gray-800） 文字色
  - `--card`: `#ffffff` （カード/面）
  - `--muted-foreground`: `#6b7280` （gray-500）補助テキスト
  - `--border`: `rgba(0,0,0,.08)` 境界線
  - `--primary`: `#3b82f6`
  - `--success`: `#10b981`
  - `--warning`: `#f59e0b`
  - `--danger`: `#ef4444`
  - `--tag-daily`: `var(--primary)`
  - `--tag-scheduled`: `var(--warning)`
  - `--tag-backlog`: `#8b5cf6`
- ダークテーマ（prefers-color-scheme: dark）
  - `--background`: `#0b0f14`（黒系のソフト）
  - `--foreground`: `#e5e7eb`（gray-200）
  - `--card`: `#0f141a`
  - `--muted-foreground`: `#94a3b8`（slate-400）
  - `--border`: `rgba(255,255,255,.08)`
  - `--primary`: `#60a5fa`
  - `--success`: `#34d399`
  - `--warning`: `#fbbf24`
  - `--danger`: `#f87171`
  - `--tag-daily`: `var(--primary)`
  - `--tag-scheduled`: `var(--warning)`
  - `--tag-backlog`: `#a78bfa`

補足：
- `@theme inline` にて `--color-background`/`--color-foreground` を変数として再エクスポート。
- 既定の `.card`, `.text-muted`, `.border` 等のヘルパーで参照。

## ブランド/ロゴ（public/unwavr-logo.svg）
- グラデーション: `#0EA5E9` → `#8B5CF6`
- ロゴパス白: `#ffffff`（不透明度0.9）

## プロダクト紹介イラスト（public/illustration-*.svg）
- tasks: グレー系境界 `#E2E8F0`, 面 `#E2E8F0`, `#CBD5E0`、アクセント `#34D399`
- pomodoro: オレンジ系 `#F97316`, `#FB923C`, `#FCD34D`, `#F59E0B`, 枠 `#FDE68A`
- calendar: ブルー系 `#EFF6FF`, `#BFDBFE`, `#93C5FD`, `#DBEAFE`, `#60A5FA`, `#3B82F6`
- milestone: グリーン系 `#D1FAE5`, `#A7F3D0`, `#6EE7B7`, `#34D399`, `#10B981`, ベース `#F8FAF9`
- launcher: パープル系 `#F5F3FF`, `#DDD6FE`, `#EDE9FE`, `#C4B5FD`, `#A78BFA`, `#8B5CF6`

## ランチャー関連のプリセット色
- カテゴリ色（例: `src/app/tasks/import-export/page.tsx`, `seed/engineer`）
  - 学習: `#3b82f6`
  - 開発: `#10b981`
  - 情報収集: `#f59e0b`
  - コミュニケーション: `#8b5cf6`
- ショートカット色（外部ブランド準拠）
  - GitHub: `#000000`
  - StackOverflow: `#f48024`
  - MDN/Notion: `#000000`
  - Google Calendar: `#4285F4`
  - Slack: `#611f69`
  - Zoom: `#0B5CFF`
  - Jira: `#2684FF`
  - Sentry: `#362D59`
  - Qiita: `#55c500`
  - Zenn: `#3ea8ff`

## マニフェスト（PWA）
- `background_color`: `#f9fafb`（ライト）
- `theme_color`: `#3b82f6`（ライト/メタデータでダーク時 `#60a5fa`）

## コンポーネント/ページ上の色傾向
- ボタン/枠線/カード: テーマ変数 `--border`, `--card` を参照
- ヘルプテキスト: `.text-muted` → `--muted-foreground`
- 成果物や通知でのアクセント（例: ハイライトアニメーション）
  - `rgba(16,185,129,0.12)`（エメラルド系のハイライト）

---

## トークン適用済み（主要）
- 危険系: `--danger`
  - `TaskForm`, `TaskList`, `TaskDetail`, `Providers`（確認ダイアログ）, `tasks/[id]`, `bgm`, `import-export`, `calendar（日曜ハイライト）`
- 警告系: `--warning`
  - `PomodoroTopBar`, `OverdueNotificationBar`, `weather`, `calendar（ドラッグ）`, `TaskList TypeBadge（scheduled）`
- 成功系: `--success`
  - `TaskList`（完了UI/行背景）, `tasks/archived`（復元Btn）, `Milestones`（バッジ）, `AddQiitaZenn`（完了メッセージ）
- プライマリ: `--primary`
  - `TaskList`（dailyバッジ, チェックON）, `CalendarNotificationBar`（イベントピル）, `bgm`（リング）, `tasks/page`（タブON）, `AddQiitaZenn`（ボタン）, PWA `theme_color`
- ボーダー: `--border`
  - 主要フォーム/リスト/セクションの `border-black/10` などを置換済み
- タグ/バッジ: `--tag-daily`, `--tag-scheduled`, `--tag-backlog`
  - `TaskList` の種別バッジ

---

# 次のステップ（提案）
1. カラートークン設計の拡張
   - `--surface`, `--muted`, `--info`（必要なら）などの論理トークン追加
2. SVGの色運用
   - 可能なら `currentColor` 化し、`color` 属性/親の `text-[var(--token)]` で統一
3. Tailwind連携
   - 必要に応じて tailwind.config で CSS変数をテーマカラーにマッピング
4. 監査
   - 直書きHex/Tailwind色の残りを段階的に置換

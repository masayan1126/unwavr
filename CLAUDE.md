# unwavr

## WHY: このプロジェクトについて

キャリア・スキル・人生目標を積み上げるためのタスク管理アプリ。
日々の雑用ではなく、自分の未来への投資となる行動にフォーカスする。

**対象者**: 長期的な目標達成を重視する個人ユーザー
**言語**: 日本語

## WHAT: 含まれるもの

| コンポーネント | 概要 |
|---------------|------|
| Task | デイリー/バックログタスクの管理（サブタスク対応） |
| Milestone | 目標を色分けして視覚化するラベル機能 |
| Schedule | 曜日ベースの繰り返しスケジューリング |
| WysiwygEditor | TipTapベースのリッチテキスト編集 |

> 技術的な詳細は `agent_docs/DEVELOPMENT.md` を参照

## HOW: 使い方

- 開発リファレンス @agent_docs/DEVELOPMENT.md
- 思想・哲学 @PHILOSOPHY.md
- サービス概要 @docs/ServiceOverview.md

### Zustand Store の注意点

セレクタで配列を返すメソッドを直接呼び出すと無限ループになる。
`useMemo` でキャッシュすること。詳細は開発リファレンス参照。

### 主要コマンド

```bash
npm run dev       # 開発サーバー
npm run build     # ビルド
npm run test:run  # テスト
```

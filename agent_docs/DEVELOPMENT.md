# 開発リファレンス

## 技術スタック

- **Framework**: Next.js 16 (Turbopack)
- **State**: Zustand v5
- **Database**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS v4, Framer Motion
- **Editor**: TipTap (WYSIWYG)
- **AI**: Google Gemini API
- **Auth**: NextAuth.js
- **Validation**: Zod
- **Testing**: Vitest, Playwright

## ディレクトリ構成

```
src/
├── app/           # Next.js App Router
│   └── api/       # API Routes
├── components/    # UIコンポーネント
├── hooks/         # カスタムフック
├── lib/
│   ├── stores/    # Zustand slices (機能別に分割)
│   ├── types.ts   # Zod スキーマ & 型定義
│   └── store.ts   # Store統合
└── __tests__/     # テスト
supabase/
└── migrations/    # DBマイグレーション (001_*.sql 形式)
```

## 開発コマンド

```bash
npm run dev          # 開発サーバー (Turbopack)
npm run build        # 本番ビルド
npm run test:run     # テスト実行
npm run e2e          # E2Eテスト
```

## Zustand Store パターン

### 無限ループ防止（重要）

state管理で無限ループが発生しやすいパターンに注意すること。

**パターン1: セレクタでメソッド呼び出し**

```typescript
// NG: 無限ループになる
const items = useAppStore((s) => s.getItems());

// OK: useMemoでキャッシュする
const allItems = useAppStore((s) => s.items);
const items = useMemo(() => allItems.filter(...), [allItems]);
```

**パターン2: useEffect内でのstate更新**

```typescript
// NG: 無限ループになる
useEffect(() => {
  setItems(computeItems(data));
}, [data, items]); // itemsを依存配列に入れると無限ループ

// OK: 必要な依存のみ指定
useEffect(() => {
  setItems(computeItems(data));
}, [data]);
```

**パターン3: オブジェクト/配列の参照比較**

```typescript
// NG: 毎回新しいオブジェクトが生成され再レンダリング
const config = useAppStore((s) => ({ a: s.a, b: s.b }));

// OK: shallow比較を使用
import { useShallow } from 'zustand/react/shallow';
const config = useAppStore(useShallow((s) => ({ a: s.a, b: s.b })));
```

## 主要なデータモデル

### Task
```typescript
{
  id: string;
  title: string;
  type: "daily" | "backlog";
  parentTaskId?: string;  // サブタスク機能
  milestoneIds?: string[];
  scheduled?: { daysOfWeek: number[] };
  // ... その他フィールド
}
```

### Milestone
```typescript
{
  id: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
}
```

## API エンドポイント

- `GET/POST /api/db/tasks` - タスクCRUD
- `PATCH/DELETE /api/db/tasks/[id]` - 個別タスク操作
- `GET/POST /api/db/milestones` - マイルストーン管理

## コーディング規約

- コンポーネントは `"use client"` を明示
- 型定義は Zod スキーマから推論 (`z.infer<typeof Schema>`)
- 日本語コメントOK
- Tailwind v4 の `@theme` を使用

## マイグレーション

```bash
# Supabaseマイグレーション適用
supabase migration up
```

ファイル命名: `supabase/migrations/NNN_description.sql`

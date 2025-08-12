import Link from "next/link";

export default function RoadmapPage() {
  return (
    <div className="min-h-screen px-6 sm:px-10 py-12">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">開発ロードマップ</h1>
          <Link href="/unwavr" className="text-sm underline opacity-80">プロダクトサイトへ戻る</Link>
        </header>

        <p className="text-sm opacity-80 max-w-3xl">
          Unwavr は「ブレない・迷わない」積み上げ体験に集中するため、機能を段階的に磨いていきます。状況により内容は更新されます。
        </p>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card rounded p-4 flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Now（実装中）</h2>
            <ul className="text-sm list-disc pl-5 space-y-2 opacity-90">
              <li>モバイル最適化の微調整（フォーム密度・フォント階層の最適化）</li>
              <li>Google カレンダー連携のドラッグ&ドロップ改善（時間帯D&D）</li>
              <li>ランチャーの検索・絞り込み</li>
            </ul>
          </div>
          <div className="card rounded p-4 flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Next（次に取り組む）</h2>
            <ul className="text-sm list-disc pl-5 space-y-2 opacity-90">
              <li>タスクの反復・テンプレート化（雛形から追加）</li>
              <li>BGM プレイリストの連続再生・ショートカットキー</li>
              <li>オンボーディングの強化（初期セットアップの自動化）</li>
            </ul>
          </div>
          <div className="card rounded p-4 flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Later（検討中）</h2>
            <ul className="text-sm list-disc pl-5 space-y-2 opacity-90">
              <li>タスクの自然言語入力（日時・区分の自動抽出）</li>
              <li>外部連携（GitHub Issues / Notion との簡易同期）</li>
              <li>通知・リマインダー（Web Push）</li>
            </ul>
          </div>
          <div className="card rounded p-4 flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Done（完了）</h2>
            <ul className="text-sm list-disc pl-5 space-y-2 opacity-90">
              <li>Google 認証（NextAuth）</li>
              <li>カレンダー（Google イベントの取得/作成/編集/削除）</li>
              <li>ランチャー（カテゴリ・一括操作・オンボーディング）</li>
              <li>CSV インポート/エクスポート（履歴保存）</li>
              <li>音声入力でのタスク追加・編集</li>
            </ul>
          </div>
        </section>

        <footer className="text-xs opacity-70">
          改善のリクエストは GitHub Issue または本サイトのフィードバックフォームからお寄せください。
        </footer>
      </div>
    </div>
  );
}



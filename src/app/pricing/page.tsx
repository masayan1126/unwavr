export default function PricingPage() {
  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">料金プラン</h1>
        <div className="text-xs opacity-70">価格は税別。年払い割引あり</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Free */}
        <div className="border rounded-lg p-5 flex flex-col">
          <div className="text-sm font-semibold mb-1">Free</div>
          <div className="text-3xl font-bold mb-1">¥0<span className="text-base font-medium opacity-70">/月</span></div>
          <div className="text-xs opacity-70 mb-4">個人向けお試し</div>
          <ul className="text-sm space-y-2 mb-5">
            <li>・タスク/マイルストーン/ポモドーロ 基本機能</li>
            <li>・Googleカレンダー 読み取り</li>
            <li>・Unwavr AI 月20メッセージ</li>
            <li>・BGM 20トラック / ランチャー 10件</li>
            <li>・サポート: コミュニティ</li>
          </ul>
          <a href="/auth/signin" className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded border text-sm hover:bg-black/5 dark:hover:bg-white/10">今すぐ使う</a>
        </div>

        {/* Personal */}
        <div className="border rounded-lg p-5 flex flex-col relative">
          <div className="absolute -top-2 right-3 text-[10px] px-2 py-0.5 rounded bg-foreground text-background">おすすめ</div>
          <div className="text-sm font-semibold mb-1">Personal</div>
          <div className="text-3xl font-bold mb-1">¥600<span className="text-base font-medium opacity-70">/月</span></div>
          <div className="text-xs opacity-70 mb-1">年払い: ¥6,000（約2ヶ月分お得）</div>
          <ul className="text-sm space-y-2 mb-5 mt-3">
            <li>・Googleカレンダー 書き込み</li>
            <li>・Unwavr AI 月300メッセージ</li>
            <li>・BGM 200トラック / ランチャー 100件</li>
            <li>・通知/サウンド強化、優先メールサポート</li>
          </ul>
          <a href="/auth/signin" className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded bg-foreground text-background text-sm">今すぐアップグレード</a>
        </div>

        {/* Pro */}
        <div className="border rounded-lg p-5 flex flex-col">
          <div className="text-sm font-semibold mb-1">Pro</div>
          <div className="text-3xl font-bold mb-1">¥1,200<span className="text-base font-medium opacity-70">/月</span></div>
          <div className="text-xs opacity-70 mb-1">年払い: ¥12,000</div>
          <ul className="text-sm space-y-2 mb-5 mt-3">
            <li>・Unwavr AI 月1,500メッセージ（上位モデル選択可）</li>
            <li>・テンプレ/自動化、エクスポート自動化、RAG準備</li>
            <li>・Googleタスク連携、BGM/ランチャー無制限</li>
            <li>・優先サポート（メール＋簡易チャット）</li>
          </ul>
          <a href="/auth/signin" className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded border text-sm hover:bg-black/5 dark:hover:bg-white/10">今すぐアップグレード</a>
        </div>
      </div>

      <div className="text-xs opacity-70">
        ・AIの上限に達した場合、追加クレジットを購入できます。利用状況に応じて最適なプランをご検討ください。<br />
        ・記載の機能/価格は変更される場合があります。
      </div>
    </div>
  );
}



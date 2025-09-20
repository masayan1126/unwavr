import Link from "next/link";
import { CheckCircle2, Target, Hourglass, Anchor, CalendarDays, Zap } from "lucide-react";

export default function UnwavrLanding() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-6 sm:px-10 py-16 md:py-24 lg:pt-16 bg-gradient-to-b from-black/5 to-transparent dark:from-white/5">
        <div className="max-w-6xl mx-auto relative flex flex-col items-start gap-8 lg:gap-10">
          {/* Top-right CTA */}
          <Link
            href="/"
            className="hidden md:inline-flex absolute right-0 top-0 px-5 py-2 rounded-md border text-sm backdrop-blur-sm"
            aria-label="今すぐ始める（右上）"
          >
            今すぐ始める
          </Link>
          <div className="text-xs tracking-widest uppercase opacity-70">Unwavr</div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            迷わず、今日を積む。
          </h1>
          <p className="text-sm md:text-base opacity-80 max-w-xl md:max-w-2xl">
            急な成長はない。あるのは、静かな積み上げだけ。Unwavrは「ブレない・動じない・迷わない」ために、長期目標へコツコツ進む機能だけを搭載した、ミニマルな積み上げダッシュボードです。
          </p>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-foreground text-background text-base font-medium shadow-sm hover:shadow transition"
          >
            今すぐ始める
          </Link>
          <div className="w-full rounded-xl overflow-hidden border bg-black/5 dark:bg-white/5 shadow-xl">
            <div className="w-full h-auto max-h-[40vh] md:max-h-[60vh] lg:max-h-[65vh]">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <img src="/hero.jpg" alt="Unwavr プロダクトプレビュー" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-6 sm:px-10 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border rounded p-4 flex flex-col gap-2">
            <CalendarDays size={18} />
            <div className="text-sm font-medium">ブレない今日</div>
            <p className="text-xs opacity-80">毎日/積み上げ候補/週末・連休で自動分類。今日やるべきことだけに集中。</p>
          </div>
          <div className="border rounded p-4 flex flex-col gap-2">
            <Hourglass size={18} />
            <div className="text-sm font-medium">静かな集中</div>
            <p className="text-xs opacity-80">ポモドーロで見積と実績を一致。作業の微差を積み上げる。</p>
          </div>
          <div className="border rounded p-4 flex flex-col gap-2">
            <Target size={18} />
            <div className="text-sm font-medium">遠くを見る</div>
            <p className="text-xs opacity-80">マイルストーンで長期目標を数値化。日々の前進を可視化。</p>
          </div>
          <div className="border rounded p-4 flex flex-col gap-2">
            <Anchor size={18} />
            <div className="text-sm font-medium">迷わぬ導線</div>
            <p className="text-xs opacity-80">ランチャーでYouTubeやCMSへ直行。初回一括登録対応。</p>
          </div>
        </div>
      </section>

      {/* Value Proposition + Concept */}
      <section className="px-6 sm:px-10 py-10 border-t border-black/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border rounded p-4 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider opacity-70">Value</div>
            <h2 className="text-xl font-semibold">AIを使った高速な開発と改善</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90 list-disc pl-5">
              <li>AI×開発でコア体験を約1週間で構築。仮説検証を圧倒的スピードで回せます。</li>
              <li>いただいたフィードバックは即日〜数日で反映（ロードマップ公開中）。</li>
              <li>小さく作って、早く出して、素早く直す。迷いなく前進するための開発サイクル。</li>
              <li>
                透明性と約束：<Link href="/unwavr/roadmap" className="underline underline-offset-4">開発ロードマップ</Link>で進捗と優先度を共有します。
              </li>
            </ul>
          </div>
          <div className="border rounded p-4 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider opacity-70">Concept</div>
            <h2 className="text-xl font-semibold">AI時代だからこそ、何をやるかを決め切る</h2>
            <p className="text-sm opacity-90">
              AIで「できること」が爆発的に増えた今、成果を左右するのは「何をやるか」の選択です。Unwavrは、やることを削ぎ落とし、今日の一点に集中するためのミニマルなタスク設計と導線を提供します。増えた可能性に迷わず、ブレずに、積み上げるために。
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 sm:px-10 py-12 border-t border-black/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Tasks</div>
            <h2 className="text-xl font-semibold">今日/毎日/特定曜日/候補を自動で整える</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 自動分類：毎日・特定曜日（週末/連休対応）・積み上げ候補・今日やる</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 完了/未完了/アーカイブのビュー、詳細編集と削除</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> CSVインポート/エクスポートと履歴管理</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 overflow-hidden bg-black/5 dark:bg-white/5">
            {/* Tasks illustration */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustration-tasks.svg" alt="Tasks Illustration" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Pomodoro</div>
            <h2 className="text-xl font-semibold">静かに積もる集中</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 作業/休憩/ロング休憩のサイクル＋バックグラウンドでも進行</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 上部バー/トースト/効果音で区切りを通知（作業・休憩で別音）</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 作業終了時にタスクのポモ実績を自動加算</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 overflow-hidden bg-black/5 dark:bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustration-pomodoro.svg" alt="Pomodoro Illustration" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Milestone</div>
            <h2 className="text-xl font-semibold">遠回りしないための指標</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 目標値と現在値を手元で更新</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> ±1の小さな前進を継続</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 overflow-hidden bg-black/5 dark:bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustration-calendar.svg" alt="Calendar Illustration" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Launcher</div>
            <h2 className="text-xl font-semibold">目的地へ最短で</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> オンボーディングで主要リンクをサクッと登録</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> カテゴリ/色/アイコン管理とグローバルランチャー</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 overflow-hidden bg-black/5 dark:bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustration-milestone.svg" alt="Milestone Illustration" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Calendar</div>
            <h2 className="text-xl font-semibold">Googleカレンダーと同期</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 読み取り/作成/編集/削除に対応（Googleログイン時）</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 今日の予定バー表示とドラッグで日付移動</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 overflow-hidden bg-black/5 dark:bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustration-launcher.svg" alt="Launcher Illustration" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">BGM</div>
            <h2 className="text-xl font-semibold">YouTubeプレイリストで集中環境</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 動画URL/IDから追加、グループ分け、ドラッグで整理</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> サムネ表示・埋め込み再生、DB保存で永続化</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 bg-black/5 dark:bg-white/5" />

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Assistant</div>
            <h2 className="text-xl font-semibold">Claude連携のチャット支援</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> /assistant でチャット相談（環境変数にAPIキー）</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 自然言語からタスクを作成（簡易コマンド）</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 bg-black/5 dark:bg-white/5" />
        </div>
      </section>

      {/* How it works (Lightweight animations) */}
      <section className="px-6 sm:px-10 py-12 border-t border-black/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto mb-6">
          <div className="text-xs uppercase tracking-wider opacity-70">How it works</div>
          <h2 className="text-xl font-semibold">操作イメージ（簡易アニメーション）</h2>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tasks demo */}
          <div className="border rounded p-4 flex flex-col gap-3">
            <div className="text-sm font-medium">タスクの完了</div>
            <div className="h-28 rounded border relative overflow-hidden bg-black/5 dark:bg-white/5">
              <div className="absolute left-3 right-12 top-4 h-4 rounded bg-white/70 dark:bg-black/20 border" />
              <div className="absolute left-3 right-12 top-12 h-4 rounded bg-white/70 dark:bg黑/20 border" />
              <div className="absolute left-3 right-12 top-20 h-4 rounded bg-white/70 dark:bg黑/20 border" />
              <div className="absolute right-3 top-3 w-6 h-6 rounded-full border flex items-center justify-center text-emerald-600 anim-check">✔</div>
              <div className="absolute inset-0 anim-highlight pointer-events-none" />
            </div>
          </div>

          {/* Pomodoro demo */}
          <div className="border rounded p-4 flex flex-col gap-3">
            <div className="text-sm font-medium">ポモドーロのサイクル</div>
            <div className="h-28 rounded border relative grid place-items-center bg-amber-50/60 dark:bg-amber-900/10">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-amber-400 anim-spin" />
                <div className="absolute inset-1 rounded-full border-2 border-amber-600/60" />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] opacity-70 anim-mode">作業→休憩</div>
              </div>
            </div>
          </div>

          {/* Calendar demo */}
          <div className="border rounded p-4 flex flex-col gap-3">
            <div className="text-sm font-medium">予定のドラッグ移動</div>
            <div className="h-28 rounded border relative bg-blue-50/60 dark:bg-blue-900/10 overflow-hidden">
              <div className="absolute inset-x-3 top-4 h-[72px] rounded border grid grid-cols-7">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="border-l first:border-l-0 border-blue-200/60" />
                ))}
              </div>
              <div className="absolute top-6 left-6 w-16 h-3 rounded bg-blue-400 anim-drag" />
            </div>
          </div>
        </div>

        
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-10 py-16">
        <div className="max-w-6xl mx-auto border rounded p-6 md:p-10 text-center flex flex-col items-center gap-4">
          <div className="text-xs uppercase tracking-widest opacity-70">Start</div>
          <h3 className="text-2xl md:text-3xl font-bold">急がない。止まらない。Unwavrで今日を積む。</h3>
          <p className="text-sm opacity-80 max-w-2xl">誘惑に流されず、長期目標に向けた小さな前進を日々重ねるための道具箱。必要な機能だけ、まっすぐに。</p>
          <Link href="/" className="px-6 py-2 rounded bg-foreground text-background text-sm inline-flex items-center gap-2">
            <Zap size={16} /> 今すぐ始める
          </Link>
          <Link href="/unwavr/roadmap" className="px-6 py-2 rounded border text-sm inline-flex items-center gap-2">
            ロードマップを見る
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-10 py-8 opacity-70 text-xs text-center">
        © {new Date().getFullYear()} Unwavr. All rights reserved.
      </footer>
    </div>
  );
}



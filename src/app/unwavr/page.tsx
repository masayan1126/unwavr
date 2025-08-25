import Link from "next/link";
import { CheckCircle2, Target, Hourglass, Anchor, CalendarDays, Zap } from "lucide-react";

export default function UnwavrLanding() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-6 sm:px-10 py-16 md:py-24 bg-gradient-to-b from-black/5 to-transparent dark:from-white/5">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-5">
          <div className="text-xs tracking-widest uppercase opacity-70">Unwavr</div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            迷わず、今日を積む。
          </h1>
          <p className="text-sm md:text-base opacity-80 max-w-2xl">
            急な成長はない。あるのは、静かな積み上げだけ。Unwavrは「ブレない・動じない・迷わない」ために、長期目標へコツコツ進む機能だけを搭載した、ミニマルな積み上げダッシュボードです。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded-full border opacity-80">AI×開発で約1週間で構築</span>
            <span className="text-[11px] px-2 py-1 rounded-full border opacity-80">フィードバック最速実装</span>
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/" className="px-5 py-2 rounded bg-foreground text-background text-sm">今すぐ始める</Link>
            <Link href="#features" className="px-5 py-2 rounded border text-sm">機能を見る</Link>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-6 sm:px-10 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Value Proposition */}
      <section className="px-6 sm:px-10 py-10 border-t border-black/10 dark:border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="text-xs uppercase tracking-wider opacity-70">For You</div>
            <h2 className="text-xl font-semibold">ユーザーの声が最短距離で機能になる</h2>
            <p className="text-sm opacity-90">
              Unwavrは“今日の前進”を支える道具です。改善提案は機能へ最短で反映します。小さな痛みを小さな修正で、すぐ直す。その積み重ねが、あなたの積み上げを加速させます。
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 sm:px-10 py-12 border-t border-black/10 dark:border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Tasks</div>
            <h2 className="text-xl font-semibold">今日/積み上げ候補/週末・連休を自動で整える</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 曜日＋期間レンジで週末/連休を柔軟にスケジュール</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 詳細ページで完了/ポモ対象/削除を素早く</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> CSVインポート/エクスポート＋履歴を保存</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 bg-black/5 dark:bg-white/5" />

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Pomodoro</div>
            <h2 className="text-xl font-semibold">静かに積もる集中</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 作業/休憩/ロング休憩のサイクル管理</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 作業完了でタスクのポモ実績を自動加算</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 対象タスクを明示して迷いを消す</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 bg-black/5 dark:bg白/5" />

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Milestone</div>
            <h2 className="text-xl font-semibold">遠回りしないための指標</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 目標値と現在値を手元で更新</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> ±1の小さな前進を継続</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 bg-black/5 dark:bg-white/5" />

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider opacity-70">Launcher</div>
            <h2 className="text-xl font-semibold">目的地へ最短で</h2>
            <ul className="text-sm flex flex-col gap-2 opacity-90">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> 初回一括登録で主要サービスを一気にセットアップ</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5" /> カテゴリ分けと一括削除で整理も簡単</li>
            </ul>
          </div>
          <div className="rounded border h-48 md:h-56 bg-black/5 dark:bg-white/5" />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-10 py-16">
        <div className="max-w-5xl mx-auto border rounded p-6 md:p-10 text-center flex flex-col items-center gap-4">
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



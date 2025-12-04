"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Type, Database } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/Button";
import { H1, H2, Text } from "@/components/ui/Typography";

export default function SettingsPage() {
  const { fontSize, setFontSize, handleClearAll, geminiApiKey, setGeminiApiKey } = useSettings();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="p-6 sm:p-10 max-w-[1400px] mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <H1>設定</H1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>

      <div className="bg-card border border-black/10 dark:border-white/10 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
          <Type size={18} className="opacity-70" />
          <H2>表示設定</H2>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-80">文字サイズ</span>
            <span className="font-mono bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-xs">
              {fontSize}%
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs opacity-60 font-medium">A</span>
            <div className="flex-1 relative h-6 flex items-center">
              <input
                type="range"
                min="80"
                max="120"
                step="5"
                list="fontsize-markers"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:scale-110 transition-all relative z-10"
              />
              <datalist id="fontsize-markers" className="absolute w-full flex justify-between px-[6px] pointer-events-none top-1/2 -translate-y-1/2">
                {[80, 85, 90, 95, 100, 105, 110, 115, 120].map((val) => (
                  <option key={val} value={val} className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/20" label={val === 100 ? "|" : ""} />
                ))}
              </datalist>
              <div className="absolute w-full flex justify-between px-[6px] pointer-events-none h-1 top-1/2 -translate-y-1/2">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full ${i === 4 ? "bg-primary/50 w-1.5 h-1.5 -ml-[1px]" : "bg-black/10 dark:bg-white/10"}`} />
                ))}
              </div>
            </div>
            <span className="text-lg opacity-80 font-medium">A</span>
          </div>
          <Text className="text-xs opacity-60 mt-1">
            アプリケーション全体の文字サイズを調整します（標準: 100%）
          </Text>
        </div>
      </div>

      <div className="bg-card border border-black/10 dark:border-white/10 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
          <Database size={18} className="opacity-70" />
          <H2>データ管理</H2>
        </div>
        <div className="text-sm">
          <Text className="opacity-80 mb-3">タスク、マイルストーン、BGM設定のインポート・エクスポートが行えます。</Text>
          <Link href="/settings/data">
            <Button>データ管理画面へ</Button>
          </Link>
        </div>
      </div>

      <div className="bg-card border border-black/10 dark:border-white/10 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
          <span className="opacity-70">✨</span>
          <H2>AI連携 (Gemini 2.5 Flash)</H2>
        </div>
        <div className="text-sm flex flex-col gap-3">
          <Text className="opacity-80">
            Gemini APIキーを設定すると、Unwavr AI機能が利用可能になります。
            キーはブラウザにのみ保存され、サーバーには送信されません。
          </Text>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium opacity-70">Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              className="border rounded px-3 py-2 text-sm bg-background w-full max-w-md"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
          </div>
          <div className="text-xs opacity-60">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
              APIキーを取得する
            </a>
          </div>
        </div>
      </div>
      <div className="bg-[var(--danger)]/5 rounded-xl p-5 flex flex-col gap-3">
        <div className="text-sm font-medium text-[var(--danger)]">危険な操作</div>
        <div className="text-xs opacity-80">タスク・マイルストーン・ランチャーの設定をすべて削除します。この操作は取り消せません。</div>
        <div>
          <Button variant="danger" onClick={handleClearAll} className="w-full sm:w-auto h-auto">
            すべて削除（タスク/マイルストーン/ランチャー）
          </Button>
        </div>
      </div>
    </div>
  );
}

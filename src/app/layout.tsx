import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_JP, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import LayoutChrome from "@/components/LayoutChrome";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300","400","500","700","900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "unwavr | タスク × ポモドーロ × ダッシュボード",
    template: "%s | unwavr",
  },
  description:
    "unwavrは、毎日積み上げ・特定曜日・積み上げ候補をひとつのダッシュボードで管理し、ポモドーロで着実に進めるための生産性アプリです。",
  keywords: [
    "タスク管理",
    "ポモドーロ",
    "ToDo",
    "ダッシュボード",
    "スケジュール",
    "生産性"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "unwavr | タスク × ポモドーロ × ダッシュボード",
    description:
      "毎日・特定曜日・積み上げ候補をまとめて管理し、今日やるべきことに集中できるローカルファーストのタスクアプリ",
    siteName: "unwavr",
    images: [
      { url: "/globe.svg" },
    ],
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "unwavr | タスク × ポモドーロ × ダッシュボード",
    description:
      "毎日・特定曜日・積み上げ候補をまとめて管理し、今日やるべきことに集中できるローカルファーストのタスクアプリ",
    images: ["/globe.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/unwavr-logo.svg" }],
    shortcut: [{ url: "/unwavr-logo.svg" }],
    apple: [{ url: "/unwavr-logo.svg" }],
  },
  category: "productivity",
  // 動的テーマカラー（ライト/ダーク）
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#60a5fa" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${notoSansJp.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>
          <LayoutChrome>{children}</LayoutChrome>
        </Providers>
      </body>
    </html>
  );
}

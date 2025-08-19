import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import OnboardingGuide from "@/components/OnboardingGuide";
import Providers from "@/components/Providers";
import GlobalLauncherBar from "@/components/GlobalLauncherBar";
import MobileTabBar from "@/components/MobileTabBar";
import CalendarNotificationBar from "@/components/CalendarNotificationBar";
import OverdueNotificationBar from "@/components/OverdueNotificationBar";
import CookieConsent from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "unwavr | タスク × ポモドーロ × ダッシュボード",
    template: "%s | unwavr",
  },
  description:
    "unwavrは、毎日積み上げ・特定日・バックログをひとつのダッシュボードで管理し、ポモドーロで着実に進めるための生産性アプリです。",
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
      "毎日・特定日・バックログをまとめて管理し、今日やるべきことに集中できるローカルファーストのタスクアプリ",
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
      "毎日・特定日・バックログをまとめて管理し、今日やるべきことに集中できるローカルファーストのタスクアプリ",
    images: ["/globe.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
    shortcut: [{ url: "/unwavr-logo.svg" }],
    apple: [{ url: "/unwavr-logo.svg" }],
  },
  category: "productivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            <div className="hidden md:block">
              <Sidebar />
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <CalendarNotificationBar />
              <OverdueNotificationBar />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
            </div>
          </div>
          <OnboardingGuide />
          <GlobalLauncherBar />
          <CookieConsent />
          <MobileTabBar />
        </Providers>
      </body>
    </html>
  );
}

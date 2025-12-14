"use client";
import Link from "next/link";
import Pomodoro from "@/components/Pomodoro";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";

export default function PomodoroPage() {
  return (
    <PageLayout>
      <PageHeader
        title="ポモドーロ"
        actions={
          <Link className="text-sm underline opacity-80" href="/">
            ホーム
          </Link>
        }
      />
      <Pomodoro />
    </PageLayout>
  );
}



"use client";
import Link from "next/link";
import { useMemo } from "react";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import SectionLoader from "@/components/SectionLoader";

export default function WeekendPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const weekend = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.type === "scheduled" &&
          (t.scheduled?.daysOfWeek?.some((d) => d === 0 || d === 6) || (t.scheduled?.dateRanges?.length ?? 0) > 0)
      ),
    [tasks]
  );
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">週末・連休向け</h1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>
      {hydrating ? <SectionLoader label="週末・連休向けタスクを読み込み中..." lines={5} /> : <TaskList title="週末・連休向け" tasks={weekend} />}
    </div>
  );
}



"use client";
import Link from "next/link";
import { useMemo } from "react";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";

export default function BacklogPage() {
  const tasks = useAppStore((s) => s.tasks);
  const backlog = useMemo(() => tasks.filter((t) => t.type === "backlog"), [tasks]);
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">バックログ</h1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>
      <TaskList title="バックログ" tasks={backlog} />
    </div>
  );
}



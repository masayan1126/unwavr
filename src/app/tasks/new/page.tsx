"use client";
import Link from "next/link";
import TaskForm from "@/components/TaskForm";

export default function NewTaskPage() {
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">タスクを追加</h1>
        <Link className="text-sm underline opacity-80" href="/tasks">
          タスク一覧へ
        </Link>
      </div>
      <TaskForm />
    </div>
  );
}



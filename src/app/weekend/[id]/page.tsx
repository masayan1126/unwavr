"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function WeekendTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const taskId = Array.isArray(id) ? id[0] : id;
  const task = useAppStore((s) => s.tasks.find((t) => t.id === taskId));
  const toggleTask = useAppStore((s) => s.toggleTask);

  if (!task) {
    router.push("/weekend");
    return null;
  }

  toggleTask(task.id);
  router.push("/weekend");
  return null;
}



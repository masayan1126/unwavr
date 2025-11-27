"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function BacklogTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const taskId = Array.isArray(id) ? id[0] : id;
  const task = useAppStore((s) => s.tasks.find((t) => t.id === taskId));
  const togglePlannedForToday = useAppStore((s) => s.togglePlannedForToday);

  if (!task) {
    router.push("/backlog");
    return null;
  }

  togglePlannedForToday(task.id);
  router.push("/backlog");
  return null;
}



"use client";
import { useParams } from "next/navigation";
import TaskDetail from "@/components/TaskDetail";

export default function TodayDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto">
      <TaskDetail taskId={id} backHref="/today" />
    </div>
  );
}



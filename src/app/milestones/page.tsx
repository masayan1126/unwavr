"use client";
import Link from "next/link";
import Milestones from "@/components/Milestones";

export default function MilestonesPage() {
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">マイルストーン管理</h1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>
      <Milestones />
    </div>
  );
}



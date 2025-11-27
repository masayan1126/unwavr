"use client";
import { useState } from "react";
import Link from "next/link";
import TasksImportExport from "@/components/data/TasksImportExport";
import MilestonesImportExport from "@/components/data/MilestonesImportExport";
import BgmImportExport from "@/components/data/BgmImportExport";

type Tab = "tasks" | "milestones" | "bgm";

export default function DataSettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("tasks");

    return (
        <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">データ管理</h1>
                <Link className="text-sm underline opacity-80" href="/settings">
                    設定へ戻る
                </Link>
            </div>

            <div className="flex items-center gap-4 border-b border-border">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "tasks"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => setActiveTab("tasks")}
                >
                    タスク
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "milestones"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => setActiveTab("milestones")}
                >
                    マイルストーン
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "bgm"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => setActiveTab("bgm")}
                >
                    BGM
                </button>
            </div>

            <div className="mt-4">
                {activeTab === "tasks" && <TasksImportExport />}
                {activeTab === "milestones" && <MilestonesImportExport />}
                {activeTab === "bgm" && <BgmImportExport />}
            </div>
        </div>
    );
}

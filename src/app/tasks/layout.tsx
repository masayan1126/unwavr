"use client";

import ActiveTasksQueue from "@/components/ActiveTasksQueue";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-10 pt-6 sm:pt-10 pb-0">
                <ActiveTasksQueue className="mb-0" />
            </div>
            {children}
        </div>
    );
}

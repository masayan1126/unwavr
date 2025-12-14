"use client";

import { Plus } from "lucide-react";
import { forwardRef } from "react";
import clsx from "clsx";

type AddTaskButtonProps = {
    onClick?: () => void;
    className?: string;
};

const AddTaskButton = forwardRef<HTMLButtonElement, AddTaskButtonProps>(
    ({ onClick, className }, ref) => {
        return (
            <button
                ref={ref}
                onClick={onClick}
                style={{
                    backgroundColor: "#37352F",
                }}
                className={clsx(
                    "group flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-[3px]",
                    "text-white shadow-md transition-all duration-200",
                    "hover:opacity-90 hover:shadow-lg hover:scale-[1.02] active:scale-95",
                    className
                )}
            >
                <div className="bg-white/20 rounded-sm p-0.5 transition-transform group-hover:rotate-90">
                    <Plus size={18} strokeWidth={2.5} />
                </div>
                <span className="hidden md:inline font-medium text-sm tracking-wide pr-1">タスク追加</span>
            </button>
        );
    }
);

AddTaskButton.displayName = "AddTaskButton";

export default AddTaskButton;

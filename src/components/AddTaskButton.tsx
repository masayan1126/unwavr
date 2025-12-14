"use client";

import { Plus } from "lucide-react";
import { forwardRef } from "react";
import { Button } from "@/components/ui/Button";

type AddTaskButtonProps = {
    onClick?: () => void;
    className?: string;
};

const AddTaskButton = forwardRef<HTMLButtonElement, AddTaskButtonProps>(
    ({ onClick, className }, ref) => {
        return (
            <Button
                ref={ref}
                onClick={onClick}
                size="sm"
                iconLeft={<Plus size={16} strokeWidth={2.5} />}
                className={className}
            >
                <span className="hidden md:inline">タスク追加</span>
            </Button>
        );
    }
);

AddTaskButton.displayName = "AddTaskButton";

export default AddTaskButton;

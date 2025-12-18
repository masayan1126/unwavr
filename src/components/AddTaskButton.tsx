"use client";

import { Plus, ChevronDown } from "lucide-react";
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
                iconRight={<ChevronDown size={14} className="opacity-70" />}
                className={className}
            >
                <span className="hidden md:inline">新規</span>
            </Button>
        );
    }
);

AddTaskButton.displayName = "AddTaskButton";

export default AddTaskButton;

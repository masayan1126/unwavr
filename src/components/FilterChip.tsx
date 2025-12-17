"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

type FilterChipProps = {
    label: string;
    active: boolean;
    onClick: () => void;
    className?: string;
};

export default function FilterChip({
    label,
    active,
    onClick,
    className,
}: FilterChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-fast border",
                active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent border-border hover:bg-black/5 dark:hover:bg-white/5",
                className
            )}
        >
            {active && <Check size={12} strokeWidth={3} />}
            {label}
        </button>
    );
}

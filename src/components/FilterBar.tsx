"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type FilterBarProps = {
    children: ReactNode;
    className?: string;
};

export default function FilterBar({ children, className }: FilterBarProps) {
    return (
        <div className={clsx("flex flex-wrap items-center gap-2 sm:gap-4 text-sm", className)}>
            {children}
        </div>
    );
}

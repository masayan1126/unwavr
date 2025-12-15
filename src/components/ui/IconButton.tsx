"use client";

import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonVariant = "ghost" | "outline" | "solid";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: ReactNode;
    size?: IconButtonSize;
    variant?: IconButtonVariant;
    label?: string;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        {
            className,
            icon,
            size = "md",
            variant = "ghost",
            label,
            disabled,
            ...props
        },
        ref
    ) => {
        const sizes = {
            sm: "w-7 h-7",
            md: "w-8 h-8",
            lg: "w-10 h-10",
        };

        const iconSizes = {
            sm: "[&>svg]:w-[14px] [&>svg]:h-[14px]",
            md: "[&>svg]:w-[16px] [&>svg]:h-[16px]",
            lg: "[&>svg]:w-[18px] [&>svg]:h-[18px]",
        };

        const variants = {
            ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/5",
            outline: "bg-transparent border border-border hover:bg-black/5 dark:hover:bg-white/5",
            solid: "bg-primary text-white hover:opacity-90",
        };

        return (
            <button
                ref={ref}
                disabled={disabled}
                aria-label={label}
                className={clsx(
                    "inline-flex items-center justify-center rounded-[var(--radius-sm)]",
                    "transition-fast",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]",
                    "active:scale-95",
                    sizes[size],
                    iconSizes[size],
                    variants[variant],
                    className
                )}
                {...props}
            >
                {icon}
            </button>
        );
    }
);

IconButton.displayName = "IconButton";

export { IconButton };

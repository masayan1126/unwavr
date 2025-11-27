"use client";

import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "danger" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = "primary",
            size = "md",
            iconLeft,
            iconRight,
            isLoading,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const variants = {
            primary: "bg-[var(--primary)] text-white hover:opacity-90 border-transparent",
            danger: "bg-[var(--danger)] text-white hover:opacity-90 border-transparent",
            outline: "bg-transparent border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5",
            ghost: "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5",
        };

        const sizes = {
            sm: "px-2 py-1 text-xs",
            md: "px-3 py-1.5 text-sm",
            lg: "px-4 py-2 text-base",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={clsx(
                    "inline-flex items-center justify-center gap-2 rounded-[3px] border transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading && (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {!isLoading && iconLeft}
                <span className="whitespace-nowrap">{children}</span>
                {!isLoading && iconRight}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };

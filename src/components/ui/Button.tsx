"use client";

import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "accent" | "soft" | "secondary" | "success" | "danger" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    isLoading?: boolean;
    fullWidth?: boolean;
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
            fullWidth,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const variantClasses: Record<ButtonVariant, string> = {
            primary: "bg-primary text-primary-foreground border-transparent hover:bg-primary-hover",
            accent: "bg-accent text-accent-foreground border-transparent hover:bg-accent-hover",
            soft: "bg-soft text-foreground border-transparent hover:bg-soft-hover",
            secondary: "bg-transparent border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5",
            success: "bg-success text-white border-transparent hover:opacity-90",
            danger: "bg-danger text-white border-transparent hover:opacity-90",
            outline: "bg-transparent border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5",
            ghost: "bg-transparent border-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/5",
        };

        const sizes: Record<ButtonSize, string> = {
            sm: "px-2 py-1 text-xs gap-1.5",
            md: "px-3 py-1.5 text-sm gap-2",
            lg: "px-4 py-2 text-base gap-2.5",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={clsx(
                    "inline-flex items-center justify-center rounded-[var(--radius-sm)] border font-medium",
                    "transition-fast",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]",
                    variantClasses[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    className
                )}
                {...props}
            >
                {isLoading && (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {!isLoading && iconLeft}
                {children && <span>{children}</span>}
                {!isLoading && iconRight}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };

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
            style,
            ...props
        },
        ref
    ) => {
        // Option B: ウォームアクセント - インラインスタイルでCSS変数を適用
        const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
            primary: { backgroundColor: "var(--primary)" },
            accent: { backgroundColor: "var(--accent)" },
            soft: { backgroundColor: "var(--soft)" },
            secondary: {},
            success: {},
            danger: {},
            outline: {},
            ghost: {},
        };

        const variantClasses: Record<ButtonVariant, string> = {
            primary: "text-white dark:text-background border-transparent hover:opacity-90",
            accent: "text-white dark:text-background border-transparent hover:opacity-90",
            soft: "text-foreground border-transparent hover:opacity-90",
            secondary: "bg-transparent border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5",
            success: "bg-success text-white border-transparent hover:opacity-90",
            danger: "bg-danger text-white border-transparent hover:opacity-90",
            outline: "bg-transparent border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5",
            ghost: "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5",
        };

        const sizes = {
            sm: "px-2 py-1 text-xs gap-1.5",
            md: "px-3 py-1.5 text-sm gap-2",
            lg: "px-4 py-2 text-base gap-2.5",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                style={{ ...variantStyles[variant], ...style }}
                className={clsx(
                    "inline-flex items-center justify-center rounded-[var(--radius-sm)] border font-medium",
                    "transition-all duration-[var(--transition-fast)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20",
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

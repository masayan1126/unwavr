import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

interface TypographyProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
}

interface TextProps extends TypographyProps {
    variant?: "default" | "muted" | "small";
}

export const H1 = ({ className, children, ...props }: TypographyProps) => (
    <h1
        className={clsx(
            "text-2xl font-bold tracking-tight",
            className
        )}
        {...props}
    >
        {children}
    </h1>
);

export const H2 = ({ className, children, ...props }: TypographyProps) => (
    <h2
        className={clsx(
            "text-lg font-semibold",
            className
        )}
        {...props}
    >
        {children}
    </h2>
);

export const H3 = ({ className, children, ...props }: TypographyProps) => (
    <h3
        className={clsx(
            "text-base font-medium",
            className
        )}
        {...props}
    >
        {children}
    </h3>
);

export const H4 = ({ className, children, ...props }: TypographyProps) => (
    <h4
        className={clsx(
            "text-sm font-semibold",
            className
        )}
        {...props}
    >
        {children}
    </h4>
);

export const Text = ({ className, children, variant = "default", ...props }: TextProps) => {
    const variants = {
        default: "text-sm text-foreground",
        muted: "text-sm",
        small: "text-xs",
    };

    return (
        <p className={clsx(variants[variant], className)} {...props}>
            {children}
        </p>
    );
};

export const Label = ({ className, children, ...props }: TypographyProps) => (
    <span
        className={clsx(
            "text-sm font-medium text-foreground",
            className
        )}
        {...props}
    >
        {children}
    </span>
);

export const SectionTitle = ({ className, children, ...props }: TypographyProps) => (
    <div
        className={clsx(
            "text-xxs uppercase tracking-wider font-semibold",
            className
        )}
        {...props}
    >
        {children}
    </div>
);

export const Caption = ({ className, children, ...props }: TypographyProps) => (
    <span
        className={clsx(
            "text-xs",
            className
        )}
        {...props}
    >
        {children}
    </span>
);

export const Code = ({ className, children, ...props }: TypographyProps) => (
    <code
        className={clsx(
            "font-mono text-sm bg-muted px-1.5 py-0.5 rounded-[var(--radius-sm)]",
            className
        )}
        {...props}
    >
        {children}
    </code>
);

import clsx from "clsx";
import type { HTMLAttributes } from "react";

interface TypographyProps extends HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
}

export const H1 = ({ className, children, ...props }: TypographyProps) => (
    <h1 className={clsx("text-xl font-semibold", className)} {...props}>
        {children}
    </h1>
);

export const H2 = ({ className, children, ...props }: TypographyProps) => (
    <h2 className={clsx("font-medium", className)} {...props}>
        {children}
    </h2>
);

export const Text = ({ className, children, ...props }: TypographyProps) => (
    <p className={clsx("text-sm opacity-80", className)} {...props}>
        {children}
    </p>
);

export const Label = ({ className, children, ...props }: TypographyProps) => (
    <span className={clsx("text-sm font-medium opacity-80", className)} {...props}>
        {children}
    </span>
);

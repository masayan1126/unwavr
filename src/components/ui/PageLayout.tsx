"use client";

import clsx from "clsx";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface PageLayoutProps extends HTMLAttributes<HTMLDivElement> {
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(
    ({ className, maxWidth = "xl", children, ...props }, ref) => {
        const maxWidths = {
            sm: "max-w-[640px]",
            md: "max-w-[768px]",
            lg: "max-w-[1024px]",
            xl: "max-w-[1400px]",
            full: "max-w-full",
        };

        return (
            <div
                ref={ref}
                className={clsx(
                    "min-h-screen p-4 sm:p-6 md:p-10 mx-auto flex flex-col gap-6",
                    maxWidths[maxWidth],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

PageLayout.displayName = "PageLayout";

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    title?: ReactNode;
    actions?: ReactNode;
}

const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(
    ({ className, title, actions, children, ...props }, ref) => (
        <header
            ref={ref}
            className={clsx("flex items-center justify-between gap-4 flex-wrap", className)}
            {...props}
        >
            {title && (
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                    {title}
                </h1>
            )}
            {actions && (
                <div className="flex items-center gap-3">{actions}</div>
            )}
            {children}
        </header>
    )
);

PageHeader.displayName = "PageHeader";

export interface PageSectionProps extends HTMLAttributes<HTMLElement> {
    title?: string;
}

const PageSection = forwardRef<HTMLElement, PageSectionProps>(
    ({ className, title, children, ...props }, ref) => (
        <section ref={ref} className={clsx("flex flex-col gap-4", className)} {...props}>
            {title && (
                <h2 className="text-lg font-medium">{title}</h2>
            )}
            {children}
        </section>
    )
);

PageSection.displayName = "PageSection";

export { PageLayout, PageHeader, PageSection };

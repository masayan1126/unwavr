"use client";

import clsx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    padding?: CardPadding;
    hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, padding = "md", hoverable = false, children, ...props }, ref) => {
        const paddings = {
            none: "",
            sm: "p-3",
            md: "p-5",
            lg: "p-6",
        };

        return (
            <div
                ref={ref}
                className={clsx(
                    "bg-sidebar rounded-[var(--radius-lg)] shadow-sm",
                    "transition-shadow duration-[var(--transition-base)]",
                    hoverable && "hover:shadow-md cursor-pointer",
                    paddings[padding],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={clsx("flex items-center justify-between mb-4", className)}
            {...props}
        >
            {children}
        </div>
    )
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, children, ...props }, ref) => (
        <h3
            ref={ref}
            className={clsx("text-sm font-medium", className)}
            {...props}
        >
            {children}
        </h3>
    )
);

CardTitle.displayName = "CardTitle";

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, children, ...props }, ref) => (
        <div ref={ref} className={clsx("flex flex-col gap-3", className)} {...props}>
            {children}
        </div>
    )
);

CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };

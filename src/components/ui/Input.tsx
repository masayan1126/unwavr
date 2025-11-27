"use client";

import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, wrapperClassName, iconLeft, iconRight, ...props }, ref) => {
        return (
            <div className={clsx("relative flex items-center", wrapperClassName)}>
                {iconLeft && (
                    <div className="absolute left-3 text-black/40 dark:text-white/40 pointer-events-none flex items-center">
                        {iconLeft}
                    </div>
                )}
                <input
                    ref={ref}
                    className={clsx(
                        "w-full bg-transparent border border-black/10 dark:border-white/10 rounded-[3px] transition-all duration-200",
                        "placeholder:text-black/30 dark:placeholder:text-white/30",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        iconLeft ? "pl-9" : "pl-3",
                        iconRight ? "pr-9" : "pr-3",
                        "py-1.5 text-sm",
                        className
                    )}
                    {...props}
                />
                {iconRight && (
                    <div className="absolute right-3 text-black/40 dark:text-white/40 pointer-events-none flex items-center">
                        {iconRight}
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };

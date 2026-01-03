"use client";

import { ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";

export type SelectOption = {
    value: string | number;
    label: string;
    disabled?: boolean;
};

export interface SelectProps {
    value: string | number;
    onChange: (value: string) => void;
    options: SelectOption[];
    label?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    fullWidth?: boolean;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "ghost";
}

export function Select({
    value,
    onChange,
    options,
    label,
    placeholder = "選択してください",
    className,
    disabled = false,
    fullWidth = false,
    size = "md",
    variant = "default",
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));
    const selectedIndex = options.findIndex((opt) => String(opt.value) === String(value));

    const sizeClasses = {
        sm: {
            button: "px-2 py-1 text-xs gap-1.5",
            icon: 12,
            dropdown: "text-xs",
        },
        md: {
            button: "px-3 py-1.5 text-sm gap-2",
            icon: 14,
            dropdown: "text-sm",
        },
        lg: {
            button: "px-4 py-2.5 text-sm gap-2",
            icon: 16,
            dropdown: "text-sm",
        },
    };

    const variantClasses = {
        default: clsx(
            "border border-border",
            "bg-transparent",
            "hover:bg-black/5 dark:hover:bg-white/5",
            "focus:ring-2 focus:ring-[var(--ring-color)] focus:border-primary"
        ),
        ghost: clsx(
            "border-transparent",
            "bg-transparent",
            "hover:bg-black/5 dark:hover:bg-white/10",
            "focus:ring-0"
        ),
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case "Enter":
            case " ":
                e.preventDefault();
                if (isOpen && highlightedIndex >= 0) {
                    const option = options[highlightedIndex];
                    if (!option.disabled) {
                        onChange(String(option.value));
                        setIsOpen(false);
                    }
                } else {
                    setIsOpen(!isOpen);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
            case "ArrowDown":
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
                } else {
                    setHighlightedIndex((prev) => {
                        const next = prev + 1;
                        return next >= options.length ? 0 : next;
                    });
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : options.length - 1);
                } else {
                    setHighlightedIndex((prev) => {
                        const next = prev - 1;
                        return next < 0 ? options.length - 1 : next;
                    });
                }
                break;
        }
    }, [disabled, isOpen, highlightedIndex, options, onChange, selectedIndex]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[role="option"]');
            items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
        }
    }, [highlightedIndex, isOpen]);

    // Reset highlighted index when opening
    useEffect(() => {
        if (isOpen) {
            setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        }
    }, [isOpen, selectedIndex]);

    const handleSelect = (val: string | number) => {
        onChange(String(val));
        setIsOpen(false);
    };

    return (
        <div
            className={clsx(
                "relative",
                fullWidth ? "w-full" : "inline-block",
                className
            )}
            ref={containerRef}
        >
            {label && (
                <label className="block text-xs font-medium opacity-70 mb-1.5">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={clsx(
                    "inline-flex items-center justify-between w-full",
                    "rounded-[var(--radius-sm)] transition-base",
                    "focus:outline-none",
                    sizeClasses[size].button,
                    variantClasses[variant],
                    isOpen && variant === "default" && "ring-2 ring-[var(--ring-color)] border-primary",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className={clsx("block truncate text-left", !selectedOption && "opacity-50")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={sizeClasses[size].icon}
                    className={clsx(
                        "shrink-0 opacity-50 transition-transform duration-150",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && (
                <div
                    ref={listRef}
                    role="listbox"
                    className={clsx(
                        "absolute z-50 mt-1 w-full min-w-[160px]",
                        "rounded-[var(--radius-md)] bg-popover",
                        "border border-border shadow-lg",
                        "animate-in fade-in-0 zoom-in-95 duration-100",
                        "origin-top",
                        sizeClasses[size].dropdown
                    )}
                >
                    <div className="py-1 max-h-60 overflow-auto">
                        {options.map((option, index) => {
                            const isSelected = String(option.value) === String(value);
                            const isHighlighted = index === highlightedIndex;
                            return (
                                <button
                                    key={option.value}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => !option.disabled && handleSelect(option.value)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    disabled={option.disabled}
                                    className={clsx(
                                        "flex w-full items-center justify-between",
                                        "px-3 py-2 text-left transition-colors",
                                        option.disabled && "opacity-40 cursor-not-allowed",
                                        isSelected && "text-primary font-medium",
                                        isHighlighted && !option.disabled && "bg-black/5 dark:bg-white/5",
                                        !isHighlighted && !isSelected && "text-foreground"
                                    )}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && (
                                        <Check size={14} className="shrink-0 text-primary ml-2" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Select;

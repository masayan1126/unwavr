"use client";

import { ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export type Option = {
    value: string | number;
    label: string;
};

type StylishSelectProps = {
    value: string | number;
    onChange: (value: string) => void;
    options: Option[];
    label?: string;
    className?: string;
    placeholder?: string;
};

export default function StylishSelect({
    value,
    onChange,
    options,
    label,
    className,
    placeholder = "選択してください",
}: StylishSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

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

    const handleSelect = (val: string | number) => {
        onChange(String(val));
        setIsOpen(false);
    };

    return (
        <div className={clsx("relative inline-block text-left", className)} ref={containerRef}>
            {label && <span className="text-xs opacity-70 mr-2">{label}</span>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-[var(--radius-md)] border text-sm transition-fast",
                    "bg-white/5 border-border hover:bg-black/5 dark:hover:bg-white/5",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]",
                    isOpen && "border-primary ring-1 ring-[var(--ring-color)]"
                )}
            >
                <span className={clsx("block truncate", !selectedOption && "opacity-70")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={14}
                    className={clsx("transition-fast opacity-70", isOpen && "rotate-180")}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-full min-w-[140px] origin-top-right rounded-[var(--radius-md)] bg-popover shadow-token-lg ring-1 ring-border focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-1 max-h-60 overflow-auto">
                        {options.map((option) => {
                            const isSelected = String(option.value) === String(value);
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={clsx(
                                        "group flex w-full items-center justify-between px-3 py-2 text-sm text-left transition-fast",
                                        isSelected
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && <Check size={14} className="text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

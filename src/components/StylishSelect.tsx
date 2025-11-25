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
                    "inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all",
                    "bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50",
                    isOpen && "border-[var(--primary)] ring-1 ring-[var(--primary)]/50"
                )}
            >
                <span className={clsx("block truncate", !selectedOption && "opacity-50")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={14}
                    className={clsx("transition-transform duration-200 opacity-50", isOpen && "rotate-180")}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-full min-w-[140px] origin-top-right rounded-lg bg-white dark:bg-[#1e1e1e] shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-1 max-h-60 overflow-auto">
                        {options.map((option) => {
                            const isSelected = String(option.value) === String(value);
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={clsx(
                                        "group flex w-full items-center justify-between px-3 py-2 text-sm text-left transition-colors",
                                        isSelected
                                            ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                                            : "text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && <Check size={14} className="text-[var(--primary)]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

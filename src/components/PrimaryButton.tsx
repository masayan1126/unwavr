"use client";

import clsx from "clsx";
import { forwardRef, type ReactNode } from "react";

export type PrimaryButtonProps = {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ label, onClick, type = "button", disabled = false, className, iconLeft, iconRight }, ref) => (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "px-3 py-1.5 rounded-[3px] border text-sm flex items-center gap-2 bg-[var(--primary)] text-white border-transparent shadow-sm transition-all",
        "hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {iconLeft}
      <span className="whitespace-nowrap">{label}</span>
      {iconRight}
    </button>
  ),
);

PrimaryButton.displayName = "PrimaryButton";

export { PrimaryButton };
export default PrimaryButton;



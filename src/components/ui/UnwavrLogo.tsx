"use client";

interface UnwavrLogoProps {
  size?: number;
  className?: string;
}

/**
 * テーマ連動のunwavrロゴコンポーネント
 * currentColorを使用して親要素のtext-*カラーを継承
 */
export function UnwavrLogo({ size = 24, className = "" }: UnwavrLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="unwavr logo"
      className={className}
    >
      {/* rounded canvas ring */}
      <rect
        x="12"
        y="12"
        width="232"
        height="232"
        rx="56"
        stroke="currentColor"
        strokeWidth="8"
        fill="none"
      />
      {/* Monogram U (unwavr) */}
      <path
        d="M76 80c-6.627 0-12 5.373-12 12v60c0 33.137 26.863 60 60 60s60-26.863 60-60V92c0-6.627-5.373-12-12-12s-12 5.373-12 12v60c0 19.882-16.118 36-36 36s-36-16.118-36-36V92c0-6.627-5.373-12-12-12Z"
        fill="currentColor"
      />
      {/* subtle wave inside the U */}
      <path
        d="M72 156c14 0 22-10 36-10s22 10 36 10 22-10 36-10"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        className="dark:stroke-zinc-900"
      />
    </svg>
  );
}

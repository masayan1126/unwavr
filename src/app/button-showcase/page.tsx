"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check, Plus, ArrowRight, Sparkles, Heart, Send, Download, Play, Zap,
  Sun, Moon, Palette, Sliders, Type, Box, Save, RotateCcw, Eye, Copy,
  Bell, AlertCircle, X, ChevronDown, Search, Settings, User, Mail, Loader2, Cloud, CloudOff
} from "lucide-react";
import clsx from "clsx";

// ========================================
// Type Definitions
// ========================================

type ColorPalette = {
  name: string;
  description: string;
  light: {
    primary: string;
    primaryHover: string;
    accent: string;
    accentHover: string;
    soft: string;
    softHover: string;
    success: string;
    danger: string;
    warning: string;
  };
  dark: {
    primary: string;
    primaryHover: string;
    accent: string;
    accentHover: string;
    soft: string;
    softHover: string;
    success: string;
    danger: string;
    warning: string;
  };
};

type ThemePreferences = {
  palette: string;
  borderRadius: string;
  shadowIntensity: string;
  transitionSpeed: string;
};

// ========================================
// Color Palette Definitions (Light + Dark)
// ========================================

const colorPalettes: Record<string, ColorPalette> = {
  warmAccent: {
    name: "Warm Orange",
    description: "Notion風のウォームオレンジ",
    light: {
      primary: "#D9730D",
      primaryHover: "#BF6309",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FEF3E2",
      softHover: "#FDECC8",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#FFA344",
      primaryHover: "#E89030",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#3D2E1F",
      softHover: "#4A3828",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmRed: {
    name: "Warm Red",
    description: "情熱的なチェリーレッド",
    light: {
      primary: "#C53030",
      primaryHover: "#9B2C2C",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FEF2F2",
      softHover: "#FEE2E2",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#FC8181",
      primaryHover: "#F56565",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#3D1F1F",
      softHover: "#4A2828",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmPink: {
    name: "Warm Pink",
    description: "華やかなローズピンク",
    light: {
      primary: "#D53F8C",
      primaryHover: "#B83280",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FDF2F8",
      softHover: "#FCE7F3",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#F687B3",
      primaryHover: "#ED64A6",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#3D1F2E",
      softHover: "#4A2838",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmYellow: {
    name: "Warm Yellow",
    description: "リッチなゴールドイエロー",
    light: {
      primary: "#B7791F",
      primaryHover: "#975A16",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FEFCE8",
      softHover: "#FEF9C3",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#F6E05E",
      primaryHover: "#ECC94B",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#3D3A1F",
      softHover: "#4A4628",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmGreen: {
    name: "Warm Green",
    description: "落ち着いたフォレストグリーン",
    light: {
      primary: "#2F855A",
      primaryHover: "#276749",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#F0FFF4",
      softHover: "#C6F6D5",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#68D391",
      primaryHover: "#48BB78",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#1F3D2A",
      softHover: "#284A34",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmTeal: {
    name: "Warm Teal",
    description: "モダンなシアンブルー",
    light: {
      primary: "#0D9488",
      primaryHover: "#0F766E",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#F0FDFA",
      softHover: "#CCFBF1",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#5EEAD4",
      primaryHover: "#2DD4BF",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#1F3D3A",
      softHover: "#284A46",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmPurple: {
    name: "Warm Purple",
    description: "上品なグレープパープル",
    light: {
      primary: "#6B46C1",
      primaryHover: "#553C9A",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FAF5FF",
      softHover: "#E9D8FD",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#B794F4",
      primaryHover: "#9F7AEA",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#2D1F3D",
      softHover: "#38284A",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmBlue: {
    name: "Warm Blue",
    description: "深みのあるネイビーブルー",
    light: {
      primary: "#2B6CB0",
      primaryHover: "#2C5282",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#EBF8FF",
      softHover: "#BEE3F8",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#63B3ED",
      primaryHover: "#4299E1",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#1F2D3D",
      softHover: "#28384A",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmIndigo: {
    name: "Warm Indigo",
    description: "神秘的なインディゴブルー",
    light: {
      primary: "#4338CA",
      primaryHover: "#3730A3",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#EEF2FF",
      softHover: "#E0E7FF",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#A5B4FC",
      primaryHover: "#818CF8",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#262050",
      softHover: "#312B5A",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmCyan: {
    name: "Warm Cyan",
    description: "爽やかなシアンブルー",
    light: {
      primary: "#0891B2",
      primaryHover: "#0E7490",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#ECFEFF",
      softHover: "#CFFAFE",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#67E8F9",
      primaryHover: "#22D3EE",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#164E63",
      softHover: "#1E6A7A",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmLime: {
    name: "Warm Lime",
    description: "フレッシュなライムグリーン",
    light: {
      primary: "#65A30D",
      primaryHover: "#4D7C0F",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#F7FEE7",
      softHover: "#ECFCCB",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#BEF264",
      primaryHover: "#A3E635",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#2D4A0F",
      softHover: "#3A5A18",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmAmber: {
    name: "Warm Amber",
    description: "温かみのあるアンバー",
    light: {
      primary: "#D97706",
      primaryHover: "#B45309",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FFFBEB",
      softHover: "#FEF3C7",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#FCD34D",
      primaryHover: "#FBBF24",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#45320D",
      softHover: "#5A4216",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmRose: {
    name: "Warm Rose",
    description: "エレガントなローズピンク",
    light: {
      primary: "#E11D48",
      primaryHover: "#BE123C",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FFF1F2",
      softHover: "#FFE4E6",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#FB7185",
      primaryHover: "#F43F5E",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#4C0D1F",
      softHover: "#5E1529",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmFuchsia: {
    name: "Warm Fuchsia",
    description: "鮮やかなフューシャ",
    light: {
      primary: "#C026D3",
      primaryHover: "#A21CAF",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FDF4FF",
      softHover: "#FAE8FF",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#E879F9",
      primaryHover: "#D946EF",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#4A1052",
      softHover: "#5C1866",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmViolet: {
    name: "Warm Violet",
    description: "深みのあるバイオレット",
    light: {
      primary: "#7C3AED",
      primaryHover: "#6D28D9",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#F5F3FF",
      softHover: "#EDE9FE",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#C4B5FD",
      primaryHover: "#A78BFA",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#2E1A5E",
      softHover: "#3D2472",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmSky: {
    name: "Warm Sky",
    description: "澄んだスカイブルー",
    light: {
      primary: "#0284C7",
      primaryHover: "#0369A1",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#F0F9FF",
      softHover: "#E0F2FE",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#7DD3FC",
      primaryHover: "#38BDF8",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#0C4A6E",
      softHover: "#155E85",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmEmerald: {
    name: "Warm Emerald",
    description: "高貴なエメラルドグリーン",
    light: {
      primary: "#059669",
      primaryHover: "#047857",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#ECFDF5",
      softHover: "#D1FAE5",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#6EE7B7",
      primaryHover: "#34D399",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#064E3B",
      softHover: "#0D6149",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmSlate: {
    name: "Warm Slate",
    description: "モダンなスレートグレー",
    light: {
      primary: "#475569",
      primaryHover: "#334155",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#F8FAFC",
      softHover: "#F1F5F9",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#94A3B8",
      primaryHover: "#64748B",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#1E293B",
      softHover: "#2A3A4E",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmStone: {
    name: "Warm Stone",
    description: "ナチュラルなストーン",
    light: {
      primary: "#57534E",
      primaryHover: "#44403C",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FAFAF9",
      softHover: "#F5F5F4",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#A8A29E",
      primaryHover: "#78716C",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#292524",
      softHover: "#3A3532",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmBrown: {
    name: "Warm Brown",
    description: "落ち着いたブラウン",
    light: {
      primary: "#92400E",
      primaryHover: "#78350F",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FEF3C7",
      softHover: "#FDE68A",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#FCD34D",
      primaryHover: "#FBBF24",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#451A03",
      softHover: "#5A2810",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmOlive: {
    name: "Warm Olive",
    description: "アースカラーのオリーブ",
    light: {
      primary: "#4D7C0F",
      primaryHover: "#3F6212",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#F7FEE7",
      softHover: "#ECFCCB",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#A3E635",
      primaryHover: "#84CC16",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#263C0A",
      softHover: "#344D12",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmCoral: {
    name: "Warm Coral",
    description: "活発なコーラルオレンジ",
    light: {
      primary: "#EA580C",
      primaryHover: "#C2410C",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FFF7ED",
      softHover: "#FFEDD5",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#FB923C",
      primaryHover: "#F97316",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#431407",
      softHover: "#571D0F",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmPeach: {
    name: "Warm Peach",
    description: "優しいピーチピンク",
    light: {
      primary: "#F472B6",
      primaryHover: "#EC4899",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FDF2F8",
      softHover: "#FCE7F3",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#F9A8D4",
      primaryHover: "#F472B6",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#500724",
      softHover: "#651030",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmLavender: {
    name: "Warm Lavender",
    description: "癒しのラベンダー",
    light: {
      primary: "#8B5CF6",
      primaryHover: "#7C3AED",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#F5F3FF",
      softHover: "#EDE9FE",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#C4B5FD",
      primaryHover: "#A78BFA",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#2E1065",
      softHover: "#3E1A7A",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmMint: {
    name: "Warm Mint",
    description: "爽やかなミントグリーン",
    light: {
      primary: "#14B8A6",
      primaryHover: "#0D9488",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#F0FDFA",
      softHover: "#CCFBF1",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#5EEAD4",
      primaryHover: "#2DD4BF",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#134E4A",
      softHover: "#1D6560",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmNavy: {
    name: "Warm Navy",
    description: "クラシックなネイビー",
    light: {
      primary: "#1E3A8A",
      primaryHover: "#1E40AF",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#EFF6FF",
      softHover: "#DBEAFE",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#93C5FD",
      primaryHover: "#60A5FA",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#172554",
      softHover: "#1E3A6A",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmCrimson: {
    name: "Warm Crimson",
    description: "深みのあるクリムゾン",
    light: {
      primary: "#DC2626",
      primaryHover: "#B91C1C",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FEF2F2",
      softHover: "#FEE2E2",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#F87171",
      primaryHover: "#EF4444",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#450A0A",
      softHover: "#5A1414",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
  warmSienna: {
    name: "Warm Sienna",
    description: "温かみのあるシエナ",
    light: {
      primary: "#A0522D",
      primaryHover: "#8B4513",
      accent: "#37352F",
      accentHover: "#2D2B27",
      soft: "#FEF7ED",
      softHover: "#FDECD5",
      success: "#059669",
      danger: "#EB5757",
      warning: "#F59E0B",
    },
    dark: {
      primary: "#D2956B",
      primaryHover: "#C4825A",
      accent: "#EBEBEA",
      accentHover: "#D3D3D2",
      soft: "#3D2414",
      softHover: "#4D301C",
      success: "#10B981",
      danger: "#EB5757",
      warning: "#FBBF24",
    },
  },
};

// ========================================
// Style Options
// ========================================

const borderRadiusOptions = {
  sharp: { name: "Sharp", value: "0px", preview: "rounded-none" },
  subtle: { name: "Subtle", value: "3px", preview: "rounded-[3px]" },
  soft: { name: "Soft", value: "6px", preview: "rounded-md" },
  rounded: { name: "Rounded", value: "12px", preview: "rounded-xl" },
  pill: { name: "Pill", value: "9999px", preview: "rounded-full" },
};

const shadowOptions = {
  none: { name: "None", value: "none" },
  subtle: { name: "Subtle", multiplier: 0.5 },
  normal: { name: "Normal", multiplier: 1 },
  elevated: { name: "Elevated", multiplier: 1.5 },
  dramatic: { name: "Dramatic", multiplier: 2 },
};

const transitionOptions = {
  instant: { name: "Instant", value: "80ms" },
  fast: { name: "Fast", value: "120ms" },
  normal: { name: "Normal", value: "200ms" },
  smooth: { name: "Smooth", value: "300ms" },
  slow: { name: "Slow", value: "400ms" },
};

// ========================================
// Storage Keys
// ========================================

const STORAGE_KEY = "unwavr-theme-preferences";
const DEFAULT_PREFERENCES: ThemePreferences = {
  palette: "warmAccent",
  borderRadius: "subtle",
  shadowIntensity: "normal",
  transitionSpeed: "fast",
};

// ========================================
// Helper Functions
// ========================================

function loadPreferencesFromLocalStorage(): ThemePreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore
  }
  return DEFAULT_PREFERENCES;
}

function savePreferencesToLocalStorage(prefs: ThemePreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

async function loadPreferencesFromAPI(): Promise<ThemePreferences | null> {
  try {
    const res = await fetch("/api/db/preferences");
    if (!res.ok) {
      if (res.status === 401) return null; // Not authenticated
      throw new Error("Failed to load preferences");
    }
    const data = await res.json();
    if (data.preferences) {
      return {
        palette: data.preferences.theme_palette || DEFAULT_PREFERENCES.palette,
        borderRadius: data.preferences.border_radius || DEFAULT_PREFERENCES.borderRadius,
        shadowIntensity: data.preferences.shadow_intensity || DEFAULT_PREFERENCES.shadowIntensity,
        transitionSpeed: data.preferences.transition_speed || DEFAULT_PREFERENCES.transitionSpeed,
      };
    }
  } catch (err) {
    console.error("Error loading preferences from API:", err);
  }
  return null;
}

async function savePreferencesToAPI(prefs: ThemePreferences): Promise<boolean> {
  try {
    const res = await fetch("/api/db/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme_palette: prefs.palette,
        border_radius: prefs.borderRadius,
        shadow_intensity: prefs.shadowIntensity,
        transition_speed: prefs.transitionSpeed,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Error saving preferences to API:", err);
    return false;
  }
}

// ========================================
// Component: Section Header
// ========================================

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// ========================================
// Component: Option Card
// ========================================

function OptionCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative p-3 rounded-xl border-2 text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.1)]"
          : "border-border hover:border-primary/40 hover:bg-muted/50",
        className
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check size={12} className="text-primary-foreground" />
        </div>
      )}
      {children}
    </button>
  );
}

// ========================================
// Component: Color Swatch
// ========================================

function ColorSwatch({ color, label, size = "md" }: { color: string; label?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-10 h-10" };
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={clsx(sizes[size], "rounded-lg border border-black/10 shadow-sm")}
        style={{ backgroundColor: color }}
        title={label}
      />
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
    </div>
  );
}

// ========================================
// Component: Palette Preview Mini (for selection cards)
// ========================================

function PalettePreviewMini({ palette, isDark }: { palette: ColorPalette; isDark: boolean }) {
  const colors = isDark ? palette.dark : palette.light;
  const bgColor = isDark ? "#1a1a1a" : "#ffffff";
  const textColor = isDark ? "#e5e5e5" : "#37352F";

  return (
    <div
      className="rounded-lg p-2 space-y-1.5"
      style={{ backgroundColor: bgColor }}
    >
      {/* Mini button row */}
      <div className="flex gap-1">
        <div
          className="px-2 py-0.5 text-[10px] font-medium rounded"
          style={{
            backgroundColor: colors.primary,
            color: isDark ? "#18181B" : "#FFFFFF",
          }}
        >
          Primary
        </div>
        <div
          className="px-2 py-0.5 text-[10px] font-medium rounded"
          style={{
            backgroundColor: colors.soft,
            color: colors.primary,
          }}
        >
          Soft
        </div>
      </div>
      {/* Color bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden">
        <div className="flex-1" style={{ backgroundColor: colors.primary }} />
        <div className="flex-1" style={{ backgroundColor: colors.accent }} />
        <div className="flex-1" style={{ backgroundColor: colors.soft }} />
        <div className="flex-1" style={{ backgroundColor: colors.success }} />
        <div className="flex-1" style={{ backgroundColor: colors.danger }} />
      </div>
    </div>
  );
}

// ========================================
// Component: Dual Mode Preview (Light + Dark side by side)
// ========================================

function DualModePreview({ palette }: { palette: ColorPalette }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Light Mode */}
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="px-3 py-1.5 bg-muted/50 text-xs font-medium flex items-center gap-1.5">
          <Sun size={12} />
          Light
        </div>
        <div className="p-3 bg-white space-y-2">
          <div className="flex gap-1.5">
            <button
              className="px-2.5 py-1 text-xs font-medium rounded"
              style={{
                backgroundColor: palette.light.primary,
                color: "#FFFFFF",
              }}
            >
              Button
            </button>
            <button
              className="px-2.5 py-1 text-xs font-medium rounded"
              style={{
                backgroundColor: palette.light.soft,
                color: palette.light.primary,
              }}
            >
              Soft
            </button>
            <button
              className="px-2.5 py-1 text-xs font-medium rounded border"
              style={{
                backgroundColor: "transparent",
                color: palette.light.primary,
                borderColor: palette.light.primary,
              }}
            >
              Outline
            </button>
          </div>
          <div className="flex gap-1">
            {Object.entries(palette.light).slice(0, 5).map(([key, color]) => (
              <div
                key={key}
                className="flex-1 h-4 first:rounded-l last:rounded-r"
                style={{ backgroundColor: color }}
                title={key}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Dark Mode */}
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="px-3 py-1.5 bg-muted/50 text-xs font-medium flex items-center gap-1.5">
          <Moon size={12} />
          Dark
        </div>
        <div className="p-3 bg-zinc-900 space-y-2">
          <div className="flex gap-1.5">
            <button
              className="px-2.5 py-1 text-xs font-medium rounded"
              style={{
                backgroundColor: palette.dark.primary,
                color: "#18181B",
              }}
            >
              Button
            </button>
            <button
              className="px-2.5 py-1 text-xs font-medium rounded"
              style={{
                backgroundColor: palette.dark.soft,
                color: palette.dark.primary,
              }}
            >
              Soft
            </button>
            <button
              className="px-2.5 py-1 text-xs font-medium rounded border"
              style={{
                backgroundColor: "transparent",
                color: palette.dark.primary,
                borderColor: palette.dark.primary,
              }}
            >
              Outline
            </button>
          </div>
          <div className="flex gap-1">
            {Object.entries(palette.dark).slice(0, 5).map(([key, color]) => (
              <div
                key={key}
                className="flex-1 h-4 first:rounded-l last:rounded-r"
                style={{ backgroundColor: color }}
                title={key}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Component: Preview Button
// ========================================

function PreviewButton({
  palette,
  isDark,
  variant = "primary",
  radius,
  children,
  icon,
  size = "md",
}: {
  palette: ColorPalette;
  isDark: boolean;
  variant?: "primary" | "accent" | "outline" | "ghost" | "soft" | "success" | "danger";
  radius: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const colors = isDark ? palette.dark : palette.light;

  const variantStyles = {
    primary: { bg: colors.primary, color: isDark ? "#18181B" : "#FFFFFF", border: "transparent" },
    accent: { bg: colors.accent, color: isDark ? "#18181B" : "#FFFFFF", border: "transparent" },
    outline: { bg: "transparent", color: colors.primary, border: colors.primary },
    ghost: { bg: "transparent", color: colors.primary, border: "transparent" },
    soft: { bg: colors.soft, color: colors.primary, border: "transparent" },
    success: { bg: colors.success, color: "#FFFFFF", border: "transparent" },
    danger: { bg: colors.danger, color: "#FFFFFF", border: "transparent" },
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const v = variantStyles[variant];

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-all duration-200",
        sizeStyles[size]
      )}
      style={{
        backgroundColor: v.bg,
        color: v.color,
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: v.border,
        borderRadius: radius,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ========================================
// Component: Preview Input
// ========================================

function PreviewInput({
  palette,
  isDark,
  radius,
  placeholder = "入力してください...",
  icon,
}: {
  palette: ColorPalette;
  isDark: boolean;
  radius: string;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  const colors = isDark ? palette.dark : palette.light;

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <input
        type="text"
        placeholder={placeholder}
        className={clsx(
          "w-full py-2 text-sm transition-all duration-200 border focus:outline-none",
          icon ? "pl-9 pr-3" : "px-3"
        )}
        style={{
          borderRadius: radius,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E9E9E7",
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "transparent",
          color: isDark ? "#D4D4D4" : "#37352F",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = colors.primary;
          e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#E9E9E7";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ========================================
// Component: Preview Card
// ========================================

function PreviewCard({
  palette,
  isDark,
  radius,
  children,
}: {
  palette: ColorPalette;
  isDark: boolean;
  radius: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-4 transition-all duration-200"
      style={{
        borderRadius: radius,
        backgroundColor: isDark ? "#202020" : "#F7F7F5",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#E9E9E7"}`,
      }}
    >
      {children}
    </div>
  );
}

// ========================================
// Component: Preview Chip
// ========================================

function PreviewChip({
  palette,
  isDark,
  radius,
  active,
  children,
}: {
  palette: ColorPalette;
  isDark: boolean;
  radius: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  const colors = isDark ? palette.dark : palette.light;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-all"
      style={{
        borderRadius: radius === "9999px" ? "9999px" : Math.min(parseInt(radius) || 6, 9999) + "px",
        backgroundColor: active ? colors.primary : "transparent",
        color: active ? (isDark ? "#18181B" : "#FFFFFF") : (isDark ? "#D4D4D4" : "#37352F"),
        border: `1px solid ${active ? colors.primary : (isDark ? "rgba(255,255,255,0.1)" : "#E9E9E7")}`,
      }}
    >
      {active && <Check size={10} strokeWidth={3} />}
      {children}
    </span>
  );
}

// ========================================
// Component: Toast Preview
// ========================================

function ToastPreview({
  palette,
  isDark,
  radius,
  type,
}: {
  palette: ColorPalette;
  isDark: boolean;
  radius: string;
  type: "info" | "success" | "warning" | "error";
}) {
  const colors = isDark ? palette.dark : palette.light;
  const icons = {
    info: Bell,
    success: Check,
    warning: AlertCircle,
    error: X,
  };
  const typeColors = {
    info: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.danger,
  };
  const messages = {
    info: "新しい通知があります",
    success: "保存しました",
    warning: "注意が必要です",
    error: "エラーが発生しました",
  };
  const Icon = icons[type];

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 shadow-lg"
      style={{
        borderRadius: radius,
        backgroundColor: isDark ? "rgba(32,32,32,0.95)" : "rgba(255,255,255,0.95)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#E9E9E7"}`,
      }}
    >
      <div
        className="w-1 h-full rounded-full self-stretch"
        style={{ backgroundColor: typeColors[type] }}
      />
      <Icon size={16} style={{ color: typeColors[type] }} className="mt-0.5 shrink-0" />
      <span className="text-sm" style={{ color: isDark ? "#D4D4D4" : "#37352F" }}>
        {messages[type]}
      </span>
    </div>
  );
}

// ========================================
// Main Page Component
// ========================================

export default function ButtonShowcasePage() {
  const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULT_PREFERENCES);
  const [previewDark, setPreviewDark] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"palette" | "style" | "components">("palette");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const initialLoadDone = useRef(false);

  const palette = colorPalettes[preferences.palette] || colorPalettes.warmAccent;
  const radius = borderRadiusOptions[preferences.borderRadius as keyof typeof borderRadiusOptions]?.value || "3px";

  // Load preferences on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    async function loadPreferences() {
      setIsLoading(true);

      // First try API
      const apiPrefs = await loadPreferencesFromAPI();
      if (apiPrefs) {
        setPreferences(apiPrefs);
        setIsAuthenticated(true);
        // Also save to localStorage as backup
        savePreferencesToLocalStorage(apiPrefs);
      } else {
        // Fall back to localStorage
        const localPrefs = loadPreferencesFromLocalStorage();
        setPreferences(localPrefs);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    }

    loadPreferences();
  }, []);

  // Update preference
  const updatePref = useCallback(<K extends keyof ThemePreferences>(key: K, value: ThemePreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Apply theme to document
  const applyTheme = useCallback(async () => {
    const light = palette.light;
    const dark = palette.dark;
    const radiusVal = borderRadiusOptions[preferences.borderRadius as keyof typeof borderRadiusOptions]?.value || "3px";
    const transitionVal = transitionOptions[preferences.transitionSpeed as keyof typeof transitionOptions]?.value || "120ms";

    // Generate CSS to inject
    const css = `
      :root {
        --primary: ${light.primary};
        --primary-foreground: #FFFFFF;
        --primary-hover: ${light.primaryHover};
        --accent: ${light.accent};
        --accent-foreground: #FFFFFF;
        --accent-hover: ${light.accentHover};
        --soft: ${light.soft};
        --soft-hover: ${light.softHover};
        --success: ${light.success};
        --danger: ${light.danger};
        --warning: ${light.warning};
        --radius-sm: ${Math.max(parseInt(radiusVal) * 0.5, 0)}px;
        --radius-md: ${radiusVal};
        --radius-lg: ${Math.min(parseInt(radiusVal) * 2, 24)}px;
        --transition-fast: ${transitionVal} ease;
        --ring-color: ${light.primary}33;
        --ring-color-accent: ${light.accent}4D;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --primary: ${dark.primary};
          --primary-foreground: #18181B;
          --primary-hover: ${dark.primaryHover};
          --accent: ${dark.accent};
          --accent-foreground: #18181B;
          --accent-hover: ${dark.accentHover};
          --soft: ${dark.soft};
          --soft-hover: ${dark.softHover};
          --success: ${dark.success};
          --danger: ${dark.danger};
          --warning: ${dark.warning};
          --ring-color: ${dark.primary}40;
          --ring-color-accent: ${dark.accent}59;
        }
      }
    `;

    // Remove existing theme style
    const existingStyle = document.getElementById("unwavr-theme-override");
    if (existingStyle) {
      existingStyle.remove();
    }

    // Inject new style
    const styleEl = document.createElement("style");
    styleEl.id = "unwavr-theme-override";
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // Save to localStorage (always)
    savePreferencesToLocalStorage(preferences);

    // Save to API if authenticated
    if (isAuthenticated) {
      setIsSyncing(true);
      const success = await savePreferencesToAPI(preferences);
      setIsSyncing(false);
      if (!success) {
        console.warn("Failed to sync preferences to server");
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [palette, preferences, isAuthenticated]);

  // Reset to default
  const resetTheme = useCallback(async () => {
    const existingStyle = document.getElementById("unwavr-theme-override");
    if (existingStyle) {
      existingStyle.remove();
    }
    localStorage.removeItem(STORAGE_KEY);
    setPreferences(DEFAULT_PREFERENCES);

    // Reset in API if authenticated
    if (isAuthenticated) {
      setIsSyncing(true);
      await savePreferencesToAPI(DEFAULT_PREFERENCES);
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  // Copy CSS
  const copyCSS = useCallback(() => {
    const light = palette.light;
    const dark = palette.dark;
    const css = `/* Light Mode - ${palette.name} */
:root {
  --primary: ${light.primary};
  --primary-foreground: #FFFFFF;
  --primary-hover: ${light.primaryHover};
  --accent: ${light.accent};
  --accent-foreground: #FFFFFF;
  --accent-hover: ${light.accentHover};
  --soft: ${light.soft};
  --soft-hover: ${light.softHover};
  --success: ${light.success};
  --danger: ${light.danger};
  --warning: ${light.warning};
}

/* Dark Mode - ${palette.name} */
@media (prefers-color-scheme: dark) {
  :root {
    --primary: ${dark.primary};
    --primary-foreground: #18181B;
    --primary-hover: ${dark.primaryHover};
    --accent: ${dark.accent};
    --accent-foreground: #18181B;
    --accent-hover: ${dark.accentHover};
    --soft: ${dark.soft};
    --soft-hover: ${dark.softHover};
    --success: ${dark.success};
    --danger: ${dark.danger};
    --warning: ${dark.warning};
  }
}`;
    navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [palette]);


  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Palette size={20} className="text-primary" />
                Design System
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-muted-foreground">テーマをカスタマイズしてアプリに適用</p>
                {isAuthenticated ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-success/10 text-success">
                    <Cloud size={10} />
                    同期中
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">
                    <CloudOff size={10} />
                    ローカル保存
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetTheme}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                リセット
              </button>
              <button
                onClick={copyCSS}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copied ? "コピー済み" : "CSSをコピー"}
              </button>
              <button
                onClick={applyTheme}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved ? (
                  <Check size={14} />
                ) : (
                  <Save size={14} />
                )}
                {isSyncing ? "保存中..." : saved ? "適用済み!" : "アプリに適用"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">
          {/* Left: Controls */}
          <div className="space-y-8">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              {[
                { key: "palette", label: "カラー", icon: Palette },
                { key: "style", label: "スタイル", icon: Sliders },
                { key: "components", label: "コンポーネント", icon: Box },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={clsx(
                    "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    activeTab === key
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "palette" && (
              <div className="space-y-6">
                <SectionHeader icon={Palette} title="カラーパレット" description="アプリ全体のカラーテーマを選択" />
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(colorPalettes).map(([key, p]) => (
                    <OptionCard
                      key={key}
                      selected={preferences.palette === key}
                      onClick={() => updatePref("palette", key)}
                    >
                      <div className="mb-2">
                        <PalettePreviewMini palette={p} isDark={previewDark} />
                      </div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </OptionCard>
                  ))}
                </div>

                {/* Selected Palette Details */}
                <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{palette.name} の詳細</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDark(!previewDark)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg border border-border hover:bg-background transition-colors"
                      >
                        {previewDark ? <Moon size={12} /> : <Sun size={12} />}
                        プレビュー: {previewDark ? "Dark" : "Light"}
                      </button>
                    </div>
                  </div>

                  {/* Dual Mode Preview */}
                  <DualModePreview palette={palette} />

                  {/* Color Swatches (All Colors) */}
                  <div className="pt-3 border-t border-border/50">
                    <div className="text-xs text-muted-foreground mb-2">全カラー ({previewDark ? "Dark Mode" : "Light Mode"})</div>
                    <div className="grid grid-cols-7 gap-2">
                      {Object.entries(previewDark ? palette.dark : palette.light).map(([name, color]) => (
                        <ColorSwatch key={name} color={color} label={name} size="md" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "style" && (
              <div className="space-y-8">
                {/* Border Radius */}
                <div>
                  <SectionHeader icon={Box} title="角の丸み" description="ボタンやカードの角の丸さ" />
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(borderRadiusOptions).map(([key, opt]) => (
                      <OptionCard
                        key={key}
                        selected={preferences.borderRadius === key}
                        onClick={() => updatePref("borderRadius", key)}
                        className="!p-2 min-w-[80px]"
                      >
                        <div
                          className="w-12 h-8 bg-primary/20 border-2 border-primary mb-2"
                          style={{ borderRadius: opt.value }}
                        />
                        <div className="text-xs font-medium text-center">{opt.name}</div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                {/* Shadow Intensity */}
                <div>
                  <SectionHeader icon={Sliders} title="シャドウ" description="影の強さ" />
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(shadowOptions).map(([key, opt]) => (
                      <button
                        key={key}
                        onClick={() => updatePref("shadowIntensity", key)}
                        className={clsx(
                          "px-4 py-2 text-sm font-medium rounded-full border transition-all",
                          preferences.shadowIntensity === key
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transition Speed */}
                <div>
                  <SectionHeader icon={Zap} title="アニメーション速度" description="ホバーやフォーカス時のトランジション" />
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(transitionOptions).map(([key, opt]) => (
                      <button
                        key={key}
                        onClick={() => updatePref("transitionSpeed", key)}
                        className={clsx(
                          "px-4 py-2 text-sm font-medium rounded-full border transition-all",
                          preferences.transitionSpeed === key
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        {opt.name} ({opt.value})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "components" && (
              <div className="space-y-6">
                <SectionHeader icon={Box} title="コンポーネントプレビュー" description="選択したテーマでの各コンポーネントの見た目" />

                {/* Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewDark(false)}
                    className={clsx(
                      "px-3 py-1.5 text-sm rounded-lg transition-all",
                      !previewDark ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
                    )}
                  >
                    <Sun size={14} className="inline mr-1.5" />
                    Light
                  </button>
                  <button
                    onClick={() => setPreviewDark(true)}
                    className={clsx(
                      "px-3 py-1.5 text-sm rounded-lg transition-all",
                      previewDark ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
                    )}
                  >
                    <Moon size={14} className="inline mr-1.5" />
                    Dark
                  </button>
                </div>

                {/* Component Showcase */}
                <div
                  className="p-6 rounded-2xl space-y-8"
                  style={{
                    backgroundColor: previewDark ? "#191919" : "#FFFFFF",
                    border: `1px solid ${previewDark ? "rgba(255,255,255,0.09)" : "#E9E9E7"}`,
                  }}
                >
                  {/* Buttons */}
                  <div>
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: previewDark ? "#9B9A97" : "#787774" }}
                    >
                      Buttons
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="primary">
                        Primary
                      </PreviewButton>
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="accent">
                        Accent
                      </PreviewButton>
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="outline">
                        Outline
                      </PreviewButton>
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="ghost">
                        Ghost
                      </PreviewButton>
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="soft">
                        Soft
                      </PreviewButton>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="primary" icon={<Plus size={14} />}>
                        追加
                      </PreviewButton>
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="accent" icon={<Sparkles size={14} />}>
                        生成
                      </PreviewButton>
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="success" icon={<Check size={14} />}>
                        完了
                      </PreviewButton>
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="danger" icon={<X size={14} />}>
                        削除
                      </PreviewButton>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="primary" size="sm">
                        Small
                      </PreviewButton>
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="primary" size="md">
                        Medium
                      </PreviewButton>
                      <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="primary" size="lg">
                        Large
                      </PreviewButton>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div>
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: previewDark ? "#9B9A97" : "#787774" }}
                    >
                      Inputs
                    </h4>
                    <div className="space-y-3 max-w-sm">
                      <PreviewInput palette={palette} isDark={previewDark} radius={radius} placeholder="テキストを入力..." />
                      <PreviewInput palette={palette} isDark={previewDark} radius={radius} placeholder="検索..." icon={<Search size={16} />} />
                      <PreviewInput palette={palette} isDark={previewDark} radius={radius} placeholder="メールアドレス" icon={<Mail size={16} />} />
                    </div>
                  </div>

                  {/* Chips */}
                  <div>
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: previewDark ? "#9B9A97" : "#787774" }}
                    >
                      Chips & Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <PreviewChip palette={palette} isDark={previewDark} radius={radius} active>アクティブ</PreviewChip>
                      <PreviewChip palette={palette} isDark={previewDark} radius={radius}>タグ1</PreviewChip>
                      <PreviewChip palette={palette} isDark={previewDark} radius={radius}>タグ2</PreviewChip>
                      <PreviewChip palette={palette} isDark={previewDark} radius={radius}>タグ3</PreviewChip>
                    </div>
                  </div>

                  {/* Cards */}
                  <div>
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: previewDark ? "#9B9A97" : "#787774" }}
                    >
                      Cards
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <PreviewCard palette={palette} isDark={previewDark} radius={radius}>
                        <div className="flex items-center gap-2 mb-2">
                          <User size={16} style={{ color: previewDark ? palette.dark.primary : palette.light.primary }} />
                          <span className="font-medium text-sm" style={{ color: previewDark ? "#D4D4D4" : "#37352F" }}>
                            カードタイトル
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: previewDark ? "#9B9A97" : "#787774" }}>
                          これはカードの説明文です。選択したテーマが適用されます。
                        </p>
                      </PreviewCard>
                      <PreviewCard palette={palette} isDark={previewDark} radius={radius}>
                        <div className="flex items-center gap-2 mb-2">
                          <Settings size={16} style={{ color: previewDark ? palette.dark.accent : palette.light.accent }} />
                          <span className="font-medium text-sm" style={{ color: previewDark ? "#D4D4D4" : "#37352F" }}>
                            設定カード
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: previewDark ? "#9B9A97" : "#787774" }}>
                          アクセントカラーも確認できます。
                        </p>
                      </PreviewCard>
                    </div>
                  </div>

                  {/* Toasts */}
                  <div>
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: previewDark ? "#9B9A97" : "#787774" }}
                    >
                      Toasts
                    </h4>
                    <div className="space-y-2">
                      <ToastPreview palette={palette} isDark={previewDark} radius={radius} type="info" />
                      <ToastPreview palette={palette} isDark={previewDark} radius={radius} type="success" />
                      <ToastPreview palette={palette} isDark={previewDark} radius={radius} type="warning" />
                      <ToastPreview palette={palette} isDark={previewDark} radius={radius} type="error" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Eye size={16} />
                ライブプレビュー
              </h2>
              <button
                onClick={() => setPreviewDark(!previewDark)}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {previewDark ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            {/* Preview Panel */}
            <div
              className="rounded-2xl overflow-hidden border"
              style={{
                backgroundColor: previewDark ? "#191919" : "#FFFFFF",
                borderColor: previewDark ? "rgba(255,255,255,0.09)" : "#E9E9E7",
              }}
            >
              {/* Mock App Header */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{
                  backgroundColor: previewDark ? "#202020" : "#F7F7F5",
                  borderBottom: `1px solid ${previewDark ? "rgba(255,255,255,0.09)" : "#E9E9E7"}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: previewDark ? palette.dark.primary : palette.light.primary }}
                >
                  <Zap size={16} className="text-white" />
                </div>
                <span className="font-semibold text-sm" style={{ color: previewDark ? "#D4D4D4" : "#37352F" }}>
                  unwavr
                </span>
              </div>

              {/* Mock Content */}
              <div className="p-4 space-y-4">
                {/* Task Card */}
                <PreviewCard palette={palette} isDark={previewDark} radius={radius}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-sm" style={{ color: previewDark ? "#D4D4D4" : "#37352F" }}>
                        デザインシステムの構築
                      </div>
                      <div className="text-xs mt-1" style={{ color: previewDark ? "#9B9A97" : "#787774" }}>
                        UIコンポーネントの統一
                      </div>
                    </div>
                    <PreviewChip palette={palette} isDark={previewDark} radius={radius} active>
                      進行中
                    </PreviewChip>
                  </div>
                  <div className="flex gap-2">
                    <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="primary" size="sm" icon={<Check size={12} />}>
                      完了
                    </PreviewButton>
                    <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="outline" size="sm">
                      編集
                    </PreviewButton>
                  </div>
                </PreviewCard>

                {/* Quick Add */}
                <div className="space-y-2">
                  <PreviewInput palette={palette} isDark={previewDark} radius={radius} placeholder="新しいタスクを追加..." icon={<Plus size={16} />} />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="accent" icon={<Sparkles size={14} />}>
                    AIで生成
                  </PreviewButton>
                  <PreviewButton palette={palette} isDark={previewDark} radius={radius} variant="soft" icon={<ArrowRight size={14} />}>
                    詳細を見る
                  </PreviewButton>
                </div>
              </div>
            </div>

            {/* Current Selection Summary */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <h3 className="text-sm font-semibold">現在の設定</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">パレット</span>
                  <span className="font-medium">{palette.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">角の丸み</span>
                  <span className="font-medium">
                    {borderRadiusOptions[preferences.borderRadius as keyof typeof borderRadiusOptions]?.name || "Subtle"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">シャドウ</span>
                  <span className="font-medium">
                    {shadowOptions[preferences.shadowIntensity as keyof typeof shadowOptions]?.name || "Normal"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">速度</span>
                  <span className="font-medium">
                    {transitionOptions[preferences.transitionSpeed as keyof typeof transitionOptions]?.name || "Fast"}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex gap-1">
                  {Object.values(previewDark ? palette.dark : palette.light).slice(0, 7).map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 h-6 first:rounded-l-lg last:rounded-r-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

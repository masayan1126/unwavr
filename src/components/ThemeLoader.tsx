"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "unwavr-theme-preferences";

// Color palette definitions (must match button-showcase/page.tsx)
const colorPalettes: Record<string, { light: Record<string, string>; dark: Record<string, string> }> = {
  warmAccent: {
    light: { primary: "#D9730D", primaryHover: "#BF6309", accent: "#37352F", accentHover: "#2D2B27", soft: "#FEF3E2", softHover: "#FDECC8", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#FFA344", primaryHover: "#E89030", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#3D2E1F", softHover: "#4A3828", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmRed: {
    light: { primary: "#C53030", primaryHover: "#9B2C2C", accent: "#37352F", accentHover: "#2D2B27", soft: "#FEF2F2", softHover: "#FEE2E2", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#FC8181", primaryHover: "#F56565", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#3D1F1F", softHover: "#4A2828", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmPink: {
    light: { primary: "#D53F8C", primaryHover: "#B83280", accent: "#37352F", accentHover: "#2D2B27", soft: "#FDF2F8", softHover: "#FCE7F3", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#F687B3", primaryHover: "#ED64A6", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#3D1F2E", softHover: "#4A2838", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmYellow: {
    light: { primary: "#B7791F", primaryHover: "#975A16", accent: "#37352F", accentHover: "#2D2B27", soft: "#FEFCE8", softHover: "#FEF9C3", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#F6E05E", primaryHover: "#ECC94B", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#3D3A1F", softHover: "#4A4628", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmGreen: {
    light: { primary: "#2F855A", primaryHover: "#276749", accent: "#37352F", accentHover: "#2D2B27", soft: "#F0FFF4", softHover: "#C6F6D5", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#68D391", primaryHover: "#48BB78", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#1F3D2A", softHover: "#284A34", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmTeal: {
    light: { primary: "#0D9488", primaryHover: "#0F766E", accent: "#37352F", accentHover: "#2D2B27", soft: "#F0FDFA", softHover: "#CCFBF1", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#5EEAD4", primaryHover: "#2DD4BF", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#1F3D3A", softHover: "#284A46", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmPurple: {
    light: { primary: "#6B46C1", primaryHover: "#553C9A", accent: "#37352F", accentHover: "#2D2B27", soft: "#FAF5FF", softHover: "#E9D8FD", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#B794F4", primaryHover: "#9F7AEA", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#2D1F3D", softHover: "#38284A", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmBlue: {
    light: { primary: "#2B6CB0", primaryHover: "#2C5282", accent: "#37352F", accentHover: "#2D2B27", soft: "#EBF8FF", softHover: "#BEE3F8", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#63B3ED", primaryHover: "#4299E1", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#1F2D3D", softHover: "#28384A", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmIndigo: {
    light: { primary: "#4338CA", primaryHover: "#3730A3", accent: "#37352F", accentHover: "#2D2B27", soft: "#EEF2FF", softHover: "#E0E7FF", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#A5B4FC", primaryHover: "#818CF8", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#262050", softHover: "#312B5A", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmCyan: {
    light: { primary: "#0891B2", primaryHover: "#0E7490", accent: "#37352F", accentHover: "#2D2B27", soft: "#ECFEFF", softHover: "#CFFAFE", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#67E8F9", primaryHover: "#22D3EE", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#164E63", softHover: "#1E6A7A", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmLime: {
    light: { primary: "#65A30D", primaryHover: "#4D7C0F", accent: "#37352F", accentHover: "#2D2B27", soft: "#F7FEE7", softHover: "#ECFCCB", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#BEF264", primaryHover: "#A3E635", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#2D4A0F", softHover: "#3A5A18", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmAmber: {
    light: { primary: "#D97706", primaryHover: "#B45309", accent: "#37352F", accentHover: "#2D2B27", soft: "#FFFBEB", softHover: "#FEF3C7", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#FCD34D", primaryHover: "#FBBF24", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#45320D", softHover: "#5A4216", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmRose: {
    light: { primary: "#E11D48", primaryHover: "#BE123C", accent: "#37352F", accentHover: "#2D2B27", soft: "#FFF1F2", softHover: "#FFE4E6", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#FB7185", primaryHover: "#F43F5E", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#4C0D1F", softHover: "#5E1529", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmFuchsia: {
    light: { primary: "#C026D3", primaryHover: "#A21CAF", accent: "#37352F", accentHover: "#2D2B27", soft: "#FDF4FF", softHover: "#FAE8FF", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#E879F9", primaryHover: "#D946EF", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#4A1052", softHover: "#5C1866", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmViolet: {
    light: { primary: "#7C3AED", primaryHover: "#6D28D9", accent: "#37352F", accentHover: "#2D2B27", soft: "#F5F3FF", softHover: "#EDE9FE", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#C4B5FD", primaryHover: "#A78BFA", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#2E1A5E", softHover: "#3D2472", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmSky: {
    light: { primary: "#0284C7", primaryHover: "#0369A1", accent: "#37352F", accentHover: "#2D2B27", soft: "#F0F9FF", softHover: "#E0F2FE", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#7DD3FC", primaryHover: "#38BDF8", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#0C4A6E", softHover: "#155E85", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmEmerald: {
    light: { primary: "#059669", primaryHover: "#047857", accent: "#37352F", accentHover: "#2D2B27", soft: "#ECFDF5", softHover: "#D1FAE5", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#6EE7B7", primaryHover: "#34D399", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#064E3B", softHover: "#0D6149", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmSlate: {
    light: { primary: "#475569", primaryHover: "#334155", accent: "#37352F", accentHover: "#2D2B27", soft: "#F8FAFC", softHover: "#F1F5F9", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#94A3B8", primaryHover: "#64748B", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#1E293B", softHover: "#2A3A4E", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmStone: {
    light: { primary: "#57534E", primaryHover: "#44403C", accent: "#37352F", accentHover: "#2D2B27", soft: "#FAFAF9", softHover: "#F5F5F4", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#A8A29E", primaryHover: "#78716C", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#292524", softHover: "#3A3532", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmBrown: {
    light: { primary: "#92400E", primaryHover: "#78350F", accent: "#37352F", accentHover: "#2D2B27", soft: "#FEF3C7", softHover: "#FDE68A", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#FCD34D", primaryHover: "#FBBF24", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#451A03", softHover: "#5A2810", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmOlive: {
    light: { primary: "#4D7C0F", primaryHover: "#3F6212", accent: "#37352F", accentHover: "#2D2B27", soft: "#F7FEE7", softHover: "#ECFCCB", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#A3E635", primaryHover: "#84CC16", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#263C0A", softHover: "#344D12", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmCoral: {
    light: { primary: "#EA580C", primaryHover: "#C2410C", accent: "#37352F", accentHover: "#2D2B27", soft: "#FFF7ED", softHover: "#FFEDD5", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#FB923C", primaryHover: "#F97316", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#431407", softHover: "#571D0F", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmPeach: {
    light: { primary: "#F472B6", primaryHover: "#EC4899", accent: "#37352F", accentHover: "#2D2B27", soft: "#FDF2F8", softHover: "#FCE7F3", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#F9A8D4", primaryHover: "#F472B6", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#500724", softHover: "#651030", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmLavender: {
    light: { primary: "#8B5CF6", primaryHover: "#7C3AED", accent: "#37352F", accentHover: "#2D2B27", soft: "#F5F3FF", softHover: "#EDE9FE", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#C4B5FD", primaryHover: "#A78BFA", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#2E1065", softHover: "#3E1A7A", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmMint: {
    light: { primary: "#14B8A6", primaryHover: "#0D9488", accent: "#37352F", accentHover: "#2D2B27", soft: "#F0FDFA", softHover: "#CCFBF1", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#5EEAD4", primaryHover: "#2DD4BF", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#134E4A", softHover: "#1D6560", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmNavy: {
    light: { primary: "#1E3A8A", primaryHover: "#1E40AF", accent: "#37352F", accentHover: "#2D2B27", soft: "#EFF6FF", softHover: "#DBEAFE", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#93C5FD", primaryHover: "#60A5FA", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#172554", softHover: "#1E3A6A", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmCrimson: {
    light: { primary: "#DC2626", primaryHover: "#B91C1C", accent: "#37352F", accentHover: "#2D2B27", soft: "#FEF2F2", softHover: "#FEE2E2", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#F87171", primaryHover: "#EF4444", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#450A0A", softHover: "#5A1414", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
  warmSienna: {
    light: { primary: "#A0522D", primaryHover: "#8B4513", accent: "#37352F", accentHover: "#2D2B27", soft: "#FEF7ED", softHover: "#FDECD5", success: "#059669", danger: "#EB5757", warning: "#F59E0B" },
    dark: { primary: "#D2956B", primaryHover: "#C4825A", accent: "#EBEBEA", accentHover: "#D3D3D2", soft: "#3D2414", softHover: "#4D301C", success: "#10B981", danger: "#EB5757", warning: "#FBBF24" },
  },
};

const borderRadiusOptions: Record<string, string> = {
  sharp: "0px",
  subtle: "3px",
  soft: "6px",
  rounded: "12px",
  pill: "9999px",
};

const transitionOptions: Record<string, string> = {
  instant: "80ms",
  fast: "120ms",
  normal: "200ms",
  smooth: "300ms",
  slow: "400ms",
};

type ThemePreferences = {
  palette: string;
  borderRadius: string;
  shadowIntensity: string;
  transitionSpeed: string;
};

function applyThemeCSS(prefs: ThemePreferences) {
  const palette = colorPalettes[prefs.palette] || colorPalettes.warmAccent;
  const light = palette.light;
  const dark = palette.dark;
  const radiusVal = borderRadiusOptions[prefs.borderRadius] || "3px";
  const transitionVal = transitionOptions[prefs.transitionSpeed] || "120ms";

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
}

export default function ThemeLoader() {
  const { status } = useSession();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;

    async function loadTheme() {
      // First, try localStorage for immediate application
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const prefs = JSON.parse(saved) as ThemePreferences;
          if (prefs.palette && colorPalettes[prefs.palette]) {
            applyThemeCSS(prefs);
          }
        }
      } catch {
        // Ignore localStorage errors
      }

      // If authenticated, try to load from API
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/db/preferences");
          if (res.ok) {
            const data = await res.json();
            if (data.preferences) {
              const prefs: ThemePreferences = {
                palette: data.preferences.theme_palette || "warmAccent",
                borderRadius: data.preferences.border_radius || "subtle",
                shadowIntensity: data.preferences.shadow_intensity || "normal",
                transitionSpeed: data.preferences.transition_speed || "fast",
              };
              if (prefs.palette && colorPalettes[prefs.palette]) {
                applyThemeCSS(prefs);
                // Update localStorage with server data
                localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
              }
            }
          }
        } catch {
          // Ignore API errors, keep localStorage theme
        }
      }

      loadedRef.current = true;
    }

    // Only load after we know the auth status
    if (status !== "loading") {
      loadTheme();
    }
  }, [status]);

  return null;
}

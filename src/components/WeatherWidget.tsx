"use client";
import { useState } from "react";
import Link from "next/link";
import { Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, type LucideIcon, MapPin } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";

type WeatherState = {
  loading: boolean;
  error?: string;
  temperatureC?: number;
  weatherCode?: number;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  isDefaultLocation?: boolean;
};

function codeToWeather(
  code?: number
): { label: string; Icon: LucideIcon; accent: string; bg: string } {
  if (code == null) return { label: "-", Icon: Cloud, accent: "#6b7280", bg: "#6b728020" };
  if (code === 0) return { label: "快晴", Icon: Sun, accent: "#f59e0b", bg: "#f59e0b20" };
  if ([1, 2, 3].includes(code)) return { label: "晴れ/くもり", Icon: CloudSun, accent: "#9ca3af", bg: "#9ca3af20" };
  if ([45, 48].includes(code)) return { label: "霧", Icon: CloudFog, accent: "#94a3b8", bg: "#94a3b820" };
  if ([51, 53, 55].includes(code)) return { label: "霧雨", Icon: CloudDrizzle, accent: "#60a5fa", bg: "#60a5fa20" };
  if ([61, 63, 65, 66, 67].includes(code)) return { label: "雨", Icon: CloudRain, accent: "#3b82f6", bg: "#3b82f620" };
  if ([71, 73, 75, 77].includes(code)) return { label: "雪", Icon: CloudSnow, accent: "#93c5fd", bg: "#93c5fd20" };
  if ([80, 81, 82].includes(code)) return { label: "にわか雨", Icon: CloudRain, accent: "#3b82f6", bg: "#3b82f620" };
  if ([85, 86].includes(code)) return { label: "にわか雪", Icon: CloudSnow, accent: "#93c5fd", bg: "#93c5fd20" };
  if ([95, 96, 99].includes(code)) return { label: "雷雨", Icon: CloudLightning, accent: "#f59e0b", bg: "#f59e0b20" };
  return { label: "-", Icon: Cloud, accent: "#6b7280", bg: "#6b728020" };
}

type WeatherWidgetProps = { variant?: "small" | "large" };

export default function WeatherWidget({ variant = "small" }: WeatherWidgetProps) {
  const state = useWeather();

  const iconSize = variant === "large" ? 28 : 18;
  const tempClass = variant === "large" ? "text-lg font-semibold" : "font-medium";
  const containerClass = variant === "large" ? "px-3 py-2 text-base" : "px-2 py-1 text-sm";

  if (state.loading) {
    return (
      <div className={`flex items-center gap-2 border rounded ${containerClass} opacity-70`} style={{ minHeight: variant === "large" ? "48px" : "32px" }}>
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">天気取得中...</span>
      </div>
    );
  }
  
  if (state.error) {
    return (
      <div className={`flex items-center gap-2 border rounded ${containerClass} opacity-70`} style={{ minHeight: variant === "large" ? "48px" : "32px" }}>
        <span className="text-xs">{state.error}</span>
      </div>
    );
  }
  
  const { label, Icon, accent, bg } = codeToWeather(state.weatherCode);
  
  return (
    <Link
      href="/weather"
      className={`flex items-center gap-2 hover:opacity-80 border rounded ${containerClass} relative`}
      title={`天気の詳細を見る${state.feelsLike ? ` (体感: ${state.feelsLike.toFixed(1)}°C)` : ''}${state.isDefaultLocation ? ' (東京の天気)' : ''}`}
      style={{ 
        backgroundColor: bg, 
        borderColor: accent,
        minHeight: variant === "large" ? "48px" : "32px"
      }}
    >
      <Icon size={iconSize} color={accent} />
      <span className={`${tempClass} tabular-nums`}>{state.temperatureC?.toFixed(1)}°C</span>
      <span className="opacity-80">{label}</span>
      {state.isDefaultLocation && (
        <MapPin size={12} className="opacity-60" title="東京の天気を表示中" />
      )}
    </Link>
  );
}



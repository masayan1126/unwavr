"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, type LucideIcon } from "lucide-react";

type WeatherState = {
  loading: boolean;
  error?: string;
  temperatureC?: number;
  weatherCode?: number;
};

function codeToWeather(
  code?: number
): { label: string; Icon: LucideIcon; accent: string; bg: string } {
  // デフォルトは曇り系の落ち着いた色
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
  const [state, setState] = useState<WeatherState>({ loading: true });

  useEffect(() => {
    let canceled = false;
    if (!navigator.geolocation) {
      setState({ loading: false, error: "位置情報が利用できません" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
          const res = await fetch(url, { cache: "no-store" });
          const data = await res.json();
          if (canceled) return;
          const temp = data?.current?.temperature_2m;
          const code = data?.current?.weather_code;
          setState({ loading: false, temperatureC: typeof temp === "number" ? temp : undefined, weatherCode: code });
        } catch {
          if (!canceled) setState({ loading: false, error: "天気の取得に失敗しました" });
        }
      },
      () => {
        setState({ loading: false, error: "位置情報の許可が必要です" });
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
    return () => {
      canceled = true;
    };
  }, []);

  if (state.loading) {
    return <div className="text-xs opacity-70">天気取得中...</div>;
  }
  if (state.error) {
    return <div className="text-xs opacity-70">{state.error}</div>;
  }
  const { label, Icon, accent, bg } = codeToWeather(state.weatherCode);
  const iconSize = variant === "large" ? 28 : 18;
  const tempClass = variant === "large" ? "text-lg font-semibold" : "font-medium";
  const containerClass = variant === "large" ? "px-3 py-2 text-base" : "px-2 py-1 text-sm";
  return (
    <Link
      href="/weather"
      className={`flex items-center gap-2 hover:opacity-80 border rounded ${containerClass}`}
      title="天気の詳細を見る"
      style={{ backgroundColor: bg, borderColor: accent }}
    >
      <Icon size={iconSize} color={accent} />
      <span className={`${tempClass} tabular-nums`}>{state.temperatureC?.toFixed(1)}°C</span>
      <span className="opacity-80">{label}</span>
    </Link>
  );
}



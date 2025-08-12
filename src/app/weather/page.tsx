"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog } from "lucide-react";

type Current = { temperatureC?: number; weatherCode?: number };
type Daily = { date: string; tMax?: number; tMin?: number; code?: number };

function codeToWeather(code?: number): {
  Icon: React.ComponentType<{ size?: number }>;
  accent: string;
  bg: string;
} {
  // 曇り系をデフォルト
  if (code == null) return { Icon: Cloud, accent: "#6b7280", bg: "#6b728020" };
  if (code === 0) return { Icon: Sun, accent: "#f59e0b", bg: "#f59e0b20" };
  if ([1, 2, 3].includes(code)) return { Icon: CloudSun, accent: "#9ca3af", bg: "#9ca3af20" };
  if ([45, 48].includes(code)) return { Icon: CloudFog, accent: "#94a3b8", bg: "#94a3b820" };
  if ([51, 53, 55].includes(code)) return { Icon: CloudDrizzle, accent: "#60a5fa", bg: "#60a5fa20" };
  if ([61, 63, 65, 66, 67].includes(code)) return { Icon: CloudRain, accent: "#3b82f6", bg: "#3b82f620" };
  if ([71, 73, 75, 77].includes(code)) return { Icon: CloudSnow, accent: "#93c5fd", bg: "#93c5fd20" };
  if ([80, 81, 82].includes(code)) return { Icon: CloudRain, accent: "#3b82f6", bg: "#3b82f620" };
  if ([85, 86].includes(code)) return { Icon: CloudSnow, accent: "#93c5fd", bg: "#93c5fd20" };
  if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, accent: "#f59e0b", bg: "#f59e0b20" };
  return { Icon: Cloud, accent: "#6b7280", bg: "#6b728020" };
}

export default function WeatherPage() {
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null);
  const [current, setCurrent] = useState<Current>({});
  const [daily, setDaily] = useState<Daily[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setErr("位置情報が利用できません");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude;
        const lon = p.coords.longitude;
        setPos({ lat, lon });
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
          const res = await fetch(url, { cache: "no-store" });
          const data = await res.json();
          setCurrent({ temperatureC: data?.current?.temperature_2m, weatherCode: data?.current?.weather_code });
          const days: Daily[] = (data?.daily?.time ?? []).map((t: string, i: number) => ({
            date: t,
            code: data?.daily?.weather_code?.[i],
            tMax: data?.daily?.temperature_2m_max?.[i],
            tMin: data?.daily?.temperature_2m_min?.[i],
          }));
          setDaily(days);
        } catch {
          setErr("天気の取得に失敗しました");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setErr("位置情報の許可が必要です");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">天気</h1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>
      {loading ? (
        <div className="text-sm opacity-70">取得中...</div>
      ) : err ? (
        <div className="text-sm opacity-70">{err}</div>
      ) : (
        <>
          <section className="border rounded p-4 border-black/10 dark:border-white/10">
            <div className="text-sm font-medium mb-2">現在</div>
            <div className="flex items-center gap-3 text-lg">
              {(() => {
                const { Icon, accent, bg } = codeToWeather(current.weatherCode);
                return (
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded border" style={{ backgroundColor: bg, borderColor: accent }}>
                    <Icon size={20} color={accent} />
                  </span>
                );
              })()}
              <div className="font-semibold tabular-nums">{current.temperatureC?.toFixed(1)}°C</div>
            </div>
          </section>
          <section className="border rounded p-4 border-black/10 dark:border-white/10">
            <div className="text-sm font-medium mb-3">週間</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {daily.slice(0, 7).map((d) => {
                const { Icon, accent, bg } = codeToWeather(d.code);
                const date = new Date(d.date);
                const label = `${date.getMonth() + 1}/${date.getDate()}`;
                return (
                  <div key={d.date} className="border rounded p-3 flex flex-col items-center gap-1">
                    <div className="text-sm">{label}</div>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded border" style={{ backgroundColor: bg, borderColor: accent }}>
                      <Icon size={16} color={accent} />
                    </span>
                    <div className="text-xs tabular-nums">
                      {Math.round(d.tMin ?? 0)}° / {Math.round(d.tMax ?? 0)}°
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}



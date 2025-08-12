"use client";
import { useEffect, useState } from "react";

export type WeatherState = {
  loading: boolean;
  error?: string;
  temperatureC?: number;
  weatherCode?: number;
};

export function useWeather() {
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

  return state;
}



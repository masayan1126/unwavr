"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog } from "lucide-react";

type Current = { temperatureC?: number; weatherCode?: number; feelsLike?: number; humidity?: number; windSpeed?: number };
type Daily = { date: string; tMax?: number; tMin?: number; code?: number };

// デフォルト位置（東京）
const DEFAULT_LOCATION = {
  lat: 35.6762,
  lon: 139.6503
};

function codeToWeather(code?: number): {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
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

// OpenWeatherMap APIの天気コードをOpen-Meteo形式に変換
function convertWeatherCode(owmCode: number): number {
  // OpenWeatherMap: https://openweathermap.org/weather-conditions
  // Open-Meteo: https://open-meteo.com/en/docs
  const codeMap: { [key: number]: number } = {
    200: 95, // thunderstorm with light rain
    201: 95, // thunderstorm with rain
    202: 99, // thunderstorm with heavy rain
    210: 95, // light thunderstorm
    211: 95, // thunderstorm
    212: 99, // heavy thunderstorm
    221: 99, // ragged thunderstorm
    230: 95, // thunderstorm with light drizzle
    231: 95, // thunderstorm with drizzle
    232: 99, // thunderstorm with heavy drizzle
    300: 51, // light intensity drizzle
    301: 53, // drizzle
    302: 55, // heavy intensity drizzle
    310: 51, // light intensity drizzle rain
    311: 53, // drizzle rain
    312: 55, // heavy intensity drizzle rain
    313: 53, // shower rain and drizzle
    314: 55, // heavy shower rain and drizzle
    321: 53, // shower drizzle
    500: 51, // light rain
    501: 53, // moderate rain
    502: 55, // heavy intensity rain
    503: 65, // very heavy rain
    504: 65, // extreme rain
    511: 66, // freezing rain
    520: 80, // light intensity shower rain
    521: 81, // shower rain
    522: 82, // heavy intensity shower rain
    531: 82, // ragged shower rain
    600: 71, // light snow
    601: 73, // snow
    602: 75, // heavy snow
    611: 66, // sleet
    612: 66, // light shower sleet
    613: 66, // shower sleet
    615: 66, // light rain and snow
    616: 66, // rain and snow
    620: 71, // light shower snow
    621: 73, // shower snow
    622: 75, // heavy shower snow
    701: 45, // mist
    711: 45, // smoke
    721: 45, // haze
    731: 45, // sand/dust whirls
    741: 48, // fog
    751: 45, // sand
    761: 45, // dust
    762: 45, // volcanic ash
    771: 45, // squalls
    781: 45, // tornado
    800: 0,  // clear sky
    801: 1,  // few clouds
    802: 2,  // scattered clouds
    803: 3,  // broken clouds
    804: 3,  // overcast clouds
  };
  return codeMap[owmCode] ?? 3;
}

export default function WeatherPage() {
  const [current, setCurrent] = useState<Current>({});
  const [daily, setDaily] = useState<Daily[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDefaultLocation, setIsDefaultLocation] = useState(false);

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {


      // APIプロキシエンドポイントを使用
      const url = `/api/weather?lat=${lat}&lon=${lon}`;



      const res = await fetch(url, {
        method: 'GET',
        cache: "no-store",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });



      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error Response:', errorData);
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const responseData = await res.json();
      const data = responseData.data;


      if (responseData.source === 'openweathermap') {
        // OpenWeatherMap API レスポンス
        setCurrent({
          temperatureC: data.main?.temp,
          weatherCode: convertWeatherCode(data.weather?.[0]?.id ?? 0),
          feelsLike: data.main?.feels_like,
          humidity: data.main?.humidity,
          windSpeed: data.wind?.speed
        });

        // 週間予報も取得
        const forecastUrl = `/api/weather/forecast?lat=${lat}&lon=${lon}`;


        const forecastRes = await fetch(forecastUrl, {
          method: 'GET',
          cache: "no-store"
        });

        if (!forecastRes.ok) {
          console.warn('Forecast API failed, using current weather only');
        } else {
          const forecastResponseData = await forecastRes.json();
          const forecastData = forecastResponseData.data;


          // 5日間の予報を日別に集約
          type ForecastItem = { dt: number; main: { temp: number }; weather?: Array<{ id?: number }> };
          const list: ForecastItem[] = Array.isArray(forecastData.list) ? forecastData.list : [];
          const dailyData: Daily[] = list.reduce<Daily[]>((acc, item) => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0];
            const existing = acc.find(d => d.date === date);
            if (existing) {
              existing.tMax = Math.max(existing.tMax ?? item.main.temp, item.main.temp);
              existing.tMin = Math.min(existing.tMin ?? item.main.temp, item.main.temp);
            } else {
              acc.push({
                date,
                tMax: item.main.temp,
                tMin: item.main.temp,
                code: convertWeatherCode(item.weather?.[0]?.id ?? 0)
              });
            }
            return acc;
          }, []);

          setDaily(dailyData?.slice(0, 7) ?? []);
        }
      } else {
        // Open-Meteo API レスポンス（フォールバック）
        setCurrent({
          temperatureC: data?.current?.temperature_2m,
          weatherCode: data?.current?.weather_code,
          humidity: data?.current?.relative_humidity_2m,
          windSpeed: data?.current?.wind_speed_10m
        });

        const days: Daily[] = (data?.daily?.time ?? []).map((t: string, i: number) => ({
          date: t,
          code: data?.daily?.weather_code?.[i],
          tMax: data?.daily?.temperature_2m_max?.[i],
          tMin: data?.daily?.temperature_2m_min?.[i],
        }));
        setDaily(days);
      }

      setLastUpdated(new Date());
      setIsDefaultLocation(false);
    } catch (error) {
      console.error('Weather fetch error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      let errorMessage = "天気の取得に失敗しました";

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = "ネットワーク接続エラーです。インターネット接続を確認してください。";
      } else if (error instanceof Error) {
        if (error.message.includes('HTTP error! status: 401')) {
          errorMessage = "APIキーが無効です。設定を確認してください。";
        } else if (error.message.includes('HTTP error! status: 429')) {
          errorMessage = "APIリクエスト制限に達しました。しばらく待ってから再試行してください。";
        } else if (error.message.includes('HTTP error! status: 5')) {
          errorMessage = "サーバーエラーです。しばらく待ってから再試行してください。";
        }
      }

      setErr(errorMessage);
    }
  };

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
        await fetchWeatherData(lat, lon);
        setLoading(false);
      },
      (geolocationError) => {
        // エラーオブジェクトの詳細情報を取得
        const errorDetails = {
          error: geolocationError,
          code: geolocationError.code,
          message: geolocationError.message,
          PERMISSION_DENIED: geolocationError.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: geolocationError.POSITION_UNAVAILABLE,
          TIMEOUT: geolocationError.TIMEOUT,
          // エラーオブジェクトの全プロパティを確認
          allProperties: Object.getOwnPropertyNames(geolocationError),
          // エラーオブジェクトの文字列表現
          errorString: geolocationError.toString(),
          // エラーオブジェクトのJSON表現（可能な場合）
          errorJSON: (() => {
            try {
              return JSON.stringify(geolocationError, Object.getOwnPropertyNames(geolocationError));
            } catch (e) {
              const errorMessage = e instanceof Error ? e.message : 'Unknown error';
              return 'JSON.stringify failed: ' + errorMessage;
            }
          })()
        };

        console.error('Geolocation error details:', errorDetails);

        // 位置情報エラーの場合、デフォルト位置で天気を取得



        // 位置情報エラーの場合、デフォルト位置で天気を取得
        setIsDefaultLocation(true);
        fetchWeatherData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5分間キャッシュ
      }
    );
  }, []);

  const handleRefresh = async () => {
    if (!navigator.geolocation) return;

    setLoading(true);
    setErr(null);

    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude;
        const lon = p.coords.longitude;
        await fetchWeatherData(lat, lon);
        setLoading(false);
      },
      (geolocationError) => {
        // エラーオブジェクトの詳細情報を取得
        const errorDetails = {
          error: geolocationError,
          code: geolocationError.code,
          message: geolocationError.message,
          PERMISSION_DENIED: geolocationError.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: geolocationError.POSITION_UNAVAILABLE,
          TIMEOUT: geolocationError.TIMEOUT,
          // エラーオブジェクトの全プロパティを確認
          allProperties: Object.getOwnPropertyNames(geolocationError),
          // エラーオブジェクトの文字列表現
          errorString: geolocationError.toString(),
          // エラーオブジェクトのJSON表現（可能な場合）
          errorJSON: (() => {
            try {
              return JSON.stringify(geolocationError, Object.getOwnPropertyNames(geolocationError));
            } catch (e) {
              const errorMessage = e instanceof Error ? e.message : 'Unknown error';
              return 'JSON.stringify failed: ' + errorMessage;
            }
          })()
        };

        console.error('Geolocation error on refresh:', errorDetails);

        let errorMessage = "位置情報の取得に失敗しました";
        const errorCode = geolocationError.code;

        switch (errorCode) {
          case geolocationError.PERMISSION_DENIED:
            errorMessage = "位置情報の許可が拒否されました。ブラウザの設定で位置情報を許可してください。";
            break;
          case geolocationError.POSITION_UNAVAILABLE:
            errorMessage = "位置情報を取得できませんでした。GPSが無効になっている可能性があります。";
            break;
          case geolocationError.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました。ネットワーク接続を確認してください。";
            break;
          default:
            errorMessage = `位置情報エラーが発生しました (コード: ${errorCode})。ブラウザの設定を確認してください。`;
            break;
        }


        setErr(errorMessage);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">天気</h1>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs opacity-60">
              更新: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-sm underline opacity-80 hover:opacity-100 disabled:opacity-40"
          >
            更新
          </button>
          <Link className="text-sm underline opacity-80" href="/">
            ホーム
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="text-sm opacity-70">取得中...</div>
      ) : err ? (
        <div className="text-sm opacity-70">{err}</div>
      ) : (
        <>
          {isDefaultLocation && (
            <div className="border rounded p-3 border-[var(--warning)]/20 bg-[var(--warning)]/10">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--warning)]">📍</span>
                <span>東京の天気を表示中</span>
              </div>
              <p className="text-xs opacity-70 mt-1">
                位置情報の許可が必要です。ブラウザの設定で位置情報を許可すると、現在地の天気を表示できます。
              </p>
            </div>
          )}
          <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
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
            {(current.feelsLike || current.humidity || current.windSpeed) && (
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                {current.feelsLike && (
                  <div>
                    <div className="opacity-60">体感温度</div>
                    <div className="font-medium">{current.feelsLike.toFixed(1)}°C</div>
                  </div>
                )}
                {current.humidity && (
                  <div>
                    <div className="opacity-60">湿度</div>
                    <div className="font-medium">{current.humidity}%</div>
                  </div>
                )}
                {current.windSpeed && (
                  <div>
                    <div className="opacity-60">風速</div>
                    <div className="font-medium">{current.windSpeed.toFixed(1)}m/s</div>
                  </div>
                )}
              </div>
            )}
          </section>
          <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
            <div className="text-sm font-medium mb-3">週間</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {daily.slice(0, 7).map((d) => {
                const { Icon, accent, bg } = codeToWeather(d.code);
                const date = new Date(d.date);
                const label = `${date.getMonth() + 1}/${date.getDate()}`;
                return (
                  <div key={d.date} className="bg-card rounded-lg p-3 shadow-sm flex flex-col items-center gap-1">
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



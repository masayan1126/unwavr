"use client";
import { useEffect, useState } from "react";

export type WeatherState = {
  loading: boolean;
  error?: string;
  temperatureC?: number;
  weatherCode?: number;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  isDefaultLocation?: boolean;
};

// OpenWeatherMap APIの天気コードをOpen-Meteo形式に変換
function convertWeatherCode(owmCode: number): number {
  const codeMap: { [key: number]: number } = {
    200: 95, 201: 95, 202: 99, 210: 95, 211: 95, 212: 99, 221: 99,
    230: 95, 231: 95, 232: 99, 300: 51, 301: 53, 302: 55, 310: 51,
    311: 53, 312: 55, 313: 53, 314: 55, 321: 53, 500: 51, 501: 53,
    502: 55, 503: 65, 504: 65, 511: 66, 520: 80, 521: 81, 522: 82,
    531: 82, 600: 71, 601: 73, 602: 75, 611: 66, 612: 66, 613: 66,
    615: 66, 616: 66, 620: 71, 621: 73, 622: 75, 701: 45, 711: 45,
    721: 45, 731: 45, 741: 48, 751: 45, 761: 45, 762: 45, 771: 45,
    781: 45, 800: 0, 801: 1, 802: 2, 803: 3, 804: 3,
  };
  return codeMap[owmCode] ?? 3;
}

// デフォルト位置（東京）
const DEFAULT_LOCATION = {
  lat: 35.6762,
  lon: 139.6503
};

export function useWeather() {
  const [state, setState] = useState<WeatherState>({ loading: true });

  const fetchWeatherData = async (lat: number, lon: number, isDefault = false) => {
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
        setState({
          loading: false,
          temperatureC: data.main?.temp,
          weatherCode: convertWeatherCode(data.weather?.[0]?.id ?? 0),
          feelsLike: data.main?.feels_like,
          humidity: data.main?.humidity,
          windSpeed: data.wind?.speed,
          isDefaultLocation: isDefault
        });
      } else {
        // Open-Meteo API レスポンス（フォールバック）
        const temp = data?.current?.temperature_2m;
        const code = data?.current?.weather_code;
        setState({
          loading: false,
          temperatureC: typeof temp === "number" ? temp : undefined,
          weatherCode: code,
          humidity: data?.current?.relative_humidity_2m,
          windSpeed: data?.current?.wind_speed_10m,
          isDefaultLocation: isDefault
        });
      }
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

      setState({ loading: false, error: errorMessage, isDefaultLocation: isDefault });
    }
  };

  useEffect(() => {
    let canceled = false;

    // 位置情報の許可状態を確認
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {

        permissionStatus.onchange = () => {

        };
      });
    }

    if (!navigator.geolocation) {

      fetchWeatherData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (canceled) return;
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        await fetchWeatherData(lat, lon, false);
      },
      (geolocationError) => {
        // エラーオブジェクトの詳細情報を取得
        const errorDetails = {
          code: geolocationError.code,
          message: geolocationError.message,
          PERMISSION_DENIED: geolocationError.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: geolocationError.POSITION_UNAVAILABLE,
          TIMEOUT: geolocationError.TIMEOUT,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        };

        console.error('Geolocation error details:', errorDetails);

        let errorMessage = "位置情報の許可が必要です";
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



        // 位置情報エラーの場合、デフォルト位置で天気を取得
        if (!canceled) {

          fetchWeatherData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, true);
        }
      },
      {
        enableHighAccuracy: false, // より確実に位置情報を取得するためfalseに変更
        timeout: 10000, // タイムアウトを短縮
        maximumAge: 600000 // 10分間キャッシュ
      }
    );

    return () => {
      canceled = true;
    };
  }, []);

  return state;
}



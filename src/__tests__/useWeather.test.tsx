import { renderHook, waitFor } from '@testing-library/react';
import { useWeather } from '@/hooks/useWeather';

describe('天気取得フック useWeather', () => {
  beforeEach(() => {
    // 環境変数をモック
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY = 'test_api_key';
    
    // @ts-expect-error - test-only: mock fetch to return simplified shape
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ 
        data: {
          main: { 
            temp: 20.5, 
            feels_like: 22.1,
            humidity: 65
          },
          weather: [{ id: 800 }],
          wind: { speed: 3.2 }
        },
        source: 'openweathermap',
        timestamp: new Date().toISOString()
      })
    }));
    // @ts-expect-error - test-only: JSDOM lacks geolocation, inject mock
    global.navigator.geolocation = {
      getCurrentPosition: (success: PositionCallback) => {
        // @ts-expect-error - test-only: simplify coords object
        success({ coords: { latitude: 35, longitude: 139 } });
      },
    } as Geolocation;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  });

  it('OpenWeather API で温度/コード等を取得できる', async () => {
    const { result } = renderHook(() => useWeather());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.temperatureC).toBe(20.5);
    expect(result.current.weatherCode).toBe(0); // 800 -> 0 (clear sky)
    expect(result.current.feelsLike).toBe(22.1);
    expect(result.current.humidity).toBe(65);
    expect(result.current.windSpeed).toBe(3.2);
    expect(result.current.error).toBeUndefined();
  });

  it('APIキーがない場合 Open-Meteo にフォールバックする', async () => {
    delete process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    
    // @ts-expect-error test: mock fetch error response
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ 
        data: {
          current: { 
            temperature_2m: 18.3, 
            weather_code: 1,
            relative_humidity_2m: 70,
            wind_speed_10m: 2.5
          }
        },
        source: 'open-meteo',
        timestamp: new Date().toISOString()
      })
    }));
    
    const { result } = renderHook(() => useWeather());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.temperatureC).toBe(18.3);
    expect(result.current.weatherCode).toBe(1);
    expect(result.current.humidity).toBe(70);
    expect(result.current.windSpeed).toBe(2.5);
    expect(result.current.error).toBeUndefined();
  });

  it('HTTP エラー時にユーザー向けエラー文言を返す', async () => {
    // @ts-expect-error - test-only: mock fetch error response
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    }));
    
    const { result } = renderHook(() => useWeather());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("サーバーエラーです。しばらく待ってから再試行してください。");
  });
});



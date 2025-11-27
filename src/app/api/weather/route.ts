import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    let url: string;
    let isOpenWeatherMap = false;

    if (apiKey) {
      // OpenWeatherMap API
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`;
      isOpenWeatherMap = true;
    } else {
      // Open-Meteo API (fallback)
      url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    }



    async function tryFetch(u: string, attempts: number = 2): Promise<Response> {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i++) {
        try {
          const ac = new AbortController();
          const t = setTimeout(() => ac.abort(), 4000);
          const res = await fetch(u, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'unwavr-weather-app/1.0'
            },
            signal: ac.signal
          });
          clearTimeout(t);
          return res;
        } catch (e) {
          lastErr = e;
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      throw lastErr ?? new Error('fetch failed');
    }

    const response = await tryFetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weather API error:', { status: response.status, error: errorText });
      return NextResponse.json(
        { error: `Weather API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();


    return NextResponse.json({
      data,
      source: isOpenWeatherMap ? 'openweathermap' : 'open-meteo',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weather API proxy error:', error);
    // フォールバック: OpenWeatherMap失敗時にOpen-Meteoへ切替、逆も試行
    try {
      const fallbackUrl = apiKey
        ? `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        : (process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
          ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric&lang=ja`
          : '');
      if (!fallbackUrl) throw error;
      const res2 = await fetch(fallbackUrl, { headers: { 'Accept': 'application/json', 'User-Agent': 'unwavr-weather-app/1.0' } });
      if (res2.ok) {
        const data = await res2.json();
        return NextResponse.json({ data, source: apiKey ? 'open-meteo' : 'openweathermap', timestamp: new Date().toISOString(), degraded: true });
      }
      throw error;
    } catch {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 500 }
      );
    }
  }
}

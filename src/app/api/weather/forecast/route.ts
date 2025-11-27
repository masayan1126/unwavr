import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'OpenWeatherMap API key required for forecast' }, { status: 400 });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`;



    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'unwavr-weather-app/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weather forecast API error:', { status: response.status, error: errorText });
      return NextResponse.json(
        { error: `Weather forecast API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();


    return NextResponse.json({
      data,
      source: 'openweathermap',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weather forecast API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather forecast data' },
      { status: 500 }
    );
  }
}

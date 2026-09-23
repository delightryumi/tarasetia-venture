import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') || '-6.2088';
    const lon = searchParams.get('lon') || '106.8456';
    const apiKey = process.env.WEATHER_API;

    if (!apiKey) {
      return NextResponse.json({ error: 'Weather API key not configured' }, { status: 503 });
    }

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=metric&appid=${apiKey}`,
      { next: { revalidate: 600 } } // Cache for 10 minutes to save API quotas
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal weather service error' }, { status: 500 });
  }
}

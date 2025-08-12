import { renderHook, waitFor } from '@testing-library/react';
import { useWeather } from '@/hooks/useWeather';

describe('useWeather', () => {
  beforeEach(() => {
    // @ts-expect-error mock
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ current: { temperature_2m: 20.5, weather_code: 1 } })
    }));
    // @ts-expect-error mock
    global.navigator.geolocation = {
      getCurrentPosition: (success: PositionCallback) => {
        // @ts-expect-error
        success({ coords: { latitude: 35, longitude: 139 } });
      },
    } as Geolocation;
  });

  it('returns temperature and weather code', async () => {
    const { result } = renderHook(() => useWeather());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.temperatureC).toBe(20.5);
    expect(result.current.weatherCode).toBe(1);
    expect(result.current.error).toBeUndefined();
  });
});



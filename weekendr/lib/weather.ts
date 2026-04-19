import type { WeekendWeather, DayWeather } from "@/types";

const LAT = -37.8136;
const LON = 144.9631;

const WMO: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Icy fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  80: "Showers", 81: "Showers", 82: "Heavy showers",
  95: "Thunderstorm", 96: "Storms with hail",
};

function wmo(code: number) { return WMO[code] ?? "Variable conditions"; }

export async function getMelbourneWeekend(): Promise<WeekendWeather> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&timezone=Australia%2FMelbourne&forecast_days=7`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const j = await res.json();
    const { time, temperature_2m_max: max, temperature_2m_min: min, precipitation_sum: rain, weathercode: code } = j.daily;

    const today = new Date();
    const satOffset = (6 - today.getDay() + 7) % 7 || 7;
    const si = Math.min(satOffset, time.length - 1);
    const su = Math.min(si + 1, time.length - 1);

    const build = (i: number): DayWeather => ({
      date: time[i],
      max_temp: Math.round(max[i]),
      min_temp: Math.round(min[i]),
      description: wmo(code[i]),
      rain_mm: Math.round(rain[i] * 10) / 10,
    });

    return { saturday: build(si), sunday: build(su) };
  } catch {
    return {
      saturday: { date: "", max_temp: 19, min_temp: 12, description: "Mild and pleasant", rain_mm: 0 },
      sunday:   { date: "", max_temp: 17, min_temp: 11, description: "Partly cloudy",     rain_mm: 0 },
    };
  }
}

export function weatherSummary(w: WeekendWeather): string {
  const { saturday: sat, sunday: sun } = w;
  return (
    `Saturday: ${sat.description}, ${sat.min_temp}–${sat.max_temp}°C` +
    (sat.rain_mm > 1 ? `, ${sat.rain_mm}mm rain expected` : "") +
    `. Sunday: ${sun.description}, ${sun.min_temp}–${sun.max_temp}°C` +
    (sun.rain_mm > 1 ? `, ${sun.rain_mm}mm rain expected` : "") + "."
  );
}

// Returns true if weather shifted significantly between generation and Saturday morning
export function significantWeatherChange(
  original: DayWeather,
  current: DayWeather
): boolean {
  const tempShift = Math.abs(original.max_temp - current.max_temp) > 4;
  const rainAppeared = original.rain_mm < 2 && current.rain_mm >= 5;
  const clearingUp = original.rain_mm >= 5 && current.rain_mm < 2;
  return tempShift || rainAppeared || clearingUp;
}

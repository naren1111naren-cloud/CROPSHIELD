import { TN_DISTRICT_GEODATA, getDistrictGeo, DistrictGeo } from '../config/tamilNaduDistricts';
import { apiFetch } from '../lib/apiClient';

export interface CurrentWeatherState {
  time: string;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  precipitation: number;
  rain: number;
  weatherCode: number;
  weatherDescription: string;
  weatherDescriptionTamil: string;
  cloudCover: number;
  windSpeed: number;
  isDay: boolean;
}

export interface DailyForecastDay {
  date: string;
  dayOfWeek: string;
  dayOfWeekTamil: string;
  weatherCode: number;
  weatherDescription: string;
  weatherDescriptionTamil: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
}

export interface RealWeatherData {
  district: string;
  districtTamil: string;
  zone: string;
  zoneTamil: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current: CurrentWeatherState;
  daily: DailyForecastDay[];
  lastUpdated: string;
  cachedAt?: number;
  isStale: boolean;
  source: string;
  attribution: string;
}

// WMO Weather Interpretation Codes according to WMO Code 4677 standard
export function decodeWmoWeather(code: number): { en: string; ta: string } {
  switch (code) {
    case 0:
      return { en: 'Clear Sky', ta: 'தெளிவான வானம்' };
    case 1:
      return { en: 'Mainly Clear', ta: 'பெரும்பாலும் தெளிவான வானம்' };
    case 2:
      return { en: 'Partly Cloudy', ta: 'பகுதி மேகமூட்டம்' };
    case 3:
      return { en: 'Overcast', ta: 'முழு மேகமூட்டம்' };
    case 45:
    case 48:
      return { en: 'Fog & Depositing Rime', ta: 'அடர்ந்த பனிமூட்டம்' };
    case 51:
      return { en: 'Light Drizzle', ta: 'லேசான தூறல்' };
    case 53:
      return { en: 'Moderate Drizzle', ta: 'மிதமான தூறல்' };
    case 55:
      return { en: 'Dense Drizzle', ta: 'அடர்ந்த தூறல்' };
    case 61:
      return { en: 'Slight Rain', ta: 'லேசான மழை' };
    case 63:
      return { en: 'Moderate Rain', ta: 'மிதமான மழை' };
    case 65:
      return { en: 'Heavy Rain', ta: 'கனமழை' };
    case 80:
      return { en: 'Slight Rain Showers', ta: 'லேசான மழைச்சாரல்' };
    case 81:
      return { en: 'Moderate Rain Showers', ta: 'மிதமான மழைச்சாரல்' };
    case 82:
      return { en: 'Violent Rain Showers', ta: 'தீவிர மழைச்சாரல்' };
    case 95:
      return { en: 'Thunderstorm', ta: 'இடியுடன் கூடிய மழை' };
    case 96:
    case 99:
      return { en: 'Thunderstorm with Hail', ta: 'ஆலங்கட்டி இடிமழை' };
    default:
      return { en: 'Scattered Cloudiness', ta: 'சிதறிய மேகங்கள்' };
  }
}

const DAY_NAMES: Record<number, { en: string; ta: string }> = {
  0: { en: 'Sun', ta: 'ஞாயிறு' },
  1: { en: 'Mon', ta: 'திங்கள்' },
  2: { en: 'Tue', ta: 'செவ்வாய்' },
  3: { en: 'Wed', ta: 'புதன்' },
  4: { en: 'Thu', ta: 'வியாழன்' },
  5: { en: 'Fri', ta: 'வெள்ளி' },
  6: { en: 'Sat', ta: 'சனி' },
};

// Client-side cache (30 minutes TTL per district)
const CACHE_TTL_MS = 30 * 60 * 1000;
const weatherCache = new Map<string, { timestamp: number; data: RealWeatherData }>();

/**
 * Fetch real, verified meteorological data for any Tamil Nadu district.
 * Uses server-side proxy /api/weather or falls back directly to Open-Meteo.
 */
export async function getDistrictWeather(districtName: string): Promise<RealWeatherData> {
  const geo = getDistrictGeo(districtName);
  const cacheKey = geo.name.toLowerCase();

  // Check cache first
  const cached = weatherCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.data,
      isStale: false,
    };
  }

  try {
    // Try server-side proxy endpoint first (same-origin in dev, Render in production)
    const proxyUrl = `/api/weather?district=${encodeURIComponent(geo.name)}`;
    const response = await apiFetch(proxyUrl);

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        weatherCache.set(cacheKey, { timestamp: now, data: json.data });
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[CropShield] Server-side weather proxy unavailable, falling back to direct Open-Meteo:', err);
  }

  // Fallback: Direct call to Open-Meteo public API with full parameters
  try {
    const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FKolkata&forecast_days=5`;

    const res = await fetch(directUrl);
    if (!res.ok) {
      throw new Error(`Open-Meteo meteorological service returned status ${res.status}`);
    }

    const raw = await res.json();
    const parsed = parseOpenMeteoResponse(raw, geo);

    weatherCache.set(cacheKey, { timestamp: now, data: parsed });
    return parsed;
  } catch (error: any) {
    // If cached version exists, return it with isStale = true
    if (cached) {
      return {
        ...cached.data,
        isStale: true,
      };
    }
    throw new Error(
      error.message ||
        `Could not retrieve live weather for ${geo.name}. Please check your internet connection.`
    );
  }
}

/**
 * Parses the raw Open-Meteo JSON into CropShield's RealWeatherData structure
 */
export function parseOpenMeteoResponse(raw: any, geo: DistrictGeo): RealWeatherData {
  const current = raw.current || {};
  const daily = raw.daily || {};

  const currentWmo = decodeWmoWeather(current.weather_code ?? 0);

  const forecastDays: DailyForecastDay[] = [];
  const times: string[] = daily.time || [];

  for (let i = 0; i < times.length; i++) {
    const dateStr = times[i];
    const dateObj = new Date(dateStr);
    const dayIndex = dateObj.getDay();
    const dayName = DAY_NAMES[dayIndex] || { en: 'Day', ta: 'நாள்' };

    const code = daily.weather_code?.[i] ?? 0;
    const wmo = decodeWmoWeather(code);

    forecastDays.push({
      date: dateStr,
      dayOfWeek: dayName.en,
      dayOfWeekTamil: dayName.ta,
      weatherCode: code,
      weatherDescription: wmo.en,
      weatherDescriptionTamil: wmo.ta,
      tempMax: Math.round((daily.temperature_2m_max?.[i] ?? 30) * 10) / 10,
      tempMin: Math.round((daily.temperature_2m_min?.[i] ?? 24) * 10) / 10,
      precipitationSum: Math.round((daily.precipitation_sum?.[i] ?? 0) * 10) / 10,
      precipitationProbabilityMax: daily.precipitation_probability_max?.[i] ?? 0,
      windSpeedMax: Math.round((daily.wind_speed_10m_max?.[i] ?? 10) * 10) / 10,
    });
  }

  // Format timestamp in Indian Standard Time (IST)
  const now = new Date();
  const lastUpdated = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return {
    district: geo.name,
    districtTamil: geo.nameTamil,
    zone: geo.zone,
    zoneTamil: geo.zoneTamil,
    latitude: geo.latitude,
    longitude: geo.longitude,
    elevation: raw.elevation ?? 0,
    timezone: raw.timezone || 'Asia/Kolkata',
    current: {
      time: current.time || now.toISOString(),
      temperature: Math.round((current.temperature_2m ?? 28) * 10) / 10,
      apparentTemperature: Math.round((current.apparent_temperature ?? 30) * 10) / 10,
      relativeHumidity: current.relative_humidity_2m ?? 75,
      precipitation: Math.round((current.precipitation ?? 0) * 10) / 10,
      rain: Math.round((current.rain ?? 0) * 10) / 10,
      weatherCode: current.weather_code ?? 0,
      weatherDescription: currentWmo.en,
      weatherDescriptionTamil: currentWmo.ta,
      cloudCover: current.cloud_cover ?? 50,
      windSpeed: Math.round((current.wind_speed_10m ?? 12) * 10) / 10,
      isDay: Boolean(current.is_day ?? 1),
    },
    daily: forecastDays,
    lastUpdated,
    cachedAt: Date.now(),
    isStale: false,
    source: 'Open-Meteo High-Resolution Numerical Weather Prediction API',
    attribution: 'Weather data provided by Open-Meteo.com under Creative Commons Attribution 4.0 International (CC BY 4.0)',
  };
}

import { TN_DISTRICT_GEODATA, getDistrictGeo, DistrictGeo } from '../config/tamilNaduDistricts';
import { apiFetch } from '../lib/apiClient';
import {
  AgriculturalRiskReport,
  FarmWeatherReport,
  getWindCompass,
  calculateAgriculturalRisks,
} from '../../server/weatherIntelligenceService';

export type { AgriculturalRiskReport, FarmWeatherReport };
export { getWindCompass, calculateAgriculturalRisks };

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
  windDirection?: number;
  windDirectionCompass?: string;
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
  windDirectionDominant?: number;
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
  isFarmCoordinate?: boolean;
  locationName?: string;
  forecastPeriod?: string;
  risks?: AgriculturalRiskReport;
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

  const windDir = current.wind_direction_10m ?? 90;
  const windDirCompass = getWindCompass(windDir);

  const risks = calculateAgriculturalRisks(current, forecastDays);

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
      windDirection: windDir,
      windDirectionCompass: windDirCompass,
      isDay: Boolean(current.is_day ?? 1),
    },
    daily: forecastDays,
    lastUpdated,
    cachedAt: Date.now(),
    isStale: false,
    source: 'Open-Meteo High-Resolution Numerical Weather Prediction API',
    attribution: 'Weather data provided by Open-Meteo.com under Creative Commons Attribution 4.0 International (CC BY 4.0)',
    isFarmCoordinate: false,
    locationName: `${geo.name} District`,
    forecastPeriod: `${forecastDays[0]?.date || 'Today'} to ${forecastDays[forecastDays.length - 1]?.date || '5 Days'}`,
    risks,
  };
}

/**
 * Fetch farm-specific meteorological and agricultural risk intelligence.
 * Uses exact parcel coordinates when available, falling back to district centroid.
 */
export async function getFarmWeatherIntelligence(options: {
  latitude?: number;
  longitude?: number;
  district?: string;
  locationName?: string;
  cropType?: string;
  cropStage?: string;
}): Promise<FarmWeatherReport> {
  const params = new URLSearchParams();
  if (options.latitude !== undefined && options.longitude !== undefined) {
    params.set('lat', String(options.latitude));
    params.set('lng', String(options.longitude));
  }
  if (options.district) params.set('district', options.district);
  if (options.locationName) params.set('locationName', options.locationName);
  if (options.cropType) params.set('cropType', options.cropType);
  if (options.cropStage) params.set('cropStage', options.cropStage);

  try {
    const res = await apiFetch(`/api/weather?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && (json.data || json.report)) {
        return json.data || json.report;
      }
    }
  } catch (err) {
    console.warn('[CropShield] Server /api/weather call failed, falling back to direct computation:', err);
  }

  // Direct client-side fallback
  const lat = options.latitude ?? 10.96;
  const lng = options.longitude ?? 78.08;
  const isFarm = options.latitude !== undefined && options.longitude !== undefined;
  const locName = options.locationName || (options.district ? `${options.district} District` : 'Tamil Nadu');

  const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&hourly=temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m&timezone=Asia%2FKolkata&forecast_days=7`;

  const resp = await fetch(directUrl);
  if (!resp.ok) {
    throw new Error(`Open-Meteo direct API returned status ${resp.status}`);
  }

  const raw = await resp.json();
  const current = raw.current || {};
  const dailyRaw = raw.daily || {};
  const hourlyRaw = raw.hourly || {};

  const currentWmo = decodeWmoWeather(current.weather_code ?? 0);
  const windDirCompass = getWindCompass(current.wind_direction_10m ?? 90);

  const dailyForecast: FarmWeatherReport['daily'] = [];
  const times: string[] = dailyRaw.time || [];

  for (let i = 0; i < times.length; i++) {
    const dateStr = times[i];
    const dateObj = new Date(dateStr);
    const dayIndex = dateObj.getDay();
    const dayName = DAY_NAMES[dayIndex] || { en: 'Day', ta: 'நாள்' };

    const code = dailyRaw.weather_code?.[i] ?? 0;
    const wmo = decodeWmoWeather(code);

    dailyForecast.push({
      date: dateStr,
      dayOfWeek: dayName.en,
      dayOfWeekTamil: dayName.ta,
      weatherCode: code,
      weatherDescription: wmo.en,
      weatherDescriptionTamil: wmo.ta,
      tempMax: Math.round((dailyRaw.temperature_2m_max?.[i] ?? 30) * 10) / 10,
      tempMin: Math.round((dailyRaw.temperature_2m_min?.[i] ?? 24) * 10) / 10,
      precipitationSum: Math.round((dailyRaw.precipitation_sum?.[i] ?? 0) * 10) / 10,
      precipitationProbabilityMax: dailyRaw.precipitation_probability_max?.[i] ?? 0,
      windSpeedMax: Math.round((dailyRaw.wind_speed_10m_max?.[i] ?? 10) * 10) / 10,
      windDirectionDominant: dailyRaw.wind_direction_10m_dominant?.[i] ?? 0,
    });
  }

  const hourlyNext24h: FarmWeatherReport['hourlyNext24h'] = [];
  const hourlyTimes: string[] = hourlyRaw.time || [];
  const currentIso = new Date().toISOString();
  let count = 0;

  for (let j = 0; j < hourlyTimes.length && count < 24; j++) {
    const t = hourlyTimes[j];
    if (t >= currentIso.slice(0, 13)) {
      hourlyNext24h.push({
        time: t,
        temperature: Math.round((hourlyRaw.temperature_2m?.[j] ?? 28) * 10) / 10,
        precipitationProbability: hourlyRaw.precipitation_probability?.[j] ?? 0,
        precipitation: Math.round((hourlyRaw.precipitation?.[j] ?? 0) * 10) / 10,
        windSpeed: Math.round((hourlyRaw.wind_speed_10m?.[j] ?? 10) * 10) / 10,
        relativeHumidity: hourlyRaw.relative_humidity_2m?.[j] ?? 70,
      });
      count++;
    }
  }

  const risks = calculateAgriculturalRisks(current, dailyForecast, options.cropType, options.cropStage);

  const nowIst = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return {
    locationName: locName,
    isFarmCoordinate: isFarm,
    latitude: lat,
    longitude: lng,
    elevation: raw.elevation ?? 0,
    timezone: raw.timezone || 'Asia/Kolkata',
    current: {
      time: current.time || new Date().toISOString(),
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
      windDirection: current.wind_direction_10m ?? 0,
      windDirectionCompass: windDirCompass,
      isDay: Boolean(current.is_day ?? 1),
    },
    daily: dailyForecast,
    hourlyNext24h,
    risks,
    lastUpdated: nowIst,
    forecastPeriod: `${dailyForecast[0]?.date || 'Today'} to ${dailyForecast[dailyForecast.length - 1]?.date || '7 Days'}`,
    source: 'Open-Meteo High-Resolution Numerical Weather Prediction API',
    attribution: 'Weather data provided by Open-Meteo.com under CC BY 4.0. Calibrated with TNAU agro-climatic standards.',
  };
}

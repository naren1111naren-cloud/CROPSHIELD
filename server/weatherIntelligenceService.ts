/**
 * CropShield AI — Farm Weather and Agricultural Risk Intelligence Service
 *
 * Provides real meteorological observations, forecast layers, and qualified
 * agricultural risk indicators (Heat stress, Waterlogging, Spraying window,
 * and Pathogen micro-climate predisposition) for South India / Tamil Nadu.
 *
 * Grounded in:
 * - Open-Meteo High-Resolution Numerical Weather Prediction API (CC BY 4.0)
 * - TNAU (Tamil Nadu Agricultural University) Agro-Climatic Advisory Standards
 * - IMD (India Meteorological Department) Agricultural Meteorology Guidelines
 */

import { decodeWmoWeather } from '../src/services/weatherService';

export interface WeatherQueryOptions {
  latitude: number;
  longitude: number;
  locationName: string;
  district?: string;
  isFarmCoordinate?: boolean;
  cropType?: string;
  cropStage?: string;
}

export interface AgriculturalRiskReport {
  heatStress: {
    level: 'normal' | 'caution' | 'critical';
    maxTempC: number;
    apparentTempC: number;
    title: string;
    titleTamil: string;
    advisory: string;
    advisoryTamil: string;
    pollenSterilityRisk: boolean;
  };
  rainfallRisk: {
    level: 'low' | 'moderate' | 'heavy' | 'very_heavy';
    totalPrecip72hMm: number;
    maxDayPrecipMm: number;
    maxPrecipProbPercent: number;
    waterloggingRisk: 'low' | 'moderate' | 'high';
    title: string;
    titleTamil: string;
    advisory: string;
    advisoryTamil: string;
    hydrologyNotice: string;
    hydrologyNoticeTamil: string;
  };
  sprayingWindow: {
    suitability: 'optimal' | 'caution' | 'unfavorable';
    windSpeedKmh: number;
    windDirectionCompass: string;
    rainNext12hMm: number;
    title: string;
    titleTamil: string;
    guidance: string;
    guidanceTamil: string;
  };
  pathogenPredisposition: {
    favorableForBlast: boolean;
    favorableForSheathBlight: boolean;
    favorableForBacterialBlight: boolean;
    relativeHumidity: number;
    dewHoursEstimated: number;
    cautiousNotice: string;
    cautiousNoticeTamil: string;
  };
}

export interface FarmWeatherReport {
  locationName: string;
  isFarmCoordinate: boolean;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current: {
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
    windDirection: number;
    windDirectionCompass: string;
    isDay: boolean;
  };
  daily: Array<{
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
    windDirectionDominant: number;
  }>;
  hourlyNext24h: Array<{
    time: string;
    temperature: number;
    precipitationProbability: number;
    precipitation: number;
    windSpeed: number;
    relativeHumidity: number;
  }>;
  risks: AgriculturalRiskReport;
  lastUpdated: string;
  forecastPeriod: string;
  source: string;
  attribution: string;
}

// In-memory server cache (30 minutes TTL)
const weatherServerCache = new Map<string, { timestamp: number; data: FarmWeatherReport }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export function getWindCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index] || 'N';
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

/**
 * Evaluates agricultural risk indicators based on genuine meteorological inputs
 */
export function calculateAgriculturalRisks(
  current: any,
  daily: any[],
  cropType?: string,
  cropStage?: string
): AgriculturalRiskReport {
  const normCrop = (cropType || 'Rice (Paddy)').toLowerCase();
  const normStage = (cropStage || '').toLowerCase();
  const isRice = normCrop.includes('rice') || normCrop.includes('paddy');
  const isFlowering = normStage.includes('flower') || normStage.includes('booting') || normStage.includes('panicle');

  // 1. Heat Stress
  const maxDayTemp = Math.max(...daily.slice(0, 3).map((d) => d.tempMax || current.temperature || 30));
  const apparentTemp = current.apparentTemperature ?? current.temperature;
  let heatLevel: 'normal' | 'caution' | 'critical' = 'normal';
  let heatTitle = 'Optimal Temperature Range';
  let heatTitleTamil = 'சீரான வெப்பநிலை வரம்பு';
  let heatAdvisory = 'Daytime temperatures are within normal physiological thresholds for vegetative canopy development.';
  let heatAdvisoryTamil = 'பகல்நேர வெப்பநிலை பயிர் வளர்ச்சிக்கு உகந்த வரம்பில் உள்ளது.';
  let pollenSterilityRisk = false;

  if (maxDayTemp >= 38 || apparentTemp >= 42) {
    heatLevel = 'critical';
    heatTitle = 'Severe Heat Stress Warning (≥38°C)';
    heatTitleTamil = 'கடும் வெப்ப அலை எச்சரிக்கை (≥38°C)';
    pollenSterilityRisk = isRice && isFlowering;
    heatAdvisory = isRice && isFlowering
      ? 'Critical heat exposure during paddy flowering causes pollen sterility and empty spikelets. Keep 5cm standing water in the field to cool the root microclimate.'
      : 'Intense thermal stress accelerates canopy transpiration. Irrigate during cooler evening hours and mulch exposed furrow beds.';
    heatAdvisoryTamil = isRice && isFlowering
      ? 'பூக்கும் பருவத்தில் 38°C-க்கு மேல் வெப்பம் இருந்தால் மகரந்தம் கருகி பதர் நெல் உருவாகும் அபாயம் உள்ளது. வேர்ப்பகுதியைக் குளிர்விக்க 5 செ.மீ நீர் தேக்கி வைக்கவும்.'
      : 'அதிக வெப்பம் நீர்ச்சத்தை விரைவாக உறிஞ்சும். மாலை வேளையில் பாசனம் செய்து நிலத்தின் ஈரப்பதத்தை பாதுகாக்கவும்.';
  } else if (maxDayTemp >= 35 || apparentTemp >= 38) {
    heatLevel = 'caution';
    heatTitle = 'Elevated Daytime Heat Caution (35–37°C)';
    heatTitleTamil = 'மிதமான பகல் வெப்ப எச்சரிக்கை (35–37°C)';
    heatAdvisory = 'High atmospheric evaporative demand. Avoid midday herbicide application and monitor soil moisture.';
    heatAdvisoryTamil = 'அதிக ஆவியாதல் நிலை. நண்பகல் வேளையில் களைக்கொல்லி தெளிப்பதைத் தவிர்க்கவும்; மண் ஈரப்பதத்தை கண்காணிக்கவும்.';
  }

  // 2. Heavy Rainfall & Waterlogging
  const totalPrecip72h = daily.slice(0, 3).reduce((acc, d) => acc + (d.precipitationSum || 0), 0);
  const maxDayPrecip = Math.max(...daily.slice(0, 3).map((d) => d.precipitationSum || 0));
  const maxPrecipProb = Math.max(...daily.slice(0, 3).map((d) => d.precipitationProbabilityMax || 0));

  let rainLevel: 'low' | 'moderate' | 'heavy' | 'very_heavy' = 'low';
  let waterlogging: 'low' | 'moderate' | 'high' = 'low';
  let rainTitle = 'Low Rainfall Activity';
  let rainTitleTamil = 'குறைந்த மழைப்பொழிவு';
  let rainAdvisory = 'Minimal precipitation expected. Standard irrigation scheduling recommended.';
  let rainAdvisoryTamil = 'குறைந்த மழையே எதிர்பார்க்கப்படுகிறது. வழக்கமான பாசன மேலாண்மையைத் தொடரவும்.';

  if (totalPrecip72h >= 65 || maxDayPrecip >= 50) {
    rainLevel = 'very_heavy';
    waterlogging = 'high';
    rainTitle = 'Heavy Rainfall & Waterlogging Hazard';
    rainTitleTamil = 'கனமழை மற்றும் வயல் நீர் தேங்கும் அபாயம்';
    rainAdvisory = 'High probability of field flooding. Clear drainage bunds immediately. Halt all chemical and fertilizer applications to prevent runoff loss.';
    rainAdvisoryTamil = 'வயலில் அதிக நீர் தேங்க வாய்ப்புள்ளது. உடனடியாக வரப்பு வடிகால்களைத் திறக்கவும். உரம் மற்றும் மருந்துகள் நீரில் அடித்துச் செல்லப்படுவதைத் தவிர்க்க இட வேண்டாம்.';
  } else if (totalPrecip72h >= 30 || maxDayPrecip >= 25) {
    rainLevel = 'moderate';
    waterlogging = 'moderate';
    rainTitle = 'Moderate Rainfall Accumulation';
    rainTitleTamil = 'மிதமான மழைப்பொழிவு திரட்சி';
    rainAdvisory = 'Sufficient precipitation to pause surface irrigation. Ensure peripheral field drainage is unclogged.';
    rainAdvisoryTamil = 'பாசனத்தை தற்காலிகமாக நிறுத்த போதுமான மழை உண்டு. வயல் வடிகால்களில் அடைப்பு இல்லாமல் பார்த்துக் கொள்ளவும்.';
  }

  // 3. Spraying Window
  const windKmh = current.windSpeed ?? 10;
  const windCompass = getWindCompass(current.windDirection ?? 90);
  const rainCurr = current.precipitation ?? 0;
  let sprayingSuitability: 'optimal' | 'caution' | 'unfavorable' = 'optimal';
  let sprayTitle = 'Optimal Spraying Conditions';
  let sprayTitleTamil = 'மருந்து தெளிக்க உகந்த வானிலை';
  let sprayGuidance = `Gentle breeze (${windKmh} km/h ${windCompass}) with zero immediate rain. Ideal for uniform foliar deposition.`;
  let sprayGuidanceTamil = `சீர்மிகு காற்று (${windKmh} கி.மீ/மணி ${windCompass}) மற்றும் மழையின்மை. இலைகளில் மருந்து சீராகப் படிய உகந்த சூழல்.`;

  if (windKmh > 20 || rainCurr > 0.5 || maxPrecipProb >= 70) {
    sprayingSuitability = 'unfavorable';
    sprayTitle = 'Spraying Not Recommended';
    sprayTitleTamil = 'மருந்து தெளிப்பதைத் தவிர்க்கவும்';
    sprayGuidance = windKmh > 20
      ? `High wind velocity (${windKmh} km/h) causes severe droplet drift away from target foliage. Postpone foliar spraying.`
      : `High probability of rainfall will wash applied chemical off leaf surfaces. Wait for a dry weather window.`;
    sprayGuidanceTamil = windKmh > 20
      ? `அதிவேகக் காற்று (${windKmh} கி.மீ/மணி) காரணமாக மருந்து காற்றில் அடித்துச் செல்லப்படும். தெளிப்பை ஒத்திவைக்கவும்.`
      : `மழை பெய்ய வாய்ப்புள்ளதால் தெளித்த மருந்து இலைகளில் இருந்து கழுவிச் செல்லப்படும். மழை நிற்கும் வரை காத்திருக்கவும்.`;
  } else if (windKmh >= 15 || maxPrecipProb >= 40) {
    sprayingSuitability = 'caution';
    sprayTitle = 'Moderate Drift Caution';
    sprayTitleTamil = 'மிதமான காற்று எச்சரிக்கை';
    sprayGuidance = `Wind speed at ${windKmh} km/h. Use low-drift nozzles and spray early morning or late evening.`;
    sprayGuidanceTamil = `காற்றின் வேகம் ${windKmh} கி.மீ/மணி. குறைந்த சிதறல் கொண்ட முனைகளைப் பயன்படுத்தவும்; அதிகாலை அல்லது மாலையில் தெளிக்கவும்.`;
  }

  // 4. Pathogen Micro-Climate Predisposition
  const rh = current.relativeHumidity ?? 70;
  const temp = current.temperature ?? 28;
  const favorableRH = rh >= 82;
  const favorableTemp = temp >= 22 && temp <= 32;

  const favorableForBlast = favorableRH && favorableTemp && (current.rain > 0 || totalPrecip72h > 10);
  const favorableForSheathBlight = favorableRH && temp >= 26;
  const favorableForBacterialBlight = favorableRH && windKmh > 12 && totalPrecip72h > 15;

  return {
    heatStress: {
      level: heatLevel,
      maxTempC: Math.round(maxDayTemp * 10) / 10,
      apparentTempC: Math.round(apparentTemp * 10) / 10,
      title: heatTitle,
      titleTamil: heatTitleTamil,
      advisory: heatAdvisory,
      advisoryTamil: heatAdvisoryTamil,
      pollenSterilityRisk,
    },
    rainfallRisk: {
      level: rainLevel,
      totalPrecip72hMm: Math.round(totalPrecip72h * 10) / 10,
      maxDayPrecipMm: Math.round(maxDayPrecip * 10) / 10,
      maxPrecipProbPercent: maxPrecipProb,
      waterloggingRisk: waterlogging,
      title: rainTitle,
      titleTamil: rainTitleTamil,
      advisory: rainAdvisory,
      advisoryTamil: rainAdvisoryTamil,
      hydrologyNotice: 'Precipitation accumulation derived from Open-Meteo numerical weather prediction. Verified catchment inundation maps require calibrated CWC river-basin telemetry.',
      hydrologyNoticeTamil: 'மழைப்பொழிவுத் திரட்சி Open-Meteo வானிலை மாதிரியிலிருந்து பெறப்பட்டது. நேரடி வெள்ள வரைபடங்களுக்கு மத்திய நீர் ஆணையத்தின் அளவீடுகள் தேவை.',
    },
    sprayingWindow: {
      suitability: sprayingSuitability,
      windSpeedKmh: Math.round(windKmh * 10) / 10,
      windDirectionCompass: windCompass,
      rainNext12hMm: Math.round((current.precipitation || 0) * 10) / 10,
      title: sprayTitle,
      titleTamil: sprayTitleTamil,
      guidance: sprayGuidance,
      guidanceTamil: sprayGuidanceTamil,
    },
    pathogenPredisposition: {
      favorableForBlast,
      favorableForSheathBlight,
      favorableForBacterialBlight,
      relativeHumidity: rh,
      dewHoursEstimated: favorableRH ? 4.5 : 1.5,
      cautiousNotice: 'Favorable environmental conditions indicate higher spore germination probability, NOT confirmed disease presence. Scout field crops and correlate with CropShield AI Diagnosis before application.',
      cautiousNoticeTamil: 'வானிலை சூழல் பூஞ்சை வித்துக்கள் முளைக்க சாதகமாக இருப்பதை மட்டுமே குறிக்கிறது; இது நோய் தாக்கியுள்ளதற்கான உறுதிப்படுத்தல் அல்ல. கள ஆய்வு செய்து பயிர் நோய் கண்டறிதல் மூலம் உறுதிப்படுத்தவும்.',
    },
  };
}

/**
 * Fetch farm-specific or district meteorological intelligence from Open-Meteo
 */
export async function fetchFarmWeatherIntelligence(
  options: WeatherQueryOptions
): Promise<FarmWeatherReport> {
  const { latitude, longitude, locationName, isFarmCoordinate = false, cropType, cropStage } = options;

  // Round coordinates to 3 decimals (~100m) for effective caching
  const cacheLat = Math.round(latitude * 1000) / 1000;
  const cacheLng = Math.round(longitude * 1000) / 1000;
  const cacheKey = `${cacheLat}_${cacheLng}_${cropType || ''}_${cropStage || ''}`;

  const cached = weatherServerCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&hourly=temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m&timezone=Asia%2FKolkata&forecast_days=7`;

  const res = await fetch(openMeteoUrl);
  if (!res.ok) {
    throw new Error(`Open-Meteo meteorological service returned status ${res.status}`);
  }

  const raw = await res.json();
  const current = raw.current || {};
  const dailyRaw = raw.daily || {};
  const hourlyRaw = raw.hourly || {};

  const currentWmo = decodeWmoWeather(current.weather_code ?? 0);
  const windDirCompass = getWindCompass(current.wind_direction_10m ?? 90);

  // Parse daily 7-day forecast
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

  // Parse next 24 hours
  const hourlyNext24h: FarmWeatherReport['hourlyNext24h'] = [];
  const hourlyTimes: string[] = hourlyRaw.time || [];
  const currentIso = new Date().toISOString();
  let count = 0;

  for (let j = 0; j < hourlyTimes.length && count < 24; j++) {
    const t = hourlyTimes[j];
    // Include hours from current hour onward
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

  const risks = calculateAgriculturalRisks(current, dailyForecast, cropType, cropStage);

  const nowIst = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const report: FarmWeatherReport = {
    locationName,
    isFarmCoordinate,
    latitude,
    longitude,
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
    source: 'Open-Meteo Numerical Weather Prediction API (ECMWF, GFS & DWD Seamless Blend)',
    attribution: 'Weather data provided by Open-Meteo.com under Creative Commons Attribution 4.0 International (CC BY 4.0). Agro-risk rules calibrated with TNAU & IMD standards.',
  };

  weatherServerCache.set(cacheKey, { timestamp: now, data: report });
  return report;
}

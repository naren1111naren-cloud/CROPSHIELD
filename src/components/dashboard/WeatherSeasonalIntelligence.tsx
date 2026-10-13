import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { FarmRecord } from '../../types';
import { TN_DISTRICT_GEODATA, getDistrictGeo } from '../../config/tamilNaduDistricts';
import {
  RealWeatherData,
  getDistrictWeather,
  decodeWmoWeather,
} from '../../services/weatherService';
import {
  CropWeatherRecommendation,
  generateCropWeatherRecommendations,
} from '../../services/cropRecommendationEngine';
import {
  TN_SEASONAL_CALENDAR,
  getActiveSeasonalWindows,
  SeasonalCropWindow,
} from '../../config/seasonalRegistry';
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  CloudFog,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Sprout,
  Info,
  MapPin,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface WeatherSeasonalIntelligenceProps {
  farms?: FarmRecord[];
  activeFarm?: FarmRecord | null;
  onSelectFarm?: (farm: FarmRecord) => void;
  onNavigateToScan?: (cropId?: string) => void;
}

const DISTRICT_LIST = Object.keys(TN_DISTRICT_GEODATA);

const SUPPORTED_CROPS = [
  { id: 'rice', name: 'Rice (Paddy)', nameTa: 'நெல் (Paddy)' },
  { id: 'tomato', name: 'Tomato', nameTa: 'தக்காளி (Tomato)' },
  { id: 'chilli', name: 'Chilli', nameTa: 'மிளகாய் (Chilli)' },
  { id: 'cotton', name: 'Cotton', nameTa: 'பருத்தி (Cotton)' },
  { id: 'maize', name: 'Maize', nameTa: 'மக்காச்சோளம் (Maize)' },
];

const STAGE_OPTIONS = [
  { value: 'Nursery / Seedling (1-20 DAT)', labelEn: 'Nursery / Seedling (1-20 DAT)', labelTa: 'நாற்றங்கால் / இளம்பருவம்' },
  { value: 'Active Tillering (21-45 DAT)', labelEn: 'Active Tillering / Vegetative (21-45 DAT)', labelTa: 'தூர்கட்டும் பருவம் / கிளைப்பு' },
  { value: 'Panicle Initiation (46-65 DAT)', labelEn: 'Panicle Initiation / Booting (46-65 DAT)', labelTa: 'கதிர் உருவாகும் பருவம் / தண்டு உருளல்' },
  { value: 'Flowering / Milk Stage (66-85 DAT)', labelEn: 'Flowering / Milk Stage (66-85 DAT)', labelTa: 'பூக்கும் பருவம் / பால்கட்டும் பருவம்' },
  { value: 'Ripening / Grain Maturity (>85 DAT)', labelEn: 'Ripening / Maturity (>85 DAT)', labelTa: 'முதிர்ச்சி / அறுவடைப் பருவம்' },
];

function getWeatherIcon(code: number) {
  if (code === 0) return <Sun className="w-8 h-8 text-[#B67B2A]" />;
  if (code === 1 || code === 2) return <CloudSun className="w-8 h-8 text-[#426B43]" />;
  if (code === 3) return <Cloud className="w-8 h-8 text-[#4A584D]" />;
  if (code === 45 || code === 48) return <CloudFog className="w-8 h-8 text-[#667166]" />;
  if (code >= 51 && code <= 65) return <CloudRain className="w-8 h-8 text-[#183B2A]" />;
  if (code >= 80 && code <= 82) return <CloudRain className="w-8 h-8 text-[#183B2A]" />;
  if (code >= 95) return <CloudLightning className="w-8 h-8 text-[#A94338]" />;
  return <Cloud className="w-8 h-8 text-[#426B43]" />;
}

export const WeatherSeasonalIntelligence: React.FC<WeatherSeasonalIntelligenceProps> = ({
  farms = [],
  activeFarm = null,
  onSelectFarm,
  onNavigateToScan,
}) => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const isTa = language === 'ta';

  // Selection states
  const initialDistrict = activeFarm?.district || profile?.district || 'Thanjavur';
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [selectedCrop, setSelectedCrop] = useState<string>(
    activeFarm?.cropType || profile?.primaryCrop || 'Rice (Paddy)'
  );
  const [selectedStage, setSelectedStage] = useState<string>(
    activeFarm?.cropStage || profile?.cropStage || 'Active Tillering (21-45 DAT)'
  );

  // Weather state
  const [weather, setWeather] = useState<RealWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync when active farm changes
  useEffect(() => {
    if (activeFarm) {
      if (activeFarm.district) setSelectedDistrict(activeFarm.district);
      if (activeFarm.cropType) setSelectedCrop(activeFarm.cropType);
      if (activeFarm.cropStage) setSelectedStage(activeFarm.cropStage);
    }
  }, [activeFarm]);

  // Fetch weather data for selected district
  const fetchWeather = async (district: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getDistrictWeather(district);
      setWeather(data);
    } catch (err: any) {
      console.error('Failed to load meteorological data:', err);
      setErrorMsg(
        err.message ||
          (isTa
            ? 'வானிலை தரவைப் பெற முடியவில்லை. உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்.'
            : 'Unable to retrieve live meteorological data. Please check your internet connection.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedDistrict);
  }, [selectedDistrict]);

  // Recommendations generated from genuine weather + agronomic rules
  const recommendations: CropWeatherRecommendation[] = weather
    ? generateCropWeatherRecommendations(weather, {
        cropNameOrId: selectedCrop,
        cropStage: selectedStage,
        district: selectedDistrict,
        irrigationMethod: activeFarm?.irrigationMethod || profile?.irrigationMethod,
      })
    : [];

  // Regional crop calendar windows for selected district and crop
  const seasonalWindows: SeasonalCropWindow[] = getActiveSeasonalWindows(selectedDistrict, selectedCrop);

  return (
    <div className="space-y-6">
      {/* 1. Header & Location Controls */}
      <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#D9DED3] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#426B43] uppercase tracking-wider font-semibold">
              <Compass className="w-4 h-4 text-[#183B2A]" />
              <span>OPEN-METEO LIVE FORECASTING & TNAU CROP CALENDAR</span>
              <span>·</span>
              <span className="text-[#183B2A]">{selectedDistrict.toUpperCase()} DISTRICT</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A] mt-1">
              {isTa ? 'வானிலை & பருவக்கால பயிர் நுண்ணறிவு' : 'Weather & Seasonal Crop Intelligence'}
            </h2>
            <p className="text-xs sm:text-sm text-[#4A584D] font-sans mt-1">
              {isTa
                ? 'உண்மையான வானிலை முன்னறிவிப்பு, பருவமழை அட்டவணை மற்றும் பயிர் வளர்ச்சிக்குரிய சரிபார்க்கப்பட்ட நடைமுறைகள்.'
                : 'Live atmospheric observations, 5-day forecasts, and rule-based agronomic alerts for Tamil Nadu fields.'}
            </p>
          </div>

          {/* District Picker & Refresh Button */}
          <div className="bg-[#FAF9F3] border border-[#E5EBDD] p-3.5 rounded-xs flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="space-y-1">
              <label htmlFor="weatherDistrictSelect" className="block text-[10px] font-mono uppercase text-[#4A584D] font-semibold">
                {isTa ? 'மாவட்டம் தேர்வு' : 'SELECT DISTRICT'}
              </label>
              <select
                id="weatherDistrictSelect"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="p-2 bg-white border border-[#D9DED3] text-xs font-mono text-[#183B2A] font-semibold focus:outline-hidden focus:border-[#183B2A] min-h-[38px]"
              >
                {DISTRICT_LIST.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist} ({TN_DISTRICT_GEODATA[dist]?.nameTamil})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchWeather(selectedDistrict)}
              disabled={isLoading}
              className="px-3 py-2 bg-white hover:bg-[#E5EBDD] border border-[#D9DED3] text-xs font-mono text-[#183B2A] rounded-xs cursor-pointer flex items-center gap-1.5 self-end sm:self-auto min-h-[38px] transition-colors"
              title="Refresh Meteorological Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#426B43]' : ''}`} />
              <span>{isTa ? 'புதுப்பி' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stale / Warning Banner */}
        {weather?.isStale && (
          <div className="mb-6 p-3 bg-[#B67B2A]/10 border border-[#B67B2A] text-[#183B2A] text-xs font-sans rounded-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B67B2A] shrink-0" />
            <span>
              {isTa
                ? 'இணைப்புச் சிக்கல் காரணமாக முன்பு பெறப்பட்ட வானிலை தரவு காட்டப்படுகிறது.'
                : 'Displaying cached meteorological readings due to temporary upstream connectivity.'}
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-[#A94338]/10 border border-[#A94338] text-[#A94338] text-xs font-sans rounded-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => fetchWeather(selectedDistrict)}
              className="px-3 py-1 bg-[#A94338] text-white font-mono text-xs rounded-xs hover:bg-[#8e372e] cursor-pointer"
            >
              {isTa ? 'மீண்டும் முயற்சி' : 'Retry'}
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !weather && (
          <div className="py-16 text-center text-[#4A584D] font-mono text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#183B2A]" />
            <span>
              {isTa
                ? `${selectedDistrict} மாவட்ட வானிலை தரவுகள் ஏற்றப்படுகின்றன...`
                : `Fetching live meteorological variables for ${selectedDistrict} from Open-Meteo...`}
            </span>
          </div>
        )}

        {/* 2. Current Weather Snapshot */}
        {weather && (
          <div className="space-y-6">
            <div className="bg-[#FAF9F3] border border-[#E5EBDD] p-5 sm:p-6 rounded-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5EBDD] pb-4 mb-4">
                <div className="flex items-center gap-4">
                  {getWeatherIcon(weather.current.weatherCode)}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#183B2A]">
                        {weather.current.temperature.toFixed(1)}°C
                      </span>
                      <span className="text-xs font-mono text-[#667166]">
                        {isTa ? `உணர்வது ${weather.current.apparentTemperature.toFixed(1)}°C` : `Feels like ${weather.current.apparentTemperature.toFixed(1)}°C`}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-[#426B43] font-sans">
                      {isTa ? weather.current.weatherDescriptionTamil : weather.current.weatherDescription}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-[#4A584D] space-y-0.5">
                  <div className="text-[#183B2A] font-semibold">
                    {isTa ? weather.zoneTamil : weather.zone}
                  </div>
                  <div className="text-[11px] text-[#667166]">
                    {isTa ? 'கடைசி புதுப்பிப்பு: ' : 'Updated: '} {weather.lastUpdated}
                  </div>
                </div>
              </div>

              {/* Atmospheric Variable Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-white border border-[#D9DED3] rounded-xs">
                  <div className="text-[10px] uppercase text-[#667166] flex items-center gap-1 mb-1">
                    <Droplets className="w-3.5 h-3.5 text-[#426B43]" />
                    <span>{isTa ? 'ஈரப்பதம்' : 'HUMIDITY'}</span>
                  </div>
                  <div className="text-lg font-semibold text-[#183B2A]">
                    {weather.current.relativeHumidity}%
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#D9DED3] rounded-xs">
                  <div className="text-[10px] uppercase text-[#667166] flex items-center gap-1 mb-1">
                    <CloudRain className="w-3.5 h-3.5 text-[#426B43]" />
                    <span>{isTa ? 'மழைப்பொழிவு' : 'PRECIPITATION'}</span>
                  </div>
                  <div className="text-lg font-semibold text-[#183B2A]">
                    {weather.current.precipitation.toFixed(1)} mm
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#D9DED3] rounded-xs">
                  <div className="text-[10px] uppercase text-[#667166] flex items-center gap-1 mb-1">
                    <Wind className="w-3.5 h-3.5 text-[#426B43]" />
                    <span>{isTa ? 'காற்றின் வேகம்' : 'WIND SPEED'}</span>
                  </div>
                  <div className="text-lg font-semibold text-[#183B2A]">
                    {weather.current.windSpeed.toFixed(1)} km/h
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#D9DED3] rounded-xs">
                  <div className="text-[10px] uppercase text-[#667166] flex items-center gap-1 mb-1">
                    <Cloud className="w-3.5 h-3.5 text-[#426B43]" />
                    <span>{isTa ? 'மேகமூட்டம்' : 'CLOUD COVER'}</span>
                  </div>
                  <div className="text-lg font-semibold text-[#183B2A]">
                    {weather.current.cloudCover}%
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 5-Day Real Forecast Strip */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#D9DED3] pb-2">
                <span className="text-xs font-mono uppercase text-[#426B43] tracking-wider font-semibold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#183B2A]" />
                  <span>{isTa ? '5 நாள் வானிலை முன்னறிவிப்பு' : '5-DAY WEATHER OUTLOOK'}</span>
                </span>
                <span className="text-[11px] font-mono text-[#667166]">
                  {isTa ? 'உண்மையான கணிப்பு' : 'Direct Forecast Data'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {weather.daily.map((day, idx) => (
                  <div
                    key={day.date}
                    className={`p-3.5 bg-white border rounded-xs flex flex-col justify-between text-xs font-mono transition-colors ${
                      idx === 0
                        ? 'border-[#183B2A] bg-[#FAF9F3] ring-1 ring-[#183B2A]/20'
                        : 'border-[#D9DED3] hover:border-[#426B43]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[#667166] mb-1">
                        <span className="font-bold text-[#183B2A]">
                          {isTa ? day.dayOfWeekTamil : day.dayOfWeek}
                        </span>
                        <span className="text-[10px]">{day.date.slice(5)}</span>
                      </div>
                      <div className="my-2 flex items-center justify-center">
                        {getWeatherIcon(day.weatherCode)}
                      </div>
                      <div className="text-[11px] font-sans text-center text-[#4A584D] truncate mb-2">
                        {isTa ? day.weatherDescriptionTamil : day.weatherDescription}
                      </div>
                    </div>

                    <div className="border-t border-[#F0F2EB] pt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#667166]">{isTa ? 'அதிக / குறை' : 'Max / Min'}:</span>
                        <span className="font-bold text-[#183B2A]">
                          {day.tempMax}° / {day.tempMin}°
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#667166]">{isTa ? 'மழை வாய்ப்பு' : 'Rain prob'}:</span>
                        <span className={`font-semibold ${day.precipitationProbabilityMax >= 70 ? 'text-[#A94338]' : 'text-[#426B43]'}`}>
                          {day.precipitationProbabilityMax}%
                        </span>
                      </div>
                      {day.precipitationSum > 0 && (
                        <div className="flex justify-between text-[10px] text-[#4A584D]">
                          <span>{isTa ? 'எதிர்பார்ப்பு' : 'Precip'}:</span>
                          <span>{day.precipitationSum} mm</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Crop-Aware Rule-Based Recommendations */}
      <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs space-y-6">
        <div className="border-b border-[#D9DED3] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#426B43] tracking-wider font-semibold">
              <Sprout className="w-4 h-4 text-[#183B2A]" />
              <span>CROP-WEATHER ADVISORY ENGINE</span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#183B2A] mt-1">
              {isTa ? 'வானிலை சார்ந்த பயிர் பரிந்துரைகள்' : 'Weather-Triggered Crop Recommendations'}
            </h3>
            <p className="text-xs text-[#4A584D] font-sans mt-0.5">
              {isTa
                ? 'தற்போதைய வானிலை, பயிர் மற்றும் வளர்ச்சிப் பருவத்தை ஒப்பிட்டு உருவாக்கப்பட்ட வழிகாட்டல்கள்.'
                : 'Deterministic agronomic recommendations triggered by genuine meteorological conditions and growth stages.'}
            </p>
          </div>

          {/* Quick Context Filter: Crop & Stage */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="p-2 bg-[#FAF9F3] border border-[#D9DED3] text-xs font-mono text-[#183B2A] font-semibold min-h-[38px]"
            >
              {SUPPORTED_CROPS.map((c) => (
                <option key={c.id} value={c.name}>
                  {isTa ? c.nameTa : c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="p-2 bg-[#FAF9F3] border border-[#D9DED3] text-xs font-mono text-[#183B2A] min-h-[38px]"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {isTa ? s.labelTa : s.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recommendations Cards */}
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-5 rounded-xs border transition-all space-y-3 ${
                rec.severity === 'critical'
                  ? 'bg-[#FAF3F2] border-[#A94338]'
                  : rec.severity === 'caution'
                  ? 'bg-[#FAF8F2] border-[#B67B2A]'
                  : 'bg-[#FAF9F3] border-[#D9DED3]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#E5EBDD] pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 uppercase font-bold rounded-xs ${
                        rec.guidanceType === 'verified_guidance'
                          ? 'bg-[#183B2A] text-white'
                          : 'bg-[#4A584D] text-white'
                      }`}
                    >
                      {rec.guidanceType === 'verified_guidance'
                        ? (isTa ? 'சரிபார்க்கப்பட்ட வேளாண்மை' : 'VERIFIED TNAU GUIDANCE')
                        : (isTa ? 'பொதுவான முன்னெச்சரிக்கை' : 'GENERAL PRECAUTION')}
                    </span>

                    <span className="text-[11px] font-mono text-[#426B43] font-semibold">
                      {rec.cropStage}
                    </span>
                  </div>

                  <h4 className="font-serif text-lg font-semibold text-[#183B2A]">
                    {isTa ? rec.titleTamil : rec.title}
                  </h4>
                </div>

                <div className="text-[11px] font-mono text-[#4A584D] shrink-0 bg-white px-2.5 py-1 border border-[#D9DED3] rounded-xs">
                  {isTa ? 'காலம்: ' : 'Relevance: '} {isTa ? rec.relevancePeriodTamil : rec.relevancePeriod}
                </div>
              </div>

              {/* Trigger Rule & Plain-Language Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-white border border-[#E5EBDD] rounded-xs">
                  <span className="text-[10px] uppercase text-[#667166] block mb-0.5 font-bold">
                    {isTa ? 'தூண்டிய வானிலை விதி:' : 'DATA TRIGGER RULE:'}
                  </span>
                  <span className="text-[#183B2A]">
                    {isTa ? rec.triggerRuleTamil : rec.triggerRule}
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-[#E5EBDD] rounded-xs">
                  <span className="text-[10px] uppercase text-[#667166] block mb-0.5 font-bold">
                    {isTa ? 'காரணம்:' : 'AGRONOMIC RATIONALE:'}
                  </span>
                  <span className="text-[#202B22]">
                    {isTa ? rec.reasonTamil : rec.reason}
                  </span>
                </div>
              </div>

              {/* Action Steps */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-mono text-[#183B2A] font-semibold uppercase block">
                  {isTa ? 'செயல்படுத்த வேண்டிய நடைமுறைகள்:' : 'Recommended Action Steps:'}
                </span>
                <ul className="space-y-1 text-xs text-[#202B22] font-sans">
                  {(isTa ? rec.actionStepsTamil : rec.actionSteps).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#183B2A]/10 text-[#183B2A] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-[#E5EBDD] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#667166]">
                <span>{rec.sourceReference}</span>
                {onNavigateToScan && (
                  <button
                    onClick={() => onNavigateToScan(rec.cropId)}
                    className="text-[#183B2A] underline hover:text-[#426B43] cursor-pointer"
                  >
                    {isTa ? 'இப்பயிரின் இலையை ஸ்கேன் செய்ய' : 'Inspect crop foliage with scanner'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. District-Aware Seasonal Crop Calendar Registry */}
      <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs space-y-6">
        <div className="border-b border-[#D9DED3] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#426B43] tracking-wider font-semibold">
              <Calendar className="w-4 h-4 text-[#183B2A]" />
              <span>TAMIL NADU AGRO-CLIMATIC CROP CALENDAR</span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#183B2A] mt-1">
              {isTa ? `${selectedDistrict} மாவட்டப் பயிர் பருவங்கள்` : `Crop Seasons for ${selectedDistrict}`}
            </h3>
            <p className="text-xs text-[#4A584D] font-sans mt-0.5">
              {isTa
                ? 'தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழகத்தால் (TNAU) பரிந்துரைக்கப்பட்ட விதைப்பு மற்றும் அறுவடை காலங்கள்.'
                : 'Verified planting windows, duration, and water strategies calibrated to regional agro-climatic zones.'}
            </p>
          </div>
          <div className="text-xs font-mono text-[#4A584D]">
            {seasonalWindows.length} {isTa ? 'பருவங்கள் கண்டறியப்பட்டன' : 'SEASONS RECORDED'}
          </div>
        </div>

        {seasonalWindows.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-[#4A584D] bg-[#FAF9F3] border border-[#D9DED3]">
            {isTa
              ? 'இந்த மாவட்டத்திற்குப் பிரத்யேகப் பருவங்கள் பதிவு செய்யப்படவில்லை. பொதுவான பயிர் வழிகாட்டலைப் பின்பற்றவும்.'
              : 'No specific regional season record found for this combination. Displaying general agronomic window.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seasonalWindows.map((win) => (
              <div
                key={win.seasonKey}
                className="p-5 bg-[#FAF9F3] border border-[#D9DED3] rounded-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-[#183B2A] text-white px-2 py-0.5 rounded-xs font-bold">
                        {win.cropName}
                      </span>
                      <h4 className="font-serif text-lg font-semibold text-[#183B2A] mt-1">
                        {isTa ? win.seasonNameTamil : win.seasonName}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-[#426B43] font-bold">
                      {win.durationDays}
                    </span>
                  </div>

                  <div className="bg-white p-3 border border-[#E5EBDD] rounded-xs space-y-2 text-xs font-mono mb-3">
                    <div className="flex justify-between border-b border-[#F0F2EB] pb-1">
                      <span className="text-[#667166]">{isTa ? 'விதைப்பு / நடவு' : 'Sowing Window'}:</span>
                      <span className="font-bold text-[#183B2A]">{isTa ? win.sowingPeriodTamil : win.sowingPeriod}</span>
                    </div>

                    <div className="flex justify-between border-b border-[#F0F2EB] pb-1">
                      <span className="text-[#667166]">{isTa ? 'அறுவடை' : 'Harvest Window'}:</span>
                      <span className="font-bold text-[#183B2A]">{isTa ? win.harvestPeriodTamil : win.harvestPeriod}</span>
                    </div>

                    <div>
                      <span className="text-[#667166] block mb-0.5">{isTa ? 'பரிந்துரைக்கப்பட்ட ரகங்கள்' : 'Recommended Cultivars'}:</span>
                      <div className="flex flex-wrap gap-1">
                        {win.recommendedCultivars.map((v) => (
                          <span key={v} className="bg-[#FAF9F3] px-1.5 py-0.5 border border-[#D9DED3] text-[11px] text-[#183B2A]">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#4A584D] font-sans space-y-1">
                    <span className="font-mono text-[11px] uppercase font-bold text-[#183B2A] block">
                      {isTa ? 'நீர் மேலாண்மை உத்தி:' : 'Water Management Strategy:'}
                    </span>
                    <p className="leading-relaxed">
                      {isTa ? win.waterStrategyTamil : win.waterStrategy}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5EBDD] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#667166] truncate max-w-[240px]">{win.verifiedSource}</span>
                  <a
                    href={win.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#183B2A] hover:underline"
                  >
                    <span>{isTa ? 'சான்று' : 'Reference'}</span>
                    <ExternalLink className="w-3 h-3 text-[#426B43]" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Scientific Attributions & Transparency Strip */}
      <div className="p-4 bg-white border border-[#D9DED3] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#667166]">
        <div>
          <span>WEATHER PROVIDER: </span>
          <span className="text-[#183B2A] font-semibold">Open-Meteo NWP Global Models (CC BY 4.0)</span>
          <span> · </span>
          <span>AGRONOMY: </span>
          <span className="text-[#183B2A] font-semibold">Tamil Nadu Agricultural University (TNAU)</span>
        </div>
        <div className="text-[11px]">
          {isTa
            ? 'அறிவியல் வெளிப்படைத்தன்மை: வானிலை அபாயங்கள் ஒருபோதும் நோயியல் உறுதிப்படுத்தல் ஆகாது.'
            : 'Precautionary Note: Atmospheric risks indicate spore windows and do not represent confirmed crop disease.'}
        </div>
      </div>
    </div>
  );
};

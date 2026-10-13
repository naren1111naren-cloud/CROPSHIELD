import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { DistrictRisk } from '../../types';
import { CloudRain, Wind, Thermometer, RefreshCw } from 'lucide-react';

export const DistrictRiskRegistry: React.FC = () => {
  const { language, t } = useLanguage();
  const [districts, setDistricts] = useState<DistrictRisk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Thanjavur');

  useEffect(() => {
    async function loadRiskData() {
      try {
        const res = await fetch('/api/risk-intelligence');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDistricts(json.data);
        }
      } catch (err) {
        console.error('Failed to load risk intelligence:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRiskData();
  }, []);

  const activeDistrict = districts.find((d) => d.district === selectedDistrict) || districts[0];

  if (isLoading) {
    return (
      <div className="bg-white border border-[#D9DED3] p-12 text-center text-[#4A584D] font-mono text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[#183B2A]" />
        <span>Loading agro-climatic registry for Tamil Nadu delta...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#D9DED3] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9DED3] pb-4 mb-4">
          <div>
            <span className="text-xs font-mono uppercase text-[#426B43] tracking-wider block font-semibold">
              AGRO-METEOROLOGICAL SURVEILLANCE
            </span>
            <h2 className="font-serif text-2xl font-medium text-[#183B2A]">
              Tamil Nadu District Risk Registry
            </h2>
          </div>
          <div className="text-xs font-mono text-[#4A584D]">
            SEASON: Samba / Thaladi 2026 · Aduthurai Met Grid
          </div>
        </div>

        {/* District Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {districts.map((d) => {
            const isSelected = d.district === (activeDistrict?.district || 'Thanjavur');
            return (
              <button
                key={d.district}
                onClick={() => setSelectedDistrict(d.district)}
                className={`px-4 py-2.5 min-h-[44px] text-xs font-mono font-medium rounded-xs border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#183B2A] text-white border-[#183B2A]'
                    : 'bg-[#FAF9F3] text-[#202B22] border-[#D9DED3] hover:bg-white'
                }`}
              >
                <span>{language === 'ta' ? d.districtTamil : d.district}</span>
                <span className={`ml-2 text-xs font-semibold ${d.overallRisk === 'Elevated' ? 'text-[#B67B2A]' : 'text-[#78965C]'}`}>
                  [{d.overallRisk}]
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeDistrict && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Weather Snapshot Column */}
          <div className="lg:col-span-5 bg-white border border-[#D9DED3] p-6 space-y-5 shadow-xs">
            <div className="border-b border-[#D9DED3] pb-3 flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-[#183B2A]">ATMOSPHERIC VARIABLES</span>
              <span className="text-[#4A584D]">{activeDistrict.weatherSnapshot.cloudCover}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#FAF9F3] border border-[#E5EBDD]">
                <div className="text-xs font-mono text-[#4A584D] uppercase mb-1 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-[#426B43]" />
                  <span>Dew Duration</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-[#183B2A] tabular-nums">
                  {activeDistrict.weatherSnapshot.dewDurationHours} hrs
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF9F3] border border-[#E5EBDD]">
                <div className="text-xs font-mono text-[#4A584D] uppercase mb-1 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-[#426B43]" />
                  <span>Canopy RH</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-[#B67B2A] tabular-nums">
                  {activeDistrict.weatherSnapshot.relativeHumidity}%
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF9F3] border border-[#E5EBDD]">
                <div className="text-xs font-mono text-[#4A584D] uppercase mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-[#426B43]" />
                  <span>Temperature</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-[#183B2A] tabular-nums">
                  {activeDistrict.weatherSnapshot.tempC}°C
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF9F3] border border-[#E5EBDD]">
                <div className="text-xs font-mono text-[#4A584D] uppercase mb-1 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-[#426B43]" />
                  <span>Rainfall (48h)</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-[#183B2A] tabular-nums">
                  {activeDistrict.weatherSnapshot.rainfallPast48hMm} mm
                </div>
              </div>
            </div>

            {/* Disease Vulnerability Matrix */}
            <div className="border-t border-[#D9DED3] pt-4 space-y-2.5">
              <span className="text-xs font-mono uppercase text-[#4A584D] block font-semibold">
                Pathogen Vulnerability Vector
              </span>
              <div className="text-xs font-mono space-y-2">
                <div className="flex justify-between items-center p-2.5 bg-[#FAF9F3] border border-[#D9DED3]">
                  <span>RICE BLAST (M. oryzae)</span>
                  <span className={`font-semibold ${activeDistrict.blastRisk === 'High' ? 'text-[#A94338]' : 'text-[#4A584D]'}`}>
                    {activeDistrict.blastRisk}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-[#FAF9F3] border border-[#D9DED3]">
                  <span>BACTERIAL BLIGHT (X. oryzae)</span>
                  <span className={`font-semibold ${activeDistrict.blbRisk === 'High' ? 'text-[#A94338]' : 'text-[#4A584D]'}`}>
                    {activeDistrict.blbRisk}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-[#FAF9F3] border border-[#D9DED3]">
                  <span>BROWN SPOT (B. oryzae)</span>
                  <span className="font-semibold text-[#B67B2A]">{activeDistrict.brownSpotRisk}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-[#FAF9F3] border border-[#D9DED3]">
                  <span>SHEATH BLIGHT (R. solani)</span>
                  <span className="font-semibold text-[#4A584D]">{activeDistrict.sheathBlightRisk}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Advisory Column */}
          <div className="lg:col-span-7 bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="border-b border-[#D9DED3] pb-3 mb-4 flex items-center justify-between text-xs font-mono text-[#4A584D]">
                <span>TNAU METEOROLOGICAL ADVISORY</span>
                <span>{activeDistrict.lastUpdated}</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A] mb-3">
                {language === 'ta' ? activeDistrict.districtTamil : activeDistrict.district} · {activeDistrict.basin}
              </h3>

              <div className="p-4 sm:p-5 bg-[#FAF9F3] border-l-3 border-[#183B2A] mb-6">
                <p className="text-sm sm:text-base text-[#202B22] font-sans leading-relaxed">
                  {language === 'ta' ? activeDistrict.advisoryTamil : activeDistrict.advisoryText}
                </p>
              </div>

              <div className="space-y-3 text-sm text-[#202B22]/90 font-sans">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#426B43] font-semibold">·</span>
                  <span>
                    <strong>Canopy Management:</strong> Ensure drainage along bund channels to avoid excess relative humidity accumulation.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#426B43] font-semibold">·</span>
                  <span>
                    <strong>Fertilizer Balance:</strong> Avoid top-dressing pure urea during cool morning mist periods without potash buffer.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#D9DED3] text-xs font-mono text-[#4A584D] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>SOURCE: {activeDistrict.source}</span>
              <span className="text-[#426B43] font-semibold">OFFICIAL ADVISORY</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

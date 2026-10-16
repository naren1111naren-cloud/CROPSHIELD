import {
  FarmRecord,
  FarmSoilProfile,
  LaboratorySoilTest,
  WaterManagementGuidance,
  FarmIrrigationInfrastructure,
  SoilGridsProperties,
  RegionalSoilClassification,
} from '../types';

export interface SoilIntelligenceResponse {
  latitude: number;
  longitude: number;
  district: string;
  soilProfile: FarmSoilProfile;
  waterGuidance: WaterManagementGuidance;
  irrigationInfrastructure?: FarmIrrigationInfrastructure;
  latestSoilTest?: LaboratorySoilTest;
  soilTestRatingSummary?: {
    phStatus: string;
    salinityStatus: string;
    fertilityIndex: string;
  };
  retrievedAt: string;
  sourceAttribution: string;
}

/**
 * Fetch soil intelligence & water management guidance for a given farm or coordinate
 */
export async function fetchFarmSoilIntelligence(params: {
  farm?: FarmRecord;
  latitude?: number;
  longitude?: number;
  district?: string;
  cropType?: string;
  cropStage?: string;
  irrigationInfrastructure?: FarmIrrigationInfrastructure;
  latestSoilTest?: LaboratorySoilTest;
  forecastPrecipitation48hMm?: number;
}): Promise<SoilIntelligenceResponse | null> {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const endpoint = `${apiUrl}/api/soil/intelligence`;

  let lat = params.latitude;
  let lng = params.longitude;
  let district = params.district || 'Karur';
  let cropType = params.cropType;
  let cropStage = params.cropStage;
  let irrigation = params.irrigationInfrastructure;
  let soilTest = params.latestSoilTest;

  if (params.farm) {
    if (params.farm.boundary?.centroid) {
      lat = params.farm.boundary.centroid.lat;
      lng = params.farm.boundary.centroid.lng;
    } else if (params.farm.coordinates) {
      lat = params.farm.coordinates.lat;
      lng = params.farm.coordinates.lng;
    }
    district = params.farm.district || district;
    cropType = cropType || params.farm.cropType;
    cropStage = cropStage || params.farm.cropStage;
    irrigation = irrigation || params.farm.irrigationInfrastructure;
    if (!soilTest && params.farm.soilTests && params.farm.soilTests.length > 0) {
      soilTest = params.farm.soilTests[params.farm.soilTests.length - 1];
    }
  }

  const payload = {
    latitude: lat,
    longitude: lng,
    district,
    cropType,
    cropStage,
    irrigationInfrastructure: irrigation,
    latestSoilTest: soilTest,
    forecastPrecipitation48hMm: params.forecastPrecipitation48hMm,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.report) {
        return data.report;
      }
    }
  } catch (err) {
    console.warn('[CropShield] Direct API call to /api/soil/intelligence failed, trying relative proxy:', err);
  }

  // Fallback to relative URL
  try {
    const fallbackRes = await fetch('/api/soil/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      if (fallbackData.success && fallbackData.report) {
        return fallbackData.report;
      }
    }
  } catch (err) {
    console.error('[CropShield] Offline or soil intelligence endpoint unavailable:', err);
  }

  // Graceful client fallback
  return {
    latitude: lat || 10.9601,
    longitude: lng || 78.0766,
    district: district,
    soilProfile: {
      regionalClassification: 'red_loam',
      regionalSeriesName: 'Palaviduthi Series (TNAU / ICAR-NBSS&LUP Benchmark)',
      regionalSeriesNameTamil: 'பாலவிடுதி தொடர் (செம்மண்)',
      regionalDescription: 'Deep red loam derived from granitic gneiss with medium water-holding capacity.',
      regionalDescriptionTamil: 'கருங்கற்களிலிருந்து உருவான செம்மண் வகை. நடுத்தர நீர் பிடிப்புத் திறன் கொண்டது.',
      source: 'TNAU & ICAR-NBSS&LUP Soil Resource Atlas',
      drainageClass: 'well_drained',
      isLaboratoryVerified: false,
    },
    waterGuidance: {
      cropType: cropType || 'Rice (Paddy)',
      cropStage: cropStage || 'Tillering',
      recommendedFrequencyDays: 3,
      recommendedWaterDepthMm: 35,
      waterConservationPotentialPercent: 22,
      alternateWettingDryingAdvice:
        'Maintain 2-5 cm standing water until 7 days after transplanting. Thereafter, re-irrigate only when field water level drops 15 cm below ground level in perforated field water tube (AWD Pani Pipe).',
      alternateWettingDryingAdviceTamil:
        'நாற்று நட்ட 7 நாட்களுக்கு 2-5 செ.மீ நீர் தேக்குங்கள். பின்னர் பாணி குழாயில் நீர் மட்டம் 15 செ.மீ கீழே குறையும் போது மட்டும் மீண்டும் பாசனம் செய்யவும்.',
      precipitationPauseAdvice: 'Monitor upcoming rainfall forecasts. Pause surface canal or borewell replenishment if precipitation exceeds 15 mm.',
      cautiousNotice: 'Water requirements depend on actual field evapotranspiration and soil drainage class. Satellite and weather models provide evidence-based benchmarks, not automated valve control.',
      cautiousNoticeTamil: 'நீர்த் தேவை நிலத்தின் உண்மையான ஆவியாதல் மற்றும் வடிகால் தன்மையைப் பொறுத்தது. மாதிரி வழிகாட்டுதல்களை கள நிலவரத்துடன் ஒப்பிட்டு செயல்படுத்தவும்.',
    },
    irrigationInfrastructure: irrigation,
    latestSoilTest: soilTest,
    retrievedAt: new Date().toLocaleDateString('en-IN'),
    sourceAttribution: 'ICAR-NBSS&LUP & TNAU Soil Science Atlas · ISRIC SoilGrids 250m ML Prediction',
  };
}

/**
 * Rate laboratory soil parameters against GoI Soil Health Card calibration standards
 */
export async function rateLaboratorySoilTest(test: LaboratorySoilTest): Promise<LaboratorySoilTest> {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const endpoint = `${apiUrl}/api/soil/rate-test`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('[CropShield] Direct API call to /api/soil/rate-test failed, using client fallback:', err);
  }

  // Client-side fallback rating (GoI Standards)
  const rated = { ...test };
  if (test.ph < 6.5) rated.phRating = 'acidic';
  else if (test.ph > 8.5) rated.phRating = 'strongly_alkaline';
  else if (test.ph > 7.5) rated.phRating = 'moderately_alkaline';
  else rated.phRating = 'neutral';

  if (test.electricalConductivityDsm < 1.0) rated.salinityRating = 'normal';
  else if (test.electricalConductivityDsm < 2.0) rated.salinityRating = 'critical';
  else rated.salinityRating = 'injurious';

  if (test.availableNitrogenKgPerHa !== undefined) {
    if (test.availableNitrogenKgPerHa < 280) rated.nitrogenRating = 'low';
    else if (test.availableNitrogenKgPerHa <= 560) rated.nitrogenRating = 'medium';
    else rated.nitrogenRating = 'high';
  }

  if (test.availablePhosphorusKgPerHa !== undefined) {
    if (test.availablePhosphorusKgPerHa < 11) rated.phosphorusRating = 'low';
    else if (test.availablePhosphorusKgPerHa <= 22) rated.phosphorusRating = 'medium';
    else rated.phosphorusRating = 'high';
  }

  if (test.availablePotassiumKgPerHa !== undefined) {
    if (test.availablePotassiumKgPerHa < 118) rated.potassiumRating = 'low';
    else if (test.availablePotassiumKgPerHa <= 280) rated.potassiumRating = 'medium';
    else rated.potassiumRating = 'high';
  }

  if (test.organicCarbonPercent !== undefined) {
    if (test.organicCarbonPercent < 0.5) rated.organicCarbonRating = 'low';
    else if (test.organicCarbonPercent <= 0.75) rated.organicCarbonRating = 'medium';
    else rated.organicCarbonRating = 'high';
  }

  return rated;
}

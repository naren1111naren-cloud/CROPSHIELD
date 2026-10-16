/**
 * CropShield AI — Soil Intelligence and Farm Water Management Service
 *
 * Provides real soil information, laboratory soil-test records management,
 * irrigation-infrastructure mapping, and evidence-based water-management guidance
 * for South India, beginning with Tamil Nadu.
 *
 * Grounded in:
 * - ICAR-NBSS&LUP & TNAU Soil Resource Atlas (Department of Soil Science & Agricultural Chemistry)
 * - ISRIC SoilGrids 250m Global Machine Learning Soil Information System (CC-BY 4.0)
 * - Government of India Soil Health Card (SHC) Laboratory Calibration Standards
 * - TNAU Alternate Wetting and Drying (AWD) & Irrigation Scheduling Guidelines
 */

import {
  FarmSoilProfile,
  LaboratorySoilTest,
  WaterManagementGuidance,
  FarmIrrigationInfrastructure,
  SoilGridsProperties,
  RegionalSoilClassification,
} from '../src/types';

export interface SoilQueryOptions {
  latitude: number;
  longitude: number;
  district?: string;
  cropType?: string;
  cropStage?: string;
  irrigationInfrastructure?: FarmIrrigationInfrastructure;
  latestSoilTest?: LaboratorySoilTest;
  forecastPrecipitation48hMm?: number;
}

export interface SoilIntelligenceReport {
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

// In-memory 24-hour cache for soil characteristics
const soilCache = new Map<string, { timestamp: number; data: SoilIntelligenceReport }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Verified TNAU & ICAR-NBSS&LUP Regional Soil Series Benchmark for South India / Tamil Nadu
 */
const SOUTH_INDIA_SOIL_REGISTRY: Record<
  string,
  {
    classification: RegionalSoilClassification;
    seriesName: string;
    seriesNameTamil: string;
    description: string;
    descriptionTamil: string;
    drainage: 'well_drained' | 'moderately_drained' | 'imperfectly_drained' | 'poorly_drained';
    typicalPh: number;
    typicalOrganicCarbonPercent: number;
    typicalClayPercent: number;
    typicalSandPercent: number;
    typicalSiltPercent: number;
  }
> = {
  Karur: {
    classification: 'red_sandy_loam',
    seriesName: 'Irugur & Amaravathi Alluvial Complex',
    seriesNameTamil: 'இருகுர் மற்றும் அமராவதி வண்டல் தொடர்',
    description: 'Deep red sandy loam with calcareous subsoil nodules and riverine alluvial belts along Amaravathi & Cauvery basins. Highly responsive to organic enrichment and balanced NPK.',
    descriptionTamil: 'அமராவதி மற்றும் காவிரி படுகைகளில் காணப்படும் ஆழமான செம்மண் மற்றும் ஆற்று வண்டல் மண். இயற்கை உரம் மற்றும் சமச்சீர் உரமிடுதலுக்கு சிறந்த பலன் தரும்.',
    drainage: 'well_drained',
    typicalPh: 7.4,
    typicalOrganicCarbonPercent: 0.55,
    typicalClayPercent: 22,
    typicalSandPercent: 62,
    typicalSiltPercent: 16,
  },
  Thanjavur: {
    classification: 'cauvery_alluvial_clay',
    seriesName: 'Adanur & Kalathur Heavy Clay Series',
    seriesNameTamil: 'ஆதனூர் மற்றும் களத்தூர் களிமண் தொடர்',
    description: 'Cauvery Old Delta deep alluvial clay. High cation exchange capacity (CEC) and excellent water retention; requires careful drainage to prevent anaerobic root suffocation.',
    descriptionTamil: 'காவிரி பழைய டெல்டாவின் ஆழமான வண்டல் களிமண். அதிக நீர் தக்கவைக்கும் திறன் கொண்டது; வேரழுகல் தடுக்க முறையான வடிகால் வசதி தேவை.',
    drainage: 'imperfectly_drained',
    typicalPh: 7.2,
    typicalOrganicCarbonPercent: 0.72,
    typicalClayPercent: 46,
    typicalSandPercent: 24,
    typicalSiltPercent: 30,
  },
  Tiruvarur: {
    classification: 'cauvery_alluvial_clay',
    seriesName: 'Valuthalaikudi Deltaic Heavy Silt-Clay',
    seriesNameTamil: 'வழுதலுக்குடி டெல்டா வண்டல் களிமண் தொடர்',
    description: 'Fine alluvial clay loam in the lower Vennar & Cauvery sub-basins. Prone to surface crusting and water stagnation during northeast monsoon downpours.',
    descriptionTamil: 'கீழ் வெண்ணாறு மற்றும் காவிரி படுகை வண்டல் களிமண். வடகிழக்கு பருவமழைக் காலத்தில் நீர் தேங்க வாய்ப்புள்ளது.',
    drainage: 'poorly_drained',
    typicalPh: 7.1,
    typicalOrganicCarbonPercent: 0.68,
    typicalClayPercent: 52,
    typicalSandPercent: 18,
    typicalSiltPercent: 30,
  },
  Nagapattinam: {
    classification: 'coastal_saline_alluvium',
    seriesName: 'Nagapattinam Coastal Marine Alluvium',
    seriesNameTamil: 'நாகப்பட்டினம் கடற்கரை உவர் வண்டல் தொடர்',
    description: 'Low-lying deltaic coastal alluvium with salinity intrusion risks during summer lean flow. Often exhibits potassium and zinc fixation.',
    descriptionTamil: 'கடலோர தாழ்வான உவர் வண்டல் மண். கோடையில் கடல்நீர் உட்புகும் அபாயம் உண்டு; சாம்பல் மற்றும் துத்தநாக பற்றாக்குறை ஏற்படலாம்.',
    drainage: 'imperfectly_drained',
    typicalPh: 7.8,
    typicalOrganicCarbonPercent: 0.48,
    typicalClayPercent: 38,
    typicalSandPercent: 36,
    typicalSiltPercent: 26,
  },
  Coimbatore: {
    classification: 'red_sandy_loam',
    seriesName: 'Palladam & Peelamedu Calcareous Series',
    seriesNameTamil: 'பல்லடம் மற்றும் பீளமேடு சுண்ணாம்பு கலந்த செம்மண்',
    description: 'Medium deep red calcareous gravelly loam with calcic horizons. Well-drained, optimal for drip-irrigated coconut, vegetables, and cotton.',
    descriptionTamil: 'சுண்ணாம்பு துகள்கள் கலந்த நடுத்தர செம்மண். சிறந்த வடிகால் வசதி கொண்டது; சொட்டுநீர்ப் பாசனத்தில் தென்னை மற்றும் காய்கறிகளுக்கு உகந்தது.',
    drainage: 'well_drained',
    typicalPh: 7.9,
    typicalOrganicCarbonPercent: 0.45,
    typicalClayPercent: 26,
    typicalSandPercent: 54,
    typicalSiltPercent: 20,
  },
  Tiruppur: {
    classification: 'red_sandy_loam',
    seriesName: 'Pongalur Gravelly Red Loam Series',
    seriesNameTamil: 'பொங்கலூர் சரளை செம்மண் தொடர்',
    description: 'Shallow to moderately deep reddish brown gravelly loam with high infiltration rate. Susceptible to rapid moisture depletion in dry spells.',
    descriptionTamil: 'சரளை கலந்த செம்மண். அதிக நீர் ஊடுருவல் கொண்டது; வறட்சி காலங்களில் விரைவாக ஈரம் உலர்ந்துவிடும்.',
    drainage: 'well_drained',
    typicalPh: 7.6,
    typicalOrganicCarbonPercent: 0.42,
    typicalClayPercent: 20,
    typicalSandPercent: 65,
    typicalSiltPercent: 15,
  },
  Erode: {
    classification: 'red_sandy_loam',
    seriesName: 'Bhavani Red Sandy Clay Loam',
    seriesNameTamil: 'பவானி செம்மண் களி கலந்த தொடர்',
    description: 'Rich agricultural loam under Lower Bhavani Project command area. Highly productive for turmeric, sugarcane, and Samba paddy.',
    descriptionTamil: 'கீழ்பவானி பாசன பகுதி செம்மண். மஞ்சள், கரும்பு மற்றும் சம்பா நெல் சாகுபடிக்கு மிகவும் வளமானது.',
    drainage: 'well_drained',
    typicalPh: 7.3,
    typicalOrganicCarbonPercent: 0.62,
    typicalClayPercent: 30,
    typicalSandPercent: 48,
    typicalSiltPercent: 22,
  },
  Madurai: {
    classification: 'red_sandy_loam',
    seriesName: 'Vaigai Alluvial & Melur Red Series',
    seriesNameTamil: 'வைகை ஆற்று வண்டல் மற்றும் மேலூர் செம்மண் தொடர்',
    description: 'Mixed Vaigai river basin sandy loam and upland red soils. Neutral to mildly alkaline with good response to green manuring.',
    descriptionTamil: 'வைகை படுகை வண்டல் மண் மற்றும் மேலூர் செம்மண். பசுந்தாள் உரமிடுதலுக்கு சிறந்த பயன் தரும் நடுநிலை மண்.',
    drainage: 'well_drained',
    typicalPh: 7.5,
    typicalOrganicCarbonPercent: 0.52,
    typicalClayPercent: 28,
    typicalSandPercent: 50,
    typicalSiltPercent: 22,
  },
  Thoothukudi: {
    classification: 'black_cotton_clay',
    seriesName: 'Kovilpatti Deep Black Vertisol Series',
    seriesNameTamil: 'கோவில்பட்டி ஆழ்ந்த கரிசல் மண் (வெர்டிசால்)',
    description: 'Deep black cotton clay (Vertisols) with montmorillonite clay mineralogy. Exhibits deep cracks when dry and sticky swelling when wet.',
    descriptionTamil: 'ஆழ்ந்த கரிசல் மண் (வெர்டிசால்). கோடையில் ஆழமான வெடிப்புகளும், மழையில் அதிக ஒட்டும் தன்மையும் காட்டும்.',
    drainage: 'poorly_drained',
    typicalPh: 8.2,
    typicalOrganicCarbonPercent: 0.45,
    typicalClayPercent: 58,
    typicalSandPercent: 22,
    typicalSiltPercent: 20,
  },
  Tirunelveli: {
    classification: 'black_cotton_clay',
    seriesName: 'Tamirabarani Silt Alluvium & Vertisols',
    seriesNameTamil: 'தாமிரபரணி வண்டல் மற்றும் கரிசல் தொடர்',
    description: 'Fertile Tamirabarani river basin alluvial belt flanked by deep rainfed black soils. High inherent fertility.',
    descriptionTamil: 'வளமான தாமிரபரணி படுகை வண்டல் மற்றும் கரிசல் நிலங்கள். இயற்கையிலேயே அதிக ஊட்டச்சத்து கொண்டது.',
    drainage: 'moderately_drained',
    typicalPh: 7.6,
    typicalOrganicCarbonPercent: 0.65,
    typicalClayPercent: 42,
    typicalSandPercent: 32,
    typicalSiltPercent: 26,
  },
  The_Nilgiris: {
    classification: 'laterite_clay_loam',
    seriesName: 'Ooty Humic Brown Lateritic Series',
    seriesNameTamil: 'ஊட்டி சரளை மற்றும் மலைப்பகுதி காடு மண்',
    description: 'Acidic humic lateritic clay loam rich in organic matter. Prone to phosphorus fixation; requires rock phosphate amendments.',
    descriptionTamil: 'அமிலத்தன்மை கொண்ட மலைப்பகுதி செம்மண். மணிச்சத்தை ஈர்க்கும் தன்மை கொண்டதால் பாறை பாஸ்பேட் இட வேண்டும்.',
    drainage: 'well_drained',
    typicalPh: 5.2,
    typicalOrganicCarbonPercent: 1.85,
    typicalClayPercent: 36,
    typicalSandPercent: 38,
    typicalSiltPercent: 26,
  },
  Ramanathapuram: {
    classification: 'coastal_saline_alluvium',
    seriesName: 'Ramanathapuram Coastal Saline Complex',
    seriesNameTamil: 'இராமநாதபுரம் கடற்கரை உவர் மண் தொடர்',
    description: 'Coastal sandy regur and saline clay flats. High electrical conductivity; requires salt-tolerant cultivars (e.g. CSR-series) and gypsum leaching.',
    descriptionTamil: 'கடற்கரை மணல் மற்றும் உவர் களிமண். உப்புத்தன்மை அதிகம் உள்ளதால் உப்பு தாங்கும் ரகங்கள் (CSR-27, 36) மற்றும் ஜிப்சம் இட வேண்டும்.',
    drainage: 'moderately_drained',
    typicalPh: 8.4,
    typicalOrganicCarbonPercent: 0.35,
    typicalClayPercent: 32,
    typicalSandPercent: 48,
    typicalSiltPercent: 20,
  },
};

/**
 * Fetch 250m machine-learning predicted soil physical properties from ISRIC SoilGrids REST API
 * Fallback gracefully to TNAU verified regional benchmark if offline or unauthenticated.
 */
export async function querySoilGridsProperties(
  lat: number,
  lng: number,
  fallbackDistrict = 'Karur'
): Promise<SoilGridsProperties> {
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;

  try {
    const soilGridsUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${roundedLat}&lon=${roundedLng}&property=phh2o&property=soc&property=clay&property=sand&property=silt&property=bdod&property=cec&depth=0-30cm&value=mean`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const res = await fetch(soilGridsUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const layers: any[] = data?.properties?.layers || [];

      const getVal = (name: string): number | null => {
        const lyr = layers.find((l) => l.name === name);
        const depth = lyr?.depths?.find((d: any) => d.label === '0-30cm');
        return depth?.values?.mean ?? null;
      };

      const rawPh = getVal('phh2o');
      const rawSoc = getVal('soc');
      const rawClay = getVal('clay');
      const rawSand = getVal('sand');
      const rawSilt = getVal('silt');
      const rawBdod = getVal('bdod');
      const rawCec = getVal('cec');

      if (rawPh !== null && rawClay !== null) {
        const phVal = Math.round((rawPh / 10) * 10) / 10;
        const socVal = Math.round((rawSoc ? rawSoc / 10 : 8.0) * 10) / 10;
        const clayVal = Math.round((rawClay / 10) * 10) / 10;
        const sandVal = Math.round((rawSand ? rawSand / 10 : 45) * 10) / 10;
        const siltVal = Math.round((rawSilt ? rawSilt / 10 : 25) * 10) / 10;
        return {
          depthCm: '0–30 cm (Topsoil)',
          phH2O: phVal,
          phTopsoil: phVal,
          organicCarbonGPerKg: socVal,
          organicCarbonContentGPerKg: socVal,
          clayPercentage: clayVal,
          clayContentPercent: clayVal,
          sandPercentage: sandVal,
          sandContentPercent: sandVal,
          siltPercentage: siltVal,
          siltContentPercent: siltVal,
          bulkDensityGPerCm3: Math.round((rawBdod ? rawBdod / 100 : 1.35) * 100) / 100,
          cationExchangeCapacityCmolPerKg: Math.round((rawCec ? rawCec / 10 : 18) * 10) / 10,
          modelConfidence: 'ISRIC SoilGrids 250m Machine Learning Model (WoSIS Trained)',
          attribution: 'ISRIC SoilGrids 250m Global Machine Learning Soil Information System (CC-BY 4.0)',
        };
      }
    }
  } catch (err) {
    // Graceful fallback to verified regional benchmark
  }

  // Fallback using TNAU verified regional benchmark
  const benchmark = SOUTH_INDIA_SOIL_REGISTRY[fallbackDistrict] || SOUTH_INDIA_SOIL_REGISTRY['Karur'];
  const fbSoc = Math.round(benchmark.typicalOrganicCarbonPercent * 100) / 10;
  return {
    depthCm: '0–30 cm (TNAU Regional Benchmark)',
    phH2O: benchmark.typicalPh,
    phTopsoil: benchmark.typicalPh,
    organicCarbonGPerKg: fbSoc,
    organicCarbonContentGPerKg: fbSoc,
    clayPercentage: benchmark.typicalClayPercent,
    clayContentPercent: benchmark.typicalClayPercent,
    sandPercentage: benchmark.typicalSandPercent,
    sandContentPercent: benchmark.typicalSandPercent,
    siltPercentage: benchmark.typicalSiltPercent,
    siltContentPercent: benchmark.typicalSiltPercent,
    bulkDensityGPerCm3: 1.32,
    cationExchangeCapacityCmolPerKg: 21.5,
    modelConfidence: 'TNAU & ICAR-NBSS&LUP Soil Resource Atlas Benchmark',
    attribution: 'ICAR-NBSS&LUP & TNAU Soil Science Resource Atlas',
  };
}

/**
 * Rate physical laboratory Soil Health Card parameters according to Government of India standards
 */
export function rateSoilHealthParameters(test: Partial<LaboratorySoilTest>): {
  phRating: 'acidic' | 'normal' | 'alkaline' | 'sodic';
  salinityRating: 'non_saline' | 'slightly_saline' | 'moderately_saline' | 'highly_saline';
  nitrogenRating: 'low' | 'medium' | 'high';
  phosphorusRating: 'low' | 'medium' | 'high';
  potassiumRating: 'low' | 'medium' | 'high';
  organicCarbonRating: 'low' | 'medium' | 'high';
} {
  const ph = test.ph ?? 7.2;
  const ec = test.electricalConductivityDsM ?? (test as any).electricalConductivityDsm ?? 0.6;
  const n = test.availableNitrogenKgPerHa ?? 280;
  const p = test.availablePhosphorusKgPerHa ?? 18;
  const k = test.availablePotassiumKgPerHa ?? 220;
  const oc = test.organicCarbonPercent ?? 0.6;

  let phRating: 'acidic' | 'normal' | 'alkaline' | 'sodic' = 'normal';
  if (ph < 6.5) phRating = 'acidic';
  else if (ph > 8.5) phRating = 'sodic';
  else if (ph > 7.8) phRating = 'alkaline';

  let salinityRating: 'non_saline' | 'slightly_saline' | 'moderately_saline' | 'highly_saline' = 'non_saline';
  if (ec >= 4.0) salinityRating = 'highly_saline';
  else if (ec >= 2.0) salinityRating = 'moderately_saline';
  else if (ec >= 1.0) salinityRating = 'slightly_saline';

  let nitrogenRating: 'low' | 'medium' | 'high' = 'medium';
  if (n < 280) nitrogenRating = 'low';
  else if (n > 450) nitrogenRating = 'high';

  let phosphorusRating: 'low' | 'medium' | 'high' = 'medium';
  if (p < 11) phosphorusRating = 'low';
  else if (p > 22) phosphorusRating = 'high';

  let potassiumRating: 'low' | 'medium' | 'high' = 'medium';
  if (k < 118) potassiumRating = 'low';
  else if (k > 280) potassiumRating = 'high';

  let organicCarbonRating: 'low' | 'medium' | 'high' = 'medium';
  if (oc < 0.5) organicCarbonRating = 'low';
  else if (oc > 0.75) organicCarbonRating = 'high';

  return {
    phRating,
    salinityRating,
    nitrogenRating,
    phosphorusRating,
    potassiumRating,
    organicCarbonRating,
  };
}

/**
 * Generate evidence-based water management guidance combining crop stage, soil type,
 * weather forecast, and lab soil chemistry.
 */
export function generateWaterManagementGuidance(options: {
  cropType?: string;
  cropStage?: string;
  soilClassification: RegionalSoilClassification;
  irrigationInfrastructure?: FarmIrrigationInfrastructure;
  latestSoilTest?: LaboratorySoilTest;
  forecastPrecipitation48hMm?: number;
}): WaterManagementGuidance {
  const normCrop = (options.cropType || 'Rice (Paddy)').toLowerCase();
  const normStage = (options.cropStage || '').toLowerCase();
  const isRice = normCrop.includes('rice') || normCrop.includes('paddy');
  const isSugarcane = normCrop.includes('sugarcane') || normCrop.includes('cane');
  const isBanana = normCrop.includes('banana') || normCrop.includes('plantain');

  const rain48h = options.forecastPrecipitation48hMm ?? 0;
  const isClay =
    options.soilClassification === 'cauvery_alluvial_clay' ||
    options.soilClassification === 'cauvery_delta_clay' ||
    options.soilClassification === 'black_cotton_clay' ||
    options.soilClassification === 'vertisol_black';
  const isSaline =
    options.soilClassification === 'coastal_saline_alluvium' ||
    options.soilClassification === 'coastal_saline';

  let recommendedAction = 'Maintain standard soil moisture schedule based on crop stage.';
  let recommendedActionTamil = 'பயிர் பருவத்திற்கு ஏற்ப வழக்கமான மண் ஈரப்பத அட்டவணையைப் பராமரிக்கவும்.';
  let irrigationSchedule = isClay ? 'Irrigate every 4–6 days (heavy clay holds moisture)' : 'Irrigate every 2–3 days (light loam drains freely)';
  let irrigationScheduleTamil = isClay ? '4–6 நாட்களுக்கு ஒருமுறை பாசனம் (களிமண் அதிக ஈரம் தக்கவைக்கும்)' : '2–3 நாட்களுக்கு ஒருமுறை பாசனம் (செம்மண் எளிதில் வடிகிறது)';

  const recommendedFrequencyDays = isRice ? (isClay ? 4 : 3) : (isClay ? 5 : 3);
  const recommendedWaterDepthMm = isRice ? 50 : 35;
  const waterConservationPotentialPercent = isRice ? 25 : 15;

  let alternateWettingDryingAdvice: string | undefined;
  let alternateWettingDryingAdviceTamil: string | undefined;
  let salinitySoilAmendmentAdvice: string | undefined;
  let salinitySoilAmendmentAdviceTamil: string | undefined;
  let precipitationPauseAdvice: string | undefined;

  // 1. Rain Pause Trigger
  if (rain48h >= 15) {
    precipitationPauseAdvice = `Forecast precipitation of ${rain48h.toFixed(1)} mm in next 48 hours. Pause all scheduled canal and tubewell surface irrigation to avoid waterlogging and nitrogen leaching.`;
  }

  // 2. Rice / Samba Paddy AWD (Alternate Wetting and Drying)
  if (isRice) {
    if (normStage.includes('transplant') || normStage.includes('seedling')) {
      recommendedAction = 'Maintain shallow standing water (2.0–2.5 cm) during seedling establishment.';
      recommendedActionTamil = 'நாற்று நட்ட 10-15 நாட்களுக்கு பயிர் வேர் பிடிக்க 2.0-2.5 செ.மீ நீர் தேக்கி வைக்கவும்.';
      irrigationSchedule = 'Continuous shallow submergence until early tillering.';
      irrigationScheduleTamil = 'தூர்விடும் பருவம் தொடங்கும் வரை சீரான ஆழமற்ற நீர் பராமரிப்பு.';
    } else if (normStage.includes('panicle') || normStage.includes('flower') || normStage.includes('booting')) {
      recommendedAction = 'CRITICAL WATER PHASE: Keep 5 cm standing water throughout panicle initiation and flowering to prevent empty spikelets.';
      recommendedActionTamil = 'முக்கிய நீர் பருவம்: கதிர் உருப்பெறும் மற்றும் பூக்கும் பருவத்தில் பதர் நெல் உருவாகாமல் தடுக்க 5 செ.மீ நீர் கட்டாயம் தேங்க வேண்டும்.';
      irrigationSchedule = 'Do not allow field to dry during flowering.';
      irrigationScheduleTamil = 'பூக்கும் பருவத்தில் எக்காரணம் கொண்டும் நிலம் காயக்கூடாது.';
    } else if (normStage.includes('ripen') || normStage.includes('mature')) {
      recommendedAction = 'Terminal drainage: Drain field completely 10–12 days prior to combine harvest.';
      recommendedActionTamil = 'கடைசி வடிகால்: அறுவடைக்கு 10-12 நாட்களுக்கு முன்பாக வயல் நீரை முழுமையாக வடிக்கவும்.';
      irrigationSchedule = 'Cease all irrigation to facilitate uniform ripening and tractor access.';
      irrigationScheduleTamil = 'சீரான அறுவடை மற்றும் இயந்திரப் பயன்பாட்டிற்கு பாசனத்தை நிறுத்தவும்.';
    } else {
      // Tillering / Vegetative — AWD Protocol
      recommendedAction = 'Adopt TNAU Alternate Wetting and Drying (AWD): Irrigate to 5 cm depth, then allow water to naturally subside until hairline surface cracks appear before re-irrigating.';
      recommendedActionTamil = 'தமிழ்நாடு வேளாண் பல்கலைக்கழக மாற்றுப் பாசனம் (AWD): 5 செ.மீ நீர் பாய்ச்சி, நீர் வடிந்து நிலத்தில் நுண்ணிய கீறல்கள் தோன்றிய பின் மீண்டும் பாசனம் செய்யவும்.';
      alternateWettingDryingAdvice = 'Use a perforated field water tube (AWD Pani Pipe, 15 cm buried). Re-flood only when water table drops to 15 cm below soil surface. Saves 25-30% irrigation water without yield loss.';
      alternateWettingDryingAdviceTamil = '15 செ.மீ ஆழத்தில் துளையிடப்பட்ட கள நீர் பாணி குழாயைப் (AWD Pani Pipe) பயன்படுத்தவும். குழாயில் நீர்மட்டம் 15 செ.மீ கீழே சென்றதும் பாசனம் செய்யவும். 30% நீர் மிச்சமாகும்.';
    }
  } else if (isBanana) {
    recommendedAction = 'Banana requires high sustained soil moisture. Drip fertigation daily (15–20 litres/plant) or basin flooding every 4–5 days.';
    recommendedActionTamil = 'வாழைக்கு தொடர் மண் ஈரப்பதம் தேவை. சொட்டுநீரில் நாளொன்றுக்கு 15-20 லிட்டர்/செடி அல்லது 4-5 நாட்களுக்கு ஒருமுறை பாத்திப் பாசனம்.';
  } else if (isSugarcane) {
    recommendedAction = 'Trash mulching (5 tonnes/acre) in furrows reduces soil evaporation by 35%. Irrigate at 7–8 day intervals.';
    recommendedActionTamil = 'சால் பாசனத்தில் கரும்பு சோகையை மூடாக்காக இடுவதால் 35% நீர் ஆவியாதல் குறையும். 7-8 நாட்களுக்கு ஒருமுறை பாசனம் போதுமானது.';
  }

  // 3. Lab Soil Test Chemistry Amendments
  if (options.latestSoilTest) {
    const ph = options.latestSoilTest.ph;
    const ec = options.latestSoilTest.electricalConductivityDsM ?? (options.latestSoilTest as any).electricalConductivityDsm ?? 0;
    if (ph >= 8.5) {
      salinitySoilAmendmentAdvice = `Alkaline/Sodic Soil (pH ${ph}). Apply agricultural gypsum @ 500 kg/acre followed by fresh canal water flushing to displace exchangeable sodium.`;
      salinitySoilAmendmentAdviceTamil = `கார மண் (pH ${ph}). எக்டேருக்கு 500 கிலோ விவசாய ஜிப்சம் இட்டு, நன்னீர் பாய்ச்சி வடிகட்டுவதன் மூலம் சோடியத்தை அகற்றலாம்.`;
    } else if (ec >= 2.0 || isSaline) {
      salinitySoilAmendmentAdvice = `Saline Soil Index (EC ${ec} dS/m). Maintain raised ridges and ensure active furrow leaching. Avoid applying potassium chloride (MOP) during dry spells.`;
      salinitySoilAmendmentAdviceTamil = `உவர் மண் நிலை (EC ${ec} dS/m). மேட்டுப்பாத்திகளில் நடவு செய்து வடிகால் அமைக்கவும். உலர் காலத்தில் பொட்டாஷ் இட வேண்டாம்.`;
    }
  }

  return {
    recommendedAction,
    recommendedActionTamil,
    irrigationSchedule,
    irrigationScheduleTamil,
    recommendedFrequencyDays,
    recommendedWaterDepthMm,
    waterConservationPotentialPercent,
    cropType: options.cropType || 'Rice (Paddy)',
    cropStage: options.cropStage || 'Vegetative',
    alternateWettingDryingAdvice,
    alternateWettingDryingAdviceTamil,
    salinitySoilAmendmentAdvice,
    salinitySoilAmendmentAdviceTamil,
    precipitationPauseAdvice,
    cautiousNotice: 'Water requirements depend on actual field evapotranspiration and soil drainage class. Satellite and weather models provide evidence-based benchmarks, not automated valve control.',
    cautiousNoticeTamil: 'நீர்த் தேவை நிலத்தின் உண்மையான ஆவியாதல் மற்றும் வடிகால் தன்மையைப் பொறுத்தது. மாதிரி வழிகாட்டுதல்களை கள நிலவரத்துடன் ஒப்பிட்டு செயல்படுத்தவும்.',
  };
}

/**
 * Main service function evaluating farm soil intelligence and water management
 */
export async function getFarmSoilIntelligence(options: SoilQueryOptions): Promise<SoilIntelligenceReport> {
  const { latitude, longitude, district = 'Karur' } = options;

  // Round coordinates for 24h caching
  const cacheKey = `${Math.round(latitude * 1000) / 1000}_${Math.round(longitude * 1000) / 1000}_${district}_${options.cropType || ''}`;
  const cached = soilCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Regional Series Lookup
  const regionalData = SOUTH_INDIA_SOIL_REGISTRY[district] || SOUTH_INDIA_SOIL_REGISTRY['Karur'];

  // 2. SoilGrids Physical Properties
  const soilGrids = await querySoilGridsProperties(latitude, longitude, district);

  // 3. Build Soil Profile
  const soilProfile: FarmSoilProfile = {
    regionalClassification: regionalData.classification,
    regionalSeriesName: regionalData.seriesName,
    regionalSeriesNameTamil: regionalData.seriesNameTamil,
    regionalDescription: regionalData.description,
    regionalDescriptionTamil: regionalData.descriptionTamil,
    source: options.latestSoilTest ? 'Farmer Laboratory Assay' : 'TNAU & ICAR-NBSS&LUP Soil Resource Atlas',
    soilGridsEstimate: soilGrids,
    drainageClass: regionalData.drainage,
    isLaboratoryVerified: Boolean(options.latestSoilTest),
  };

  // 4. Generate Water Guidance
  const waterGuidance = generateWaterManagementGuidance({
    cropType: options.cropType,
    cropStage: options.cropStage,
    soilClassification: regionalData.classification,
    irrigationInfrastructure: options.irrigationInfrastructure,
    latestSoilTest: options.latestSoilTest,
    forecastPrecipitation48hMm: options.forecastPrecipitation48hMm,
  });

  // 5. Soil Test Ratings Summary
  let soilTestRatingSummary: SoilIntelligenceReport['soilTestRatingSummary'];
  if (options.latestSoilTest) {
    const ratings = rateSoilHealthParameters(options.latestSoilTest);
    soilTestRatingSummary = {
      phStatus: ratings.phRating.toUpperCase(),
      salinityStatus: ratings.salinityRating.replace('_', ' ').toUpperCase(),
      fertilityIndex: `N: ${ratings.nitrogenRating.toUpperCase()} | P: ${ratings.phosphorusRating.toUpperCase()} | K: ${ratings.potassiumRating.toUpperCase()}`,
    };
  }

  const report: SoilIntelligenceReport = {
    latitude,
    longitude,
    district,
    soilProfile,
    waterGuidance,
    irrigationInfrastructure: options.irrigationInfrastructure,
    latestSoilTest: options.latestSoilTest,
    soilTestRatingSummary,
    retrievedAt: new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    sourceAttribution: 'ICAR-NBSS&LUP & TNAU Soil Science Atlas · ISRIC SoilGrids 250m ML Prediction · GoI Soil Health Card Standards',
  };

  soilCache.set(cacheKey, { timestamp: now, data: report });
  return report;
}

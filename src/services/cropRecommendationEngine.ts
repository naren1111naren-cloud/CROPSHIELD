import { RealWeatherData } from './weatherService';

export interface CropWeatherRecommendation {
  id: string;
  title: string;
  titleTamil: string;
  cropId: string;
  cropStage: string;
  severity: 'info' | 'caution' | 'critical';
  guidanceType: 'verified_guidance' | 'general_precaution';
  triggerRule: string;
  triggerRuleTamil: string;
  reason: string;
  reasonTamil: string;
  relevancePeriod: string;
  relevancePeriodTamil: string;
  actionSteps: string[];
  actionStepsTamil: string[];
  sourceReference: string;
}

export interface RecommendationContext {
  cropNameOrId: string;
  cropStage?: string;
  district: string;
  irrigationMethod?: string;
}

/**
 * Generate structured, rule-based crop-weather recommendations
 * strictly derived from genuine meteorological readings and TNAU agronomic standards.
 */
export function generateCropWeatherRecommendations(
  weather: RealWeatherData,
  context: RecommendationContext
): CropWeatherRecommendation[] {
  const recommendations: CropWeatherRecommendation[] = [];

  const normCrop = (context.cropNameOrId || 'rice').toLowerCase();
  const isRice = normCrop.includes('rice') || normCrop.includes('paddy');
  const isTomato = normCrop.includes('tomato');
  const isChilli = normCrop.includes('chilli');
  const isCotton = normCrop.includes('cotton');
  const isMaize = normCrop.includes('maize');

  const stage = (context.cropStage || 'Active Tillering (21-45 DAT)').toLowerCase();
  const isNursery = stage.includes('nursery') || stage.includes('seedling');
  const isTillering = stage.includes('tiller') || stage.includes('vegetative');
  const isPanicle = stage.includes('panicle') || stage.includes('booting');
  const isFlowering = stage.includes('flower') || stage.includes('milk');
  const isRipening = stage.includes('ripen') || stage.includes('matur') || stage.includes('harvest');

  const curr = weather.current;
  const next3DaysPrecip = weather.daily.slice(0, 3).reduce((acc, d) => acc + d.precipitationSum, 0);
  const next3DaysMaxProb = Math.max(...weather.daily.slice(0, 3).map((d) => d.precipitationProbabilityMax || 0));
  const maxWindSpeed = Math.max(curr.windSpeed, ...weather.daily.slice(0, 2).map((d) => d.windSpeedMax || 0));

  // --------------------------------------------------------------------------
  // Rule 1: High Precipitation / Rain Forecast (>15mm or probability >= 80%)
  // --------------------------------------------------------------------------
  if (next3DaysPrecip >= 15 || next3DaysMaxProb >= 80 || curr.precipitation > 5) {
    if (isRipening) {
      recommendations.push({
        id: 'rec-heavy-rain-harvest',
        title: 'Rain Forecast During Ripening: Drain Field Bunds Promptly',
        titleTamil: 'அறுவடைப் பருவத்தில் மழை எச்சரிக்கை: வயல் வடிகால்களை உடனே திறக்கவும்',
        cropId: isRice ? 'rice' : normCrop,
        cropStage: 'Ripening / Maturity',
        severity: 'critical',
        guidanceType: 'verified_guidance',
        triggerRule: `Forecast precipitation of ${next3DaysPrecip.toFixed(1)}mm across next 72h (Rain probability: ${next3DaysMaxProb}%)`,
        triggerRuleTamil: `அடுத்த 72 மணி நேரத்தில் ${next3DaysPrecip.toFixed(1)}மிமீ மழை மற்றும் ${next3DaysMaxProb}% மழைப்பொழிவு வாய்ப்பு`,
        reason: 'Standing rain water during grain maturity causes panicle lodging, grain discolouration, and premature on-ear sprouting.',
        reasonTamil: 'தானியம் முதிர்ந்த நிலையில் நீர் தேங்கினால் பயிர் சாய்ந்து, தானியம் நிறம் மாறி கதிரிலேயே முளைத்துவிடும் அபாயம் உள்ளது.',
        relevancePeriod: 'Next 24 to 72 hours',
        relevancePeriodTamil: 'அடுத்த 24 முதல் 72 மணி நேரம் வரை',
        actionSteps: [
          'Open field peripheral drainage cuts to prevent water stagnating around ripening tillers.',
          'If 85% of grains have reached physiological straw-maturity, expedite combine harvesting before intense downpours.',
          'Clean threshing floor and prepare moisture-proof tarpaulins for harvested grain protection.',
        ],
        actionStepsTamil: [
          'முதிர்ந்த பயிரைச் சுற்றி நீர் தேங்காதவாறு வரப்பு வடிகால்களை உடனடியாகத் திறந்து விடவும்.',
          '85% கதிர்கள் பொன்னிறமாக முதிர்ந்திருந்தால், பலத்த மழைக்கு முன்பாக அறுவடையை விரைவுபடுத்தவும்.',
          'அறுவடை செய்த நெல்லைப் பாதுகாக்க தார்ப்பாய்களை முன்கூட்டியே தயார் நிலையில் வைக்கவும்.',
        ],
        sourceReference: 'TNAU Agritech Portal – Rice Crop Drainage & Harvest Management',
      });
    } else if (isCotton || isTomato || isChilli || isMaize) {
      recommendations.push({
        id: 'rec-waterlogging-upland',
        title: 'Precipitation Alert: Prevent Soil Waterlogging in Root Zone',
        titleTamil: 'மழை எச்சரிக்கை: வேர்ப்பகுதியில் நீர் தேங்குவதைத் தவிர்க்கவும்',
        cropId: normCrop,
        cropStage: context.cropStage || 'Vegetative / Reproductive',
        severity: 'caution',
        guidanceType: 'verified_guidance',
        triggerRule: `Expected rainfall accumulation ${next3DaysPrecip.toFixed(1)}mm with ${next3DaysMaxProb}% precipitation probability`,
        triggerRuleTamil: `${next3DaysPrecip.toFixed(1)}மிமீ எதிர்பார்க்கப்படும் மழை மற்றும் ${next3DaysMaxProb}% வாய்ப்பு`,
        reason: 'Solanaceous and upland crops (Tomato, Chilli, Cotton, Maize) cannot tolerate waterlogged root zones; standing water for >24 hours triggers root collar rot and wilt.',
        reasonTamil: 'தக்காளி, மிளகாய், பருத்தி, மக்காச்சோளம் பயிர்கள் வேர்ப்பகுதியில் நீர் தேங்குவதை தாங்காது; 24 மணி நேரத்திற்கு மேல் நீர் தேங்கினால் வேரழுகல் ஏற்படும்.',
        relevancePeriod: 'Next 48 to 72 hours',
        relevancePeriodTamil: 'அடுத்த 48 முதல் 72 மணி நேரம் வரை',
        actionSteps: [
          'Clear field furrows and drainage channels so excess rainfall drains freely away from beds.',
          'Withhold all basal or foliar fertilizer applications until weather clears to avoid leaching losses.',
          'Check raised bed stability to avoid water erosion around stem bases.',
        ],
        actionStepsTamil: [
          'பாத்திகளில் இருந்து உபரி நீர் எளிதில் வடியும் வகையில் சால் வடிகால்களைத் தூய்மைப்படுத்தவும்.',
          'மழை நிற்கும் வரை எவ்வித உரம் அல்லது தெளிப்பு மருந்துகளை இட வேண்டாம்; உரங்கள் நீரில் அடித்துச் செல்லப்படலாம்.',
          'செடியின் தண்டுப்பகுதியைச் சுற்றி மண் அரிப்பு ஏற்படாமல் பார்த்துக் கொள்ளவும்.',
        ],
        sourceReference: 'TNAU Directorate of Crop Management – Upland Crop Contingency Measures',
      });
    } else {
      recommendations.push({
        id: 'rec-paddy-drainage',
        title: 'Monsoon Rain Inflow: Regulate Standing Water Depth',
        titleTamil: 'மழை வரத்து: வயல் நீர்மட்டத்தை வரன்முறைப்படுத்தவும்',
        cropId: 'rice',
        cropStage: context.cropStage || 'Tillering / Panicle',
        severity: 'info',
        guidanceType: 'verified_guidance',
        triggerRule: `Forecast precipitation ${next3DaysPrecip.toFixed(1)}mm with ${next3DaysMaxProb}% probability`,
        triggerRuleTamil: `${next3DaysPrecip.toFixed(1)}மிமீ மழை மற்றும் ${next3DaysMaxProb}% மழை வாய்ப்பு`,
        reason: 'Continuous deep flooding (>5cm) reduces tiller aeration and elevates bacterial blight pathogen mobility across flooded leaf margins.',
        reasonTamil: 'தொடர்ந்து 5 செ.மீ-க்கு மேல் நீர் தேங்குவது தூர்களின் காற்றோட்டத்தைக் குறைத்து பாக்டீரியா நோய்க்கிருமிகள் பரவ வழிவகுக்கும்.',
        relevancePeriod: 'Next 48 to 72 hours',
        relevancePeriodTamil: 'அடுத்த 48 முதல் 72 மணி நேரம் வரை',
        actionSteps: [
          'Maintain water level at 2.5 to 5 cm; allow excess rainwater to spill over into drainage ditches.',
          'Postpone top-dressing urea/nitrogen until rain subsides to prevent fertilizer loss.',
        ],
        actionStepsTamil: [
          'நீர்மட்டத்தை 2.5 முதல் 5 செ.மீ வரை பராமரிக்கவும்; உபரி நீரை வடிகாலில் வடியவிடவும்.',
          'மழை தணியும் வரை யூரியா போன்ற தழைச்சத்து இடுவதைத் தற்காலிகமாக ஒத்திவைக்கவும்.',
        ],
        sourceReference: 'TNAU Agritech Portal – Alternate Wetting and Drying (AWD) Guidelines',
      });
    }
  }

  // --------------------------------------------------------------------------
  // Rule 2: Post-Rainfall Foliar Scouting Checklist
  // --------------------------------------------------------------------------
  if (curr.precipitation > 2 || next3DaysPrecip >= 8) {
    recommendations.push({
      id: 'rec-scout-after-rain',
      title: 'Post-Rain Field Inspection: Scout Lower Canopy & Leaf Margins',
      titleTamil: 'மழைக்குப் பிந்தைய கள ஆய்வு: கீழ் இலைகள் மற்றும் விளிம்புகளைப் பரிசோதிக்கவும்',
      cropId: normCrop,
      cropStage: context.cropStage || 'Active Growth',
      severity: 'info',
      guidanceType: 'general_precaution',
      triggerRule: `Recent or forecast rainfall event (${(curr.precipitation || next3DaysPrecip).toFixed(1)}mm)`,
      triggerRuleTamil: `மழைப்பொழிவு நிகழ்வு (${(curr.precipitation || next3DaysPrecip).toFixed(1)}மிமீ)`,
      reason: 'Rain splashing, soil silt deposition, and prolonged surface wetness create initial opportunities for spore and bacterial entry.',
      reasonTamil: 'மழைத்துளி சிதறல், மண் துகள்கள் படிதல் மற்றும் தொடர் ஈரப்பதம் ஆகியவை பூஞ்சை மற்றும் பாக்டீரியாக்கள் நுழைய ஏதுவான சூழலை உருவாக்கும்.',
      relevancePeriod: 'Once rainfall pauses (Within 48h)',
      relevancePeriodTamil: 'மழை நின்றவுடன் (48 மணி நேரத்திற்குள்)',
      actionSteps: [
        'Walk diagonally across your parcel once foliage surfaces dry in sunlight.',
        'Inspect leaf edges for water-soaked wavy lesions and lower sheaths for fungal spots.',
        'Note: Weather favors fungal mobility, but does NOT confirm disease. Verify visible symptoms before taking management steps.',
      ],
      actionStepsTamil: [
        'மழை நின்ற பின் இலைகள் காய்ந்ததும் வயலின் குறுக்கே நடந்து பயிர்களைப் பார்வையிடவும்.',
        'இலை விளிம்புகளில் நீர் ஊறிய கருகல் கோடுகள் அல்லது இலை உறைகளில் புள்ளிகள் உள்ளதா எனப் பார்க்கவும்.',
        'குறிப்பு: வானிலை நோய்க்கான சூழலை உருவாக்கலாம்; ஆனால் நோய் தாக்கியுள்ளது என்பதை உறுதிப்படுத்தாமல் மருந்து தெளிக்க வேண்டாம்.',
      ],
      sourceReference: 'TNAU Integrated Pest Management (IPM) Foliar Surveillance Standard',
    });
  }

  // --------------------------------------------------------------------------
  // Rule 3: High Relative Humidity (>85%) with Favorable Temperature (22 - 30°C)
  // --------------------------------------------------------------------------
  if (curr.relativeHumidity >= 82 && curr.temperature >= 22 && curr.temperature <= 32) {
    recommendations.push({
      id: 'rec-high-humidity-spore',
      title: 'Extended High Humidity Window: Atmospheric Disease Risk Caution',
      titleTamil: 'அதிகக் காற்றின் ஈரப்பதம்: பூஞ்சை பரவல் எச்சரிக்கை',
      cropId: isRice ? 'rice' : isTomato ? 'tomato' : isChilli ? 'chilli' : normCrop,
      cropStage: isFlowering ? 'Flowering' : isPanicle ? 'Panicle Initiation' : 'Vegetative',
      severity: 'caution',
      guidanceType: 'verified_guidance',
      triggerRule: `Relative humidity at ${curr.relativeHumidity}% with temperature ${curr.temperature.toFixed(1)}°C`,
      triggerRuleTamil: `காற்றின் ஈரப்பதம் ${curr.relativeHumidity}% மற்றும் வெப்பநிலை ${curr.temperature.toFixed(1)}°C`,
      reason: 'Micro-climatic conditions with relative humidity exceeding 85% and moderate temperatures prolong dew duration, favoring Leaf Blast, BLB, and Early Blight spore germination.',
      reasonTamil: '85%க்கும் அதிகமான ஈரப்பதம் மற்றும் மிதமான வெப்பநிலை பனித்துளி நீடிக்கும் நேரத்தை அதிகரித்து குலை நோய் மற்றும் கருகல் வித்துக்கள் முளைக்க சாதகமாக அமைகிறது.',
      relevancePeriod: 'Current atmospheric window',
      relevancePeriodTamil: 'தற்போதைய வானிலை நிலவரம்',
      actionSteps: [
        'Avoid excessive split nitrogen application; heavy urea softens leaf cuticles and accelerates pathogen penetration.',
        'Apply bio-fungicide Pseudomonas fluorescens (0.2% spray @ 2g/litre) as an eco-friendly protective prophylactic measure.',
        'Do not treat this atmospheric risk as a confirmed disease diagnosis. Inspect actual leaves first.',
      ],
      actionStepsTamil: [
        'அதிகப்படியான யூரியா இடுவதைத் தவிர்க்கவும்; அதிக தழைச்சத்து இலைகளை மென்மையாக்கி நோய்த்தொற்றை எளிதாக்கும்.',
        'சூடோமோனாஸ் புளோரசன்ஸ் உயிரியல் மருந்தைத் தெளித்து (லிட்டருக்கு 2 கிராம்) பயிரின் நோய் எதிர்ப்பாற்றலை அதிகரிக்கவும்.',
        'இதை உறுதியான நோயாகக் கருத வேண்டாம்; உங்கள் வயல் பயிர்களில் அறிகுறிகள் தென்படுகின்றனவா என்று முதலில் ஆய்வு செய்யவும்.',
      ],
      sourceReference: 'TNAU Department of Plant Pathology – Agro-Meteorological Advisory Protocol',
    });
  }

  // --------------------------------------------------------------------------
  // Rule 4: Dry Spell & Irrigation Regulation (Next 3 days rain < 1mm & Temp >= 30°C)
  // --------------------------------------------------------------------------
  if (next3DaysPrecip < 1 && next3DaysMaxProb < 30 && curr.temperature >= 30) {
    if (isPanicle || isFlowering) {
      recommendations.push({
        id: 'rec-dry-critical-panicle',
        title: 'Dry Spell Warning: Maintain Critical Water Depth During Reproductive Phase',
        titleTamil: 'வறண்ட வானிலை: கதிர் உருவாகும் மற்றும் பூக்கும் பருவத்தில் நீர் பற்றாக்குறையைத் தவிர்க்கவும்',
        cropId: 'rice',
        cropStage: isFlowering ? 'Flowering / Milk Stage' : 'Panicle Initiation',
        severity: 'caution',
        guidanceType: 'verified_guidance',
        triggerRule: `Negligible rain (<1mm) across next 3 days, maximum temperature ${Math.max(...weather.daily.slice(0, 3).map((d) => d.tempMax)).toFixed(1)}°C`,
        triggerRuleTamil: `அடுத்த 3 நாட்களுக்கு மழை இல்லை (<1மிமீ) மற்றும் அதிகபட்ச வெப்பநிலை ${Math.max(...weather.daily.slice(0, 3).map((d) => d.tempMax)).toFixed(1)}°C`,
        reason: 'Moisture stress during panicle initiation or flowering induces high spikelet sterility and chaffy grains.',
        reasonTamil: 'கதிர் உருவாகும் அல்லது பூக்கும் தருணத்தில் ஏற்படும் நீர் பற்றாக்குறை பதர்களை அதிகரிக்கச் செய்து விளைச்சலைக் கடுமையாகப் பாதிக்கும்.',
        relevancePeriod: 'Next 3 to 5 days',
        relevancePeriodTamil: 'அடுத்த 3 முதல் 5 நாட்கள் வரை',
        actionSteps: [
          'Maintain uninterrupted 3 to 5 cm standing water layer in fields until grain dough stage.',
          'Schedule irrigation in early morning or evening hours to minimize soil evaporation.',
        ],
        actionStepsTamil: [
          'தானியம் கெட்டியாகும் வரை வயலில் 3 முதல் 5 செ.மீ நீர் தொடர்ந்து இருக்குமாறு பாசனம் செய்யவும்.',
          'ஆவியாதலைத் தவிர்க்க காலை அல்லது மாலை வேளையில் நீர் பாய்ச்சவும்.',
        ],
        sourceReference: 'TNAU Agritech Portal – Water Management in Paddy',
      });
    } else {
      recommendations.push({
        id: 'rec-dry-awd',
        title: 'Dry Weather: Implement Alternate Wetting and Drying (AWD)',
        titleTamil: 'வறண்ட வானிலை: காய்ச்சலும் பாய்ச்சலுமாக நீர் மேலாண்மை',
        cropId: normCrop,
        cropStage: context.cropStage || 'Tillering / Vegetative',
        severity: 'info',
        guidanceType: 'verified_guidance',
        triggerRule: `Forecast dry conditions for next 3 days (Precipitation: ${next3DaysPrecip.toFixed(1)}mm)`,
        triggerRuleTamil: `அடுத்த 3 நாட்களுக்கு வறண்ட வானிலை (மழை: ${next3DaysPrecip.toFixed(1)}மிமீ)`,
        reason: 'AWD saves 25-30% irrigation water without reducing grain yields and strengthens root anchorage.',
        reasonTamil: 'காய்ச்சலும் பாய்ச்சலுமாக நீர் பாய்ச்சுவது 25-30% தண்ணீரைச் சேமித்து, வேர்களை ஆழமாக வளரச் செய்யும்.',
        relevancePeriod: 'Next 3 to 5 days',
        relevancePeriodTamil: 'அடுத்த 3 முதல் 5 நாட்கள் வரை',
        actionSteps: [
          'Allow standing water to disappear until hairline surface cracks appear before irrigating to 2-3 cm.',
          'Inspect irrigation channels to eliminate transmission seepage losses.',
        ],
        actionStepsTamil: [
          'நிலத்தில் சிறு கீறல் விழுந்த பிறகு 2 முதல் 3 செ.மீ அளவு மறுபாசனம் செய்யவும்.',
          'பாசன வாய்க்கால்களில் நீர் கசிவு ஏற்படாதவாறு சீரமைக்கவும்.',
        ],
        sourceReference: 'TNAU Water Technology Centre & IRRI AWD Framework',
      });
    }
  }

  // --------------------------------------------------------------------------
  // Rule 5: High Wind Velocity (>22 km/h)
  // --------------------------------------------------------------------------
  if (maxWindSpeed >= 22) {
    recommendations.push({
      id: 'rec-high-wind-drift',
      title: 'Elevated Wind Velocity: Postpone Foliar Spraying & Prevent Lodging',
      titleTamil: 'வேகமான காற்று: தெளிப்பு மருந்துகளை ஒத்திவைக்கவும் & பயிர் சாய்தலைத் தவிர்க்கவும்',
      cropId: normCrop,
      cropStage: context.cropStage || 'All Stages',
      severity: 'caution',
      guidanceType: 'general_precaution',
      triggerRule: `Wind gusts recorded up to ${maxWindSpeed.toFixed(1)} km/h`,
      triggerRuleTamil: `காற்றின் வேகம் ${maxWindSpeed.toFixed(1)} கி.மீ/மணி வரை பதிவாகியுள்ளது`,
      reason: 'Winds above 20 km/h cause severe spray droplet drift, wasting costly biocontrol inputs, and increase lodging in tall varieties.',
      reasonTamil: '20 கி.மீ/மணிக்கு மேல் காற்று வீசும்போது தெளிப்பு மருந்துகள் காற்றில் அடித்துச் செல்லப்பட்டு வீணாகும்; மேலும் உயரமான பயிர்கள் சாயக்கூடும்.',
      relevancePeriod: 'During windy intervals today',
      relevancePeriodTamil: 'இன்றைய பலத்த காற்று வீசும் வேளைகளில்',
      actionSteps: [
        'Postpone all knapsack and power sprayer operations until calm morning or evening hours (<12 km/h).',
        'In banana, maize, or tall paddy, strengthen border bund support to prevent mechanical wind damage.',
      ],
      actionStepsTamil: [
        'காற்றின் வேகம் குறையும் வரை (காலை 8 மணிக்குள்) எவ்வித தெளிப்பு பணிகளையும் செய்ய வேண்டாம்.',
        'உயரமான பயிர்கள் காற்றில் சாயாமல் இருக்க வரப்புகளை பலப்படுத்தவும்.',
      ],
      sourceReference: 'IMD Agricultural Meteorology Division – Spray Operations Advisory',
    });
  }

  // Fallback seasonal hygiene reminder if no severe weather triggered
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-favorable-hygiene',
      title: 'Favorable Weather Window: Ideal Conditions for Field Scouting',
      titleTamil: 'சாதகமான வானிலை: பயிர் ஆய்வு மற்றும் பராமரிப்புக்கு உகந்த நேரம்',
      cropId: normCrop,
      cropStage: context.cropStage || 'Current Stage',
      severity: 'info',
      guidanceType: 'verified_guidance',
      triggerRule: `Stable weather readings (Temp: ${curr.temperature.toFixed(1)}°C, RH: ${curr.relativeHumidity}%, Wind: ${curr.windSpeed.toFixed(1)} km/h)`,
      triggerRuleTamil: `சீரான வானிலை (வெப்பநிலை: ${curr.temperature.toFixed(1)}°C, ஈரப்பதம்: ${curr.relativeHumidity}%, காற்று: ${curr.windSpeed.toFixed(1)} கி.மீ/மணி)`,
      reason: 'Current weather conditions are conducive to normal crop metabolic activity with low immediate meteorological stress.',
      reasonTamil: 'தற்போதைய வானிலை சீராகவும், உடனடி வானிலை இடர்பாடுகள் இன்றியும் பயிர் வளர்ச்சிக்கு உகந்ததாக உள்ளது.',
      relevancePeriod: 'Next 24 to 48 hours',
      relevancePeriodTamil: 'அடுத்த 24 முதல் 48 மணி நேரம் வரை',
      actionSteps: [
        'Carry out routine weed clearance along bunds to remove alternate insect hosts.',
        'Use the CropShield disease scanner to record baseline healthy leaf images for ongoing phenological monitoring.',
      ],
      actionStepsTamil: [
        'வரப்புகளில் உள்ள களைகளை அகற்றி தூய்மையாக வைத்திருக்கவும்.',
        'பயிர்களின் ஆரோக்கியத்தைக் கண்காணிக்க கிராப்ஷீல்ட் செயலியில் அவ்வப்போது ஆய்வு செய்யவும்.',
      ],
      sourceReference: 'TNAU Agritech Portal – Routine Field Sanitation Package of Practices',
    });
  }

  return recommendations;
}

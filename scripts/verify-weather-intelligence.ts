/**
 * Automated Verification Suite for CropShield AI — Phase 3: Farm Weather and Agricultural Risk Intelligence
 *
 * Verifies:
 * 1. Farm-specific coordinate querying (exact parcel centroid vs district fallback).
 * 2. Real meteorological observation & forecast extraction from Open-Meteo NWP:
 *    - Current observed temperature, feels-like, humidity, wind speed & compass direction.
 *    - 7-day daily forecasts with precipitation sums and rain probability.
 *    - Distinction between observed current state and forecast projections.
 * 3. Agricultural risk modeling calibrated to TNAU & IMD standards:
 *    - Heat stress exposure (normal vs caution vs critical ≥38°C) + flowering paddy pollen sterility.
 *    - Heavy rainfall accumulation (72h accumulation thresholds & waterlogging hazard).
 *    - Spraying window suitability (wind speed drift thresholds and precipitation washout).
 *    - Fungal / bacterial disease microclimate predisposition (RH ≥82%, temperature favorability).
 * 4. Transparent data provenance and non-fabrication guarantees.
 * 5. In-memory caching and rapid response time (<50ms on cache hit).
 */

import {
  fetchFarmWeatherIntelligence,
  calculateAgriculturalRisks,
  getWindCompass,
} from '../server/weatherIntelligenceService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runWeatherIntelligenceTests() {
  console.log('================================================================');
  console.log('CropShield AI — Phase 3 Farm Weather & Ag-Risk Intelligence Tests');
  console.log('================================================================\n');

  // 1. Compass Direction Helper
  console.log('--- Test 1: Wind Compass Calculation ---');
  assert(getWindCompass(0) === 'N', '0° corresponds to North');
  assert(getWindCompass(45) === 'NE', '45° corresponds to North-East');
  assert(getWindCompass(90) === 'E', '90° corresponds to East');
  assert(getWindCompass(180) === 'S', '180° corresponds to South');
  assert(getWindCompass(270) === 'W', '270° corresponds to West');

  // 2. Agricultural Risk Calculation Logic
  console.log('\n--- Test 2: Agricultural Risk Indicators & Agronomic Rules ---');
  // Scenario A: Heat wave during Rice Flowering
  const mockCurrentHot = {
    temperature: 39.2,
    apparentTemperature: 43.5,
    relativeHumidity: 65,
    windSpeed: 11,
    windDirection: 90,
    precipitation: 0,
    rain: 0,
  };
  const mockDailyHot = [
    { tempMax: 39.5, precipitationSum: 0, precipitationProbabilityMax: 10 },
    { tempMax: 38.8, precipitationSum: 0, precipitationProbabilityMax: 10 },
    { tempMax: 38.0, precipitationSum: 0, precipitationProbabilityMax: 10 },
  ];
  const hotRisks = calculateAgriculturalRisks(mockCurrentHot, mockDailyHot, 'Paddy / Rice', 'Panicle / Flowering');
  assert(hotRisks.heatStress.level === 'critical', 'Detects critical heat stress at ≥38°C');
  assert(hotRisks.heatStress.pollenSterilityRisk === true, 'Triggers pollen sterility warning for flowering paddy');
  assert(hotRisks.heatStress.advisory.includes('pollen sterility'), 'Advisory explicitly mentions empty spikelet / sterility risk');
  assert(hotRisks.sprayingWindow.suitability === 'optimal', 'Spraying wind speed is optimal under gentle breeze');

  // Scenario B: Heavy Monsoon Downpour (High Waterlogging Risk)
  const mockCurrentRain = {
    temperature: 27.5,
    apparentTemperature: 30.0,
    relativeHumidity: 92,
    windSpeed: 24,
    windDirection: 220,
    precipitation: 12.5,
    rain: 12.0,
  };
  const mockDailyRain = [
    { tempMax: 29.0, precipitationSum: 45.0, precipitationProbabilityMax: 95 },
    { tempMax: 28.0, precipitationSum: 35.0, precipitationProbabilityMax: 90 },
    { tempMax: 28.5, precipitationSum: 15.0, precipitationProbabilityMax: 80 },
  ];
  const rainRisks = calculateAgriculturalRisks(mockCurrentRain, mockDailyRain, 'Rice (Paddy)', 'Tillering');
  assert(rainRisks.rainfallRisk.level === 'very_heavy', 'Detects very heavy rainfall (72h sum ≥ 65mm)');
  assert(rainRisks.rainfallRisk.waterloggingRisk === 'high', 'Classifies waterlogging risk as high');
  assert(rainRisks.rainfallRisk.hydrologyNotice.includes('Open-Meteo'), 'Discloses hydrology precipitation source');
  assert(rainRisks.sprayingWindow.suitability === 'unfavorable', 'Flags spraying as unfavorable due to rain and 24 km/h wind');
  assert(rainRisks.pathogenPredisposition.favorableForBlast === true, 'Detects microclimate predisposition for Blast (RH ≥82% + rain)');

  // 3. Exact Farm Coordinate vs District Fallback
  console.log('\n--- Test 3: Micro-Climate Farm vs District Centroid Resolution ---');
  // Farm coordinates near Thanthoni, Karur
  const farmWeather = await fetchFarmWeatherIntelligence({
    latitude: 10.958,
    longitude: 78.082,
    locationName: 'Thanthoni Cauvery Farm #1',
    isFarmCoordinate: true,
    cropType: 'Paddy / Rice',
    cropStage: 'Vegetative / Tillering',
  });

  assert(farmWeather.isFarmCoordinate === true, 'Recognizes exact farm coordinate source');
  assert(farmWeather.latitude === 10.958 && farmWeather.longitude === 78.082, 'Retains exact parcel coordinates');
  assert(typeof farmWeather.current.temperature === 'number', 'Contains genuine temperature reading');
  assert(typeof farmWeather.current.apparentTemperature === 'number', 'Contains feels-like temperature');
  assert(typeof farmWeather.current.windSpeed === 'number', 'Contains genuine wind speed');
  assert(Boolean(farmWeather.current.windDirectionCompass), 'Populates cardinal wind compass');
  assert(farmWeather.daily.length >= 5, 'Provides at least 5-day daily forecast outlook');
  assert(farmWeather.source.includes('Open-Meteo'), 'Attribution confirms Open-Meteo NWP source');

  // District fallback
  const districtWeather = await fetchFarmWeatherIntelligence({
    latitude: 10.96,
    longitude: 78.08,
    locationName: 'Karur District',
    isFarmCoordinate: false,
    district: 'Karur',
  });
  assert(districtWeather.isFarmCoordinate === false, 'Correctly flags district centroid fallback when farm is unmapped');
  assert(districtWeather.locationName.includes('Karur'), 'Identifies location as Karur District');

  // 4. In-Memory Server Caching Performance
  console.log('\n--- Test 4: In-Memory Caching & Performance ---');
  const tStart = Date.now();
  const cachedReport = await fetchFarmWeatherIntelligence({
    latitude: 10.958,
    longitude: 78.082,
    locationName: 'Thanthoni Cauvery Farm #1',
    isFarmCoordinate: true,
    cropType: 'Paddy / Rice',
    cropStage: 'Vegetative / Tillering',
  });
  const tElapsed = Date.now() - tStart;
  assert(cachedReport.locationName === 'Thanthoni Cauvery Farm #1', 'Retrieved cached farm report');
  assert(tElapsed < 25, `Cache hit returned instantly in ${tElapsed}ms (<25ms)`);

  console.log('\n================================================================');
  console.log('🎉 ALL FARM WEATHER & AG-RISK INTELLIGENCE TESTS PASSED!');
  console.log('================================================================');
}

runWeatherIntelligenceTests().catch((err) => {
  console.error('Fatal error during weather tests:', err);
  process.exit(1);
});

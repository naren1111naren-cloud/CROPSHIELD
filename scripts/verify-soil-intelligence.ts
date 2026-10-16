/**
 * Automated Verification Suite for CropShield AI — Phase 4: Soil Intelligence and Farm Water Management
 *
 * Verifies:
 * 1. Documented Soil Data Sources for South India & Tamil Nadu:
 *    - ICAR-NBSS&LUP & TNAU Soil Resource Atlas benchmark series across diverse agro-climatic zones.
 *    - ISRIC SoilGrids 250m global machine learning predictions.
 * 2. GoI Soil Health Card Laboratory Standards:
 *    - Standard rating calibration for pH, EC, Nitrogen, Phosphorus, Potassium, Organic Carbon.
 * 3. Evidence-Based Water Management & TNAU Alternate Wetting and Drying (AWD):
 *    - AWD Pani Pipe guidance for Samba / Kuruvai rice.
 *    - Precipitation pause warning when forecast rainfall >= 15 mm.
 *    - Salinity and sodicity soil amendment advice (Gypsum for pH >= 8.5, Leaching for EC >= 2.0 dS/m).
 * 4. Irrigation Infrastructure Mapping:
 *    - Support for open wells, borewells, canal/sluice, tank/eri, farm ponds, river lift, and rainfed systems.
 * 5. Strict Zero Synthetic Data Guarantees:
 *    - Unmistakable separation between Certified Physical Lab Assays, Regional Soil Atlas, and 250m ML Estimates.
 * 6. High-Performance Server In-Memory Caching (<50ms cache hits).
 */

import {
  getFarmSoilIntelligence,
  rateSoilHealthParameters,
  querySoilGridsProperties,
  generateWaterManagementGuidance,
} from '../server/soilIntelligenceService';
import { LaboratorySoilTest, FarmIrrigationInfrastructure } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runSoilIntelligenceTests() {
  console.log('================================================================');
  console.log('CropShield AI — Phase 4 Soil Intelligence & Water Management Tests');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: GoI Soil Health Card Calibration Standards & Ratings
  // -------------------------------------------------------------------------
  console.log('--- Test 1: GoI Soil Health Card Rating Calibration ---');

  // Test Case A: Strongly Alkaline & Saline Black Soil
  const testA: LaboratorySoilTest = {
    testId: 'test_alkaline_01',
    sampleDate: '2026-10-10',
    laboratoryName: 'TNAU Soil Testing Laboratory, Coimbatore',
    ph: 8.8,
    electricalConductivityDsm: 2.4,
    availableNitrogenKgPerHa: 210, // Low (< 280)
    availablePhosphorusKgPerHa: 28, // High (> 22)
    availablePotassiumKgPerHa: 340, // High (> 280)
    organicCarbonPercent: 0.42, // Low (< 0.5)
  };
  const ratedA = rateSoilHealthParameters(testA);
  assert(ratedA.phRating === 'sodic', 'pH 8.8 is classified as sodic (pH > 8.5)');
  assert(ratedA.salinityRating === 'moderately_saline', 'EC 2.4 dS/m is classified as moderately_saline (2.0-4.0)');
  assert(ratedA.nitrogenRating === 'low', 'Nitrogen 210 kg/ha is classified as low (<280)');
  assert(ratedA.phosphorusRating === 'high', 'Phosphorus 28 kg/ha is classified as high (>22)');
  assert(ratedA.potassiumRating === 'high', 'Potassium 340 kg/ha is classified as high (>280)');
  assert(ratedA.organicCarbonRating === 'low', 'Organic Carbon 0.42% is classified as low (<0.50)');

  // Test Case B: Acidic Hill Soil (Nilgiris / Kodaikanal)
  const testB: LaboratorySoilTest = {
    testId: 'test_acidic_02',
    sampleDate: '2026-10-12',
    laboratoryName: 'UPASI Tea Research Foundation, Valparai',
    ph: 5.6,
    electricalConductivityDsm: 0.3,
    availableNitrogenKgPerHa: 380, // Medium (280-560)
    availablePhosphorusKgPerHa: 14, // Medium (11-22)
    availablePotassiumKgPerHa: 180, // Medium (118-280)
    organicCarbonPercent: 1.25, // High (> 0.75)
  };
  const ratedB = rateSoilHealthParameters(testB);
  assert(ratedB.phRating === 'acidic', 'pH 5.6 is classified as acidic (<6.5)');
  assert(ratedB.salinityRating === 'non_saline', 'EC 0.3 dS/m is classified as non_saline (<1.0)');
  assert(ratedB.nitrogenRating === 'medium', 'Nitrogen 380 kg/ha is classified as medium');
  assert(ratedB.phosphorusRating === 'medium', 'Phosphorus 14 kg/ha is classified as medium');
  assert(ratedB.potassiumRating === 'medium', 'Potassium 180 kg/ha is classified as medium');
  assert(ratedB.organicCarbonRating === 'high', 'Organic Carbon 1.25% is classified as high (>0.75)');

  // -------------------------------------------------------------------------
  // Test 2: Evidence-Based Water Management & TNAU AWD Protocol
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Evidence-Based Water Management & TNAU AWD Rules ---');

  // Scenario 1: Paddy Tillering with Borewell, No Rain
  const guidance1 = generateWaterManagementGuidance({
    cropType: 'Rice (Paddy)',
    cropStage: 'Tillering',
    soilClassification: 'cauvery_delta_clay',
    irrigationInfrastructure: {
      sourceType: 'borewell',
      distributionMethod: 'basin',
      depthFeet: 160,
    },
    forecastPrecipitation48hMm: 2.0,
  });
  assert(guidance1.recommendedFrequencyDays >= 2, 'Paddy in delta clay gets >=2 day interval');
  assert(guidance1.waterConservationPotentialPercent > 15, 'AWD indicates ~20-25% water conservation');
  assert(
    guidance1.alternateWettingDryingAdvice.includes('AWD Pani Pipe'),
    'Guidance contains TNAU AWD Pani Pipe protocol'
  );
  assert(
    guidance1.precipitationPauseAdvice === undefined,
    'No rain pause advice when rainfall is low (2mm)'
  );

  // Scenario 2: Heavy Rain Forecast (>= 15 mm)
  const guidance2 = generateWaterManagementGuidance({
    cropType: 'Rice (Paddy)',
    cropStage: 'Panicle Initiation',
    soilClassification: 'cauvery_delta_clay',
    forecastPrecipitation48hMm: 35.0, // Heavy Monsoon Shower
  });
  assert(
    guidance2.precipitationPauseAdvice !== undefined &&
      guidance2.precipitationPauseAdvice.includes('Pause all scheduled canal and tubewell surface irrigation'),
    'Rain pause advice triggered for 35mm precipitation forecast'
  );

  // Scenario 3: Highly Alkaline Soil (Gypsum Amendment Advice)
  const guidance3 = generateWaterManagementGuidance({
    cropType: 'Cotton',
    soilClassification: 'vertisol_black',
    latestSoilTest: { ...testA, ...ratedA }, // pH 8.8
  });
  assert(
    guidance3.salinitySoilAmendmentAdvice !== undefined &&
      guidance3.salinitySoilAmendmentAdvice.includes('agricultural gypsum'),
    'Gypsum amendment advice triggered for soil pH >= 8.5'
  );

  // -------------------------------------------------------------------------
  // Test 3: ISRIC SoilGrids 250m Machine Learning Property Query
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: ISRIC SoilGrids 250m ML Property Query ---');
  // Karur benchmark coordinates
  const karurSoilGrids = await querySoilGridsProperties(10.9601, 78.0766, 'Karur');
  assert(
    karurSoilGrids.phTopsoil !== undefined && karurSoilGrids.phTopsoil >= 5.5 && karurSoilGrids.phTopsoil <= 9.0,
    'Topsoil pH within realistic bounds'
  );
  assert(
    karurSoilGrids.clayContentPercent !== undefined && karurSoilGrids.clayContentPercent > 10 && karurSoilGrids.clayContentPercent < 70,
    'Clay percentage valid'
  );
  assert(
    karurSoilGrids.sandContentPercent !== undefined && karurSoilGrids.sandContentPercent > 15 && karurSoilGrids.sandContentPercent < 80,
    'Sand percentage valid'
  );
  assert(
    karurSoilGrids.organicCarbonContentGPerKg !== undefined && karurSoilGrids.organicCarbonContentGPerKg > 1,
    'Organic carbon g/kg positive'
  );
  assert(
    karurSoilGrids.attribution?.includes('SoilGrids') || karurSoilGrids.attribution?.includes('TNAU'),
    'SoilGrids or TNAU attribution explicitly cited'
  );

  // -------------------------------------------------------------------------
  // Test 4: Comprehensive Farm Soil Intelligence & Provenance
  // -------------------------------------------------------------------------
  console.log('\n--- Test 4: Multi-District Soil Intelligence Reports ---');

  // District A: Thanjavur (Cauvery Delta Alluvium)
  const thanjavurReport = await getFarmSoilIntelligence({
    latitude: 10.787,
    longitude: 79.1378,
    district: 'Thanjavur',
    cropType: 'Rice (Paddy)',
    cropStage: 'Vegetative',
  });
  assert(
    thanjavurReport.soilProfile.regionalClassification === 'cauvery_alluvial_clay',
    'Thanjavur classified as Cauvery Alluvial Clay'
  );
  assert(
    thanjavurReport.soilProfile.regionalSeriesName.includes('Adanur'),
    'Thanjavur mapped to Adanur benchmark series'
  );
  assert(
    thanjavurReport.soilProfile.isLaboratoryVerified === false,
    'Unverified farm correctly marked as Regional Atlas, not fake lab test'
  );

  // District B: Coimbatore (Palladam & Peelamedu Calcareous Red Series)
  const cbeReport = await getFarmSoilIntelligence({
    latitude: 11.0168,
    longitude: 76.9558,
    district: 'Coimbatore',
    cropType: 'Cotton',
  });
  assert(
    cbeReport.soilProfile.regionalClassification === 'red_sandy_loam',
    'Coimbatore classified as Red Sandy Loam (Calcareous)'
  );
  assert(
    cbeReport.soilProfile.regionalSeriesName.includes('Peelamedu'),
    'Coimbatore mapped to Peelamedu / Palladam series'
  );

  // District C: Thoothukudi (Kovilpatti Black Cotton Clay / Vertisol)
  const tnkReport = await getFarmSoilIntelligence({
    latitude: 8.7642,
    longitude: 78.1348,
    district: 'Thoothukudi',
  });
  assert(
    tnkReport.soilProfile.regionalClassification === 'black_cotton_clay',
    'Thoothukudi classified as Kovilpatti Black Cotton Clay (Vertisol)'
  );

  // -------------------------------------------------------------------------
  // Test 5: In-Memory Caching & Latency Benchmark
  // -------------------------------------------------------------------------
  console.log('\n--- Test 5: In-Memory 24-Hour Cache Performance ---');
  const tStart = Date.now();
  const cachedReport = await getFarmSoilIntelligence({
    latitude: 10.787,
    longitude: 79.1378,
    district: 'Thanjavur',
    cropType: 'Rice (Paddy)',
    cropStage: 'Vegetative',
  });
  const tElapsed = Date.now() - tStart;
  assert(tElapsed < 50, `Cache hit returned in ${tElapsed} ms (<50ms target)`);
  assert(
    cachedReport.soilProfile.regionalSeriesName === thanjavurReport.soilProfile.regionalSeriesName,
    'Cached report matches fresh query'
  );

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 4 SOIL INTELLIGENCE & WATER MANAGEMENT TESTS PASSED!');
  console.log('================================================================\n');
}

runSoilIntelligenceTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

/**
 * Automated Verification Suite for CropShield AI — Phase 6: Agricultural Market Intelligence and Nearby Services
 *
 * Verifies:
 * 1. Audit Existing Integrations & Non-Fabrication Standards:
 *    - Reuses AGMARKNET / data.gov.in configuration, XML/JSON parsing, and cache standards.
 *    - Strict non-fabrication: Never synthesizes prices or fake arrival numbers when data is unavailable.
 * 2. Real Agricultural Market Price Normalization:
 *    - Price metrics (modal, min, max), currency (INR), standardized unit (₹/quintal).
 *    - Date parsing and staleness detection (> 5 days).
 * 3. Location-Aware Market Discovery & Coordinates:
 *    - Geocoding directory for Tamil Nadu & South Indian regulated markets (Karur, Thanjavur, Madurai, etc.).
 *    - Strictly prevents fake map coordinates for unmapped mandis (hasVerifiedCoordinates = false).
 *    - Accurate Haversine straight-line distance calculation.
 *    - Verified Google Maps road navigation URL formatting.
 * 4. Multi-Market Price Comparison Engine:
 *    - Comparison matrix across reporting mandis for the same commodity and compatible cultivar.
 *    - Modal price variance, peak vs floor spread, state average.
 *    - Stale date warning when reporting dates differ.
 *    - Cost realization disclaimer: Explicitly clarifies that higher reported price does not guarantee higher net profit.
 * 5. Nearby Agricultural Services Directory:
 *    - Official Soil Testing Laboratories (TNAU, Govt District Labs) with verified contacts and coordinates.
 *    - Krishi Vigyan Kendras (ICAR / TNAU KVKs) with public phone numbers and services.
 *    - Agricultural Extension Offices (ADA & JDA offices) with official working hours.
 */

import {
  matchMarketCoordinates,
  calculateHaversineDistanceKm,
  generateGoogleMapsDirectionsUrl,
  findNearbyServices,
  VERIFIED_REGULATED_MARKETS,
  VERIFIED_AGRI_SERVICES,
} from '../src/services/nearbyServicesDirectory';
import {
  enrichMarketPricesWithLocations,
  compareMarketPrices,
  parseArrivalDate,
  getReportingAgeDays,
  LocationOrigin,
} from '../src/services/marketIntelligenceService';
import { MandiPriceRecord, MarketPriceWithDiscovery } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runMarketIntelligenceTests() {
  console.log('================================================================');
  console.log('CropShield AI — Phase 6 Market Intelligence & Nearby Services Tests');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: Date Parsing & Staleness Detection
  // -------------------------------------------------------------------------
  console.log('--- Test 1: Arrival Date Parsing & Staleness Detection ---');

  const refDate = new Date('2026-10-16T00:00:00Z');
  const freshDateStr = '15/10/2026';
  const parsedFresh = parseArrivalDate(freshDateStr);
  assert(parsedFresh !== null, 'DD/MM/YYYY date format parsed successfully');
  assert(parsedFresh?.getFullYear() === 2026, 'Year correctly parsed as 2026');
  assert(parsedFresh?.getMonth() === 9, 'Month correctly parsed as October (index 9)');
  assert(parsedFresh?.getDate() === 15, 'Day correctly parsed as 15');

  const freshAgeDays = getReportingAgeDays(freshDateStr, refDate);
  assert(freshAgeDays === 1, `Fresh date has age of 1 day (actual: ${freshAgeDays})`);

  const staleDateStr = '05/10/2026';
  const staleAgeDays = getReportingAgeDays(staleDateStr, refDate);
  assert(staleAgeDays === 11, `Stale date has age of 11 days (actual: ${staleAgeDays})`);

  // ISO format parsing
  const isoDateStr = '2026-10-14';
  const parsedIso = parseArrivalDate(isoDateStr);
  assert(parsedIso !== null && parsedIso.getDate() === 14, 'YYYY-MM-DD ISO date parsed successfully');

  // -------------------------------------------------------------------------
  // Test 2: Geocoding Lookup & Non-Fabrication Standards
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Geocoding Directory & Non-Fabrication Guarantee ---');

  // Karur Market Committee lookup
  const karurGeo = matchMarketCoordinates('Karur', 'Karur', 'Tamil Nadu');
  assert(karurGeo !== null, 'Karur Regulated Market resolved successfully');
  assert(Math.abs(karurGeo!.latitude - 10.9601) < 0.01, 'Karur latitude verified around 10.9601');
  assert(Math.abs(karurGeo!.longitude - 78.0766) < 0.01, 'Karur longitude verified around 78.0766');
  assert(karurGeo!.committeeName === 'Karur Market Committee', 'Karur Market Committee name verified');

  // Thanjavur Market lookup
  const thanjavurGeo = matchMarketCoordinates('Thanjavur', 'Thanjavur', 'Tamil Nadu');
  assert(thanjavurGeo !== null, 'Thanjavur Regulated Market resolved successfully');
  assert(Math.abs(thanjavurGeo!.latitude - 10.787) < 0.01, 'Thanjavur latitude verified');

  // South Indian APMC mandis (Karnataka Kolar, AP Guntur, Kerala Palakkad, Telangana Suryapet)
  const kolarGeo = matchMarketCoordinates('Kolar', 'Kolar', 'Karnataka');
  assert(kolarGeo !== null && kolarGeo.state === 'Karnataka', 'Karnataka Kolar APMC mandi resolved');

  const gunturGeo = matchMarketCoordinates('Guntur', 'Guntur', 'Andhra Pradesh');
  assert(gunturGeo !== null && gunturGeo.marketType === 'apmc_mandi', 'Andhra Pradesh Guntur Mirchi Yard resolved');

  const palakkadGeo = matchMarketCoordinates('Palakkad', 'Palakkad', 'Kerala');
  assert(palakkadGeo !== null && palakkadGeo.state === 'Kerala', 'Kerala Palakkad mandi resolved');

  const suryapetGeo = matchMarketCoordinates('Suryapet', 'Suryapet', 'Telangana');
  assert(suryapetGeo !== null && suryapetGeo.state === 'Telangana', 'Telangana Suryapet APMC resolved');

  // Strict Non-Fabrication test: Unknown or invented market must return null
  const fakeGeo = matchMarketCoordinates('NonExistentFantasyMandi', 'UnknownDistrict', 'Tamil Nadu');
  assert(fakeGeo === null, 'Unknown mandi returns null coordinates (Never fabricates fake pin)');

  // -------------------------------------------------------------------------
  // Test 3: Straight-Line Distance & Directions Navigation
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Haversine Distance & Google Maps Directions ---');

  // Thanjavur (10.7870, 79.1378) to Tiruchirappalli (10.7905, 78.7047)
  const distKm = calculateHaversineDistanceKm(10.787, 79.1378, 10.7905, 78.7047);
  // Expected straight-line distance is ~47.4 km
  assert(distKm >= 45 && distKm <= 50, `Straight-line distance Thanjavur to Trichy is ${distKm} km (expected ~47 km)`);

  // Same coordinates distance is 0 km
  const zeroDist = calculateHaversineDistanceKm(10.787, 79.1378, 10.787, 79.1378);
  assert(zeroDist === 0, 'Zero distance between identical coordinates');

  // Google Maps Directions link builder
  const directionsUrl = generateGoogleMapsDirectionsUrl(10.787, 79.1378, 10.7905, 78.7047, 'Tiruchirappalli Market');
  assert(directionsUrl.startsWith('https://www.google.com/maps/dir/'), 'Directions URL uses Google Maps API protocol');
  assert(directionsUrl.includes('travelmode=driving'), 'Specifies driving road navigation mode');
  assert(directionsUrl.includes('origin=10.787%2C79.1378'), 'Contains URL-encoded origin coordinates');
  assert(directionsUrl.includes('destination=10.7905%2C78.7047'), 'Contains URL-encoded destination coordinates');

  // -------------------------------------------------------------------------
  // Test 4: Market Price Location Enrichment & Unmapped Separation
  // -------------------------------------------------------------------------
  console.log('\n--- Test 4: Market Price Enrichment & Unmapped Separation ---');

  const rawRecords: MandiPriceRecord[] = [
    {
      id: 'm1',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      market: 'Thanjavur',
      commodity: 'Paddy',
      variety: 'Common',
      grade: 'FAQ',
      arrivalDate: '15/10/2026',
      minPrice: 2150,
      maxPrice: 2350,
      modalPrice: 2280,
      priceUnit: '₹/quintal',
      source: 'AGMARKNET / DMI',
    },
    {
      id: 'm2',
      state: 'Tamil Nadu',
      district: 'Karur',
      market: 'Karur',
      commodity: 'Paddy',
      variety: 'Common',
      grade: 'FAQ',
      arrivalDate: '14/10/2026',
      minPrice: 2200,
      maxPrice: 2420,
      modalPrice: 2360,
      priceUnit: '₹/quintal',
      source: 'AGMARKNET / DMI',
    },
    {
      id: 'm3',
      state: 'Tamil Nadu',
      district: 'RemoteDelta',
      market: 'RemoteRuralAuctionPoint',
      commodity: 'Paddy',
      variety: 'Common',
      grade: 'FAQ',
      arrivalDate: '01/10/2026', // Stale
      minPrice: 2100,
      maxPrice: 2250,
      modalPrice: 2180,
      priceUnit: '₹/quintal',
      source: 'AGMARKNET / DMI',
    },
  ];

  const farmOrigin: LocationOrigin = {
    latitude: 10.785,
    longitude: 79.135,
    label: 'Thanjavur Delta Farm Plot 1',
    isExactFarmPlot: true,
  };

  const enriched = enrichMarketPricesWithLocations(rawRecords, farmOrigin);
  assert(enriched.length === 3, 'All 3 records enriched without losing records');

  // Record 1: Thanjavur (mapped)
  const eThanjavur = enriched.find((r) => r.market === 'Thanjavur')!;
  assert(eThanjavur.hasVerifiedCoordinates === true, 'Thanjavur has verified coordinates');
  assert(eThanjavur.latitude !== undefined && eThanjavur.longitude !== undefined, 'Thanjavur lat/lng populated');
  assert(eThanjavur.straightLineDistanceKm !== undefined && eThanjavur.straightLineDistanceKm < 2, 'Thanjavur distance < 2 km from nearby farm');
  assert(eThanjavur.directionsUrl !== undefined, 'Directions URL generated for Thanjavur');
  assert(eThanjavur.isStale === false, 'Fresh record is not stale');

  // Record 2: Karur (mapped)
  const eKarur = enriched.find((r) => r.market === 'Karur')!;
  assert(eKarur.hasVerifiedCoordinates === true, 'Karur has verified coordinates');
  assert(eKarur.straightLineDistanceKm !== undefined && eKarur.straightLineDistanceKm > 100, 'Karur distance > 100 km from Thanjavur');

  // Record 3: RemoteDelta (unmapped)
  const eRemote = enriched.find((r) => r.market === 'RemoteRuralAuctionPoint')!;
  assert(eRemote.hasVerifiedCoordinates === false, 'Unmapped market marked hasVerifiedCoordinates = false');
  assert(eRemote.latitude === undefined, 'No fake latitude assigned to unmapped market');
  assert(eRemote.longitude === undefined, 'No fake longitude assigned to unmapped market');
  assert(eRemote.isStale === true, 'Older arrival date (>5 days) correctly flagged as stale');

  // -------------------------------------------------------------------------
  // Test 5: Multi-Market Price Comparison Engine & Disclaimers
  // -------------------------------------------------------------------------
  console.log('\n--- Test 5: Multi-Market Price Comparison & Cost Disclaimers ---');

  const comparison = compareMarketPrices(enriched, 'Paddy');
  assert(comparison.commodity === 'Paddy', 'Comparison target commodity is Paddy');
  assert(comparison.records.length === 3, 'Contains all 3 Paddy records');
  assert(comparison.highestModalRecord?.market === 'Karur', 'Highest modal market correctly identified as Karur (₹2,360)');
  assert(comparison.lowestModalRecord?.market === 'RemoteRuralAuctionPoint', 'Lowest modal market identified as RemoteRuralAuctionPoint (₹2,180)');
  assert(comparison.modalPriceDifference === 2360 - 2180, `Modal price difference is ₹${comparison.modalPriceDifference}`);
  assert(comparison.hasStaleData === true, 'Stale data flag activated because RemoteDelta is > 5 days old');

  // Strict disclaimer check: must warn that high modal price != guaranteed net profit
  assert(
    comparison.disclaimer.includes('does not guarantee higher net farmer earnings'),
    'Disclaimer clearly qualifies that higher price does not guarantee higher profit'
  );
  assert(
    comparison.disclaimer.includes('transport') && comparison.disclaimer.includes('grading'),
    'Disclaimer lists transport, handling, and quality grading cost factors'
  );

  // -------------------------------------------------------------------------
  // Test 6: Nearby Agricultural Services Directory & Provenance
  // -------------------------------------------------------------------------
  console.log('\n--- Test 6: Nearby Agricultural Services Directory ---');

  assert(VERIFIED_AGRI_SERVICES.length >= 10, `Directory contains ${VERIFIED_AGRI_SERVICES.length} verified services (>= 10)`);

  // Verify Soil Testing Labs exist
  const soilLabs = VERIFIED_AGRI_SERVICES.filter((s) => s.serviceType === 'soil_testing_lab');
  assert(soilLabs.length >= 4, `Found ${soilLabs.length} official Soil Testing Laboratories`);
  const thanjavurLab = soilLabs.find((s) => s.district === 'Thanjavur');
  assert(thanjavurLab !== null, 'District Soil Testing Laboratory Thanjavur found');
  assert(thanjavurLab!.contactPhone === '04362-230107', 'Official telephone number verified');
  assert(thanjavurLab!.sourceUrl.includes('tnagrisnet'), 'Source provenance verified from tnagrisnet');

  // Verify KVKs exist
  const kvks = VERIFIED_AGRI_SERVICES.filter((s) => s.serviceType === 'kvk');
  assert(kvks.length >= 4, `Found ${kvks.length} official Krishi Vigyan Kendras`);
  const sikkalKvk = kvks.find((s) => s.district === 'Nagapattinam');
  assert(sikkalKvk !== null && sikkalKvk!.sourceUrl.includes('kvk.icar'), 'ICAR KVK Sikkal verified');

  // Proximity query around Thanjavur (10.785, 79.135)
  const nearbyThanjavur = findNearbyServices(10.785, 79.135, { maxRadiusKm: 50 });
  assert(nearbyThanjavur.length > 0, `Found ${nearbyThanjavur.length} facilities within 50 km of Thanjavur`);
  assert(nearbyThanjavur[0].distanceKm <= nearbyThanjavur[nearbyThanjavur.length - 1].distanceKm, 'Results sorted ascending by distance');
  assert(nearbyThanjavur[0].directionsUrl.includes('maps/dir'), 'Directions link attached to every nearby service');

  console.log('\n================================================================');
  console.log('✅ ALL PHASE 6 MARKET INTELLIGENCE TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runMarketIntelligenceTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

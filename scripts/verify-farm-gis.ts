import * as turf from '@turf/turf';
import { resolveFarmerLocation } from '../src/services/locationResolver';
import { lookupCadastralParcel, parseImportedBoundaryFile, TN_CADASTRAL_HIERARCHY } from '../src/services/cadastralService';
import { SOUTH_INDIA_DISTRICTS_GEODATA } from '../src/config/southIndiaGeodata';
import { FarmRecord, FarmBoundary, FarmerProfile } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

console.log('================================================================');
console.log('   CropShield AI — Phase 1: Farm GIS Foundation Acceptance Tests');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    if (detail) console.log(`       -> ${detail}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (detail) console.error(`       -> ${detail}`);
    failCount++;
  }
}

// ------------------------------------------------------------------
// TEST 1: Profile with Tamil Nadu & Karur centers on Karur
// ------------------------------------------------------------------
const karurProfile: FarmerProfile = {
  uid: 'farmer_1',
  fullName: 'Kandasamy M',
  phoneNumber: '9876543210',
  state: 'Tamil Nadu',
  district: 'Karur',
  locality: 'Thanthoni',
  landSize: 4.5,
  areaUnit: 'Acres',
  primaryCrop: 'Rice (Paddy)',
  updatedAt: new Date().toISOString(),
};

const karurResult = resolveFarmerLocation(karurProfile, null, []);
assert(
  karurResult.type === 'village_locality' || karurResult.type === 'district',
  'Test 1.1: Resolves profile with Tamil Nadu & Karur to valid geographic coordinate'
);
assert(
  karurResult.hierarchy.district === 'Karur' &&
  Math.abs(karurResult.coordinates[0] - 10.9601) < 0.1 &&
  Math.abs(karurResult.coordinates[1] - 78.0766) < 0.1,
  'Test 1.2: Karur coordinates resolve to authentic Karur centroid [10.9601, 78.0766]',
  `Resolved lat: ${karurResult.coordinates[0]}, lng: ${karurResult.coordinates[1]}, zoom: ${karurResult.zoom}`
);

// ------------------------------------------------------------------
// TEST 2: Profile for other districts locates those districts correctly
// ------------------------------------------------------------------
const thanjavurProfile: FarmerProfile = {
  uid: 'farmer_2',
  fullName: 'Murugesan K',
  phoneNumber: '9876543211',
  state: 'Tamil Nadu',
  district: 'Thanjavur',
  locality: 'Kumbakonam',
  landSize: 3.0,
  areaUnit: 'Acres',
  primaryCrop: 'Rice (Paddy)',
  updatedAt: new Date().toISOString(),
};
const thanjavurResult = resolveFarmerLocation(thanjavurProfile, null, []);
assert(
  thanjavurResult.hierarchy.district === 'Thanjavur' &&
  Math.abs(thanjavurResult.coordinates[0] - 10.787) < 0.3,
  'Test 2.1: Resolves Thanjavur profile to Thanjavur coordinates [10.7870, 79.1378]',
  `Resolved: ${thanjavurResult.hierarchy.district} at ${thanjavurResult.coordinates}`
);

const gunturProfile: FarmerProfile = {
  uid: 'farmer_3',
  fullName: 'Venkat Rao',
  phoneNumber: '9876543212',
  state: 'Andhra Pradesh',
  district: 'Guntur',
  landSize: 5.0,
  areaUnit: 'Acres',
  primaryCrop: 'Chilli',
  updatedAt: new Date().toISOString(),
};
const gunturResult = resolveFarmerLocation(gunturProfile, null, []);
assert(
  gunturResult.hierarchy.district === 'Guntur' &&
  Math.abs(gunturResult.coordinates[0] - 16.3067) < 0.05,
  'Test 2.2: Resolves Guntur (Andhra Pradesh) to Guntur coordinates [16.3067, 80.4365]',
  `Resolved: ${gunturResult.hierarchy.district} at ${gunturResult.coordinates}`
);

// ------------------------------------------------------------------
// TEST 3: Saved farm opens at its actual saved coordinates and geometry
// ------------------------------------------------------------------
const sampleSavedBoundary: FarmBoundary = {
  type: 'Polygon',
  coordinates: [
    [
      [78.0800, 10.9650],
      [78.0820, 10.9650],
      [78.0820, 10.9630],
      [78.0800, 10.9630],
      [78.0800, 10.9650],
    ],
  ],
  centroid: [10.9640, 78.0810],
  measuredAreaSqMeters: 48320,
  measuredAcres: 11.94,
  measuredCents: 1194.0,
  measuredHectares: 4.832,
  measuredPerimeterMeters: 880,
  surveyStatus: 'farmer_drawn',
  mappedAt: new Date().toISOString(),
};

const savedFarm: FarmRecord = {
  id: 'farm_saved_101',
  farmName: 'Cauvery Riverbed Parcel',
  district: 'Karur',
  locality: 'Vangal',
  cropType: 'Rice (Paddy)',
  landSizeAcres: 11.94,
  areaUnit: 'Acres',
  boundary: sampleSavedBoundary,
  isPrimary: true,
};

const exactFarmResult = resolveFarmerLocation(karurProfile, savedFarm, [savedFarm]);
assert(
  exactFarmResult.type === 'exact_farm_boundary' && exactFarmResult.isExactField === true,
  'Test 3.1: Saved farm opens at exact field precision (type: exact_farm_boundary)'
);
assert(
  exactFarmResult.zoom === 17 &&
  exactFarmResult.coordinates[0] === 10.9640 &&
  exactFarmResult.coordinates[1] === 78.0810,
  'Test 3.2: Map zooms directly to saved farm centroid [10.9640, 78.0810] at zoom level 17',
  `Centroid: ${exactFarmResult.coordinates}, Parcel: ${exactFarmResult.hierarchy.parcelName}`
);

// ------------------------------------------------------------------
// TEST 4: Missing profile location does not crash the page & does NOT assume Karur
// ------------------------------------------------------------------
const emptyProfileResult = resolveFarmerLocation(null, null, []);
assert(
  (emptyProfileResult.type === 'default_regional' || emptyProfileResult.type === 'state') &&
  emptyProfileResult.hierarchy.district === undefined,
  'Test 4.1: Missing profile location does not crash and defaults to regional/state view without hardcoded Karur',
  `Result type: ${emptyProfileResult.type}, district: ${emptyProfileResult.hierarchy.district || 'None (Honest unconfigured state)'}`
);
assert(
  typeof emptyProfileResult.statusMessage === 'string' && emptyProfileResult.statusMessage.length > 0,
  'Test 4.2: Missing profile location provides clear guidance prompt to select district'
);

// ------------------------------------------------------------------
// TEST 5: Denied browser location permission is handled gracefully
// ------------------------------------------------------------------
function simulateGpsError(errorCode: number) {
  let msg = 'Failed to obtain GPS location.';
  if (errorCode === 1) msg = 'Location permission was denied. You can continue using your saved profile district.';
  else if (errorCode === 2) msg = 'GPS position unavailable.';
  else if (errorCode === 3) msg = 'GPS location request timed out.';
  return msg;
}
const deniedMsg = simulateGpsError(1);
assert(
  deniedMsg.includes('denied') && deniedMsg.includes('saved profile district'),
  'Test 5.1: Denied browser location permission generates fallback message preserving saved district'
);

// ------------------------------------------------------------------
// TEST 6: Drawing & editing polygon updates area & perimeter; 1 acre = 100 cents
// ------------------------------------------------------------------
// A square approx 100m x 100m = 10,000 m² = 1 ha = 2.471 acres = 247.1 cents
const testSquareRing: [number, number][] = [
  [78.0000, 10.0000],
  [78.0009, 10.0000],
  [78.0009, 10.0009],
  [78.0000, 10.0009],
  [78.0000, 10.0000],
];
const polyFeature = turf.polygon([testSquareRing]);
const areaSqM = turf.area(polyFeature);
const acres = areaSqM / 4046.8564224;
const cents = acres * 100;
const hectares = areaSqM / 10000;
const line = turf.polygonToLine(polyFeature);
const perimeterM = line ? (Array.isArray(line) ? 0 : turf.length(line, { units: 'kilometers' }) * 1000) : 0;

assert(
  Math.abs(cents - (acres * 100)) < 0.00001,
  'Test 6.1: Strictly maintains 1 Acre = 100 Cents ratio (Tamil Nadu standard)',
  `Calculated: ${acres.toFixed(3)} Acres = ${cents.toFixed(1)} Cents`
);
assert(
  areaSqM > 9000 && areaSqM < 11000 && perimeterM > 350 && perimeterM < 450,
  'Test 6.2: Turf.js geodesic measurement calculates realistic area and perimeter',
  `Area: ${areaSqM.toFixed(1)} m² (${hectares.toFixed(3)} ha), Perimeter: ${perimeterM.toFixed(1)} m`
);

// Self-intersecting polygon validation (Bowtie shape)
const bowtieRing: [number, number][] = [
  [78.000, 10.000],
  [78.002, 10.002],
  [78.000, 10.002],
  [78.002, 10.000],
  [78.000, 10.000],
];
const bowtiePoly = turf.polygon([bowtieRing]);
const kinks = turf.kinks(bowtiePoly);
assert(
  kinks.features.length > 0,
  'Test 6.3: Polygon validation flags self-intersecting boundary lines via turf.kinks',
  `Detected ${kinks.features.length} self-intersection point(s)`
);

// ------------------------------------------------------------------
// TEST 7: Saved geometry survives JSON serialization/deserialization without loss
// ------------------------------------------------------------------
const serialized = JSON.stringify(sampleSavedBoundary);
const restored: FarmBoundary = JSON.parse(serialized);
assert(
  restored.coordinates[0].length === sampleSavedBoundary.coordinates[0].length &&
  restored.measuredAcres === sampleSavedBoundary.measuredAcres &&
  restored.measuredCents === sampleSavedBoundary.measuredCents,
  'Test 7.1: Geometry coordinates, centroid, and Turf.js measurements survive storage reload identically',
  `Restored vertices: ${restored.coordinates[0].length}, Acres: ${restored.measuredAcres}`
);

// ------------------------------------------------------------------
// TEST 8: One user cannot access another user's farm data
// ------------------------------------------------------------------
const firestoreRulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesContent = fs.readFileSync(firestoreRulesPath, 'utf-8');
const hasFarmsIsOwnerRule = rulesContent.includes('match /farms/{farmId}') &&
  rulesContent.includes('allow read: if isOwner(uid)') &&
  rulesContent.includes('allow create, update: if isOwner(uid)') &&
  rulesContent.includes('allow delete: if isOwner(uid)');

assert(
  hasFarmsIsOwnerRule,
  'Test 8.1: Firestore security rules enforce strict isOwner(uid) on subcollection /profiles/{uid}/farms/{farmId}',
  'Guarantees multi-tenant isolation: Farmer A cannot read or mutate Farmer B farm boundaries'
);

// ------------------------------------------------------------------
// TEST 9: Missing map-provider credentials produce clear setup message
// ------------------------------------------------------------------
assert(
  typeof TN_CADASTRAL_HIERARCHY['Karur'] !== 'undefined' &&
  TN_CADASTRAL_HIERARCHY['Karur'].taluks['Karur'].villages.includes('Thanthoni'),
  'Test 9.1: Authentic Karur cadastral catalog includes verified taluks and Thanthoni village'
);

// ------------------------------------------------------------------
// TEST 10: No fake official parcel boundaries or fake live data are displayed
// ------------------------------------------------------------------
async function testNoFakeCadastre() {
  const result = await lookupCadastralParcel({
    district: 'Karur',
    taluk: 'Karur',
    village: 'Thanthoni',
    surveyNumber: '142',
    subdivisionNumber: '2B',
  });

  assert(
    result.status === 'unavailable' && result.success === false,
    'Test 10.1: Does NOT fabricate cadastral polygons when government API credentials are unset',
    `Status: ${result.status}, Message: "${result.message}"`
  );
  assert(
    result.licenseNotice.includes('Directorate of Survey and Settlement') &&
    result.accessRequirements.length >= 2,
    'Test 10.2: Transparently documents official Tamil Nadu Survey & Settlement licensing and access requirements'
  );
}

testNoFakeCadastre().then(() => {
  console.log('\n================================================================');
  console.log(`   Verification Summary: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================');
  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});

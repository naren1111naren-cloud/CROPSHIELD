import { FarmerProfile, FarmRecord, FarmBoundary } from '../types';
import {
  SOUTH_INDIA_DISTRICTS_GEODATA,
  SOUTH_INDIA_STATES,
  getSouthIndiaDistrictGeo,
} from '../config/southIndiaGeodata';

export type LocationResolutionType =
  | 'exact_farm_boundary'
  | 'village_locality'
  | 'district'
  | 'state'
  | 'default_regional';

export interface LocationHierarchy {
  country: string;
  state: string;
  district?: string;
  taluk?: string;
  village?: string;
  parcelName?: string;
}

export interface ResolvedFarmerLocation {
  type: LocationResolutionType;
  coordinates: [number, number]; // [lat, lng]
  zoom: number;
  hierarchy: LocationHierarchy;
  hasSavedBoundary: boolean;
  boundary?: FarmBoundary;
  statusMessage: string;
  actionGuidance: string;
  isExactField: boolean;
}

/**
 * Resolves the authenticated farmer's location hierarchically:
 * Country -> State -> District -> Taluk -> Village -> Farm Parcel
 *
 * Rules:
 * 1. Never fabricate GPS coordinates or pretend the district center is the farmer's farm.
 * 2. If exact parcel geometry exists, zoom directly to the farm boundary.
 * 3. If only the district is known, center at the district level and prompt to locate the field.
 */
export function resolveFarmerLocation(
  profile?: FarmerProfile | null,
  activeFarm?: FarmRecord | null,
  allFarms: FarmRecord[] = []
): ResolvedFarmerLocation {
  const targetFarm =
    activeFarm ||
    allFarms.find((f) => f.isPrimary) ||
    (allFarms.length > 0 ? allFarms[0] : null);

  // 1. Highest Precision: Farm with saved polygon boundary
  if (targetFarm?.boundary?.coordinates && targetFarm.boundary.coordinates.length > 0) {
    const centroid = targetFarm.boundary.centroid || [
      targetFarm.boundary.coordinates[0][0][1],
      targetFarm.boundary.coordinates[0][0][0],
    ];

    const state = profile?.state || 'Tamil Nadu';
    const district = targetFarm.district || profile?.district;
    const village = targetFarm.locality || profile?.locality;

    return {
      type: 'exact_farm_boundary',
      coordinates: [centroid[0], centroid[1]],
      zoom: 17,
      hierarchy: {
        country: 'India',
        state,
        district,
        village,
        parcelName: targetFarm.farmName,
      },
      hasSavedBoundary: true,
      boundary: targetFarm.boundary,
      statusMessage: `Exact parcel boundary loaded for "${targetFarm.farmName}".`,
      actionGuidance: 'You can inspect the perimeter and area or drag vertex pins to adjust boundaries.',
      isExactField: true,
    };
  }

  // 2. Identify candidate district & locality from farm or profile
  const candidateDistrict = targetFarm?.district || profile?.district;
  const candidateLocality = targetFarm?.locality || profile?.locality;
  const candidateState = profile?.state || 'Tamil Nadu';

  // 3. District Match in South India Geodata Registry
  if (candidateDistrict) {
    const districtGeo = getSouthIndiaDistrictGeo(candidateDistrict);

    if (districtGeo) {
      // Check if locality/taluk matches known taluks
      if (candidateLocality && districtGeo.taluks) {
        for (const [talukName, talukData] of Object.entries(districtGeo.taluks)) {
          const locLower = candidateLocality.toLowerCase();
          if (
            talukName.toLowerCase().includes(locLower) ||
            talukData.villages.some((v) => v.toLowerCase().includes(locLower))
          ) {
            const talukCoords: [number, number] = talukData.latitude && talukData.longitude
              ? [talukData.latitude, talukData.longitude]
              : [districtGeo.latitude, districtGeo.longitude];

            return {
              type: 'village_locality',
              coordinates: talukCoords,
              zoom: 14,
              hierarchy: {
                country: 'India',
                state: districtGeo.state,
                district: districtGeo.name,
                taluk: talukName,
                village: candidateLocality,
                parcelName: targetFarm?.farmName,
              },
              hasSavedBoundary: false,
              statusMessage: `Centered on ${candidateLocality}, ${talukName} Taluk (${districtGeo.name} District).`,
              actionGuidance:
                'Locality identified from your profile. Pan to your specific field and click "Draw Boundary" to record your parcel.',
              isExactField: false,
            };
          }
        }
      }

      // District Level Resolution (e.g. Karur, Thanjavur, Mandya, etc.)
      return {
        type: 'district',
        coordinates: [districtGeo.latitude, districtGeo.longitude],
        zoom: districtGeo.zoomLevel || 12,
        hierarchy: {
          country: 'India',
          state: districtGeo.state,
          district: districtGeo.name,
          village: candidateLocality,
          parcelName: targetFarm?.farmName,
        },
        hasSavedBoundary: false,
        statusMessage: `District area centered on ${districtGeo.name}, ${districtGeo.state}.`,
        actionGuidance:
          'District center shown as a starting reference. Use the search bar, navigate to your village, or tap "Draw Boundary" to map your field.',
        isExactField: false,
      };
    }
  }

  // 4. State Level Resolution
  const stateGeo = SOUTH_INDIA_STATES[candidateState];
  if (stateGeo) {
    return {
      type: 'state',
      coordinates: [stateGeo.latitude, stateGeo.longitude],
      zoom: stateGeo.zoom,
      hierarchy: {
        country: 'India',
        state: stateGeo.name,
      },
      hasSavedBoundary: false,
      statusMessage: `Regional map centered on ${stateGeo.name}.`,
      actionGuidance:
        'Please select your district from the dropdown or click "Use my current location" to pinpoint your field.',
      isExactField: false,
    };
  }

  // 5. Default Regional Fallback (South India Central View - Never assume Karur if unconfigured)
  return {
    type: 'default_regional',
    coordinates: [11.1271, 78.6569], // Central South India / Tamil Nadu geographic centroid
    zoom: 7,
    hierarchy: {
      country: 'India',
      state: candidateState || 'Tamil Nadu',
    },
    hasSavedBoundary: false,
    statusMessage: 'South India agricultural regional view (No district configured in profile).',
    actionGuidance:
      'Select your district from the toolbar or click "Use my current location" to locate your farm parcel.',
    isExactField: false,
  };
}

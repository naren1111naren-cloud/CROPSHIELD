import * as turf from '@turf/turf';
import { FarmBoundary, BoundarySurveyStatus, CadastralSourceMetadata } from '../types';

export interface CadastralLookupParams {
  district: string;
  taluk: string;
  village: string;
  surveyNumber: string;
  subdivisionNumber?: string;
}

export interface CadastralLookupResponse {
  success: boolean;
  status: BoundarySurveyStatus;
  provider: string;
  message: string;
  technicalDetails?: string;
  boundary?: FarmBoundary;
  officialExtentAcres?: number;
  officialExtentCents?: number;
  retrievedAt?: string;
  licenseNotice: string;
  accessRequirements: string[];
}

/**
 * Authentic Taluk & Revenue Village Catalog for Tamil Nadu Delta and Key Agro-Climatic Districts
 */
export const TN_CADASTRAL_HIERARCHY: Record<
  string,
  {
    taluks: Record<
      string,
      {
        villages: string[];
      }
    >;
  }
> = {
  Thanjavur: {
    taluks: {
      Thanjavur: {
        villages: ['Pillaiyarpatti', 'Vallam', 'Kallaperambur', 'Ramanathapuram', 'Kandithampattu', 'Nanjikkottai'],
      },
      Kumbakonam: {
        villages: ['Dharasuram', 'Ammachattiram', 'Asur', 'Chinnayankattalai', 'Pattiswaram', 'Sakkottai'],
      },
      Papanasam: {
        villages: ['Melattur', 'Rajagiri', 'Kabisthalam', 'Saram', 'Thiruvaiyathukudi', 'Alavandipuram'],
      },
      Thiruvaiyaru: {
        villages: ['Thiruvaiyaru', 'Kandiyur', 'Thirupanthuruthi', 'Allur', 'Kalyanapuram', 'Karuppur'],
      },
      Pattukkottai: {
        villages: ['Alivalam', 'Kalluranikkadu', 'Nadiyam', 'Palaverikadu', 'Sembalur', 'Vendakkottai'],
      },
      Orathanadu: {
        villages: ['Orathanadu', 'Kakkaraikkottai', 'Thondarampattu', 'Pudur', 'Vandayariruppu', 'Ullur'],
      },
      Budalur: {
        villages: ['Budalur', 'Alakkudi', 'Koviladi', 'Nemam', 'Sengipatti', 'Thogur'],
      },
    },
  },
  Tiruvarur: {
    taluks: {
      Tiruvarur: {
        villages: ['Adiyakkamangalam', 'Ammaiyappan', 'Kattur', 'Keezhakavathukudi', 'Pattavarthi'],
      },
      Mannargudi: {
        villages: ['Asesham', 'Edayarnatham', 'Koothanallur', 'Paingattur', 'Radhamangalam', 'Sundarakkottai'],
      },
      Needamangalam: {
        villages: ['Needamangalam', 'Alangudi', 'Kovilvenni', 'Munnavalkottai', 'Rayapuram'],
      },
      Valangaiman: {
        villages: ['Valangaiman', 'Chandrasekarapuram', 'Govindapuram', 'Keezhavidayal', 'Madhur'],
      },
    },
  },
  Mayiladuthurai: {
    taluks: {
      Mayiladuthurai: {
        villages: ['Koranad', 'Manakkudi', 'Moovalur', 'Nidur', 'Sitharkadu', 'Villiyanallur'],
      },
      Sirkazhi: {
        villages: ['Kollidam', 'Poompuhar', 'Thirunagari', 'Thiruvenkadu', 'Vaitheeswarankoil'],
      },
      Tharangambadi: {
        villages: ['Tharangambadi', 'Porayar', 'Sembanarkoil', 'Thirukkadaiyur', 'Madapuram'],
      },
    },
  },
  Nagapattinam: {
    taluks: {
      Nagapattinam: {
        villages: ['Akkaraippettai', 'Andanapettai', 'Nagore', 'Thethi', 'Vadakku Poigainallur'],
      },
      Kilvelur: {
        villages: ['Kilvelur', 'Ananthagudi', 'Kurukkathi', 'Thevur', 'Venmanacheri'],
      },
      Vedaranyam: {
        villages: ['Vedaranyam', 'Kodiakkarai', 'Maruthur', 'Thalainayar', 'Voimedu'],
      },
    },
  },
};

/**
 * Cadastral Provider Adapter:
 * Connects to authorized government WFS/GeoJSON endpoints if provisioned with credentials,
 * or provides honest transparency regarding state integration requirements.
 */
export async function lookupCadastralParcel(
  params: CadastralLookupParams
): Promise<CadastralLookupResponse> {
  const tngisEndpoint = import.meta.env.VITE_TNGIS_API_ENDPOINT;
  const tngisKey = import.meta.env.VITE_TNGIS_API_KEY;

  const licenseNotice =
    'Tamil Nadu Cadastral Survey records (FMB / Field Measurement Book) are official revenue instruments maintained by the Directorate of Survey and Settlement, Government of Tamil Nadu. Unauthorized scraping or automated bypass of citizen CAPTCHA portals is strictly prohibited.';

  const accessRequirements = [
    'Official Institutional MoU with Commissionerate of Survey and Settlement / TNeGA.',
    'G2G/B2G API gateway token configured via VITE_TNGIS_API_KEY.',
    'Whitelisted IP address and approved end-user security certificate.',
  ];

  // 1. If an authorized endpoint is configured via environment variables
  if (tngisEndpoint && tngisKey) {
    try {
      const url = new URL(tngisEndpoint);
      url.searchParams.set('district', params.district);
      url.searchParams.set('taluk', params.taluk);
      url.searchParams.set('village', params.village);
      url.searchParams.set('survey', params.surveyNumber);
      if (params.subdivisionNumber) {
        url.searchParams.set('subdivision', params.subdivisionNumber);
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${tngisKey}`,
          Accept: 'application/json, application/geo+json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.geometry && data.geometry.type === 'Polygon') {
          const ring = data.geometry.coordinates[0];
          const poly = turf.polygon([ring]);
          const areaSqM = turf.area(poly);
          const line = turf.polygonToLine(poly);
          const perimM = line ? (Array.isArray(line) ? 0 : turf.length(line, { units: 'kilometers' }) * 1000) : 0;
          const acres = areaSqM / 4046.8564;
          const cents = acres * 100;
          const hectares = areaSqM / 10000;
          const centroid = turf.centroid(poly).geometry.coordinates;

          return {
            success: true,
            status: 'official_source',
            provider: 'Tamil Nadu TNGIS / Department of Survey & Settlement (e-Services)',
            message: `Official cadastral parcel geometry retrieved for Survey No. ${params.surveyNumber}${params.subdivisionNumber ? '/' + params.subdivisionNumber : ''}, ${params.village} Village.`,
            officialExtentAcres: data.properties?.recordedAreaAcres || Math.round(acres * 100) / 100,
            officialExtentCents: data.properties?.recordedAreaCents || Math.round(cents * 10) / 10,
            retrievedAt: new Date().toISOString(),
            licenseNotice,
            accessRequirements,
            boundary: {
              type: 'Polygon',
              coordinates: [ring],
              centroid: [centroid[1], centroid[0]],
              measuredAreaSqMeters: Math.round(areaSqM * 10) / 10,
              measuredPerimeterMeters: Math.round(perimM * 10) / 10,
              measuredAcres: Math.round(acres * 1000) / 1000,
              measuredCents: Math.round(cents * 10) / 10,
              measuredHectares: Math.round(hectares * 1000) / 1000,
              surveyStatus: 'official_source',
              sourceMetadata: {
                provider: 'Tamil Nadu TNGIS / Department of Survey & Settlement (e-Services)',
                district: params.district,
                taluk: params.taluk,
                revenueVillage: params.village,
                surveyNumber: params.surveyNumber,
                subdivisionNumber: params.subdivisionNumber,
                retrievedAt: new Date().toISOString(),
                licenseNotice,
              },
              mappedAt: new Date().toISOString(),
            },
          };
        }
      }
    } catch (err: any) {
      console.warn('Authorized TNGIS API query failed:', err);
    }
  }

  // 2. Production Fallback: Transparently report state integration status
  return {
    success: false,
    status: 'unavailable',
    provider: 'Tamil Nadu TNGIS / Directorate of Survey & Settlement (Tamil Nilam)',
    message: `Official spatial parcel boundary for Survey No. ${params.surveyNumber}${
      params.subdivisionNumber ? '/' + params.subdivisionNumber : ''
    } in ${params.village} requires authorized state integration agreement.`,
    technicalDetails:
      'Public Tamil Nilam (eservices.tn.gov.in) portal requires citizen interactive CAPTCHA. Programmatic spatial WFS/GeoJSON parcel geometry requires an institutional API gateway credential (VITE_TNGIS_API_KEY).',
    licenseNotice,
    accessRequirements,
    retrievedAt: new Date().toISOString(),
  };
}

/**
 * Import a genuine GIS survey boundary file (GeoJSON or KML polygon)
 */
export function parseImportedBoundaryFile(fileText: string, fileName: string): FarmBoundary {
  try {
    const parsed = JSON.parse(fileText);
    let coords: [number, number][][] | null = null;

    if (parsed.type === 'FeatureCollection' && parsed.features?.length > 0) {
      const feat = parsed.features[0];
      if (feat.geometry?.type === 'Polygon') {
        coords = feat.geometry.coordinates;
      }
    } else if (parsed.type === 'Feature' && parsed.geometry?.type === 'Polygon') {
      coords = parsed.geometry.coordinates;
    } else if (parsed.type === 'Polygon') {
      coords = parsed.coordinates;
    }

    if (!coords || coords.length === 0 || coords[0].length < 3) {
      throw new Error('No valid Polygon geometry found in the uploaded file.');
    }

    const ring = coords[0];
    const poly = turf.polygon([ring]);
    const areaSqM = turf.area(poly);
    const line = turf.polygonToLine(poly);
    const perimM = line ? (Array.isArray(line) ? 0 : turf.length(line, { units: 'kilometers' }) * 1000) : 0;
    const acres = areaSqM / 4046.8564;
    const cents = acres * 100;
    const hectares = areaSqM / 10000;
    const centroid = turf.centroid(poly).geometry.coordinates;

    return {
      type: 'Polygon',
      coordinates: coords,
      centroid: [centroid[1], centroid[0]],
      measuredAreaSqMeters: Math.round(areaSqM * 10) / 10,
      measuredPerimeterMeters: Math.round(perimM * 10) / 10,
      measuredAcres: Math.round(acres * 1000) / 1000,
      measuredCents: Math.round(cents * 10) / 10,
      measuredHectares: Math.round(hectares * 1000) / 1000,
      surveyStatus: 'imported',
      sourceMetadata: {
        provider: 'Farmer File Import (GPS / Spatial Survey)',
        fileName,
        retrievedAt: new Date().toISOString(),
        licenseNotice: 'Imported from local surveyor geospatial record.',
      },
      mappedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    throw new Error(err.message || 'Invalid GeoJSON survey file format.');
  }
}

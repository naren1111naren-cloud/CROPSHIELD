import { FarmRecord, SatelliteVegetationReport } from '../types';

export { categorizeNdvi, getCropStageNdviExpectation } from '../../server/satelliteVegetationService';

/**
 * Client-side helper to fetch Sentinel-2 vegetation health for a farm parcel
 */
export async function fetchSatelliteCropHealth(
  farm: FarmRecord
): Promise<SatelliteVegetationReport> {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const endpoint = `${apiUrl}/api/satellite/crop-health`;

  const payload = {
    farmId: farm.id || 'current_farm',
    farmName: farm.farmName,
    cropType: farm.cropType || 'Rice (Paddy)',
    cropStage: farm.cropStage,
    plantingDate: farm.plantingDate,
    boundary: farm.boundary,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.report) {
        return data.report;
      }
    }
  } catch (err) {
    console.warn('[CropShield] Direct API call to /api/satellite/crop-health failed, falling back to local proxy:', err);
  }

  // Fallback to relative endpoint if VITE_API_URL was different
  try {
    const fallbackRes = await fetch('/api/satellite/crop-health', {
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
  } catch {}

  // If server is unreachable or offline
  return {
    farmId: farm.id || 'current_farm',
    farmName: farm.farmName,
    cropType: farm.cropType || 'Rice (Paddy)',
    cropStage: farm.cropStage,
    sowingDate: farm.plantingDate,
    geometryAreaAcres: farm.boundary?.measuredAcres || farm.landSizeAcres || 0,
    status: farm.boundary ? 'credentials_required' : 'geometry_required',
    provider: 'ESA Copernicus Data Space Ecosystem (Sentinel-2 L2A)',
    providerAttribution: 'European Space Agency (ESA) Copernicus Sentinel-2 MSI Multi-Spectral Instrument',
    revisitFrequencyDays: 5,
    spectralBandsUsed: {
      nir: 'B08 (842 nm, 10m)',
      red: 'B04 (665 nm, 10m)',
      cloudMask: 'SCL (Scene Classification Layer, 20m)',
    },
    historicalObservations: [],
    disclaimer:
      'Satellite NDVI measures near-infrared and red canopy reflectance from Copernicus Sentinel-2 multispectral sensors. It indicates relative vegetative vigor and green biomass density, NOT a definitive diagnosis of specific plant pathogens, pests, or viral conditions. Always correlate unusual anomalies with physical ground scouting and CropShield AI Diagnosis.',
    disclaimerTamil:
      'செயற்கைக்கோள் NDVI குறியீடு செவ்வகப்பகுதி மற்றும் அகச்சிவப்புக் கதிர்வீச்சு மூலம் பயிர் பச்சையம் மற்றும் தழைக்கூள அடர்த்தியை அளவிடுகிறது. இது குறிப்பிட்ட நோய் அல்லது பூச்சியின் நேரடி உறுதிப்படுத்தல் அல்ல. மாற்றங்களை கள ஆய்வு மற்றும் பயிர் நோய் கண்டறிதல் கருவி மூலம் சரிபார்க்கவும்.',
    setupInstructions: {
      requiredEnvVars: ['COPERNICUS_CLIENT_ID', 'COPERNICUS_CLIENT_SECRET'],
      documentationUrl: 'https://dataspace.copernicus.eu/analyse/apis/process-api',
      instructions:
        'To activate real-time multispectral Sentinel-2 Level-2A surface reflectance imagery, configure COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET in your server environment variables.',
    },
  };
}

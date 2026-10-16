/**
 * CropShield AI — Agricultural Market Intelligence & Comparison Service
 * Version: 1.0.0 (Phase 6)
 *
 * Integrates AGMARKNET Mandi Price records with GIS geocoding, proximity calculation,
 * price comparison analytics, and verified disclaimers.
 *
 * Adheres to Non-Fabrication Standards:
 * - Never invents coordinates for mandis that lack verified geographic coordinates.
 * - Clearly distinguishes straight-line distance from road route distance.
 * - Flags stale reporting dates (> 5 days old).
 * - Avoids false net-profit speculations or fabricated transport cost deductions.
 */

import {
  MandiPriceRecord,
  MarketPriceWithDiscovery,
  MarketPriceComparisonSummary,
} from '../types';
import {
  matchMarketCoordinates,
  calculateHaversineDistanceKm,
  generateGoogleMapsDirectionsUrl,
} from './nearbyServicesDirectory';

export interface LocationOrigin {
  latitude: number;
  longitude: number;
  label: string;
  isExactFarmPlot: boolean;
}

/**
 * Parses diverse date formats returned by AGMARKNET (e.g., "14/10/2026", "2026-10-14", "14-Oct-2026")
 */
export function parseArrivalDate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const clean = dateStr.trim();

  // Format: DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const [year, month, day] = clean.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calculates how many days have elapsed since the market price was reported.
 */
export function getReportingAgeDays(arrivalDateStr: string, referenceDate: Date = new Date()): number {
  const parsed = parseArrivalDate(arrivalDateStr);
  if (!parsed) return 0;

  const diffMs = referenceDate.getTime() - parsed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
}

/**
 * Enriches raw MandiPriceRecords with verified geocoding, distance, and road directions.
 * Markets without verified coordinates are preserved with hasVerifiedCoordinates = false
 * so they can be listed without inventing false map coordinates.
 */
export function enrichMarketPricesWithLocations(
  records: MandiPriceRecord[],
  origin?: LocationOrigin | null
): MarketPriceWithDiscovery[] {
  const now = new Date();

  return records.map((record) => {
    const geo = matchMarketCoordinates(record.market, record.district, record.state);
    const ageDays = getReportingAgeDays(record.arrivalDate, now);
    const isStale = ageDays > 5;

    let straightLineDistanceKm: number | undefined;
    let directionsUrl: string | undefined;

    if (geo && origin && origin.latitude && origin.longitude) {
      straightLineDistanceKm = calculateHaversineDistanceKm(
        origin.latitude,
        origin.longitude,
        geo.latitude,
        geo.longitude
      );

      directionsUrl = generateGoogleMapsDirectionsUrl(
        origin.latitude,
        origin.longitude,
        geo.latitude,
        geo.longitude,
        geo.marketName
      );
    }

    const distanceOriginDescription = origin
      ? origin.isExactFarmPlot
        ? `From Farm: ${origin.label} (Straight-line distance)`
        : `From District Reference: ${origin.label} (Straight-line distance)`
      : undefined;

    return {
      ...record,
      latitude: geo?.latitude,
      longitude: geo?.longitude,
      hasVerifiedCoordinates: Boolean(geo),
      marketType: geo?.marketType,
      committeeName: geo?.committeeName,
      straightLineDistanceKm,
      distanceOriginDescription,
      directionsUrl,
      isStale,
      reportingAgeDays: ageDays,
    };
  });
}

/**
 * Compares market prices across reporting mandis for the same crop commodity.
 */
export function compareMarketPrices(
  records: MarketPriceWithDiscovery[],
  commodity: string,
  variety?: string
): MarketPriceComparisonSummary {
  // Filter for commodity and optionally variety
  let filtered = records.filter(
    (r) => r.commodity.toLowerCase().trim() === commodity.toLowerCase().trim()
  );

  if (variety && variety !== 'all' && variety.trim()) {
    filtered = filtered.filter(
      (r) => r.variety.toLowerCase().trim() === variety.toLowerCase().trim()
    );
  }

  // Filter out records where modalPrice is zero or invalid
  const validRecords = filtered.filter((r) => r.modalPrice > 0);

  // Sort by modalPrice descending
  const sorted = [...validRecords].sort((a, b) => b.modalPrice - a.modalPrice);

  const highestModalRecord = sorted[0];
  const lowestModalRecord = sorted[sorted.length - 1];

  const modalPriceDifference =
    highestModalRecord && lowestModalRecord
      ? Math.max(highestModalRecord.modalPrice - lowestModalRecord.modalPrice, 0)
      : 0;

  const averageModalPrice =
    sorted.length > 0
      ? Math.round(sorted.reduce((acc, curr) => acc + curr.modalPrice, 0) / sorted.length)
      : 0;

  // Check arrival dates range
  const arrivalDates = sorted.map((r) => r.arrivalDate).filter(Boolean);
  const minDate = arrivalDates.length ? arrivalDates[arrivalDates.length - 1] : 'N/A';
  const maxDate = arrivalDates.length ? arrivalDates[0] : 'N/A';

  const hasStaleData = sorted.some((r) => r.isStale);

  const disclaimer =
    'Reported wholesale mandi auction rates sourced from AGMARKNET / DMI. A higher reported price does not guarantee higher net farmer earnings. Actual realization depends on transport freight, bag handling/unloading charges, moisture/foreign matter grading, and mandi market cess.';

  const disclaimerTamil =
    'அக்மார்க்நெட் (AGMARKNET) மூலம் பெறப்பட்ட அதிகாரப்பூர்வ மொத்த விலை விவரங்கள். அதிக மாதிரி விலை அதிக லாபத்திற்கு உத்தரவாதம் அளிக்காது. போக்குவரத்து செலவு, ஏற்றுக்கூலி, ஈரப்பதம் மற்றும் தரம் ஆகியவை நிகர லாபத்தில் மாறுபடும்.';

  return {
    commodity,
    variety: variety || 'All Reported Cultivars',
    reportingDateRange: { min: minDate, max: maxDate },
    records: sorted,
    highestModalRecord,
    lowestModalRecord,
    modalPriceDifference,
    averageModalPrice,
    hasStaleData,
    disclaimer,
    disclaimerTamil,
  };
}

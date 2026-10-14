/**
 * CropShield AI — Daily Crop Market Prices Client Service
 * 
 * Provides client-side interface for fetching mandi prices from CropShield server
 * which proxies and parses Government of India OGD / AGMARKNET XML data.
 */

import { MandiPriceRecord, MarketPriceFilters, MarketPricesResponse } from '../types';
import { TN_DISTRICT_GEODATA } from '../config/tamilNaduDistricts';

export interface PriorityCommodity {
  id: string;
  name: string;
  nameTamil: string;
  category: 'cereal' | 'vegetable' | 'oilseed' | 'fruit' | 'fiber' | 'pulse';
}

export const TN_PRIORITY_COMMODITIES: PriorityCommodity[] = [
  { id: 'Paddy', name: 'Paddy / Rice', nameTamil: 'நெல் / அரிசி', category: 'cereal' },
  { id: 'Tomato', name: 'Tomato', nameTamil: 'தக்காளி', category: 'vegetable' },
  { id: 'Onion', name: 'Onion', nameTamil: 'வெங்காயம்', category: 'vegetable' },
  { id: 'Maize', name: 'Maize', nameTamil: 'மக்காச்சோளம்', category: 'cereal' },
  { id: 'Groundnut', name: 'Groundnut', nameTamil: 'நிலக்கடலை', category: 'oilseed' },
  { id: 'Banana', name: 'Banana', nameTamil: 'வாழைப்பழம்', category: 'fruit' },
  { id: 'Black Gram', name: 'Black Gram (Urad)', nameTamil: 'உளுந்து', category: 'pulse' },
  { id: 'Green Gram', name: 'Green Gram (Moong)', nameTamil: 'பாசிப்பயறு', category: 'pulse' },
  { id: 'Cotton', name: 'Cotton', nameTamil: 'பருத்தி', category: 'fiber' },
  { id: 'Chilli', name: 'Chilli', nameTamil: 'மிளகாய்', category: 'vegetable' },
  { id: 'Coconut', name: 'Coconut', nameTamil: 'தேங்காய்', category: 'oilseed' },
  { id: 'Brinjal', name: 'Brinjal / Eggplant', nameTamil: 'கத்தரிக்காய்', category: 'vegetable' },
];

export const TN_DISTRICT_LIST = Object.keys(TN_DISTRICT_GEODATA).map((districtKey) => ({
  en: districtKey,
  ta: TN_DISTRICT_GEODATA[districtKey].nameTamil,
}));

/**
 * Fetch daily mandi prices from backend API proxy
 */
export async function fetchDailyMandiPrices(filters: MarketPriceFilters = {}): Promise<MarketPricesResponse> {
  const query = new URLSearchParams();

  if (filters.state) query.set('state', filters.state);
  else query.set('state', 'Tamil Nadu');

  if (filters.district && filters.district !== 'all') query.set('district', filters.district);
  if (filters.commodity && filters.commodity !== 'all') query.set('commodity', filters.commodity);
  if (filters.market && filters.market.trim()) query.set('market', filters.market.trim());
  if (filters.variety && filters.variety.trim()) query.set('variety', filters.variety.trim());
  if (filters.limit) query.set('limit', String(filters.limit));
  if (filters.offset) query.set('offset', String(filters.offset));

  const url = `/api/market-prices?${query.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }

    const message = errorData?.message || `HTTP ${response.status}: Failed to fetch mandi market prices`;
    const errObj: MarketPricesResponse = {
      success: false,
      records: [],
      totalRecords: 0,
      fetchedAt: new Date().toISOString(),
      isCached: false,
      filtersApplied: filters,
      error: errorData?.error || 'HTTP_ERROR',
      message,
    };
    return errObj;
  }

  const data: MarketPricesResponse = await response.json();
  return data;
}

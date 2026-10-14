/**
 * CropShield AI — AGMARKNET / OGD India Daily Mandi Market Price Service
 * Version: 1.0.0
 * 
 * Sourced via Government of India's Open Government Data (OGD) Platform / AGMARKNET:
 * Resource UUID: 9ef84268-d588-465a-a308-a864a43d0070
 * Dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
 * 
 * Security & Integrity:
 * - Reads DATA_GOV_IN_API_KEY from server-side environment variables only.
 * - Parses XML safely using fast-xml-parser with external entity resolution disabled (XXE immune).
 * - Caches responses for 30 minutes in-memory to prevent rate-limiting.
 * - Distinguishes between CropShield fetch timestamp and AGMARKNET reported market date.
 * - Never fabricates placeholder prices if API key is invalid or zero records are returned.
 */

import { XMLParser } from 'fast-xml-parser';
import { MandiPriceRecord, MarketPriceFilters, MarketPricesResponse } from '../src/types';

export const OGD_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
export const OGD_API_BASE_URL = `https://api.data.gov.in/resource/${OGD_RESOURCE_ID}`;

// In-memory cache store: cacheKey -> { timestamp, data }
interface CachedEntry {
  timestamp: number;
  data: MarketPricesResponse;
}

const priceCache = new Map<string, CachedEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL

// Safe XML Parser instance configured to prevent XXE
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  processEntities: false, // Disables XML entity expansion (XXE protection)
  allowBooleanAttributes: false,
});

// Common Tamil translations for frequent Tamil Nadu agricultural commodities
const COMMODITY_TAMIL_MAP: Record<string, string> = {
  paddy: 'நெல் (பயிர்)',
  'paddy(dhan)(common)': 'நெல் (சாதாரண ரகம்)',
  'paddy(dhan)(fine)': 'நெல் (சன்ன ரகம்)',
  rice: 'அரிசி',
  tomato: 'தக்காளி',
  onion: 'வெங்காயம்',
  maize: 'மக்காச்சோளம்',
  groundnut: 'நிலக்கடலை (வேர்க்கடலை)',
  banana: 'வாழைப்பழம் / வாழைக்காய்',
  'banana - green': 'பச்சை வாழை',
  'black gram (urd crop)': 'உளுந்து (கருப்பு உளுந்து)',
  'black gram': 'உளுந்து',
  'green gram': 'பாசிப்பயறு',
  cotton: 'பருத்தி',
  coconut: 'தேங்காய்',
  sugarcane: 'கரும்பு',
  chilli: 'மிளகாய்',
  'green chilli': 'பச்சை மிளகாய்',
  'red chilli': 'காய்ந்த மிளகாய்',
  potato: 'உருளைக்கிழங்கு',
  brinjal: 'கத்தரிக்காய்',
  bhendi: 'வெண்டைக்காய்',
  cabbage: 'முட்டைக்கோஸ்',
  cauliflower: 'காலிஃபிளவர்',
  drumstick: 'முருங்கைக்காய்',
  mango: 'மாம்பழம்',
  turmeric: 'மஞ்சள்',
  tamarind: 'புளி',
  tapioca: 'மரவள்ளிக்கிழங்கு',
};

function getCommodityTamil(commodity: string): string {
  const normalized = commodity.toLowerCase().trim();
  for (const [key, val] of Object.entries(COMMODITY_TAMIL_MAP)) {
    if (normalized.includes(key)) {
      return val;
    }
  }
  return commodity;
}

/**
 * Normalizes and extracts array of records from parsed XML data
 */
function extractRecordsFromXml(parsed: any): any[] {
  if (!parsed) return [];

  const root = parsed.response || parsed;
  const recordsContainer = root.records;
  if (!recordsContainer) return [];

  // Structure can have <records><record> or <records><item>
  const rawList = recordsContainer.record || recordsContainer.item || recordsContainer;

  if (Array.isArray(rawList)) {
    return rawList;
  } else if (typeof rawList === 'object' && rawList !== null) {
    return [rawList];
  }

  return [];
}

/**
 * Fetches daily crop mandi prices from Government of India OGD API
 */
export async function fetchMandiPrices(filters: MarketPriceFilters = {}): Promise<MarketPricesResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim();
  const format = process.env.DATA_GOV_IN_FORMAT?.trim() || 'xml';
  const nowIso = new Date().toISOString();

  const stateFilter = filters.state?.trim() || 'Tamil Nadu';
  const districtFilter = filters.district?.trim() || '';
  const marketFilter = filters.market?.trim() || '';
  const commodityFilter = filters.commodity?.trim() || '';
  const varietyFilter = filters.variety?.trim() || '';
  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 250);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  const normalizedFilters: MarketPriceFilters = {
    state: stateFilter,
    district: districtFilter || undefined,
    market: marketFilter || undefined,
    commodity: commodityFilter || undefined,
    variety: varietyFilter || undefined,
    limit,
    offset,
  };

  // Check for missing or placeholder API key
  if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey.length < 20) {
    return {
      success: false,
      records: [],
      totalRecords: 0,
      fetchedAt: nowIso,
      isCached: false,
      filtersApplied: normalizedFilters,
      isConfigError: true,
      error: 'API_KEY_NOT_CONFIGURED',
      message: 'DATA_GOV_IN_API_KEY is not configured or is invalid on the server. Please register at data.gov.in and configure your OGD API key in the server environment.',
      messageTamil: 'மத்திய அரசின் data.gov.in API சாவி (DATA_GOV_IN_API_KEY) சர்வரில் அமைக்கப்படவில்லை. data.gov.in இணையதளத்தில் பதிவுசெய்து உங்கள் சாவியை .env கோப்பில் உள்ளிடவும்.',
    };
  }

  // Generate cache key
  const cacheKey = JSON.stringify({
    state: stateFilter.toLowerCase(),
    district: districtFilter.toLowerCase(),
    market: marketFilter.toLowerCase(),
    commodity: commodityFilter.toLowerCase(),
    variety: varietyFilter.toLowerCase(),
    limit,
    offset,
  });

  const cached = priceCache.get(cacheKey);
  const currentTime = Date.now();
  if (cached && currentTime - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.data,
      isCached: true,
    };
  }

  // Build OGD API URL with URLSearchParams
  const params = new URLSearchParams();
  params.append('api-key', apiKey);
  params.append('format', format);
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  if (stateFilter) {
    params.append('filters[state]', stateFilter);
  }
  if (districtFilter) {
    params.append('filters[district]', districtFilter);
  }
  if (marketFilter) {
    params.append('filters[market]', marketFilter);
  }
  if (commodityFilter) {
    params.append('filters[commodity]', commodityFilter);
  }
  if (varietyFilter) {
    params.append('filters[variety]', varietyFilter);
  }

  const targetUrl = `${OGD_API_BASE_URL}?${params.toString()}`;

  // Abort controller for 10-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const upstreamRes = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CropShield-AI-TamilNadu/1.0',
        Accept: format === 'xml' ? 'application/xml, text/xml' : 'application/json',
      },
    });

    clearTimeout(timeoutId);

    // Handle HTTP status errors from data.gov.in
    if (upstreamRes.status === 403) {
      return {
        success: false,
        records: [],
        totalRecords: 0,
        fetchedAt: nowIso,
        isCached: false,
        filtersApplied: normalizedFilters,
        isConfigError: true,
        error: 'API_KEY_UNAUTHORIZED',
        message: 'The configured DATA_GOV_IN_API_KEY was rejected by data.gov.in (Key not authorised or expired). Please verify your API key credential.',
        messageTamil: 'அமைக்கப்பட்ட data.gov.in API சாவி நிராகரிக்கப்பட்டது (அங்கீகரிக்கப்படாத அல்லது காலாவதியான சாவி). தயவுசெய்து உங்கள் சாவியை சரிபார்க்கவும்.',
      };
    }

    if (upstreamRes.status === 429) {
      return {
        success: false,
        records: [],
        totalRecords: 0,
        fetchedAt: nowIso,
        isCached: false,
        filtersApplied: normalizedFilters,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Government of India OGD API rate limit reached (Too Many Requests). Please retry in a few moments.',
        messageTamil: 'data.gov.in அரசு சர்வர் கோரிக்கை வரம்பை எட்டியுள்ளது (Too Many Requests). தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
      };
    }

    if (!upstreamRes.ok) {
      throw new Error(`Upstream API responded with HTTP status ${upstreamRes.status}`);
    }

    const rawBody = await upstreamRes.text();

    // Handle OGD API returning JSON errors (such as Rate limit exceeded or Key not authorised) even on format=xml
    if (rawBody.trim().startsWith('{')) {
      try {
        const jsonError = JSON.parse(rawBody);
        if (jsonError.error || jsonError.message) {
          const errText = jsonError.error || jsonError.message;
          const isRateLimit = /rate limit/i.test(errText);
          const isKeyAuth = /key not authori[zs]ed|invalid/i.test(errText);
          return {
            success: false,
            records: [],
            totalRecords: 0,
            fetchedAt: nowIso,
            isCached: false,
            filtersApplied: normalizedFilters,
            isConfigError: isKeyAuth,
            error: isRateLimit ? 'RATE_LIMIT_EXCEEDED' : isKeyAuth ? 'API_KEY_UNAUTHORIZED' : 'UPSTREAM_API_ERROR',
            message: `Government OGD Portal: ${errText}`,
            messageTamil: isRateLimit
              ? 'data.gov.in அரசு சர்வர் கோரிக்கை வரம்பை எட்டியுள்ளது (Rate limit exceeded). தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
              : isKeyAuth
              ? 'அமைக்கப்பட்ட data.gov.in API சாவி நிராகரிக்கப்பட்டது (அங்கீகரிக்கப்படாத சாவி). தயவுசெய்து உங்கள் சாவியை சரிபார்க்கவும்.'
              : `அரசு சர்வர் செய்தி: ${errText}`,
          };
        }
      } catch {
        // Not JSON, continue to XML parsing
      }
    }

    let rawRecords: any[] = [];
    let totalCount = 0;

    if (format === 'xml') {
      let parsedXml: any;
      try {
        parsedXml = xmlParser.parse(rawBody);
      } catch (xmlErr: any) {
        throw new Error(`Failed to parse XML response from data.gov.in: ${xmlErr.message}`);
      }

      rawRecords = extractRecordsFromXml(parsedXml);
      const root = parsedXml.response || parsedXml;
      totalCount = Number(root.total) || rawRecords.length;
    } else {
      // JSON format fallback
      const parsedJson = JSON.parse(rawBody);
      rawRecords = parsedJson.records || [];
      totalCount = Number(parsedJson.total) || rawRecords.length;
    }

    // Sanitize, normalize, and type-cast the MandiPriceRecords
    const records: MandiPriceRecord[] = rawRecords.map((item: any, idx: number) => {
      const state = String(item.state || 'Tamil Nadu').trim();
      const district = String(item.district || '').trim();
      const market = String(item.market || '').trim();
      const commodity = String(item.commodity || '').trim();
      const variety = String(item.variety || 'Standard / Other').trim();
      const grade = String(item.grade || 'FAQ').trim();
      const arrivalDate = String(item.arrival_date || item.arrivalDate || '').trim();

      const minPrice = Math.max(parseFloat(String(item.min_price || item.minPrice || '0').replace(/,/g, '')) || 0, 0);
      const maxPrice = Math.max(parseFloat(String(item.max_price || item.maxPrice || '0').replace(/,/g, '')) || 0, 0);
      const modalPrice = Math.max(parseFloat(String(item.modal_price || item.modalPrice || '0').replace(/,/g, '')) || 0, 0);

      return {
        id: `mandi_${market.toLowerCase().replace(/\s+/g, '_')}_${commodity.toLowerCase().replace(/\s+/g, '_')}_${idx}`,
        state,
        district,
        market,
        commodity,
        commodityTamil: getCommodityTamil(commodity),
        variety,
        grade,
        arrivalDate,
        minPrice,
        maxPrice,
        modalPrice,
        priceUnit: '₹/quintal', // AGMARKNET standardized wholesale price unit (Rs / 100 kg)
        source: 'AGMARKNET / Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare via data.gov.in',
      };
    });

    const result: MarketPricesResponse = {
      success: true,
      records,
      totalRecords: totalCount,
      fetchedAt: nowIso,
      isCached: false,
      filtersApplied: normalizedFilters,
    };

    // Save to in-memory cache
    priceCache.set(cacheKey, { timestamp: currentTime, data: result });

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);

    // If abort controller fired
    if (err.name === 'AbortError') {
      return {
        success: false,
        records: [],
        totalRecords: 0,
        fetchedAt: nowIso,
        isCached: false,
        filtersApplied: normalizedFilters,
        error: 'REQUEST_TIMEOUT',
        message: 'The request to AGMARKNET / data.gov.in timed out after 10 seconds. Please retry.',
        messageTamil: 'data.gov.in அரசு சேவையகத்திற்கான இணைப்பு நேரம் முடிந்தது. மீண்டும் முயற்சிக்கவும்.',
      };
    }

    console.error('Error fetching mandi market prices from data.gov.in:', err);

    return {
      success: false,
      records: [],
      totalRecords: 0,
      fetchedAt: nowIso,
      isCached: false,
      filtersApplied: normalizedFilters,
      error: 'UPSTREAM_ERROR',
      message: err.message || 'Unable to retrieve mandi market prices from the government portal.',
      messageTamil: 'அரசு சந்தை விலைத் தரவை ஏற்றுவதில் பிழை ஏற்பட்டது. தயவுசெய்து சிறிது நேரம் கழித்து முயற்சிக்கவும்.',
    };
  }
}

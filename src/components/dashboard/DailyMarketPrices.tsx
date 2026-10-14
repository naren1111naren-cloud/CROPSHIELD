import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MandiPriceRecord, MarketPricesResponse } from '../../types';
import {
  fetchDailyMandiPrices,
  TN_PRIORITY_COMMODITIES,
  TN_DISTRICT_LIST,
} from '../../services/marketPriceClient';
import {
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Building2,
  Clock,
  ArrowUpDown,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Store,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface DailyMarketPricesProps {
  activeDistrict?: string;
}

export const DailyMarketPrices: React.FC<DailyMarketPricesProps> = ({
  activeDistrict,
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  // Filters State
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(activeDistrict || 'all');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Paddy');
  const [searchMarket, setSearchMarket] = useState<string>('');
  const [searchVariety, setSearchVariety] = useState<string>('');
  const [sortBy, setSortBy] = useState<'modal_desc' | 'modal_asc' | 'market_asc' | 'date_desc'>('modal_desc');

  // Data & Request State
  const [loading, setLoading] = useState<boolean>(true);
  const [response, setResponse] = useState<MarketPricesResponse | null>(null);
  const [lastFetchedTime, setLastFetchedTime] = useState<string>('');

  // Synchronize initial district if passed
  useEffect(() => {
    if (activeDistrict && selectedDistrict === 'all') {
      const match = TN_DISTRICT_LIST.find(
        (d) => d.en.toLowerCase() === activeDistrict.toLowerCase()
      );
      if (match) {
        setSelectedDistrict(match.en);
      }
    }
  }, [activeDistrict]);

  // Load Mandi Prices
  const loadPrices = async () => {
    setLoading(true);
    try {
      const res = await fetchDailyMandiPrices({
        state: selectedState,
        district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        commodity: selectedCommodity !== 'all' ? selectedCommodity : undefined,
        market: searchMarket.trim() || undefined,
        variety: searchVariety.trim() || undefined,
        limit: 100,
      });
      setResponse(res);
      setLastFetchedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Failed to load mandi prices:', err);
      setResponse({
        success: false,
        records: [],
        totalRecords: 0,
        fetchedAt: new Date().toISOString(),
        isCached: false,
        filtersApplied: {
          state: selectedState,
          district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
          commodity: selectedCommodity !== 'all' ? selectedCommodity : undefined,
        },
        error: 'CLIENT_FETCH_ERROR',
        message: err.message || 'Network error communicating with CropShield market prices service.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, [selectedState, selectedDistrict, selectedCommodity]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPrices();
  };

  const handleResetFilters = () => {
    setSelectedState('Tamil Nadu');
    setSelectedDistrict('all');
    setSelectedCommodity('Paddy');
    setSearchMarket('');
    setSearchVariety('');
    setSortBy('modal_desc');
  };

  // Filtered and Sorted Records
  const processedRecords = useMemo(() => {
    if (!response || !response.records) return [];

    let list = [...response.records];

    // Client side secondary filtering if user typed in market or variety search
    if (searchMarket.trim()) {
      const mQuery = searchMarket.toLowerCase().trim();
      list = list.filter((r) => r.market.toLowerCase().includes(mQuery));
    }

    if (searchVariety.trim()) {
      const vQuery = searchVariety.toLowerCase().trim();
      list = list.filter((r) => r.variety.toLowerCase().includes(vQuery));
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'modal_desc') return b.modalPrice - a.modalPrice;
      if (sortBy === 'modal_asc') return a.modalPrice - b.modalPrice;
      if (sortBy === 'market_asc') return a.market.localeCompare(b.market);
      if (sortBy === 'date_desc') return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime();
      return 0;
    });

    return list;
  }, [response, searchMarket, searchVariety, sortBy]);

  // Price Statistics for Comparison
  const priceStats = useMemo(() => {
    if (!processedRecords.length) return null;
    const modalPrices = processedRecords.map((r) => r.modalPrice).filter((p) => p > 0);
    if (!modalPrices.length) return null;

    const min = Math.min(...modalPrices);
    const max = Math.max(...modalPrices);
    const avg = Math.round(modalPrices.reduce((sum, p) => sum + p, 0) / modalPrices.length);

    return { min, max, avg, count: processedRecords.length };
  }, [processedRecords]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 rounded-xs space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9DED3] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#426B43] bg-[#426B43]/10 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                GOVERNMENT OF INDIA OGD · AGMARKNET FEED
              </span>
              {response?.isCached && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A6B3A] bg-[#F7F4E9] px-2 py-0.5 rounded-full border border-[#D9DED3]">
                  ⚡ CACHED (30m TTL)
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-medium text-[#183B2A]">
              {isTa ? 'தினசரி சந்தை விலைகள் (மண்டி நிலவரம்)' : 'Daily Crop Market Prices (Mandi Rates)'}
            </h2>
            <p className="text-xs text-[#4A584D] font-sans mt-1 max-w-2xl">
              {isTa
                ? 'தமிழ்நாடு மற்றும் பிற ஒழுங்குமுறை விற்பனைக் கூடங்களின் (Mandi) அதிகாரப்பூர்வ நேரடி விலைகள். குறைந்தபட்ச, அதிகபட்ச மற்றும் மாதிரி (Modal) விலைகள் ₹/குவிண்டால் வீதத்தில் காட்டப்படுகின்றன.'
                : 'Live regulated market prices directly from the Ministry of Agriculture & Farmers Welfare via AGMARKNET feeds. Minimum, maximum, and modal wholesale rates in ₹/quintal.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={loadPrices}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#183B2A] text-white text-xs font-mono rounded-xs hover:bg-[#204935] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Mandi Prices"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? (isTa ? 'புதுப்பிக்கிறது...' : 'Refreshing...') : (isTa ? 'விலைகளை புதுப்பி' : 'Refresh Feed')}</span>
            </button>
            <a
              href="https://agmarknet.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 border border-[#D9DED3] text-[#4A584D] hover:text-[#183B2A] hover:bg-[#FAF9F3] text-xs font-mono rounded-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>AGMARKNET</span>
            </a>
          </div>
        </div>

        {/* Priority Crop Quick Filters */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#4A584D] flex items-center justify-between">
            <span>{isTa ? 'தமிழ்நாட்டின் முக்கிய பயிர்கள்' : 'Priority Tamil Nadu Crops'}:</span>
            <span className="text-[10px] text-[#426B43]">
              {isTa ? 'ஒரு பயிரைத் தொட்டு விலைகளைக் காண்க' : 'Click to inspect wholesale mandi arrivals'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TN_PRIORITY_COMMODITIES.map((c) => {
              const isSelected = selectedCommodity.toLowerCase() === c.id.toLowerCase();
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCommodity(c.id)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#183B2A] text-[#FAF9F3] border-[#183B2A] font-semibold shadow-xs'
                      : 'bg-[#FAF9F3] text-[#183B2A] border-[#D9DED3] hover:border-[#183B2A] hover:bg-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                  <span>{isTa ? c.nameTamil : c.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => setSelectedCommodity('all')}
              className={`px-3 py-1.5 text-xs font-mono rounded-xs border transition-all cursor-pointer ${
                selectedCommodity === 'all'
                  ? 'bg-[#183B2A] text-[#FAF9F3] border-[#183B2A] font-semibold'
                  : 'bg-[#FAF9F3] text-[#4A584D] border-[#D9DED3] hover:border-[#183B2A]'
              }`}
            >
              {isTa ? 'அனைத்து பயிர்களும்' : 'All Commodities'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <form onSubmit={handleManualSearch} className="bg-white border border-[#D9DED3] p-5 rounded-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
          {/* State */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-[#4A584D] font-medium">
              {isTa ? 'மாநிலம் (State)' : 'State'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-[#FAF9F3] border border-[#D9DED3] rounded-xs px-3 py-2 text-[#183B2A] font-sans focus:outline-hidden focus:border-[#183B2A]"
            >
              <option value="Tamil Nadu">Tamil Nadu (தமிழ்நாடு)</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Kerala">Kerala</option>
            </select>
          </div>

          {/* District */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-[#4A584D] font-medium">
              {isTa ? 'மாவட்டம் (District)' : 'District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-[#FAF9F3] border border-[#D9DED3] rounded-xs px-3 py-2 text-[#183B2A] font-sans focus:outline-hidden focus:border-[#183B2A]"
            >
              <option value="all">{isTa ? 'அனைத்து மாவட்டங்களும் (All Districts)' : 'All Districts (Tamil Nadu)'}</option>
              {TN_DISTRICT_LIST.map((d) => (
                <option key={d.en} value={d.en}>
                  {d.en} ({d.ta})
                </option>
              ))}
            </select>
          </div>

          {/* Market / Mandi search */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-[#4A584D] font-medium">
              {isTa ? 'சந்தை பெயர் (Mandi Name)' : 'Market / Mandi Name'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isTa ? 'உதா: Thanjavur, Madurai...' : 'e.g., Thanjavur, Madurai...'}
                value={searchMarket}
                onChange={(e) => setSearchMarket(e.target.value)}
                className="w-full bg-[#FAF9F3] border border-[#D9DED3] rounded-xs pl-8 pr-3 py-2 text-[#183B2A] font-sans placeholder:text-gray-400 focus:outline-hidden focus:border-[#183B2A]"
              />
              <Search className="w-3.5 h-3.5 text-[#4A584D] absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Variety search */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-[#4A584D] font-medium">
              {isTa ? 'ரகம் (Variety)' : 'Crop Variety'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isTa ? 'உதா: Common, 1001, Hybrid...' : 'e.g., Common, Hybrid, Local...'}
                value={searchVariety}
                onChange={(e) => setSearchVariety(e.target.value)}
                className="w-full bg-[#FAF9F3] border border-[#D9DED3] rounded-xs pl-8 pr-3 py-2 text-[#183B2A] font-sans placeholder:text-gray-400 focus:outline-hidden focus:border-[#183B2A]"
              />
              <Filter className="w-3.5 h-3.5 text-[#4A584D] absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* Sort & Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D9DED3] text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#4A584D] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              {isTa ? 'வரிசைப்படுத்து:' : 'Sort By:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FAF9F3] border border-[#D9DED3] rounded-xs px-2.5 py-1 text-[#183B2A] font-mono focus:outline-hidden focus:border-[#183B2A]"
            >
              <option value="modal_desc">{isTa ? 'மாதிரி விலை (அதிகம் முதல் குறைவு)' : 'Modal Price (High to Low)'}</option>
              <option value="modal_asc">{isTa ? 'மாதிரி விலை (குறைவு முதல் அதிகம்)' : 'Modal Price (Low to High)'}</option>
              <option value="market_asc">{isTa ? 'சந்தை பெயர் (A - Z)' : 'Market Name (A to Z)'}</option>
              <option value="date_desc">{isTa ? 'சமீபத்திய தேதி' : 'Latest Reported Date'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1 text-[#4A584D] hover:text-[#183B2A] underline cursor-pointer"
            >
              {isTa ? 'வடிகட்டிகளை மீட்டமை' : 'Reset Filters'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#426B43] hover:bg-[#183B2A] text-white font-mono rounded-xs transition-colors cursor-pointer"
            >
              {isTa ? 'தேடு' : 'Apply Search'}
            </button>
          </div>
        </div>
      </form>

      {/* Comparison Statistics Banner (if multiple records found) */}
      {priceStats && priceStats.count > 0 && (
        <div className="bg-[#FAF9F3] border border-[#D9DED3] p-4 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#183B2A]/10 flex items-center justify-center text-[#183B2A]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase text-[#426B43] font-semibold">
                {isTa ? 'சந்தை ஒப்பீட்டு பகுப்பாய்வு' : 'Market Comparison Summary'}
              </div>
              <div className="font-serif text-lg text-[#183B2A]">
                {selectedCommodity} · {priceStats.count} {isTa ? 'சந்தை மையங்கள்' : 'Reporting Mandis'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center sm:text-right font-mono">
            <div>
              <div className="text-[10px] text-[#4A584D] uppercase">{isTa ? 'குறைந்தபட்சம்' : 'Floor Modal'}</div>
              <div className="text-sm font-bold text-[#183B2A]">₹{priceStats.min.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#4A584D] uppercase">{isTa ? 'சராசரி மாதிரி' : 'State Average'}</div>
              <div className="text-sm font-bold text-[#426B43]">₹{priceStats.avg.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#4A584D] uppercase">{isTa ? 'அதிகபட்சம்' : 'Peak Modal'}</div>
              <div className="text-sm font-bold text-[#183B2A]">₹{priceStats.max.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error or API Configuration Warning State */}
      {response && !response.success && (
        <div className="bg-white border-2 border-[#A94338] p-6 rounded-xs space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-[#A94338] shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#A94338]">
                {response.error === 'MISSING_API_KEY'
                  ? isTa
                    ? 'OGD API விசை கட்டமைக்கப்படவில்லை (API Key Required)'
                    : 'AGMARKNET / data.gov.in API Key Required'
                  : response.error === 'INVALID_API_KEY'
                  ? isTa
                    ? 'OGD API விசை அங்கீகரிக்கப்படவில்லை (Invalid API Key)'
                    : 'OGD API Key Not Authorized (HTTP 403)'
                  : isTa
                  ? 'சந்தை தகவல் சேவையில் பிழை ஏற்பட்டது'
                  : 'Market Data Service Temporarily Unavailable'}
              </h3>
              <p className="text-xs text-[#4A584D] font-sans leading-relaxed">
                {response.message}
              </p>

              {(response.error === 'MISSING_API_KEY' || response.error === 'INVALID_API_KEY') && (
                <div className="bg-[#FAF9F3] border border-[#D9DED3] p-4 text-xs font-mono space-y-2 rounded-xs">
                  <div className="font-bold text-[#183B2A]">
                    {isTa ? 'கட்டமைப்பு வழிகாட்டி:' : 'Administrator Setup Instructions:'}
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-[#4A584D]">
                    <li>
                      Register or sign in at{' '}
                      <a
                        href="https://data.gov.in/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#426B43] underline"
                      >
                        data.gov.in
                      </a>
                    </li>
                    <li>Generate your secure individual API Key from "My Account" → "API Key".</li>
                    <li>
                      Set your environment variable in <code className="bg-white px-1 border">.env</code>:
                      <div className="bg-[#183B2A] text-white p-2 rounded-xs my-1 font-mono text-[11px]">
                        DATA_GOV_IN_API_KEY=your_registered_api_key_here
                      </div>
                    </li>
                    <li>Restart the server. All AGMARKNET mandi feeds will immediately synchronize.</li>
                  </ol>
                  <p className="text-[11px] text-[#7A6B3A] italic">
                    ⚠️ CropShield AI adheres to strict data integrity: placeholder or fabricated prices are never shown when official government keys are pending.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Results Container */}
      <div className="bg-white border border-[#D9DED3] rounded-xs shadow-xs overflow-hidden">
        {/* Results Metadata Header */}
        <div className="p-4 sm:p-5 border-b border-[#D9DED3] bg-[#FAF9F3]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#183B2A]">
              {loading ? 'SEARCHING MANDIS...' : `${processedRecords.length} MARKET RECORDS DISPLAYED`}
            </span>
            {selectedDistrict !== 'all' && (
              <span className="text-[#426B43] bg-white px-2 py-0.5 border border-[#D9DED3] rounded-xs">
                District: {selectedDistrict}
              </span>
            )}
            {selectedCommodity !== 'all' && (
              <span className="text-[#426B43] bg-white px-2 py-0.5 border border-[#D9DED3] rounded-xs">
                Crop: {selectedCommodity}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#4A584D]">
            <div className="flex items-center gap-1" title="When CropShield requested upstream data">
              <Clock className="w-3.5 h-3.5 text-[#426B43]" />
              <span>{isTa ? 'கடைசி புதுப்பிப்பு:' : 'Last Fetch:'} {lastFetchedTime || 'Just now'}</span>
            </div>
            <div className="text-[11px] font-semibold text-[#183B2A]">
              {isTa ? 'அலகு: ₹ / குவிண்டால்' : 'Unit: ₹/quintal'}
            </div>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="p-12 text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#183B2A]" />
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-[#183B2A]">
                {isTa ? 'மண்டி விலைகள் சரிபார்க்கப்படுகின்றன...' : 'Connecting to AGMARKNET XML Feed...'}
              </h4>
              <p className="text-xs text-[#4A584D] font-mono">
                Querying data.gov.in resource 9ef84268-d588-465a-a308-a864a43d0070
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && response?.success && processedRecords.length === 0 && (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#183B2A]/10 mx-auto flex items-center justify-center text-[#183B2A]">
              <Store className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="font-serif text-xl font-medium text-[#183B2A]">
                {isTa ? 'பொருத்தமான சந்தை பதிவுகள் எதுவும் இல்லை' : 'No Matching Mandi Records Found'}
              </h4>
              <p className="text-xs text-[#4A584D] font-sans">
                {isTa
                  ? `தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளுக்கு (${selectedCommodity !== 'all' ? selectedCommodity : 'பயிர்'}, ${selectedDistrict !== 'all' ? selectedDistrict : 'தமிழ்நாடு'}) இன்றைய தினத்திற்கான புதிய வரத்து பதிவுகள் AGMARKNET சேவையில் பதிவாகவில்லை.`
                  : `No verified mandi arrivals reported for ${selectedCommodity} in ${selectedDistrict === 'all' ? 'Tamil Nadu' : selectedDistrict} for the selected parameters.`}
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-[#183B2A] text-[#183B2A] hover:bg-[#183B2A] hover:text-white text-xs font-mono rounded-xs transition-colors cursor-pointer"
            >
              {isTa ? 'அனைத்து மாவட்டங்களையும் காண்க' : 'Clear Filters & Show All Districts'}
            </button>
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && processedRecords.length > 0 && (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF9F3] border-b border-[#D9DED3] font-mono text-[11px] text-[#4A584D] uppercase">
                    <th className="py-3.5 px-4 font-semibold">{isTa ? 'பயிர் / ரகம்' : 'Commodity / Variety'}</th>
                    <th className="py-3.5 px-4 font-semibold">{isTa ? 'சந்தை & மாவட்டம்' : 'Mandi & District'}</th>
                    <th className="py-3.5 px-4 font-semibold text-right">{isTa ? 'குறைந்த விலை' : 'Min Price'}</th>
                    <th className="py-3.5 px-4 font-semibold text-right">{isTa ? 'மாதிரி விலை (Modal)' : 'Modal Price'}</th>
                    <th className="py-3.5 px-4 font-semibold text-right">{isTa ? 'அதிக விலை' : 'Max Price'}</th>
                    <th className="py-3.5 px-4 font-semibold">{isTa ? 'விலை வரம்பு' : 'Spread Bar'}</th>
                    <th className="py-3.5 px-4 font-semibold">{isTa ? 'அறிவிக்கப்பட்ட தேதி' : 'Arrival Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DED3] font-sans">
                  {processedRecords.map((r, idx) => {
                    const priceRange = r.maxPrice - r.minPrice;
                    const percentModal = priceRange > 0 ? Math.round(((r.modalPrice - r.minPrice) / priceRange) * 100) : 50;

                    return (
                      <tr key={`${r.id}-${idx}`} className="hover:bg-[#FAF9F3]/60 transition-colors">
                        {/* Commodity & Variety */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#183B2A] text-sm">
                            {r.commodity}
                          </div>
                          {r.commodityTamil && isTa && (
                            <div className="text-[11px] text-[#426B43] font-sans">{r.commodityTamil}</div>
                          )}
                          <div className="text-[11px] font-mono text-[#4A584D] mt-0.5">
                            {isTa ? 'ரகம்:' : 'Variety:'} <span className="text-[#183B2A]">{r.variety || 'Standard / Local'}</span>
                            {r.grade && r.grade !== 'FAQ' && ` · Grade: ${r.grade}`}
                          </div>
                        </td>

                        {/* Mandi & District */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#183B2A] flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#426B43]" />
                            {r.market}
                          </div>
                          <div className="text-[11px] font-mono text-[#4A584D] mt-0.5">
                            {r.district}, {r.state}
                          </div>
                        </td>

                        {/* Min Price */}
                        <td className="py-3.5 px-4 text-right font-mono text-[#4A584D]">
                          ₹{r.minPrice.toLocaleString('en-IN')}
                        </td>

                        {/* Modal Price */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className="inline-block bg-[#183B2A] text-white px-2.5 py-1 rounded-xs font-bold text-sm shadow-2xs">
                            ₹{r.modalPrice.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-[#4A584D] font-mono mt-0.5">₹/quintal</div>
                        </td>

                        {/* Max Price */}
                        <td className="py-3.5 px-4 text-right font-mono text-[#4A584D]">
                          ₹{r.maxPrice.toLocaleString('en-IN')}
                        </td>

                        {/* Visual Range Bar */}
                        <td className="py-3.5 px-4 w-36">
                          <div className="space-y-1">
                            <div className="w-full bg-[#E5EAE1] h-2 rounded-full overflow-hidden relative">
                              <div
                                className="bg-[#426B43] h-full rounded-full transition-all"
                                style={{ width: `${Math.max(15, Math.min(100, percentModal))}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-[#4A584D]">
                              <span>Min</span>
                              <span className="text-[#183B2A] font-bold">Modal</span>
                              <span>Max</span>
                            </div>
                          </div>
                        </td>

                        {/* Reported Date */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-mono text-[#183B2A] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#426B43]" />
                            <span>{r.arrivalDate}</span>
                          </div>
                          <div className="text-[10px] font-mono text-[#4A584D]">
                            {isTa ? 'சந்தை வரத்து தேதி' : 'Reported Date'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Small Screens Card View */}
            <div className="block lg:hidden divide-y divide-[#D9DED3]">
              {processedRecords.map((r, idx) => (
                <div key={`m-${r.id}-${idx}`} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-base text-[#183B2A]">
                        {r.commodity} {r.commodityTamil && isTa && `(${r.commodityTamil})`}
                      </div>
                      <div className="text-xs font-mono text-[#4A584D] flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-[#426B43]" />
                        <span className="font-bold text-[#183B2A]">{r.market}</span> ({r.district})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-[#183B2A] text-white px-2.5 py-1 rounded-xs font-bold font-mono text-sm inline-block">
                        ₹{r.modalPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] font-mono text-[#4A584D]">₹/quintal</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#FAF9F3] p-2.5 rounded-xs border border-[#D9DED3]">
                    <div>
                      <span className="text-[#4A584D] block text-[10px] uppercase">{isTa ? 'குறைந்த விலை' : 'Min Price'}</span>
                      <span className="text-[#183B2A] font-bold">₹{r.minPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[#4A584D] block text-[10px] uppercase">{isTa ? 'அதிகபட்ச விலை' : 'Max Price'}</span>
                      <span className="text-[#183B2A] font-bold">₹{r.maxPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[#4A584D] block text-[10px] uppercase">{isTa ? 'ரகம்' : 'Variety'}</span>
                      <span className="text-[#183B2A]">{r.variety || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-[#4A584D] block text-[10px] uppercase">{isTa ? 'வரத்து தேதி' : 'Arrival Date'}</span>
                      <span className="text-[#183B2A]">{r.arrivalDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer Attribution & Disclaimers */}
        <div className="p-4 bg-[#FAF9F3] border-t border-[#D9DED3] text-xs font-sans text-[#4A584D] space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#426B43]" />
              <span>
                {isTa
                  ? 'மூலம்: இந்திய அரசின் திறந்த தரவுத் தளம் (data.gov.in) / AGMARKNET'
                  : 'Source: Open Government Data (OGD) Platform India / AGMARKNET Mandi Feeds'}
              </span>
            </div>
            <div>
              Resource UUID: <code className="text-[#183B2A]">9ef84268-d588-465a-a308-a864a43d0070</code>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed">
            {isTa
              ? 'குறிப்பு: மாதிரி விலை (Modal Price) என்பது அந்த குறிப்பிட்ட தினத்தில் அதிகபட்ச வரத்து நடைபெற்ற விலையைக் குறிக்கும். அனைத்து விலைகளும் 100 கிலோ (1 குவிண்டால்) எடையைக் குறிக்கின்றன. நிதி அல்லது விற்பனை முடிவுகளை எடுப்பதற்கு முன் உள்ளூர் ஒழுங்குமுறை விற்பனைக்கூடத்தை நேரில் தொடர்புகொள்ளவும்.'
              : 'Disclaimer: The Modal Price indicates the prevailing price at which maximum commodity quantities were transacted on that day. Prices are officially quoted in Rupees per quintal (100 kg). Market rates fluctuate with daily arrivals.'}
          </p>
        </div>
      </div>
    </div>
  );
};

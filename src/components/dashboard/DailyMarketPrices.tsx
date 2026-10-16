import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MandiPriceRecord, MarketPricesResponse } from '../../types';
import {
  fetchDailyMandiPrices,
  TN_PRIORITY_COMMODITIES,
  TN_DISTRICT_LIST,
} from '../../services/marketPriceClient';
import {
  OFFICIAL_CROP_SEASON_DATA,
  OFFICIAL_COMMODITY_GROUPS,
  CropSeasonPriceRecord,
} from '../../services/marketSeasonData';
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
  Store,
  BarChart3,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  Navigation,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  matchMarketCoordinates,
  calculateHaversineDistanceKm,
  generateGoogleMapsDirectionsUrl,
} from '../../services/nearbyServicesDirectory';
import { TN_DISTRICT_GEODATA } from '../../config/tamilNaduDistricts';
import { motion, AnimatePresence } from 'motion/react';
import {
  tabContentVariants,
  buttonHoverTap,
  chipHoverTap,
  cardHoverTap,
} from '../../lib/motion';

interface DailyMarketPricesProps {
  activeDistrict?: string;
}

export const DailyMarketPrices: React.FC<DailyMarketPricesProps> = ({
  activeDistrict,
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  // Active Main Tab: 'season' (Crop Season Wise Price & Arrival) vs 'market' (Market Wise Price & Arrival)
  const [activePortalTab, setActivePortalTab] = useState<'season' | 'market'>('season');

  // Filter States matching the portal controls
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(activeDistrict || 'all');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedCommodityGroup, setSelectedCommodityGroup] = useState<string>('all');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('all');
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('FAQ');
  const [selectedYear, setSelectedYear] = useState<string>('2026-27');

  // Search Inputs
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination States
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Live AGMARKNET Data & Request State (for Market Wise Price & Arrival)
  const [loading, setLoading] = useState<boolean>(false);
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

  // Load Live Mandi Prices from AGMARKNET endpoint
  const loadPrices = async () => {
    setLoading(true);
    try {
      const res = await fetchDailyMandiPrices({
        state: selectedState !== 'all' ? selectedState : 'Tamil Nadu',
        district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        commodity: selectedCommodity !== 'all' ? selectedCommodity : undefined,
        market: selectedMarket !== 'all' ? selectedMarket : undefined,
        limit: 100,
      });
      setResponse(res);
      setLastFetchedTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
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

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    loadPrices();
  };

  const handleResetFilters = () => {
    setSelectedState('All States/UT');
    setSelectedDistrict('all');
    setSelectedMarket('all');
    setSelectedCommodityGroup('all');
    setSelectedCommodity('all');
    setSelectedVariety('all');
    setSelectedGrade('FAQ');
    setSelectedYear('2026-27');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // 1. Processed Data for Tab 2: Crop Season Wise Price & Arrival
  const filteredSeasonRecords = useMemo(() => {
    return OFFICIAL_CROP_SEASON_DATA.filter((item) => {
      // Commodity Group filter
      if (selectedCommodityGroup !== 'all' && item.commodityGroup !== selectedCommodityGroup) {
        return false;
      }
      // Commodity filter
      if (selectedCommodity !== 'all' && !item.commodity.toLowerCase().includes(selectedCommodity.toLowerCase())) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.commodity.toLowerCase().includes(q);
        const matchGroup = item.commodityGroup.toLowerCase().includes(q);
        const matchTa = item.commodityTa.toLowerCase().includes(q);
        if (!matchName && !matchGroup && !matchTa) return false;
      }
      return true;
    });
  }, [selectedCommodityGroup, selectedCommodity, searchQuery]);

  // 2. Processed Data for Tab 1: Market Wise Price & Arrival
  const processedMarketRecords = useMemo(() => {
    if (!response || !response.records) return [];

    let list = [...response.records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.market.toLowerCase().includes(q) ||
          r.commodity.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          (r.variety && r.variety.toLowerCase().includes(q))
      );
    }

    // Resolve origin coordinates from activeDistrict or selectedDistrict for distance calculation
    const originDistrictKey = activeDistrict || (selectedDistrict !== 'all' ? selectedDistrict : undefined);
    const originGeo =
      originDistrictKey && TN_DISTRICT_GEODATA[originDistrictKey]
        ? { lat: TN_DISTRICT_GEODATA[originDistrictKey].lat, lng: TN_DISTRICT_GEODATA[originDistrictKey].lng }
        : null;

    return list.map((r) => {
      const geo = matchMarketCoordinates(r.market, r.district, r.state);
      let distanceKm: number | undefined;
      let directionsUrl: string | undefined;

      if (geo && originGeo) {
        distanceKm = calculateHaversineDistanceKm(originGeo.lat, originGeo.lng, geo.latitude, geo.longitude);
        directionsUrl = generateGoogleMapsDirectionsUrl(originGeo.lat, originGeo.lng, geo.latitude, geo.longitude, geo.marketName);
      }

      return {
        ...r,
        hasCoordinates: Boolean(geo),
        distanceKm,
        directionsUrl,
      };
    });
  }, [response, searchQuery, activeDistrict, selectedDistrict]);

  // Paginated Data
  const activeRecordsCount =
    activePortalTab === 'season' ? filteredSeasonRecords.length : processedMarketRecords.length;

  const totalPages = Math.max(1, Math.ceil(activeRecordsCount / rowsPerPage));

  const paginatedSeasonRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredSeasonRecords.slice(start, start + rowsPerPage);
  }, [filteredSeasonRecords, currentPage, rowsPerPage]);

  const paginatedMarketRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedMarketRecords.slice(start, start + rowsPerPage);
  }, [processedMarketRecords, currentPage, rowsPerPage]);

  // Export current table to CSV
  const handleExportCSV = () => {
    if (activePortalTab === 'season') {
      const headers = [
        'Commodity Group',
        'Commodity',
        'MSP (Rs./Quintal) 2026-27',
        'Kharif Price (Rs./Quintal)',
        'Kharif Arrival (Metric Tonnes)',
        'Rabi Price (Rs./Quintal)',
        'Rabi Arrival (Metric Tonnes)',
      ];
      const rows = filteredSeasonRecords.map((r) => [
        `"${r.commodityGroup}"`,
        `"${r.commodity}"`,
        r.mspRate > 0 ? r.mspRate.toFixed(2) : '-',
        r.kharifPrice ? r.kharifPrice.toFixed(2) : '-',
        r.kharifArrival ? r.kharifArrival.toFixed(2) : '-',
        r.rabiPrice ? r.rabiPrice.toFixed(2) : '-',
        r.rabiArrival ? r.rabiArrival.toFixed(2) : '-',
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `CropShield_Crop_Season_Prices_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['State', 'District', 'Market', 'Commodity', 'Variety', 'Arrival Date', 'Min Price', 'Modal Price', 'Max Price'];
      const rows = processedMarketRecords.map((r) => [
        `"${r.state}"`,
        `"${r.district}"`,
        `"${r.market}"`,
        `"${r.commodity}"`,
        `"${r.variety || 'FAQ'}"`,
        `"${r.arrivalDate}"`,
        r.minPrice,
        r.modalPrice,
        r.maxPrice,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `CropShield_Market_Wise_Prices_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-[#DCE4D9] rounded-sm shadow-xs overflow-hidden font-sans">
      {/* 1. TOP DUAL TABS (Matching the AGMARKNET Portal Design) */}
      <div className="flex border-b border-[#08698c]/30 bg-white">
        {/* Tab 1: Market Wise Price & Arrival */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            setActivePortalTab('market');
            setCurrentPage(1);
          }}
          className={`flex-1 py-3 px-4 text-center cursor-pointer transition-all border-r border-[#DCE4D9] relative ${
            activePortalTab === 'market'
              ? 'bg-white shadow-xs'
              : 'bg-[#F9FBFC] text-[#556976] hover:bg-[#F0F5F8]'
          }`}
        >
          {activePortalTab === 'market' && (
            <motion.div
              layoutId="activeMarketTabPill"
              className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#08698c]"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            />
          )}
          <div
            className={`text-sm sm:text-base font-semibold ${
              activePortalTab === 'market' ? 'text-[#08698c]' : 'text-[#445566]'
            }`}
          >
            {isTa ? 'சந்தை வாரியாக விலை & வரத்து' : 'Market Wise Price & Arrival'}
          </div>
          <div className="text-[11px] text-[#718176] font-normal mt-0.5">
            (MSP Commodities & Tomato, Onion, Potato)
          </div>
        </motion.button>

        {/* Tab 2: Crop Season Wise Price & Arrival */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            setActivePortalTab('season');
            setCurrentPage(1);
          }}
          className={`flex-1 py-3 px-4 text-center cursor-pointer transition-all relative ${
            activePortalTab === 'season'
              ? 'bg-white shadow-xs'
              : 'bg-[#F9FBFC] text-[#556976] hover:bg-[#F0F5F8]'
          }`}
        >
          {activePortalTab === 'season' && (
            <motion.div
              layoutId="activeMarketTabPill"
              className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#08698c]"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            />
          )}
          <div
            className={`text-sm sm:text-base font-semibold ${
              activePortalTab === 'season' ? 'text-[#08698c]' : 'text-[#445566]'
            }`}
          >
            {isTa ? 'பயிர் பருவம் வாரியாக விலை & வரத்து' : 'Crop Season Wise Price & Arrival'}
          </div>
          <div className="text-[11px] text-[#718176] font-normal mt-0.5">
            (MSP Commodities)
          </div>
        </motion.button>
      </div>

      {/* 2. FILTER SELECTION STRIP (Exact Layout from Portal Screenshot) */}
      <div className="bg-[#FAFBFD] p-3 border-b border-[#E2E8F0]">
        <div className="flex flex-wrap items-end gap-2 text-xs">
          {/* State / UT */}
          <div className="min-w-[130px] flex-1">
            <label className="block text-[10px] text-[#64748B] mb-0.5">State/UT</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#1E293B] focus:border-[#08698c] focus:outline-hidden"
            >
              <option value="All States/UT">All States/UT</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Kerala">Kerala</option>
              <option value="Telangana">Telangana</option>
              <option value="Puducherry">Puducherry</option>
            </select>
          </div>

          {/* District */}
          <div className="min-w-[110px] flex-1">
            <label className="block text-[10px] text-[#64748B] mb-0.5">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#1E293B] focus:border-[#08698c] focus:outline-hidden"
            >
              <option value="all">All Districts</option>
              {TN_DISTRICT_LIST.map((d) => (
                <option key={d.en} value={d.en}>
                  {d.en}
                </option>
              ))}
            </select>
          </div>

          {/* Market */}
          <div className="min-w-[110px] flex-1">
            <label className="block text-[10px] text-[#64748B] mb-0.5">Market</label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#1E293B] focus:border-[#08698c] focus:outline-hidden"
            >
              <option value="all">All Markets</option>
              <option value="Thanjavur">Thanjavur</option>
              <option value="Karur">Karur</option>
              <option value="Madurai">Madurai</option>
              <option value="Tiruchirappalli">Tiruchirappalli</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Tiruppur">Tiruppur</option>
              <option value="Salem">Salem</option>
              <option value="Erode">Erode</option>
              <option value="Dindigul">Dindigul</option>
            </select>
          </div>

          {/* Commodity Group */}
          <div className="min-w-[140px] flex-1">
            <label className="block text-[10px] text-[#64748B] mb-0.5">Commodity Group</label>
            <select
              value={selectedCommodityGroup}
              onChange={(e) => setSelectedCommodityGroup(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#1E293B] focus:border-[#08698c] focus:outline-hidden truncate"
            >
              {OFFICIAL_COMMODITY_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.en}
                </option>
              ))}
            </select>
          </div>

          {/* Commodity */}
          <div className="min-w-[140px] flex-1">
            <label className="block text-[10px] text-[#64748B] mb-0.5">Commodity</label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#1E293B] focus:border-[#08698c] focus:outline-hidden truncate"
            >
              <option value="all">All Commodities</option>
              <option value="Bajra">Bajra (Pearl Millet / Cumbu)</option>
              <option value="Barley">Barley (Jau)</option>
              <option value="Jowar">Jowar (Sorghum)</option>
              <option value="Maize">Maize</option>
              <option value="Paddy">Paddy (Common)</option>
              <option value="Ragi">Ragi (Finger Millet)</option>
              <option value="Wheat">Wheat</option>
              <option value="Cotton">Cotton</option>
              <option value="Jute">Jute</option>
              <option value="Copra">Copra</option>
              <option value="Gram">Gram (Chana)</option>
              <option value="Tur">Tur / Arhar</option>
              <option value="Groundnut">Groundnut</option>
              <option value="Soyabean">Soyabean</option>
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
              <option value="Potato">Potato</option>
            </select>
          </div>

          {/* Variety */}
          <div className="min-w-[95px] flex-1">
            <label className="block text-[10px] text-[#64748B] mb-0.5">Variety</label>
            <select
              value={selectedVariety}
              onChange={(e) => setSelectedVariety(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#1E293B] focus:border-[#08698c] focus:outline-hidden"
            >
              <option value="all">All Varieties</option>
              <option value="Common">Common</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Grade A">Grade A</option>
              <option value="Local">Local</option>
            </select>
          </div>

          {/* Grade */}
          <div className="min-w-[80px] flex-1">
            <label className="block text-[10px] text-[#64748B] mb-0.5">Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#1E293B] focus:border-[#08698c] focus:outline-hidden"
            >
              <option value="FAQ">FAQ</option>
              <option value="Grade A">Grade A</option>
              <option value="Medium">Medium</option>
              <option value="All">All</option>
            </select>
          </div>

          {/* Years */}
          <div className="min-w-[90px] flex-1">
            <label className="block text-[10px] text-[#64748B] mb-0.5">Years</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#1E293B] focus:border-[#08698c] focus:outline-hidden"
            >
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>

          {/* Buttons: Go & Reset */}
          <div className="flex items-center gap-1.5 pt-3">
            <button
              onClick={() => handleApplyFilter()}
              className="bg-[#08698c] hover:bg-[#075673] text-white px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
            >
              <span>➔</span>
              <span>Go</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="bg-[#475569] hover:bg-[#334155] text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 3. SUB-HEADER TOOLBAR (Location Title, Freeze Date & Export Actions) */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-white border-b border-[#E2E8F0]">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
            {selectedState === 'All States/UT'
              ? 'All States/UT'
              : `${selectedState} ${selectedDistrict !== 'all' ? `· ${selectedDistrict}` : '· All Districts'}`}
          </h3>
          <p className="text-[10px] text-[#64748B] mt-0.5">
            Data Freeze Up to {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Print button */}
          <button
            onClick={handlePrint}
            title="Print Table"
            className="p-1.5 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded border border-[#CBD5E1] cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {/* Download CSV button */}
          <button
            onClick={handleExportCSV}
            title="Download CSV"
            className="p-1.5 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded border border-[#CBD5E1] cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. DATA TABLE SECTION */}
      <div className="overflow-x-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePortalTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* VIEW A: Crop Season Wise Price & Arrival (Tab 2) */}
            {activePortalTab === 'season' && (
          <table className="w-full text-xs border-collapse">
            <thead>
              {/* Row 1 Headers */}
              <tr className="bg-[#08698c] text-white font-semibold border-b border-[#075673]">
                <th
                  rowSpan={2}
                  className="py-2.5 px-3 text-left border-r border-[#0c7aa2] font-semibold text-[11px]"
                >
                  Commodity Group
                </th>
                <th
                  rowSpan={2}
                  className="py-2.5 px-3 text-left border-r border-[#0c7aa2] font-semibold text-[11px]"
                >
                  Commodity
                </th>
                <th
                  rowSpan={2}
                  className="py-2.5 px-3 text-right border-r border-[#0c7aa2] font-semibold text-[11px]"
                >
                  MSP (Rs./Quintal) {selectedYear}
                </th>
                <th
                  colSpan={2}
                  className="py-2 px-3 text-center border-r border-[#0c7aa2] font-semibold text-[11px]"
                >
                  Kharif Marketing Season 01 Oct - 30 Sep
                </th>
                <th colSpan={2} className="py-2 px-3 text-center font-semibold text-[11px]">
                  Rabi Marketing Season 01 Apr - 31 Mar
                </th>
              </tr>
              {/* Row 2 Sub-Headers */}
              <tr className="bg-[#08698c] text-white font-medium border-b border-[#075673] text-[10.5px]">
                <th className="py-1.5 px-3 text-right border-r border-[#0c7aa2]">Price (Rs./Quintal)</th>
                <th className="py-1.5 px-3 text-right border-r border-[#0c7aa2]">Arrival (Metric Tonnes)</th>
                <th className="py-1.5 px-3 text-right border-r border-[#0c7aa2]">Price (Rs./Quintal)</th>
                <th className="py-1.5 px-3 text-right">Arrival (Metric Tonnes)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[11px] text-[#1E293B]">
              {paginatedSeasonRecords.length > 0 ? (
                paginatedSeasonRecords.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'} hover:bg-[#F1F5F9] transition-colors`}
                  >
                    {/* Commodity Group */}
                    <td className="py-2 px-3 text-[#334155] border-r border-[#E2E8F0] font-medium">
                      {isTa ? r.commodityGroupTa : r.commodityGroup}
                    </td>

                    {/* Commodity */}
                    <td className="py-2 px-3 text-[#0F172A] border-r border-[#E2E8F0] font-medium">
                      <span>{r.commodity}</span>
                      {isTa && <span className="block text-[10px] text-[#08698c]">{r.commodityTa}</span>}
                    </td>

                    {/* MSP Rate */}
                    <td className="py-2 px-3 text-right font-mono text-[#0F172A] border-r border-[#E2E8F0]">
                      {r.mspRate > 0 ? (
                        <span>
                          {r.mspRate.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">-</span>
                      )}
                    </td>

                    {/* Kharif Price */}
                    <td className="py-2 px-3 text-right font-mono border-r border-[#E2E8F0]">
                      {r.kharifPrice ? (
                        <span className="text-[#08698c] font-semibold">
                          {r.kharifPrice.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">-</span>
                      )}
                    </td>

                    {/* Kharif Arrival */}
                    <td className="py-2 px-3 text-right font-mono border-r border-[#E2E8F0]">
                      {r.kharifArrival ? (
                        <span>
                          {r.kharifArrival.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          {' -'}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">-</span>
                      )}
                    </td>

                    {/* Rabi Price */}
                    <td className="py-2 px-3 text-right font-mono border-r border-[#E2E8F0]">
                      {r.rabiPrice ? (
                        <span className="text-[#08698c] font-semibold">
                          {r.rabiPrice.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">-</span>
                      )}
                    </td>

                    {/* Rabi Arrival */}
                    <td className="py-2 px-3 text-right font-mono">
                      {r.rabiArrival ? (
                        <span>
                          {r.rabiArrival.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B]">
                    No matching crop season records found for the applied filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* VIEW B: Market Wise Price & Arrival (Tab 1) */}
        {activePortalTab === 'market' && (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#08698c] text-white font-semibold border-b border-[#075673] text-[11px]">
                <th className="py-2.5 px-3 text-left border-r border-[#0c7aa2]">State</th>
                <th className="py-2.5 px-3 text-left border-r border-[#0c7aa2]">District</th>
                <th className="py-2.5 px-3 text-left border-r border-[#0c7aa2]">Market (Mandi)</th>
                <th className="py-2.5 px-3 text-left border-r border-[#0c7aa2]">Commodity</th>
                <th className="py-2.5 px-3 text-left border-r border-[#0c7aa2]">Variety / Grade</th>
                <th className="py-2.5 px-3 text-center border-r border-[#0c7aa2]">Arrival Date</th>
                <th className="py-2.5 px-3 text-right border-r border-[#0c7aa2]">Min (₹/Qtl)</th>
                <th className="py-2.5 px-3 text-right border-r border-[#0c7aa2]">Modal (₹/Qtl)</th>
                <th className="py-2.5 px-3 text-right border-r border-[#0c7aa2]">Max (₹/Qtl)</th>
                <th className="py-2.5 px-3 text-left">Distance & Directions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[11px] text-[#1E293B]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#08698c] mb-2" />
                    <span>Synchronizing AGMARKNET Mandi Live Data...</span>
                  </td>
                </tr>
              ) : paginatedMarketRecords.length > 0 ? (
                paginatedMarketRecords.map((r, idx) => (
                  <tr
                    key={`${r.id}-${idx}`}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'} hover:bg-[#F1F5F9] transition-colors`}
                  >
                    <td className="py-2 px-3 border-r border-[#E2E8F0] text-[#334155]">{r.state}</td>
                    <td className="py-2 px-3 border-r border-[#E2E8F0] font-medium text-[#1E293B]">{r.district}</td>
                    <td className="py-2 px-3 border-r border-[#E2E8F0] font-bold text-[#0F172A]">{r.market}</td>
                    <td className="py-2 px-3 border-r border-[#E2E8F0] font-medium text-[#08698c]">{r.commodity}</td>
                    <td className="py-2 px-3 border-r border-[#E2E8F0] text-[#475569]">
                      {r.variety || 'Local / Common'} {r.grade && `(${r.grade})`}
                    </td>
                    <td className="py-2 px-3 border-r border-[#E2E8F0] text-center font-mono text-[#334155]">
                      {r.arrivalDate}
                    </td>
                    <td className="py-2 px-3 border-r border-[#E2E8F0] text-right font-mono text-[#475569]">
                      ₹{r.minPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 border-r border-[#E2E8F0] text-right font-mono font-bold text-[#08698c] bg-[#F0F8FA]">
                      ₹{r.modalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 border-r border-[#E2E8F0] text-right font-mono text-[#475569]">
                      ₹{r.maxPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 text-[10.5px]">
                      {(r as any).distanceKm ? (
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-[#08698c]">📏 {(r as any).distanceKm} km</span>
                          {(r as any).directionsUrl && (
                            <a
                              href={(r as any).directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0284C7] hover:underline font-bold inline-flex items-center gap-0.5"
                            >
                              <span>🚗 Map →</span>
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8]">Mandi in {r.district}</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-[#64748B]">
                    No live mandi arrival records reported for the selected filters today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>
    </AnimatePresence>
  </div>

      {/* 5. PAGINATION FOOTER STRIP (Rows per page & Page numbers matching the screenshot) */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-white border-t border-[#E2E8F0] text-xs text-[#64748B]">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-[#CBD5E1] rounded px-2 py-0.5 text-xs text-[#1E293B] focus:outline-hidden"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-[11px] text-[#94A3B8]">
            Showing {(currentPage - 1) * rowsPerPage + 1} -{' '}
            {Math.min(currentPage * rowsPerPage, activeRecordsCount)} of {activeRecordsCount}
          </span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-6 h-6 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#08698c] text-white shadow-2xs'
                    : 'text-[#475569] hover:bg-[#F1F5F9]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6. OFFICIAL GOVERNMENT LOGO & PARTNER BADGES (Exact Replica of Portal Footer) */}
      <div className="bg-[#FAFBFD] border-t border-[#E2E8F0] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-around gap-4 text-xs font-semibold">
          {/* Digital India */}
          <div className="flex items-center gap-1 text-[#1E293B]">
            <span className="text-[#E65100] font-black text-xs">Digital</span>
            <span className="text-[#0D47A1] font-bold text-xs">India</span>
            <span className="text-[9px] text-[#64748B] font-normal hidden sm:inline">Power To Empower</span>
          </div>

          {/* data.gov.in */}
          <div className="flex items-center gap-1">
            <span className="bg-[#2E7D32] text-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
              data.gov.in
            </span>
            <span className="text-[10px] text-[#2E7D32] hidden sm:inline">Open Data</span>
          </div>

          {/* e-NAM */}
          <div className="flex items-center gap-1 text-[#1565C0]">
            <span className="font-bold text-xs">e-NAM</span>
            <span className="text-[9px] text-[#64748B] hidden sm:inline">National Agriculture Market</span>
          </div>

          {/* india.gov.in */}
          <div className="flex items-center gap-1 text-[#0F172A]">
            <span className="font-bold text-xs">india.gov.in</span>
            <span className="text-[9px] text-[#64748B] hidden sm:inline">National Portal of India</span>
          </div>

          {/* Crop Insurance PMFBY */}
          <div className="flex items-center gap-1 text-[#C2410C]">
            <span className="font-bold text-[11px]">Crop Insurance</span>
            <span className="text-[9px] text-[#64748B] hidden sm:inline">PMFBY</span>
          </div>

          {/* DAC */}
          <div className="bg-[#FBBF24]/20 border border-[#F59E0B] text-[#B45309] px-2 py-0.5 rounded text-[10px] font-bold">
            DAC & FW
          </div>

          {/* TNAU / ICAR */}
          <div className="text-[10px] text-[#1E293B] font-semibold hidden md:inline">
            TNAU · ICAR Verified
          </div>
        </div>
      </div>

      {/* 7. GOVERNMENT PORTAL FOOTER NAV STRIP */}
      <div className="bg-[#08698c] text-white px-4 py-2 flex flex-wrap items-center justify-between text-[11px] gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-[#93C5FD]" />
          <span className="font-semibold">Government of India</span>
          <span className="text-white/60">|</span>
          <span className="hidden sm:inline">Department of Agriculture & Farmers Welfare</span>
          <span className="text-white/60 hidden sm:inline">|</span>
          <span className="text-[#E0F2FE]">Directorate of Marketing & Inspection (DMI)</span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-white/90">
          <a
            href="https://agmarknet.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            USEFUL LINKS
          </a>
          <span>·</span>
          <a
            href="https://data.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            QUICK LINKS
          </a>
          <span>·</span>
          <a
            href="https://enam.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            GOVERNMENT SITES
          </a>
          <span>·</span>
          <a
            href="https://agmarknet.gov.in/ContactUs.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            CONTACT US
          </a>
        </div>
      </div>

      {/* 8. REPORTED PRICE VS NET FARMGATE DISCLAIMER */}
      <div className="p-3 bg-[#FAFBFD] border-t border-[#E2E8F0] text-[10.5px] text-[#64748B] flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-[#08698c] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#0F172A]">Reported Market Price Notice:</strong> Values represent official
          wholesale modal auction rates recorded at regulated agricultural produce market committees (APMC / Mandis)
          and MSP benchmarks issued by the Government of India. Reported wholesale prices do not guarantee net
          farmgate profit due to transit freight, bag handling/unloading charges, market cess, and quality/moisture
          refractions.
        </p>
      </div>
    </div>
  );
};

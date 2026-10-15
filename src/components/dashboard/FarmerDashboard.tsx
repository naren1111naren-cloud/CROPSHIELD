import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AnalysisResult, ScanData, FarmRecord, MandiPriceRecord } from '../../types';
import { DiseaseFinder } from './DiseaseFinder';
import { DistrictRiskRegistry } from './DistrictRiskRegistry';
import { CommunityAlertsView } from './CommunityAlertsView';
import { FarmManagement } from './FarmManagement';
import { ScanDetailModal } from './ScanDetailModal';
import {
  subscribeFarmerScans,
  saveCropScanToFirestore,
  deleteScan,
  uploadCropImage,
} from '../../services/scanService';
import { subscribeFarms } from '../../services/farmService';
import { fetchDailyMandiPrices } from '../../services/marketPriceClient';
import { PersonalizedGuidance } from './PersonalizedGuidance';
import { WeatherSeasonalIntelligence } from './WeatherSeasonalIntelligence';
import { ExpertKnowledgeHub } from './ExpertKnowledgeHub';
import { FieldCaseHub } from './FieldCaseHub';
import { GuidedFieldAssessmentModal } from './GuidedFieldAssessmentModal';
import { DailyMarketPrices } from './DailyMarketPrices';
import { CropShieldLogo } from '../brand/CropShieldLogo';
import { motion, AnimatePresence } from 'motion/react';
import {
  pageVariants,
  sectionVariants,
  staggerContainer,
  itemVariants,
  buttonHoverTap,
  backdropVariants,
  drawerVariants,
  defaultViewport,
} from '../../lib/motion';
import {
  Compass,
  ArrowLeft,
  CheckCircle,
  FileText,
  UserCheck,
  Edit3,
  Calendar,
  MapPin,
  Sprout,
  AlertCircle,
  RefreshCw,
  Camera,
  Layers,
  ChevronRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  BookOpen,
  CloudSun,
  Building2,
  IndianRupee,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ChevronDown,
  User
} from 'lucide-react';

export type DashboardTab =
  | 'overview'
  | 'scan'
  | 'farms'
  | 'history'
  | 'prices'
  | 'guidance'
  | 'risks'
  | 'alerts'
  | 'expert'
  | 'cases';

interface FarmerDashboardProps {
  onBackToHome: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  initialTab?: DashboardTab;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  onBackToHome,
  onOpenProfile,
  onOpenAuth,
  initialTab = 'overview',
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, profile } = useAuth();
  const isTa = language === 'ta';

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Synchronize activeTab when initialTab changes from parent
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [initialScanCropId, setInitialScanCropId] = useState<string>('rice');
  const [enquiryContextForHub, setEnquiryContextForHub] = useState<any>(null);
  const [investigationPreload, setInvestigationPreload] = useState<{
    imagePreview: string;
    cropId: string;
    variety: string;
    farmId?: string;
  } | null>(null);

  // Real-time Firestore state
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [isFarmsLoading, setIsFarmsLoading] = useState<boolean>(true);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [isScansLoading, setIsScansLoading] = useState<boolean>(true);
  const [scansError, setScansError] = useState<string | null>(null);

  // Selected Farm for Scan context
  const [selectedFarm, setSelectedFarm] = useState<FarmRecord | null>(null);

  // Selected Scan for Detail Dossier Modal
  const [selectedScanForDetail, setSelectedScanForDetail] = useState<ScanData | null>(null);

  // Subscribe to real-time Farms
  useEffect(() => {
    if (!user) {
      setFarms([]);
      setIsFarmsLoading(false);
      return;
    }

    setIsFarmsLoading(true);
    const unsubscribe = subscribeFarms(
      user.uid,
      (loadedFarms) => {
        setFarms(loadedFarms);
        setIsFarmsLoading(false);
      },
      (err) => {
        console.error('Error listening to farmer farms:', err);
        setIsFarmsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to real-time Scans from profiles/{uid}/scans
  useEffect(() => {
    if (!user) {
      setScans([]);
      setIsScansLoading(false);
      return;
    }

    setIsScansLoading(true);
    setScansError(null);

    const unsubscribe = subscribeFarmerScans(
      user.uid,
      (loadedScans) => {
        setScans(loadedScans);
        setIsScansLoading(false);
      },
      (err) => {
        console.error('Real-time scans listener error:', err);
        setScansError(
          err.message ||
            (isTa ? 'ஆய்வுப் பதிவுகளை ஏற்றுவதில் பிழை.' : 'Failed to load inspections from Firestore.')
        );
        setIsScansLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isTa]);

  // Primary active farm or first farm
  const primaryFarm = selectedFarm || farms.find((f) => f.isPrimary) || farms[0] || null;

  // Active farm and profile details
  const farmerName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || (isTa ? 'விவசாயி' : 'Farmer');
  const activeDistrict = primaryFarm?.district || profile?.district || 'Thanjavur';
  const activeLocality = primaryFarm?.locality || profile?.locality;
  const activeCrop = primaryFarm?.cropType || profile?.primaryCrop || 'Rice (Paddy)';
  const activeVariety = primaryFarm?.riceVariety || profile?.activeVariety || 'CR 1009 Sub 1 (Samba)';
  const activeStage = primaryFarm?.cropStage || profile?.cropStage;
  const activeAcres = primaryFarm?.landSizeArea ?? primaryFarm?.landSizeAcres ?? profile?.landSizeArea ?? profile?.landSizeAcres;

  // Check if profile or farm is incomplete
  const isProfileIncomplete = !profile?.district || farms.length === 0 || !activeStage;

  // Real-time Market Highlights for Section 5 (Vertical Section System)
  const [mandiHighlights, setMandiHighlights] = useState<MandiPriceRecord[]>([]);
  const [isMandiLoading, setIsMandiLoading] = useState<boolean>(true);
  const [selectedMandiCrop, setSelectedMandiCrop] = useState<string>('Paddy');

  useEffect(() => {
    let isMounted = true;
    const loadMandiHighlights = async () => {
      setIsMandiLoading(true);
      try {
        const res = await fetchDailyMandiPrices({
          state: 'Tamil Nadu',
          district: activeDistrict && activeDistrict !== 'all' ? activeDistrict : undefined,
          commodity: selectedMandiCrop,
          limit: 3,
        });
        if (isMounted) {
          if (res.records && res.records.length > 0) {
            setMandiHighlights(res.records);
          } else {
            // Fallback across Tamil Nadu if current district had no reports for commodity today
            const fallbackRes = await fetchDailyMandiPrices({
              state: 'Tamil Nadu',
              commodity: selectedMandiCrop,
              limit: 3,
            });
            if (isMounted) {
              setMandiHighlights(fallbackRes.records || []);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load mandi overview highlights:', err);
      } finally {
        if (isMounted) setIsMandiLoading(false);
      }
    };
    loadMandiHighlights();
    return () => {
      isMounted = false;
    };
  }, [activeDistrict, selectedMandiCrop]);

  // Save scan to Firestore subcollection (and upload image to Firebase Storage if file present)
  const handleSaveToLog = async (
    result: AnalysisResult,
    imagePreview: string,
    file?: File | null,
    farmId?: string
  ) => {
    if (!user) {
      if (onOpenAuth) {
        onOpenAuth('signin');
      }
      return;
    }
    try {
      let finalImagePath = imagePreview;
      if (file) {
        try {
          const uploadRes = await uploadCropImage(user.uid, file);
          if (uploadRes && uploadRes.downloadUrl) {
            finalImagePath = uploadRes.downloadUrl;
          }
        } catch (uploadErr) {
          console.warn('Storage upload fallback to preview dataUrl:', uploadErr);
        }
      }

      const targetFarmId = farmId || primaryFarm?.id;
      const associatedFarm = farms.find((f) => f.id === targetFarmId) || primaryFarm;

      await saveCropScanToFirestore(
        user.uid,
        result,
        finalImagePath,
        result.cropId ? `${result.cropName} (${associatedFarm?.riceVariety || activeVariety})` : activeVariety,
        associatedFarm?.district || activeDistrict,
        targetFarmId
      );
    } catch (err) {
      console.error('Failed to persist scan to Firestore:', err);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!user) return;
    try {
      await deleteScan(user.uid, scanId);
    } catch (err) {
      console.error('Failed to delete scan record:', err);
    }
  };

  const handleLaunchScanForFarm = (farm: FarmRecord) => {
    setSelectedFarm(farm);
    const lowerCrop = (farm.cropType || '').toLowerCase();
    if (lowerCrop.includes('tomato')) setInitialScanCropId('tomato');
    else if (lowerCrop.includes('chilli')) setInitialScanCropId('chilli');
    else if (lowerCrop.includes('cotton')) setInitialScanCropId('cotton');
    else if (lowerCrop.includes('maize')) setInitialScanCropId('maize');
    else setInitialScanCropId('rice');

    setActiveTab('scan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Section title mapping
  const getSectionTitle = () => {
    switch (activeTab) {
      case 'overview':
        return isTa ? 'கண்ணோட்டம்' : 'Platform Overview';
      case 'scan':
        return isTa ? 'பயிர் ஆய்வு' : 'Crop Diagnosis';
      case 'farms':
        return isTa ? 'என் பண்ணைகள்' : 'My Farms';
      case 'history':
        return isTa ? 'ஆய்வு வரலாறு' : 'Scan History';
      case 'prices':
        return isTa ? 'சந்தை விலைகள்' : 'Market Prices';
      case 'guidance':
        return isTa ? 'பயிர் வழிகாட்டல்' : 'Farming Guidance';
      case 'risks':
        return isTa ? 'வானிலை & பருவங்கள்' : 'Weather & Seasons';
      case 'alerts':
        return isTa ? 'சமூக எச்சரிக்கைகள்' : 'District Alerts';
      case 'expert':
        return isTa ? 'வல்லுநர் & அறிவு மையம்' : 'Expert Knowledge Hub';
      case 'cases':
        return isTa ? 'கள ஆய்வு வழக்குகள்' : 'Field Case Hub';
      default:
        return 'Overview';
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F3E9] text-[#17271E] antialiased">
      {/* ========================================================
          1. DESKTOP APPLICATION SIDEBAR (Dark Forest #0B211A)
          ======================================================== */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-70 bg-[#0B211A] text-[#F5F7F1] border-r border-[#1F6B4A]/25 shrink-0 sticky top-0 h-screen select-none z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex flex-col gap-2.5">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 cursor-pointer text-left focus-visible:outline-hidden"
            title="Return to Public Website"
          >
            <CropShieldLogo variant="light" size="sm" />
          </button>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#B8DCC1] uppercase tracking-wider pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#70B77E] animate-pulse" />
              <span>{activeDistrict}</span>
            </span>
            <span className="text-white/40">CADASTRE</span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Group 1: Core Navigation Labels */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#70B77E]/80 px-3 mb-2 font-semibold">
              {isTa ? 'முதன்மை பணியகம்' : 'WORKSPACE'}
            </div>
            <nav className="space-y-1">
              {/* 1. Overview */}
              <button
                onClick={() => switchTab('overview')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#1F6B4A] text-white shadow-xs font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                  <span>{t('navOverview')}</span>
                </div>
              </button>

              {/* 2. Crop Diagnosis */}
              <button
                onClick={() => switchTab('scan')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer ${
                  activeTab === 'scan'
                    ? 'bg-[#1F6B4A] text-white shadow-xs font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Camera className="w-4.5 h-4.5 shrink-0 text-[#70B77E]" />
                  <span>{t('navCropDiagnosis')}</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-[#1F6B4A]/60 text-white">
                  AI
                </span>
              </button>

              {/* 3. My Farms */}
              <button
                onClick={() => switchTab('farms')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer ${
                  activeTab === 'farms'
                    ? 'bg-[#1F6B4A] text-white shadow-xs font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4.5 h-4.5 shrink-0" />
                  <span>{t('navMyFarm')}</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold">
                  {farms.length}
                </span>
              </button>

              {/* 4. Scan History */}
              <button
                onClick={() => switchTab('history')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-[#1F6B4A] text-white shadow-xs font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4.5 h-4.5 shrink-0" />
                  <span>{t('navScanHistory')}</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold">
                  {scans.length}
                </span>
              </button>

              {/* 5. Market Prices */}
              <button
                onClick={() => switchTab('prices')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer ${
                  activeTab === 'prices'
                    ? 'bg-[#1F6B4A] text-white shadow-xs font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IndianRupee className="w-4.5 h-4.5 shrink-0 text-[#D7AD63]" />
                  <span>{t('navMarketWeather')}</span>
                </div>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-[4px] bg-[#D7AD63]/20 text-[#D7AD63] font-semibold">
                  LIVE
                </span>
              </button>

              {/* 6. Farming Guidance */}
              <button
                onClick={() => switchTab('guidance')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer ${
                  activeTab === 'guidance'
                    ? 'bg-[#1F6B4A] text-white shadow-xs font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4.5 h-4.5 shrink-0" />
                  <span>{t('navFarmingGuidance')}</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Group 2: Agricultural Intelligence Tools */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#70B77E]/80 px-3 mb-2 font-semibold">
              {isTa ? 'வேளாண் நுண்ணறிவு' : 'AGRI-INTELLIGENCE'}
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => switchTab('risks')}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors cursor-pointer ${
                  activeTab === 'risks'
                    ? 'bg-[#1F6B4A] text-white font-semibold'
                    : 'text-[#F5F7F1]/75 hover:text-white hover:bg-white/5'
                }`}
              >
                <CloudSun className="w-4 h-4 shrink-0 text-[#B8DCC1]" />
                <span>{isTa ? 'வானிலை & பருவங்கள்' : 'Weather & Seasons'}</span>
              </button>

              <button
                onClick={() => switchTab('alerts')}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors cursor-pointer ${
                  activeTab === 'alerts'
                    ? 'bg-[#1F6B4A] text-white font-semibold'
                    : 'text-[#F5F7F1]/75 hover:text-white hover:bg-white/5'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#D7AD63]" />
                <span>{isTa ? 'மாவட்ட எச்சரிக்கைகள்' : 'District Alerts'}</span>
              </button>

              <button
                onClick={() => switchTab('expert')}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors cursor-pointer ${
                  activeTab === 'expert'
                    ? 'bg-[#1F6B4A] text-white font-semibold'
                    : 'text-[#F5F7F1]/75 hover:text-white hover:bg-white/5'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0 text-[#70B77E]" />
                <span>{isTa ? 'வல்லுநர் மையம்' : 'Expert Knowledge'}</span>
              </button>

              <button
                onClick={() => switchTab('cases')}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors cursor-pointer ${
                  activeTab === 'cases'
                    ? 'bg-[#1F6B4A] text-white font-semibold'
                    : 'text-[#F5F7F1]/75 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>{isTa ? 'கள ஆய்வு வழக்குகள்' : 'Field Case Hub'}</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Settings, Profile, Return */}
        <div className="p-3 border-t border-white/10 space-y-1 bg-[#081813]">
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] text-[#F5F7F1]/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>{t('navSettings')}</span>
            </button>
          )}

          <button
            onClick={onBackToHome}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] text-[#F5F7F1]/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-[#70B77E]" />
            <span>{isTa ? 'முகப்புக்குச் செல்' : 'Exit to Website'}</span>
          </button>

          {/* Farmer Account Badge */}
          <div className="pt-2 px-3 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1F6B4A] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {(farmerName || 'F')[0].toUpperCase()}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-medium text-white truncate">{farmerName}</div>
              <div className="text-[11px] text-[#B8DCC1]/70 truncate font-mono">{activeDistrict}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================
          2. MOBILE DRAWER NAVIGATION (Framer Motion Drawer)
          ======================================================== */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-[#0B211A]/70 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative flex flex-col w-72 bg-[#0B211A] text-[#F5F7F1] h-full z-10 shadow-2xl"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <CropShieldLogo variant="light" size="sm" />
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 text-white/80 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px]"
                  aria-label="Close Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                <div className="space-y-1">
                  <button
                    onClick={() => switchTab('overview')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-[14px] cursor-pointer transition-colors ${
                      activeTab === 'overview' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5" />
                    <span>{t('navOverview')}</span>
                  </button>
                  <button
                    onClick={() => switchTab('scan')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-[14px] cursor-pointer transition-colors ${
                      activeTab === 'scan' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <Camera className="w-4.5 h-4.5 text-[#70B77E]" />
                    <span>{t('navCropDiagnosis')}</span>
                  </button>
                  <button
                    onClick={() => switchTab('farms')}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[10px] text-[14px] cursor-pointer transition-colors ${
                      activeTab === 'farms' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4.5 h-4.5" />
                      <span>{t('navMyFarm')}</span>
                    </div>
                    <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full">
                      {farms.length}
                    </span>
                  </button>
                  <button
                    onClick={() => switchTab('history')}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[10px] text-[14px] cursor-pointer transition-colors ${
                      activeTab === 'history' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4.5 h-4.5" />
                      <span>{t('navScanHistory')}</span>
                    </div>
                    <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full">
                      {scans.length}
                    </span>
                  </button>
                  <button
                    onClick={() => switchTab('prices')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-[14px] cursor-pointer transition-colors ${
                      activeTab === 'prices' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <IndianRupee className="w-4.5 h-4.5 text-[#D7AD63]" />
                    <span>{t('navMarketWeather')}</span>
                  </button>
                  <button
                    onClick={() => switchTab('guidance')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-[14px] cursor-pointer transition-colors ${
                      activeTab === 'guidance' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <BookOpen className="w-4.5 h-4.5" />
                    <span>{t('navFarmingGuidance')}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-1">
                  <button
                    onClick={() => switchTab('risks')}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] text-white/75 hover:text-white hover:bg-white/5 rounded-[8px]"
                  >
                    <CloudSun className="w-4 h-4 text-[#B8DCC1]" />
                    <span>{isTa ? 'வானிலை & பருவங்கள்' : 'Weather & Seasons'}</span>
                  </button>
                  <button
                    onClick={() => switchTab('alerts')}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] text-white/75 hover:text-white hover:bg-white/5 rounded-[8px]"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#D7AD63]" />
                    <span>{isTa ? 'மாவட்ட எச்சரிக்கைகள்' : 'District Alerts'}</span>
                  </button>
                  <button
                    onClick={() => switchTab('expert')}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] text-white/75 hover:text-white hover:bg-white/5 rounded-[8px]"
                  >
                    <Building2 className="w-4 h-4 text-[#70B77E]" />
                    <span>{isTa ? 'வல்லுநர் மையம்' : 'Expert Knowledge'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 space-y-2 bg-[#081813]">
                <button
                  onClick={onBackToHome}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#B8DCC1] hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isTa ? 'முகப்புக்குச் செல்' : 'Exit to Website'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          3. MAIN CONTENT WORKSPACE AREA
          ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Compact Application Top Bar */}
        <header className="sticky top-0 z-20 bg-[#F5F3E9]/95 backdrop-blur-md border-b border-[#DCE4D9] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#17271E] hover:text-[#1F6B4A] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px]"
              aria-label="Open Workspace Navigation"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B211A] tracking-tight flex items-center gap-2">
                <span>{getSectionTitle()}</span>
                {activeTab !== 'overview' && (
                  <span className="hidden sm:inline-block text-xs font-mono font-medium text-[#718176] bg-[#EAEFE5] px-2 py-0.5 rounded-[5px]">
                    {activeDistrict}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Right Top Bar Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action: Diagnose Foliage (if not on scan) */}
            {activeTab !== 'scan' && (
              <button
                onClick={() => switchTab('scan')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1F6B4A] hover:bg-[#165439] rounded-[9px] shadow-xs cursor-pointer transition-all min-h-[38px]"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isTa ? 'ஆய்வு செய்' : 'Diagnose'}</span>
              </button>
            )}

            {/* Bilingual Switcher: English | தமிழ் */}
            <div
              className="flex items-center bg-white border border-[#DCE4D9] rounded-[8px] p-0.5 text-xs font-medium shadow-xs"
              role="group"
              aria-label="Language selection"
            >
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 transition-colors cursor-pointer rounded-[6px] ${
                  language === 'en'
                    ? 'bg-[#1F6B4A] text-white font-semibold'
                    : 'text-[#52665A] hover:text-[#17271E]'
                }`}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
              <span className="text-[#DCE4D9] select-none px-0.5">|</span>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1 transition-colors cursor-pointer rounded-[6px] ${
                  language === 'ta'
                    ? 'bg-[#1F6B4A] text-white font-semibold'
                    : 'text-[#52665A] hover:text-[#17271E]'
                }`}
                aria-pressed={language === 'ta'}
              >
                தமிழ்
              </button>
            </div>

            {/* Farmer Profile / Sign in */}
            {user ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 text-[#17271E] hover:bg-[#EAEFE5] rounded-full cursor-pointer transition-colors"
                title="Edit Farmer Profile"
                aria-label="Farmer Profile"
              >
                <div className="w-8 h-8 rounded-full bg-[#1F6B4A] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {(farmerName || 'F')[0].toUpperCase()}
                </div>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth?.('signin')}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#1F6B4A] bg-white border border-[#DCE4D9] hover:bg-[#EAEFE5] rounded-[9px] cursor-pointer min-h-[38px]"
              >
                {t('navSignIn')}
              </button>
            )}
          </div>
        </header>

        {/* Main Content Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* ========================================================
              TAB: OVERVIEW (Calm Agricultural Intelligence Workspace)
              ======================================================== */}
          {/* ========================================================
              TAB: OVERVIEW (Forest Intelligence Vertical Section System)
              ======================================================== */}
          {activeTab === 'overview' && (
            <motion.div
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-10 min-w-0"
            >
              {/* SECTION 1: Welcome Heading and Concise Introduction */}
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={defaultViewport}
                className="space-y-4 min-w-0"
              >
                <div className="bg-white border border-[#DCE4D9] p-6 lg:p-8 rounded-[16px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 min-w-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#1F6B4A] uppercase tracking-wider font-semibold">
                      <Compass className="w-4 h-4 text-[#1F6B4A]" />
                      <span>{isTa ? 'வேளாண் புல நுண்ணறிவு' : 'AGRICULTURAL INTELLIGENCE WORKSPACE'}</span>
                      <span>·</span>
                      <span className="text-[#52665A]">{activeDistrict.toUpperCase()} BASIN</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-['Manrope'] text-[#0B211A] tracking-tight">
                      {isTa ? `வணக்கம், ${farmerName}` : `Vanakkam, ${farmerName}`}
                    </h2>

                    <p className="text-sm sm:text-base text-[#52665A] font-sans max-w-2xl leading-relaxed">
                      {isTa
                        ? `${activeDistrict} மாவட்டத்தில் ${activeVariety} பயிருக்கான தற்போதைய கள மேலாண்மை மற்றும் நோய் ஆய்வு பணியகம்.`
                        : `Active cadastral intelligence for ${activeVariety} in ${activeDistrict} District. Real-time vision pathology and verified TNAU crop care.`}
                    </p>
                  </div>

                  {/* Primary Farm Quick Status Pill */}
                  <div className="bg-[#FAF9F3] border border-[#DCE4D9] p-4 rounded-[12px] min-w-[260px] space-y-1 self-start md:self-auto shrink-0">
                    <div className="text-[11px] font-mono uppercase text-[#718176] font-semibold flex items-center justify-between">
                      <span>{primaryFarm ? primaryFarm.farmName : (isTa ? 'முதன்மை பயிர்' : 'Primary Parcel')}</span>
                      <Sprout className="w-4 h-4 text-[#1F6B4A]" />
                    </div>
                    <div className="text-[15px] font-bold text-[#102D24] font-['Plus_Jakarta_Sans']">
                      {activeVariety}
                    </div>
                    <div className="text-xs text-[#1F6B4A] font-semibold font-mono">
                      {activeAcres ? `${activeAcres} ACRES · ` : ''}
                      {activeStage || (isTa ? 'வளர்ச்சிப் பருவம்' : 'Tillering Stage')}
                    </div>
                    {farms.length > 1 && (
                      <button
                        onClick={() => switchTab('farms')}
                        className="text-[11px] text-[#1F6B4A] hover:underline cursor-pointer pt-1 block"
                      >
                        {isTa ? `அனைத்து ${farms.length} பண்ணைகளையும் காண்க` : `View all ${farms.length} parcels →`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Incomplete Profile Advisory Banner (if applicable) */}
                {isProfileIncomplete && (
                  <div className="p-4 bg-[#FAF9F3] border-l-4 border-[#D7AD63] border-y border-r border-[#DCE4D9] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#A96616] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-[#102D24]">
                          {isTa ? 'உங்கள் பண்ணைப் பதிவை முழுமையாக்குங்கள்' : 'Complete Your Farm Plot Registration'}
                        </h4>
                        <p className="text-xs text-[#52665A] font-sans mt-0.5">
                          {farms.length === 0
                            ? (isTa ? 'துல்லியமான நோய் எச்சரிக்கைகளைப் பெற உங்கள் முதல் வயலைச் சேர்க்கவும்.' : 'Register your first farm plot to connect field scans and phenology-calibrated advisory.')
                            : (isTa ? 'பயிர் வளர்ச்சிப் பருவத்தைப் பதிவு செய்யவும்.' : 'Record your current crop stage to align with fungal infection windows.')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => (farms.length === 0 ? switchTab('farms') : onOpenProfile?.())}
                      className="btn-primary text-xs py-2 px-4 shrink-0 self-start sm:self-auto"
                    >
                      {farms.length === 0
                        ? (isTa ? 'பண்ணையைச் சேர்' : 'Register Farm Plot')
                        : (isTa ? 'சுயவிவரம் நிரப்புக' : 'Complete Details')}
                    </button>
                  </div>
                )}
              </motion.section>

              {/* SECTION 2: Signature Primary Crop Diagnosis Action Card */}
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={defaultViewport}
                className="bg-[#102D24] text-[#F5F7F1] rounded-[16px] p-6 sm:p-8 lg:p-10 border border-[#1F6B4A]/30 relative overflow-hidden shadow-md min-w-0"
              >
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-[#B8DCC1] font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-[#70B77E]" />
                    <span>{isTa ? 'முதன்மையான பயிர் ஆய்வு சேவை' : 'SIGNATURE VISION PATHOLOGY'}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold font-['Manrope'] text-white tracking-tight leading-tight">
                    {isTa ? 'பயிர் இலையைப் படம் பிடித்து நோயைக் கண்டறியவும்' : 'Protect Every Crop: Diagnose Foliage in Seconds'}
                  </h3>

                  <p className="text-sm sm:text-base text-[#F5F7F1]/85 font-sans leading-relaxed">
                    {isTa
                      ? 'பாதிக்கப்பட்ட இலை அல்லது தண்டை இயற்கை வெளிச்சத்தில் தெளிவாகப் படம் பிடிக்கவும். செயற்கை நுண்ணறிவு நோயியல் அடையாளங்கள் மற்றும் TNAU வழிகாட்டல்களை உடனே வழங்கும்.'
                      : 'Upload a clear photograph of an affected crop leaf blade or sheath. The AI model analyzes lesion patterns, spot margins, and symptoms against validated botanical standards.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <motion.button
                      {...buttonHoverTap}
                      onClick={() => switchTab('scan')}
                      className="px-6 py-3.5 min-h-[46px] text-sm font-semibold text-[#0B211A] bg-[#70B77E] hover:bg-[#85c992] transition-colors rounded-[11px] flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Camera className="w-4.5 h-4.5" />
                      <span>{isTa ? 'புதிய பயிர் ஆய்வு தொடங்கு' : 'Start New Crop Diagnosis'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      {...buttonHoverTap}
                      onClick={() => switchTab('guidance')}
                      className="px-5 py-3.5 min-h-[46px] text-sm font-medium text-white border border-white/20 hover:bg-white/10 transition-colors rounded-[11px] cursor-pointer"
                    >
                      {isTa ? 'பயிர் பராமரிப்பு வழிகாட்டல்' : 'Explore TNAU Protocols'}
                    </motion.button>
                  </div>
                </div>

                {/* Subtle Organic Leaf Motif */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
                  <Camera className="w-80 h-80 text-[#70B77E]" />
                </div>
              </motion.section>

              {/* SECTION 3: Crop Health & Cultivation Metrics Overview */}
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={defaultViewport}
                className="space-y-3 min-w-0"
              >
                <div className="flex items-center justify-between border-b border-[#DCE4D9] pb-2">
                  <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] text-[#102D24] flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-[#1F6B4A]" />
                    <span>{isTa ? 'பயிர் சுகாதாரம் & கள மேலோட்டம்' : 'Crop Health & Cultivation Overview'}</span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#718176]">
                    {isTa ? 'நிகழ்நேர தரவு' : 'VERIFIED FIRESTORE METRICS'}
                  </span>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={defaultViewport}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0"
                >
                  {/* Metric 1: Registered Farms */}
                  <motion.div variants={itemVariants} className="surface-card p-5 space-y-2">
                    <div className="text-xs font-mono text-[#718176] uppercase tracking-wider flex items-center justify-between font-medium">
                      <span>{isTa ? 'பதிவு செய்யப்பட்ட பண்ணைகள்' : 'REGISTERED FARMS'}</span>
                      <Layers className="w-4 h-4 text-[#1F6B4A]" />
                    </div>
                    <div className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#102D24]">
                      {farms.length}
                    </div>
                    <div className="text-xs text-[#52665A] font-sans flex items-center justify-between">
                      <span>{primaryFarm ? `${primaryFarm.farmName}` : (isTa ? 'பண்ணை இல்லை' : 'No parcels yet')}</span>
                      <button
                        onClick={() => switchTab('farms')}
                        className="text-[#1F6B4A] hover:underline font-semibold cursor-pointer text-[11px]"
                      >
                        {isTa ? 'மேலாண்மை' : 'Manage →'}
                      </button>
                    </div>
                  </motion.div>

                  {/* Metric 2: Field Inspections */}
                  <motion.div variants={itemVariants} className="surface-card p-5 space-y-2">
                    <div className="text-xs font-mono text-[#718176] uppercase tracking-wider flex items-center justify-between font-medium">
                      <span>{isTa ? 'ஆய்வுப் பதிவுகள்' : 'SCANS RECORDED'}</span>
                      <Clock className="w-4 h-4 text-[#1F6B4A]" />
                    </div>
                    <div className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#102D24]">
                      {scans.length}
                    </div>
                    <div className="text-xs text-[#52665A] font-sans flex items-center justify-between">
                      <span>{scans.length > 0 ? (isTa ? 'சேமிக்கப்பட்ட முடிவுகள்' : 'Firestore archived') : (isTa ? 'ஆய்வுகள் இல்லை' : 'Ready for first scan')}</span>
                      <button
                        onClick={() => switchTab('history')}
                        className="text-[#1F6B4A] hover:underline font-semibold cursor-pointer text-[11px]"
                      >
                        {isTa ? 'பதிவுகள்' : 'History →'}
                      </button>
                    </div>
                  </motion.div>

                  {/* Metric 3: Active Cultivar */}
                  <motion.div variants={itemVariants} className="surface-card p-5 space-y-2">
                    <div className="text-xs font-mono text-[#718176] uppercase tracking-wider flex items-center justify-between font-medium">
                      <span>{isTa ? 'முதன்மைப் பயிர் ரகம்' : 'CULTIVATED VARIETY'}</span>
                      <Sprout className="w-4 h-4 text-[#1F6B4A]" />
                    </div>
                    <div className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#102D24] truncate" title={activeVariety}>
                      {activeVariety.split(' ')[0]} {activeVariety.split(' ')[1] || ''}
                    </div>
                    <div className="text-xs text-[#52665A] font-sans truncate">
                      {activeCrop} · {activeDistrict}
                    </div>
                  </motion.div>

                  {/* Metric 4: Market Live Status */}
                  <motion.div variants={itemVariants} className="surface-card p-5 space-y-2">
                    <div className="text-xs font-mono text-[#718176] uppercase tracking-wider flex items-center justify-between font-medium">
                      <span>{isTa ? 'மண்டி நிலவரம்' : 'MANDI MARKET FEED'}</span>
                      <IndianRupee className="w-4 h-4 text-[#D7AD63]" />
                    </div>
                    <div className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#102D24]">
                      AGMARKNET
                    </div>
                    <div className="text-xs text-[#52665A] font-sans flex items-center justify-between">
                      <span>{isTa ? 'தமிழ்நாடு விற்பனைக்கூடங்கள்' : 'Tamil Nadu Mandis'}</span>
                      <button
                        onClick={() => switchTab('prices')}
                        className="text-[#1F6B4A] hover:underline font-semibold cursor-pointer text-[11px]"
                      >
                        {isTa ? 'விலைகள்' : 'Prices →'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.section>

              {/* SECTION 4: Recent Scans & Foliar Assessments (Full-Width Dedicated Section) */}
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={defaultViewport}
                className="surface-card p-6 lg:p-8 space-y-5 min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE4D9] pb-4">
                  <div>
                    <h3 className="text-xl font-bold font-['Manrope'] text-[#102D24] tracking-tight">
                      {isTa ? 'சமீபத்திய கள ஆய்வு முடிவுகள்' : 'Recent Foliar Inspections & Assessments'}
                    </h3>
                    <p className="text-xs text-[#718176] font-mono mt-0.5">
                      {scans.length} {isTa ? 'ஆய்வுகள் பத்திரப்படுத்தப்பட்டுள்ளன' : 'TOTAL FIELD ASSESSMENTS ARCHIVED IN FIRESTORE'}
                    </p>
                  </div>

                  {scans.length > 0 && (
                    <motion.button
                      {...buttonHoverTap}
                      onClick={() => switchTab('history')}
                      className="btn-secondary text-xs py-2 px-3.5 self-start sm:self-auto flex items-center gap-1.5"
                    >
                      <span>{isTa ? 'அனைத்து பதிவுகளையும் காண்க' : 'View Full Inspection Archive'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>

                {/* Scans List or Empty State */}
                {scans.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center bg-[#FAF9F3] border border-dashed border-[#DCE4D9] rounded-[14px] space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#1F6B4A]/10 text-[#1F6B4A] flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-[#102D24] font-['Plus_Jakarta_Sans']">
                        {isTa ? 'இதுவரை ஆய்வுப் பதிவுகள் இல்லை' : 'No Field Inspections Recorded Yet'}
                      </h4>
                      <p className="text-xs text-[#52665A] max-w-md mx-auto leading-relaxed">
                        {isTa
                          ? 'உங்கள் பயிரின் இலைகளைப் படம் எடுத்து ஆய்வு செய்யுங்கள். நோயியல் முடிவுகள், நோய் தீவிரம் மற்றும் TNAU வழிகாட்டல்கள் இங்கு தானாகவே சேமிக்கப்படும்.'
                          : 'Capture or upload a clear leaf photo to detect blast, blight, or nutrient deficiency. Results and personalized protocols are securely stored here.'}
                      </p>
                    </div>
                    <motion.button
                      {...buttonHoverTap}
                      onClick={() => switchTab('scan')}
                      className="btn-primary text-xs py-2.5 px-5"
                    >
                      {isTa ? 'முதல் ஆய்வைத் தொடங்கு' : 'Perform First Foliar Scan'}
                    </motion.button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#DCE4D9]">
                    {scans.slice(0, 4).map((item) => {
                      const formattedDate = item.createdAt?.toDate
                        ? item.createdAt.toDate().toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recent';

                      const isHealthy = item.isHealthy;
                      const isSevere = item.severity === 'high';

                      return (
                        <div
                          key={item.scanId || item.id}
                          onClick={() => setSelectedScanForDetail(item)}
                          className="py-4 flex items-center justify-between gap-4 hover:bg-[#FAF9F3] px-3 rounded-[10px] transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {item.imagePath ? (
                              <img
                                src={item.imagePath}
                                alt="Specimen"
                                className="w-14 h-14 object-cover rounded-[10px] border border-[#DCE4D9] shrink-0 group-hover:border-[#1F6B4A] transition-colors"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-[#EAEFE5] rounded-[10px] flex items-center justify-center text-[#1F6B4A] shrink-0">
                                <Sprout className="w-7 h-7" />
                              </div>
                            )}
                            <div className="space-y-1 min-w-0">
                              <div className="text-sm sm:text-base font-bold text-[#102D24] font-['Plus_Jakarta_Sans'] truncate">
                                {isTa ? item.possibleConditionTamil || item.possibleCondition : item.possibleCondition}
                              </div>
                              <div className="text-xs text-[#718176] font-mono flex flex-wrap items-center gap-2">
                                <span>{formattedDate}</span>
                                <span>·</span>
                                <span>{item.cropName || 'Rice'}</span>
                                {item.pathogen && item.pathogen !== 'None detected' && (
                                  <>
                                    <span>·</span>
                                    <span className="italic truncate max-w-xs">{item.pathogen}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={
                                isHealthy
                                  ? 'badge-healthy'
                                  : isSevere
                                  ? 'badge-alert'
                                  : 'badge-caution'
                              }
                            >
                              {isHealthy
                                ? 'Healthy'
                                : isSevere
                                ? 'Action Needed'
                                : 'Caution'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-[#718176] group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.section>

              {/* SECTION 5: Market Price Insights (Full-Width Dedicated Vertical Section) */}
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={defaultViewport}
                className="surface-card p-6 lg:p-8 space-y-6 min-w-0 bg-gradient-to-br from-white via-white to-[#FAF9F3]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DCE4D9] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#1F6B4A] bg-[#EAEFE5] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        GOVERNMENT OF INDIA OGD · AGMARKNET FEED
                      </span>
                      <span className="text-[11px] font-mono text-[#52665A]">
                        {activeDistrict} Basin
                      </span>
                    </div>
                    <h3 className="text-xl font-bold font-['Manrope'] text-[#102D24] tracking-tight">
                      {isTa ? 'தினசரி மண்டி சந்தை விலை நுண்ணறிவு' : 'Daily Mandi Market Price Insights'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#52665A] font-sans">
                      {isTa
                        ? 'ஒழுங்குமுறை விற்பனைக்கூடங்களின் நேரடி விலை நிலவரம் (₹/குவிண்டால்)'
                        : 'Wholesale mandi rates verified from Ministry of Agriculture open data feeds (₹/quintal)'}
                    </p>
                  </div>

                  {/* Commodity Quick Selector Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {['Paddy', 'Tomato', 'Onion', 'Chilli', 'Maize'].map((cropKey) => {
                      const isSel = selectedMandiCrop.toLowerCase() === cropKey.toLowerCase();
                      return (
                        <button
                          key={cropKey}
                          onClick={() => setSelectedMandiCrop(cropKey)}
                          className={`px-3 py-1.5 text-xs font-mono rounded-[8px] border transition-colors cursor-pointer ${
                            isSel
                              ? 'bg-[#1F6B4A] text-white border-[#1F6B4A] font-semibold'
                              : 'bg-white text-[#17271E] border-[#DCE4D9] hover:border-[#1F6B4A]'
                          }`}
                        >
                          {cropKey}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mandi Rates Grid / Loading / Empty */}
                {isMandiLoading ? (
                  <div className="p-8 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#1F6B4A] mx-auto" />
                    <p className="text-xs font-mono text-[#52665A]">
                      {isTa ? 'மண்டி விலைகள் சரிபார்க்கப்படுகின்றன...' : `Querying latest AGMARKNET arrivals for ${selectedMandiCrop}...`}
                    </p>
                  </div>
                ) : mandiHighlights.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                    {mandiHighlights.map((record, idx) => (
                      <div
                        key={`${record.id}-${idx}`}
                        className="bg-white border border-[#DCE4D9] p-4 rounded-[12px] space-y-2.5 hover:border-[#1F6B4A]/60 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-semibold text-[#102D24]">{record.market}</span>
                          <span className="text-[#1F6B4A] bg-[#EAEFE5] px-2 py-0.5 rounded-[4px]">
                            {record.district}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-[11px] font-mono text-[#718176] uppercase">Modal Price</div>
                            <div className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#102D24]">
                              ₹{record.modalPrice.toLocaleString('en-IN')}
                              <span className="text-xs font-normal text-[#52665A] ml-1">/ qtl</span>
                            </div>
                          </div>
                          <div className="text-right text-[11px] font-mono text-[#52665A]">
                            <div>Min: ₹{record.minPrice}</div>
                            <div>Max: ₹{record.maxPrice}</div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#DCE4D9] flex items-center justify-between text-[11px] font-mono text-[#718176]">
                          <span>{record.variety || 'Standard Variety'}</span>
                          <span>{record.arrivalDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-[#FAF9F3] border border-dashed border-[#DCE4D9] rounded-[10px] space-y-2">
                    <p className="text-xs text-[#52665A]">
                      {isTa
                        ? `இன்று ${selectedMandiCrop} பயிருக்கான புதிய வரத்துகள் பதிவாகவில்லை.`
                        : `No new arrivals recorded for ${selectedMandiCrop} today in this district feed.`}
                    </p>
                  </div>
                )}

                {/* Link to Full Market Prices Explorer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-[#52665A] font-sans">
                    {isTa
                      ? 'தமிழ்நாட்டின் அனைத்து மாவட்ட விற்பனைக்கூட விலைகள், வரத்து மற்றும் வரலாற்று புள்ளிவிவரங்களைக் காண:'
                      : 'Explore all 38 Tamil Nadu districts, sort by modal price, and inspect wholesale price spreads:'}
                  </div>
                  <motion.button
                    {...buttonHoverTap}
                    onClick={() => switchTab('prices')}
                    className="btn-primary text-xs py-2 px-4 shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>{isTa ? 'முழு சந்தை விலைகளைக் காண்க' : 'Open Full Market Prices Explorer'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.section>

              {/* SECTION 6: Farm Information & Relevant Farming Guidance (2-Column Comparison Layout) */}
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={defaultViewport}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0"
              >
                {/* Column 1: Registered Farm Parcels */}
                <div className="surface-card p-6 space-y-5 min-w-0 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#DCE4D9] pb-3">
                      <div>
                        <h3 className="text-lg font-bold font-['Manrope'] text-[#102D24] tracking-tight">
                          {isTa ? 'உங்கள் பண்ணை நிலங்கள்' : 'Registered Farm Plots & Cadastre'}
                        </h3>
                        <p className="text-xs text-[#718176] font-mono mt-0.5">
                          {farms.length} {isTa ? 'நிலங்கள் பதிவு செய்யப்பட்டுள்ளன' : 'PARCELS IN CADASTRE'}
                        </p>
                      </div>

                      <button
                        onClick={() => switchTab('farms')}
                        className="text-xs font-semibold text-[#1F6B4A] hover:underline cursor-pointer"
                      >
                        {isTa ? 'நிர்வகி' : 'Manage →'}
                      </button>
                    </div>

                    {farms.length === 0 ? (
                      <div className="p-6 text-center bg-[#FAF9F3] border border-dashed border-[#DCE4D9] rounded-[10px] space-y-2">
                        <p className="text-xs text-[#52665A]">
                          {isTa ? 'பண்ணைகள் பதிவு செய்யப்படவில்லை' : 'No farm parcels registered yet.'}
                        </p>
                        <button
                          onClick={() => switchTab('farms')}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          {isTa ? 'பண்ணையைச் சேர்' : 'Add First Plot'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {farms.slice(0, 3).map((farm) => (
                          <div
                            key={farm.id}
                            className="p-4 bg-[#FAF9F3] border border-[#DCE4D9] rounded-[10px] flex items-center justify-between gap-3 hover:border-[#1F6B4A]/50 transition-colors"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="text-sm font-bold text-[#102D24] flex items-center gap-1.5 truncate">
                                <span>{farm.farmName}</span>
                                {farm.isPrimary && (
                                  <span className="text-[10px] font-mono font-bold uppercase bg-[#1F6B4A] text-white px-1.5 py-0.2 rounded-[4px]">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#52665A] font-mono truncate">
                                {farm.cropType} · {farm.riceVariety || 'Standard'} · {farm.district}
                                {farm.landSizeArea ? ` · ${farm.landSizeArea} Acres` : ''}
                              </div>
                            </div>

                            <motion.button
                              {...buttonHoverTap}
                              onClick={() => handleLaunchScanForFarm(farm)}
                              className="btn-secondary text-xs py-1.5 px-3 min-h-[34px] shrink-0 flex items-center gap-1.5"
                              title="Inspect this parcel"
                            >
                              <Camera className="w-3.5 h-3.5 text-[#1F6B4A]" />
                              <span>{isTa ? 'ஆய்வு' : 'Inspect'}</span>
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#DCE4D9]">
                    <button
                      onClick={() => switchTab('farms')}
                      className="text-xs font-semibold text-[#1F6B4A] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{isTa ? 'அனைத்து நிலங்களையும் நிர்வகிக்க' : 'Manage Cadastre & Add Plots'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Column 2: Relevant TNAU Farming Guidance */}
                <div className="surface-card p-6 space-y-5 min-w-0 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#DCE4D9] pb-3">
                      <div>
                        <h3 className="text-lg font-bold font-['Manrope'] text-[#102D24] tracking-tight">
                          {isTa ? 'TNAU பரிந்துரைக்கப்பட்ட வழிகாட்டல்' : 'TNAU Calibrated Crop Guidance'}
                        </h3>
                        <p className="text-xs text-[#718176] font-mono mt-0.5 uppercase">
                          {activeCrop} · {activeStage || 'Active Phase'}
                        </p>
                      </div>

                      <button
                        onClick={() => switchTab('guidance')}
                        className="text-xs font-semibold text-[#1F6B4A] hover:underline cursor-pointer"
                      >
                        {isTa ? 'முழு வழிகாட்டல்' : 'Explore →'}
                      </button>
                    </div>

                    <div className="space-y-3 text-xs font-sans">
                      {/* Advisory 1: Blast Prophylactic Window */}
                      <div className="p-3.5 bg-[#FAF9F3] border-l-3 border-[#1F6B4A] border-y border-r border-[#DCE4D9] rounded-[8px] space-y-1">
                        <div className="font-bold text-[#102D24] flex items-center gap-1.5 font-mono uppercase text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#1F6B4A]" />
                          <span>{isTa ? 'இலைக்கருகல் / குலை நோய் கண்காணிப்பு' : 'Foliar Blast Prophylaxis Window'}</span>
                        </div>
                        <p className="text-[#52665A] leading-relaxed">
                          {isTa
                            ? `${activeDistrict} மண்டலத்தில் தற்போதைய ஈரப்பதத்தில் இலைகளில் பழுப்பு நிறப் புள்ளிகள் தென்பட்டால் உடனே வேப்பங்கொட்டை சாறு 5% தெளிக்கவும்.`
                            : `Morning dews in ${activeDistrict} Basin elevate foliar blast risk. Inspect lower sheath margins for spindle lesions with greyish centres.`}
                        </p>
                      </div>

                      {/* Advisory 2: Biological IPM */}
                      <div className="p-3.5 bg-[#FAF9F3] border-l-3 border-[#70B77E] border-y border-r border-[#DCE4D9] rounded-[8px] space-y-1">
                        <div className="font-bold text-[#102D24] flex items-center gap-1.5 font-mono uppercase text-[11px]">
                          <Sprout className="w-3.5 h-3.5 text-[#1F6B4A]" />
                          <span>{isTa ? 'உயிரியல் பூச்சி மேலாண்மை (IPM)' : 'Biological IPM Protocol'}</span>
                        </div>
                        <p className="text-[#52665A] leading-relaxed">
                          {isTa
                            ? 'சூடோமோனாஸ் ஃப்ளோரசன்ஸ் @ 10 கிராம்/லிட்டர் நீரில் கலந்து மாலையில் இலைகளில் தெளிக்கவும்.'
                            : 'Foliar spray of Pseudomonas fluorescens @ 10g/L or NSKE 5% provides eco-friendly systemic resistance without harming beneficial fauna.'}
                        </p>
                      </div>

                      {/* Advisory 3: Nutrition & Water Regime */}
                      <div className="p-3.5 bg-[#FAF9F3] border-l-3 border-[#D7AD63] border-y border-r border-[#DCE4D9] rounded-[8px] space-y-1">
                        <div className="font-bold text-[#102D24] flex items-center gap-1.5 font-mono uppercase text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-[#A96616]" />
                          <span>{isTa ? 'பாசனம் & சமச்சீர் ஊட்டச்சத்து' : 'Balanced Potash & Irrigation'}</span>
                        </div>
                        <p className="text-[#52665A] leading-relaxed">
                          {isTa
                            ? 'தழைச்சத்து உரங்களை அதிகமாக இடுவதைத் தவிர்க்கவும்; சமஅளவு பொட்டாஷ் இடுவது நோய் எதிர்ப்பு சக்தியை அதிகரிக்கும்.'
                            : 'Avoid excessive nitrogen split applications. Ensure 50% split of Muriate of Potash (MOP) to thicken epidermic cell walls against fungal penetration.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#DCE4D9]">
                    <motion.button
                      {...buttonHoverTap}
                      onClick={() => switchTab('guidance')}
                      className="btn-primary text-xs py-2 px-4 w-full flex items-center justify-center gap-1.5"
                    >
                      <span>{isTa ? 'முழு TNAU வேளாண் வழிகாட்டலைத் திற' : 'Open Full Agricultural Guidance'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.section>
            </motion.div>
          )}

          {/* ========================================================
              TAB: CROP DIAGNOSIS (Signature Feature)
              ======================================================== */}
          {activeTab === 'scan' && (
            <div className="space-y-6">
              {primaryFarm && (
                <div className="surface-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-[#1F6B4A]" />
                    <span>
                      ACTIVE FIELD CONTEXT:{' '}
                      <strong className="text-[#102D24]">{primaryFarm.farmName}</strong>
                      {' '}({primaryFarm.cropType} {primaryFarm.riceVariety ? `· ${primaryFarm.riceVariety}` : ''} · {primaryFarm.district})
                    </span>
                  </div>
                  {farms.length > 1 && (
                    <button
                      onClick={() => switchTab('farms')}
                      className="text-[#1F6B4A] hover:underline cursor-pointer font-semibold"
                    >
                      {isTa ? 'வேறு பண்ணையைத் தேர்ந்தெடு' : 'Switch Farm Plot →'}
                    </button>
                  )}
                </div>
              )}

              <DiseaseFinder
                onSaveToLog={handleSaveToLog}
                initialCropId={initialScanCropId}
                selectedFarm={selectedFarm}
                farms={farms}
                farmerCrops={profile?.primaryCrops || (profile?.primaryCrop ? [profile.primaryCrop] : [])}
                onSelectFarm={(farm) => setSelectedFarm(farm)}
                onGetAgriculturalHelp={(context) => {
                  setEnquiryContextForHub(context);
                  setActiveTab('expert');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onStartFieldCaseInvestigation={(image, crop, variety, farmId) => {
                  setInvestigationPreload({ imagePreview: image, cropId: crop, variety, farmId });
                }}
              />
            </div>
          )}

          {/* ========================================================
              TAB: MY FARMS
              ======================================================== */}
          {activeTab === 'farms' && (
            <FarmManagement
              onScanFarm={handleLaunchScanForFarm}
              onSelectGuidance={(farm) => {
                setSelectedFarm(farm);
                setActiveTab('guidance');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* ========================================================
              TAB: SCAN HISTORY (Real Firestore Profiles/{uid}/Scans)
              ======================================================== */}
          {activeTab === 'history' && (
            <div className="surface-card p-6 lg:p-8 space-y-6">
              <div className="border-b border-[#DCE4D9] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-mono uppercase text-[#1F6B4A] tracking-wider block font-semibold">
                    {user ? `FIRESTORE PROFILES / ${user.uid.substring(0, 8)} / SCANS` : 'FIELD SCAN HISTORY'}
                  </span>
                  <h3 className="text-2xl font-bold font-['Manrope'] text-[#102D24]">
                    {isTa ? 'வயல் ஆய்வு வரலாறு மற்றும் நோயியல் முடிவுகள்' : 'Field Scan History & Pathological Outcomes'}
                  </h3>
                </div>
                <div className="text-xs font-mono text-[#52665A]">
                  {scans.length} {isTa ? 'ஆய்வுகள் பதிவு செய்யப்பட்டுள்ளன' : 'INSPECTIONS LOGGED'}
                </div>
              </div>

              {/* Loading Scans */}
              {isScansLoading && (
                <div className="py-12 text-center text-[#52665A] font-mono text-xs flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#1F6B4A]" />
                  <span>{isTa ? 'ஆய்வுப் பதிவுகள் ஏற்றப்படுகின்றன...' : 'Loading scan records from Cloud Firestore...'}</span>
                </div>
              )}

              {/* Error Scans */}
              {scansError && (
                <div className="p-4 bg-[#FAF2F1] border border-[#B8423A]/30 text-[#B8423A] text-xs font-sans rounded-[10px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{scansError}</span>
                  </div>
                </div>
              )}

              {/* Useful Empty State (No Fabricated Records) */}
              {!isScansLoading && !scansError && scans.length === 0 && (
                <div className="p-8 sm:p-12 text-center bg-[#FAF9F3] border border-dashed border-[#DCE4D9] rounded-[12px] space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#1F6B4A]/10 flex items-center justify-center text-[#1F6B4A]">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-[#102D24]">
                      {isTa ? 'இதுவரை எந்த ஆய்வுப் பதிவுகளும் இல்லை' : 'No Field Inspections Recorded Yet'}
                    </h4>
                    <p className="text-xs text-[#52665A] font-sans max-w-md mx-auto">
                      {isTa
                        ? 'உங்கள் பயிரின் இலையை புகைப்படம் எடுத்து "பயிர் பரிசோதனை" பிரிவில் ஆய்வு செய்யவும். முடிவுகள் இங்கு தானாகவே சேமிக்கப்படும்.'
                        : 'Upload or photograph a crop leaf blade to detect early blast, BLB, or nutrient stress. All confirmed assessments will be chronologically archived here in Firestore.'}
                    </p>
                  </div>
                  <button
                    onClick={() => switchTab('scan')}
                    className="btn-primary text-xs py-2.5 px-5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isTa ? 'இப்போது பயிரை ஸ்கேன் செய்யவும்' : 'Scan Your First Crop Leaf'}</span>
                  </button>
                </div>
              )}

              {/* Real Inspections List */}
              {!isScansLoading && scans.length > 0 && (
                <div className="divide-y divide-[#DCE4D9]">
                  {scans.map((item) => {
                    const formattedDate = item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Recent';

                    const isHealthy = item.isHealthy;
                    const isSevere = item.severity === 'high';

                    return (
                      <div
                        key={item.scanId || item.id}
                        onClick={() => setSelectedScanForDetail(item)}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F3] px-3 transition-colors cursor-pointer rounded-[10px]"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedScanForDetail(item);
                          }
                        }}
                        aria-label={`View inspection details for ${item.scanId}`}
                      >
                        <div className="flex items-start gap-4">
                          {item.imagePath && (
                            <div className="w-16 h-16 shrink-0 bg-[#EAEFE5] border border-[#DCE4D9] overflow-hidden rounded-[8px]">
                              <img
                                src={item.imagePath}
                                alt="Crop scan thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#718176]">
                              <span className="font-semibold text-[#102D24]">{item.scanId}</span>
                              <span>·</span>
                              <span>{formattedDate}</span>
                              {item.district && (
                                <>
                                  <span>·</span>
                                  <span>{item.district}</span>
                                </>
                              )}
                            </div>

                            <div className="text-base sm:text-lg font-bold text-[#102D24] font-['Plus_Jakarta_Sans']">
                              {isTa ? item.possibleConditionTamil || item.possibleCondition : item.possibleCondition}
                            </div>

                            <div className="text-xs text-[#52665A] font-mono flex flex-wrap gap-2">
                              <span>Crop: {item.cropName || 'Rice (Paddy)'}</span>
                              <span>·</span>
                              <span>Cultivar: {item.variety || activeVariety}</span>
                              {item.pathogen && item.pathogen !== 'None detected' && (
                                <>
                                  <span>·</span>
                                  <span className="italic">{item.pathogen}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                          <span
                            className={
                              isHealthy
                                ? 'badge-healthy'
                                : isSevere
                                ? 'badge-alert'
                                : 'badge-caution'
                            }
                          >
                            {isHealthy
                              ? 'Healthy'
                              : isSevere
                              ? 'Action Needed'
                              : 'Caution'}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedScanForDetail(item);
                            }}
                            className="btn-secondary text-xs py-1.5 px-3 min-h-[36px]"
                          >
                            <span>{isTa ? 'விவரங்கள்' : 'View Details'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB: MARKET PRICES (Agmarknet Live Mandi Feeds)
              ======================================================== */}
          {activeTab === 'prices' && (
            <DailyMarketPrices
              activeDistrict={primaryFarm?.district || profile?.district || 'Thanjavur'}
            />
          )}

          {/* ========================================================
              TAB: FARMING GUIDANCE
              ======================================================== */}
          {activeTab === 'guidance' && (
            <PersonalizedGuidance
              farms={farms}
              activeFarm={primaryFarm}
              onSelectFarm={(farm) => setSelectedFarm(farm)}
              onNavigateToScan={(farm, cropId) => {
                if (farm) setSelectedFarm(farm);
                if (cropId) setInitialScanCropId(cropId);
                setActiveTab('scan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* ========================================================
              TAB: WEATHER & SEASONS
              ======================================================== */}
          {activeTab === 'risks' && (
            <WeatherSeasonalIntelligence
              farms={farms}
              activeFarm={primaryFarm}
              onSelectFarm={(farm) => setSelectedFarm(farm)}
              onNavigateToScan={(cropId) => {
                if (cropId) setInitialScanCropId(cropId);
                setActiveTab('scan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* ========================================================
              TAB: DISTRICT ALERTS
              ======================================================== */}
          {activeTab === 'alerts' && <CommunityAlertsView />}

          {/* ========================================================
              TAB: EXPERT & KNOWLEDGE HUB
              ======================================================== */}
          {activeTab === 'expert' && (
            <ExpertKnowledgeHub
              farms={farms}
              activeFarm={primaryFarm}
              scans={scans}
              initialEnquiryContext={enquiryContextForHub}
              onClearEnquiryContext={() => setEnquiryContextForHub(null)}
            />
          )}

          {/* ========================================================
              TAB: FIELD CASES
              ======================================================== */}
          {activeTab === 'cases' && (
            <FieldCaseHub
              farms={farms}
              onEscalateToExpert={(token, crop, notes) => {
                setEnquiryContextForHub({
                  caseToken: token,
                  cropId: crop,
                  description: `Field Case Escalation ${token}: ${notes}`,
                });
                setActiveTab('expert');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </main>
      </div>

      {/* ========================================================
          MODALS & OVERLAYS
          ======================================================== */}
      {/* Scan Detail Dossier Modal */}
      <AnimatePresence>
        {selectedScanForDetail && (
          <ScanDetailModal
            isOpen={Boolean(selectedScanForDetail)}
            scan={selectedScanForDetail}
            onClose={() => setSelectedScanForDetail(null)}
            onDelete={handleDeleteScan}
            onGetAgriculturalHelp={(scan) => {
              setSelectedScanForDetail(null);
              setEnquiryContextForHub({
                scanId: scan.scanId,
                cropId: scan.cropId,
                cropName: scan.cropName,
                conditionName: scan.possibleCondition,
                severity: scan.severity,
                imagePath: scan.imagePath,
              });
              setActiveTab('expert');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </AnimatePresence>

      {/* Guided Field Assessment Modal */}
      {investigationPreload && (
        <GuidedFieldAssessmentModal
          initialImagePreview={investigationPreload.imagePreview}
          initialCropId={investigationPreload.cropId}
          initialVariety={investigationPreload.variety}
          selectedFarm={farms.find((f) => f.id === investigationPreload.farmId) || primaryFarm}
          farms={farms}
          onClose={() => setInvestigationPreload(null)}
          onCaseCreated={() => {
            setInvestigationPreload(null);
            setActiveTab('cases');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onEscalateToExpert={(token, crop, notes) => {
            setInvestigationPreload(null);
            setEnquiryContextForHub({
              caseToken: token,
              cropId: crop,
              description: `Field Case Escalation ${token}: ${notes}`,
            });
            setActiveTab('expert');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
};

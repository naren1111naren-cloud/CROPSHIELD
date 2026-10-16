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
import { OverviewView } from './OverviewView';
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
  tabContentVariants,
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

  const handleRetryScans = () => {
    if (!user) return;
    setIsScansLoading(true);
    setScansError(null);
    subscribeFarmerScans(
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
  };

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
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('overview')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer relative ${
                  activeTab === 'overview'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'overview' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                  <span>{t('navOverview')}</span>
                </div>
              </motion.button>

              {/* 2. Crop Diagnosis */}
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('scan')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer relative ${
                  activeTab === 'scan'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'scan' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <Camera className="w-4.5 h-4.5 shrink-0 text-[#70B77E]" />
                  <span>{t('navCropDiagnosis')}</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-[#1F6B4A]/60 text-white relative z-10">
                  AI
                </span>
              </motion.button>

              {/* 3. My Farms */}
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('farms')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer relative ${
                  activeTab === 'farms'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'farms' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <Layers className="w-4.5 h-4.5 shrink-0" />
                  <span>{t('navMyFarm')}</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold relative z-10">
                  {farms.length}
                </span>
              </motion.button>

              {/* 4. Scan History */}
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('history')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer relative ${
                  activeTab === 'history'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'history' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <Clock className="w-4.5 h-4.5 shrink-0" />
                  <span>{t('navScanHistory')}</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold relative z-10">
                  {scans.length}
                </span>
              </motion.button>

              {/* 5. Market Prices */}
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('prices')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer relative ${
                  activeTab === 'prices'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'prices' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <IndianRupee className="w-4.5 h-4.5 shrink-0 text-[#D7AD63]" />
                  <span>{t('navMarketWeather')}</span>
                </div>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-[4px] bg-[#D7AD63]/20 text-[#D7AD63] font-semibold relative z-10">
                  LIVE
                </span>
              </motion.button>

              {/* 6. Farming Guidance */}
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('guidance')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer relative ${
                  activeTab === 'guidance'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'guidance' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <BookOpen className="w-4.5 h-4.5 shrink-0" />
                  <span>{t('navFarmingGuidance')}</span>
                </div>
              </motion.button>
            </nav>
          </div>

          {/* Group 2: Agricultural Intelligence Tools */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#70B77E]/80 px-3 mb-2 font-semibold">
              {isTa ? 'வேளாண் நுண்ணறிவு' : 'AGRI-INTELLIGENCE'}
            </div>
            <nav className="space-y-1">
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('risks')}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors cursor-pointer relative ${
                  activeTab === 'risks'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/75 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'risks' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <CloudSun className="w-4 h-4 shrink-0 text-[#B8DCC1] relative z-10" />
                <span className="relative z-10">{isTa ? 'வானிலை & பருவங்கள்' : 'Weather & Seasons'}</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('alerts')}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors cursor-pointer relative ${
                  activeTab === 'alerts'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/75 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'alerts' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#D7AD63] relative z-10" />
                <span className="relative z-10">{isTa ? 'மாவட்ட எச்சரிக்கைகள்' : 'District Alerts'}</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('expert')}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors cursor-pointer relative ${
                  activeTab === 'expert'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/75 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'expert' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Building2 className="w-4 h-4 shrink-0 text-[#70B77E] relative z-10" />
                <span className="relative z-10">{isTa ? 'வல்லுநர் மையம்' : 'Expert Knowledge'}</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab('cases')}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors cursor-pointer relative ${
                  activeTab === 'cases'
                    ? 'text-white font-semibold'
                    : 'text-[#F5F7F1]/75 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'cases' && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-[#1F6B4A] rounded-[10px] shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <FileText className="w-4 h-4 shrink-0 relative z-10" />
                <span className="relative z-10">{isTa ? 'கள ஆய்வு வழக்குகள்' : 'Field Case Hub'}</span>
              </motion.button>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              {/* ========================================================
                  TAB: OVERVIEW (Calm Agricultural Intelligence Workspace)
                  ======================================================== */}
              {/* ========================================================
                  TAB: OVERVIEW (Forest Intelligence Vertical Section System)
                  ======================================================== */}
              {activeTab === 'overview' && (
            <OverviewView
              farmerName={farmerName}
              activeDistrict={activeDistrict}
              activeLocality={activeLocality}
              activeCrop={activeCrop}
              activeVariety={activeVariety}
              activeStage={activeStage}
              activeAcres={activeAcres}
              primaryFarm={primaryFarm}
              farms={farms}
              isFarmsLoading={isFarmsLoading}
              scans={scans}
              isScansLoading={isScansLoading}
              scansError={scansError}
              onRetryScans={handleRetryScans}
              onSwitchTab={switchTab}
              onOpenProfile={onOpenProfile}
              onOpenAuth={onOpenAuth}
              onSelectScanForDetail={(scan) => setSelectedScanForDetail(scan)}
              onLaunchScanForFarm={handleLaunchScanForFarm}
              isProfileIncomplete={isProfileIncomplete}
              user={user}
            />
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
                  setActiveTab('cases');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToHistory={() => switchTab('history')}
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
        </motion.div>
      </AnimatePresence>
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

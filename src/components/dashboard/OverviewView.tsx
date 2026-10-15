import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FarmRecord, ScanData, MandiPriceRecord } from '../../types';
import { DashboardTab } from './FarmerDashboard';
import { fetchDailyMandiPrices } from '../../services/marketPriceClient';
import { motion } from 'motion/react';
import {
  pageVariants,
  sectionVariants,
  staggerContainer,
  itemVariants,
  buttonHoverTap,
  defaultViewport,
} from '../../lib/motion';
import {
  Compass,
  Sprout,
  Camera,
  Layers,
  Clock,
  IndianRupee,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers3
} from 'lucide-react';

interface OverviewViewProps {
  farmerName: string;
  activeDistrict: string;
  activeLocality?: string;
  activeCrop: string;
  activeVariety: string;
  activeStage?: string;
  activeAcres?: number;
  primaryFarm: FarmRecord | null;
  farms: FarmRecord[];
  isFarmsLoading: boolean;
  scans: ScanData[];
  isScansLoading: boolean;
  scansError: string | null;
  onRetryScans?: () => void;
  onSwitchTab: (tab: DashboardTab) => void;
  onOpenProfile?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onSelectScanForDetail: (scan: ScanData) => void;
  onLaunchScanForFarm: (farm: FarmRecord) => void;
  isProfileIncomplete: boolean;
  user: any;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  farmerName,
  activeDistrict,
  activeLocality,
  activeCrop,
  activeVariety,
  activeStage,
  activeAcres,
  primaryFarm,
  farms,
  isFarmsLoading,
  scans,
  isScansLoading,
  scansError,
  onRetryScans,
  onSwitchTab,
  onOpenProfile,
  onOpenAuth,
  onSelectScanForDetail,
  onLaunchScanForFarm,
  isProfileIncomplete,
  user,
}) => {
  const { language, t } = useLanguage();
  const isTa = language === 'ta';

  // Live AGMARKNET Mandi Price State
  const [selectedMandiCrop, setSelectedMandiCrop] = useState<string>('Paddy');
  const [mandiHighlights, setMandiHighlights] = useState<MandiPriceRecord[]>([]);
  const [isMandiLoading, setIsMandiLoading] = useState<boolean>(true);
  const [mandiError, setMandiError] = useState<string | null>(null);
  const [mandiLastUpdated, setMandiLastUpdated] = useState<string | null>(null);

  // Fetch verified AGMARKNET prices
  const loadMandiHighlights = async () => {
    setIsMandiLoading(true);
    setMandiError(null);
    try {
      const res = await fetchDailyMandiPrices({
        state: 'Tamil Nadu',
        district: activeDistrict && activeDistrict !== 'all' ? activeDistrict : undefined,
        commodity: selectedMandiCrop,
        limit: 3,
      });

      if (!res.success && res.error) {
        setMandiError(res.message || 'Market feed temporarily unavailable.');
        setMandiHighlights([]);
        return;
      }

      if (res.records && res.records.length > 0) {
        setMandiHighlights(res.records);
        setMandiLastUpdated(res.fetchedAt || null);
      } else {
        // Fallback across Tamil Nadu if current district had no reports for commodity today
        const fallbackRes = await fetchDailyMandiPrices({
          state: 'Tamil Nadu',
          commodity: selectedMandiCrop,
          limit: 3,
        });
        if (fallbackRes.records && fallbackRes.records.length > 0) {
          setMandiHighlights(fallbackRes.records);
          setMandiLastUpdated(fallbackRes.fetchedAt || null);
        } else {
          setMandiHighlights([]);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load mandi overview highlights:', err);
      setMandiError(
        isTa
          ? 'சந்தை விலை விவரங்களை ஏற்றுவதில் தாமதம். பின்னர் முயற்சிக்கவும்.'
          : 'Unable to reach AGMARKNET mandi feed at this moment.'
      );
    } finally {
      setIsMandiLoading(false);
    }
  };

  useEffect(() => {
    loadMandiHighlights();
  }, [activeDistrict, selectedMandiCrop]);

  // Guidance items calibrated for selected crop / active stage
  const getStageGuidanceItems = () => {
    const stageLower = (activeStage || '').toLowerCase();
    const isRice = activeCrop.toLowerCase().includes('rice') || activeCrop.toLowerCase().includes('paddy');

    if (isRice) {
      if (stageLower.includes('tillering') || stageLower.includes('vegetative')) {
        return [
          {
            titleEn: 'Foliar Blast Prophylaxis Window',
            titleTa: 'இலைக்கருகல் / குலை நோய் தடுப்பு கண்காணிப்பு',
            descEn: `Persistent morning dew (>6 hours) in ${activeDistrict} Basin significantly elevates foliar blast vulnerability during active tillering. Inspect lower leaf margins for spindle-shaped lesions with greyish centres.`,
            descTa: `${activeDistrict} மண்டலத்தில் தூர்கட்டும் பருவத்தில் அதிகாலை பனிப்பொழிவு நீடித்தால் குலை நோய் உருவாக வாய்ப்புள்ளது. இலைகளின் ஓரங்களில் படகு வடிவ சாம்பல் நிறப் புள்ளிகளை கவனிக்கவும்.`,
            actionEn: 'Apply Pseudomonas fluorescens @ 10g/L or 5% NSKE at first sign.',
            actionTa: 'அறிகுறி தென்பட்டால் சூடோமோனாஸ் 10 கிராம்/லிட்டர் அல்லது 5% வேப்பங்கொட்டை சாறு தெளிக்கவும்.',
            source: 'TNAU Rice Crop Production Guide — Pathology Advisory',
            type: 'warning',
          },
          {
            titleEn: 'Alternate Wetting & Drying (AWD)',
            titleTa: 'காய்ச்சலும் பாய்ச்சலுமாக (AWD) நீர் மேலாண்மை',
            descEn: 'Allow field water to naturally recede until hairline soil surface cracks appear before irrigating to 2-3 cm. This aerates rhizosphere soil and impedes fungal zoospore proliferation.',
            descTa: 'வயலில் நீர் வற்றி லேசான தரை வெடிப்பு தோன்றிய பின் 2 முதல் 3 செ.மீ வரை நீர் பாய்ச்சவும். இது வேர்களுக்குக் காற்றோட்டம் தந்து பூஞ்சை வளர்ச்சியைத் தடுக்கும்.',
            actionEn: 'Maintain perforated field water tube to guide irrigation intervals.',
            actionTa: 'வயலில் நீர் அளவிடும் குழாயைப் பயன்படுத்தி சரியான இடைவெளியில் நீர் பாய்ச்சவும்.',
            source: 'TNAU Water Technology Centre (WTC)',
            type: 'good',
          },
          {
            titleEn: 'Balanced Potash & Nitrogen Splitting',
            titleTa: 'சமச்சீர் சாம்பல் சத்து & தழைச்சத்து பிரித்தளித்தல்',
            descEn: 'Avoid single heavy urea applications. Top-dress nitrogen in 3 calibrated splits and ensure 50% split of Muriate of Potash (MOP) to thicken epidermic cell walls against piercing pests.',
            descTa: 'யூரியாவை ஒரே முறையில் இடாமல் 3-4 தவணைகளாகப் பிரித்து இடவும். பொட்டாஷ் உரத்தை சமச்சீராக இடுவது இலைகளை உறுதிப்படுத்தி நோய்களைத் தடுக்கும்.',
            actionEn: 'Ensure MOP split application alongside second top-dress.',
            actionTa: 'இரண்டாம் தவணை தழைச்சத்துடன் பொட்டாஷ் உரத்தையும் சேர்த்து இடவும்.',
            source: 'TNAU Department of Agronomy',
            type: 'neutral',
          },
        ];
      }

      if (stageLower.includes('panicle') || stageLower.includes('flowering') || stageLower.includes('heading')) {
        return [
          {
            titleEn: 'Neck Blast & False Smut Surveillance',
            titleTa: 'கழுத்து குலை நோய் & கதிர் பூஞ்சை எச்சரிக்கை',
            descEn: `As panicles emerge in ${activeDistrict}, scout for brownish discolouration at neck nodes. Cloudy weather during anthesis favours false smut (Ustilaginoidea virens) spore attachment.`,
            descTa: `கதிர் வெளிவரும் தருணத்தில் கதிர் கழுத்துப் பகுதியில் பழுப்பு நிற மாற்றம் உள்ளதா என கண்காணிக்கவும். மேகமூட்டமான வானிலை கதிர் பூஞ்சை தொற்றை அதிகரிக்கும்.`,
            actionEn: 'Ensure prophylactic bio-spray at 5% panicle emergence.',
            actionTa: '5% கதிர் வெளிவரும் போது முற்காப்பு உயிரியல் தெளிப்பு மேற்கொள்ளவும்.',
            source: 'TNAU Crop Protection Circular',
            type: 'warning',
          },
          {
            titleEn: 'Terminal Water Maintenance',
            titleTa: 'பூக்கும் பருவத்தில் சீரான நீர் மேலாண்மை',
            descEn: 'Maintain 2 cm continuous standing water from panicle initiation through milk stage. Moisture stress at flowering causes chaffy, unfilled grains.',
            descTa: 'கதிர் உருவானது முதல் பால் பிடிக்கும் பருவம் வரை வயலில் 2 செ.மீ நீர் தொடர்ந்து இருக்குமாறு பார்த்துக் கொள்ளவும். நீர் பற்றாக்குறை பதர் மணிகளை உருவாக்கும்.',
            actionEn: 'Do not withhold irrigation until 10 days before harvest.',
            actionTa: 'அறுவடைக்கு 10 நாட்களுக்கு முன்பு வரை நீர் பாய்ச்சலை நிறுத்த வேண்டாம்.',
            source: 'TNAU Agronomy Protocol',
            type: 'good',
          },
          {
            titleEn: 'Brown Planthopper (BPH) Alleyways',
            titleTa: 'புகையான் பூச்சி கண்காணிப்பு & பயிர் இடைவெளி',
            descEn: 'Part crop rows every 2 to 2.5 metres to form "alleyways" (pāthi). This allows sunlight to reach the plant base and reduces humidity that fuels BPH multiplication.',
            descTa: 'பயிர்களுக்கு இடையே 2 முதல் 2.5 மீட்டருக்கு ஒருமுறை இடைவெளி (பாதி) விடவும். இது அடிப்பகுதியில் சூரிய ஒளி படரச் செய்து புகையான் பெருக்கத்தைக் குறைக்கும்.',
            actionEn: 'Examine basal stem clumps early morning.',
            actionTa: 'காலை வேளையில் தூர்களின் அடிப்பகுதியை உன்னிப்பாகக் கவனிக்கவும்.',
            source: 'TNAU Entomology Entomology Advisories',
            type: 'neutral',
          },
        ];
      }
    }

    // Default TNAU General Guidelines for Active Tamil Nadu crops
    return [
      {
        titleEn: 'Foliar Pathogen Prophylaxis Window',
        titleTa: 'இலைக்கருகல் / பூஞ்சை நோய் கண்காணிப்பு',
        descEn: `Persistent humidity and morning dew in ${activeDistrict} Basin elevate fungal pathogen germination. Early visual scouting prevents widespread crop damage.`,
        descTa: `${activeDistrict} மண்டலத்தில் தற்போதைய காற்றில் உள்ள ஈரப்பதம் பூஞ்சை வளர்ச்சிக்கு ஏதுவாக உள்ளது. ஆரம்பக்கட்ட கண்காணிப்பு பயிர்ப் பாதுகாப்பிற்கு மிக அவசியம்.`,
        actionEn: 'Inspect 20 random leaves per plot weekly in daylight.',
        actionTa: 'வாரந்தோறும் பகல் வெளிச்சத்தில் 20 இலைகளைத் தேர்ந்தெடுத்து ஆய்வு செய்யவும்.',
        source: 'TNAU Crop Production Guide',
        type: 'warning',
      },
      {
        titleEn: 'Systemic Resistance via Biological IPM',
        titleTa: 'உயிரியல் பூச்சி மற்றும் நோய் மேலாண்மை (IPM)',
        descEn: 'Foliar application of Pseudomonas fluorescens or Trichoderma asperellum stimulates systemic induced resistance in crop foliage without destroying beneficial pollinators.',
        descTa: 'சூடோமோனாஸ் அல்லது டிரைக்கோடெர்மா உயிரியல் காரணிகளைப் பயன்படுத்துவது இயற்கை பூச்சிகளைப் பாதிக்காமல் பயிரின் நோய் எதிர்ப்புச் சக்தியை அதிகரிக்கிறது.',
        actionEn: 'Apply biocontrol solutions during calm evening hours.',
        actionTa: 'மாலையில் அமைதியான சூழலில் உயிரியல் மருந்துகளைத் தெளிக்கவும்.',
        source: 'TNAU Department of Plant Pathology',
        type: 'good',
      },
      {
        titleEn: 'Balanced Nutrient Regime & Tissue Toughness',
        titleTa: 'சமச்சீர் உர மேலாண்மை & தண்டு உறுதித்தன்மை',
        descEn: 'Avoid excess nitrogen which leads to soft succulent tissue prone to sheath diseases. Ensure potassium top-dressing to strengthen silica deposits in leaf cuticle.',
        descTa: 'அதிகப்படியான தழைச்சத்து இலைகளை மென்மையாக்கி நோய்களை எளிதில் பரப்பும். பொட்டாஷ் உரம் இலைகளின் பாதுகாப்பு அடுக்கை வலுவாக்கும்.',
        actionEn: 'Split fertilizer doses based on soil test calibration.',
        actionTa: 'மண் பரிசோதனைக்கு ஏற்ப உரங்களை தவணைகளாகப் பிரித்து இடவும்.',
        source: 'TNAU Soil Science & Agricultural Chemistry',
        type: 'neutral',
      },
    ];
  };

  const guidanceItems = getStageGuidanceItems();

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-8 min-w-0"
    >
      {/* ========================================================
          A. WELCOME & FARM CONTEXT
          ======================================================== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        className="space-y-4 min-w-0"
      >
        <div className="bg-white border border-[#DFE6DB] p-6 lg:p-8 rounded-[14px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 min-w-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#217451] uppercase tracking-wider font-semibold">
              <Compass className="w-4 h-4 text-[#217451]" />
              <span>{isTa ? 'வேளாண் புல நுண்ணறிவு' : 'AGRICULTURAL INTELLIGENCE WORKSPACE'}</span>
              <span>·</span>
              <span className="text-[#64766B]">{activeDistrict.toUpperCase()} BASIN</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] tracking-tight">
              {isTa ? `வணக்கம், ${farmerName}` : `Vanakkam, ${farmerName}`}
            </h2>

            <p className="text-sm sm:text-base text-[#64766B] font-sans max-w-2xl leading-relaxed">
              {farms.length > 0 ? (
                isTa
                  ? `${activeDistrict} மாவட்டத்தில் ${activeVariety} பயிருக்கான தற்போதைய கள மேலாண்மை, நேரடி நோயியல் பார்வை மற்றும் TNAU வழிகாட்டல் பணியகம்.`
                  : `Active agricultural intelligence for ${activeVariety} in ${activeDistrict} District. Real-time vision pathology, field surveillance, and verified TNAU crop care.`
              ) : (
                isTa
                  ? `பயிர் பாதுகாப்பு பணியகத்திற்கு வரவேற்கிறோம். துல்லியமான வளர்ச்சிப் பருவ வழிகாட்டல் மற்றும் உள்ளூர் மண்டி எச்சரிக்கைகளைப் பெற உங்கள் முதல் பண்ணையைப் பதிவு செய்யவும்.`
                  : `Welcome to CropShield Agricultural Workspace. Connect your farm plot to receive phenology-calibrated surveillance, local mandi updates, and stage-specific advisories.`
              )}
            </p>
          </div>

          {/* Farm Quick Status or Onboarding Pill */}
          <div className="bg-[#F5F4EA] border border-[#DFE6DB] p-4 rounded-[12px] min-w-[260px] space-y-1.5 self-start md:self-auto shrink-0">
            {farms.length > 0 && primaryFarm ? (
              <>
                <div className="text-[11px] font-mono uppercase text-[#64766B] font-semibold flex items-center justify-between">
                  <span className="truncate max-w-[180px]">{primaryFarm.farmName}</span>
                  <Sprout className="w-4 h-4 text-[#217451] shrink-0" />
                </div>
                <div className="text-[15px] font-bold text-[#0B241B] font-['Plus_Jakarta_Sans'] truncate">
                  {primaryFarm.cropType} · {primaryFarm.riceVariety || activeVariety}
                </div>
                <div className="text-xs text-[#217451] font-semibold font-mono flex items-center gap-1.5">
                  {activeAcres ? <span>{activeAcres} ACRES · </span> : null}
                  <span>{activeStage || (isTa ? 'வளர்ச்சிப் பருவம்' : 'Active Growth Phase')}</span>
                </div>
                {farms.length > 1 && (
                  <button
                    onClick={() => onSwitchTab('farms')}
                    className="text-[11px] text-[#217451] hover:underline cursor-pointer pt-1 block font-medium"
                  >
                    {isTa ? `அனைத்து ${farms.length} பண்ணைகளையும் காண்க →` : `View all ${farms.length} parcels →`}
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-[#B87922] font-semibold flex items-center justify-between">
                  <span>{isTa ? 'பண்ணை சேர்க்கப்படவில்லை' : 'NO FARM REGISTERED'}</span>
                  <Layers className="w-4 h-4 text-[#B87922]" />
                </div>
                <p className="text-xs text-[#64766B] leading-relaxed">
                  {isTa
                    ? 'வயலை பதிவு செய்வது பயிர் வளர்ச்சிப் பருவம் சார்ந்த ஆலோசனைகளை செயல்படுத்தும்.'
                    : 'Registering your plot activates personalized phenology and disease risk windows.'}
                </p>
                <button
                  onClick={() => onSwitchTab('farms')}
                  className="w-full text-xs font-semibold py-1.5 px-3 bg-[#217451] hover:bg-[#1b5e42] text-white rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>{isTa ? 'முதல் பண்ணையைச் சேர்' : 'Register Farm Plot'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            B. FARM REGISTRATION REMINDER
            ======================================================== */}
        {user && farms.length === 0 && (
          <motion.div
            variants={sectionVariants}
            className="p-4 bg-[#FAF4EB] border-l-4 border-[#B87922] border-y border-r border-[#DFE6DB] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#B87922] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#0B241B]">
                  {isTa ? 'உங்கள் பண்ணைப் பதிவை முழுமையாக்குங்கள்' : 'Connect Your Farm Plot for Tailored Intelligence'}
                </h4>
                <p className="text-xs text-[#64766B] font-sans mt-0.5 max-w-xl">
                  {isTa
                    ? 'உங்கள் முதல் பண்ணை நிலத்தைப் பதிவு செய்து, பயிர் வகை மற்றும் பருவத்தை குறிப்பிட்டால், நோயியல் ஆய்வுகள் தானாகவே அந்த வயலுடன் இணைக்கப்படும்.'
                    : 'Register your land coordinates, crop cultivar, and transplanting date to link image scans directly to field phenology and local micro-climate alerts.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSwitchTab('farms')}
              className="px-4 py-2 bg-[#217451] hover:bg-[#1b5e42] text-white text-xs font-semibold rounded-[8px] transition-colors shrink-0 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[38px]"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>{isTa ? 'பண்ணையைச் சேர்' : 'Register Farm Plot'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Incomplete Profile Advisory (if farm registered but stage missing) */}
        {user && farms.length > 0 && isProfileIncomplete && (
          <div className="p-4 bg-[#FAF4EB] border-l-4 border-[#B87922] border-y border-r border-[#DFE6DB] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#B87922] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#0B241B]">
                  {isTa ? 'பயிர் வளர்ச்சிப் பருவம் புதுப்பிக்கப்பட வேண்டும்' : 'Record Your Current Crop Growth Stage'}
                </h4>
                <p className="text-xs text-[#64766B] font-sans mt-0.5">
                  {isTa
                    ? 'பயிர் பருவத்தை அமைப்பது பூஞ்சை நோய்த்தொற்று அபாயக் காலங்களை துல்லியமாக கணிக்க உதவும்.'
                    : 'Specify your current tillering or panicle stage to calibrate disease susceptibility windows.'}
                </p>
              </div>
            </div>

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#0B241B] bg-white border border-[#DFE6DB] hover:bg-[#E5F1E8] rounded-[8px] transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
              >
                {isTa ? 'சுயவிவரம் புதுப்பி' : 'Update Profile'}
              </button>
            )}
          </div>
        )}
      </motion.section>

      {/* ========================================================
          C. CROP DIAGNOSIS HERO (Signature Primary Focus)
          ======================================================== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        className="bg-[#0B241B] text-[#F5F4EA] rounded-[16px] p-6 sm:p-8 lg:p-10 border border-[#217451]/40 relative overflow-hidden shadow-sm min-w-0"
      >
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-[#E5F1E8] font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#70B77E]" />
            <span>{isTa ? 'முதன்மையான பயிர் ஆய்வு சேவை' : 'SIGNATURE VISION PATHOLOGY'}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-white tracking-tight leading-tight">
            {isTa ? 'பயிர் இலையைப் படம் பிடித்து நோயைக் கண்டறியவும்' : 'Protect Every Crop: Diagnose Foliage in Seconds'}
          </h3>

          <p className="text-sm sm:text-base text-[#F5F4EA]/85 font-sans leading-relaxed">
            {isTa
              ? 'பாதிக்கப்பட்ட இலை அல்லது தண்டை இயற்கை வெளிச்சத்தில் தெளிவாகப் படம் பிடிக்கவும். கணினிப் பார்வை நோயியல் அறிகுறிகள், இலை விளிம்பு மாற்றங்கள் மற்றும் TNAU அங்கீகரித்த மேலாண்மை நெறிமுறைகளை உடனே வழங்குகிறது.'
              : 'Capture or upload a clear specimen of an affected leaf blade or collar in daylight. Computer vision pathology identifies lesion geometry, spot margins, and symptomatic markers against validated botanical protocols.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <motion.button
              {...buttonHoverTap}
              onClick={() => onSwitchTab('scan')}
              className="px-6 py-3.5 min-h-[46px] text-sm font-semibold text-[#0B241B] bg-[#70B77E] hover:bg-[#83c690] transition-colors rounded-[10px] flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Camera className="w-4.5 h-4.5" />
              <span>{isTa ? 'புதிய பயிர் ஆய்வு தொடங்கு' : 'Start New Crop Diagnosis'}</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>

            <motion.button
              {...buttonHoverTap}
              onClick={() => onSwitchTab('guidance')}
              className="px-5 py-3.5 min-h-[46px] text-sm font-medium text-white border border-white/20 hover:bg-white/10 transition-colors rounded-[10px] cursor-pointer"
            >
              {isTa ? 'பயிர் பராமரிப்பு வழிகாட்டல்' : 'Explore TNAU Protocols'}
            </motion.button>
          </div>

          {/* Supported Conditions Monospace Pill Row */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#E5F1E8]/75">
            <span className="text-white/40 uppercase">TNAU RECOGNIZED:</span>
            <span className="bg-white/10 px-2 py-0.5 rounded-[4px]">Rice Blast</span>
            <span className="bg-white/10 px-2 py-0.5 rounded-[4px]">Bacterial Blight</span>
            <span className="bg-white/10 px-2 py-0.5 rounded-[4px]">Brown Spot</span>
            <span className="bg-white/10 px-2 py-0.5 rounded-[4px]">Sheath Rot</span>
            <span className="bg-white/10 px-2 py-0.5 rounded-[4px]">Cash Crops</span>
          </div>
        </div>

        {/* Restrained Agricultural Geometric Watermark */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-12 translate-y-12">
          <Camera className="w-88 h-88 text-[#70B77E]" />
        </div>
      </motion.section>

      {/* ========================================================
          D. CROP HEALTH SUMMARY (4 Verified Real-Time Cards)
          ======================================================== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        className="space-y-3 min-w-0"
      >
        <div className="flex items-center justify-between border-b border-[#DFE6DB] pb-2">
          <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#217451]" />
            <span>{isTa ? 'பயிர் சுகாதாரம் & கள மேலோட்டம்' : 'Crop Health & Cultivation Summary'}</span>
          </h3>
          <span className="text-[11px] font-mono text-[#64766B] uppercase">
            {isTa ? 'சரிபார்க்கப்பட்ட நேரடித் தரவு' : 'VERIFIED FIRESTORE METRICS'}
          </span>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0"
        >
          {/* 1. Registered Farms */}
          <motion.div variants={itemVariants} className="bg-white border border-[#DFE6DB] rounded-[12px] p-5 space-y-2 shadow-xs hover:border-[#217451]/50 transition-colors">
            <div className="text-xs font-mono text-[#64766B] uppercase tracking-wider flex items-center justify-between font-medium">
              <span>{isTa ? 'பதிவு செய்யப்பட்ட பண்ணைகள்' : 'REGISTERED FARMS'}</span>
              <Layers className="w-4 h-4 text-[#217451]" />
            </div>
            {isFarmsLoading ? (
              <div className="h-9 w-16 bg-[#E5F1E8] animate-pulse rounded-[6px]" />
            ) : (
              <div className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B]">
                {farms.length}
              </div>
            )}
            <div className="text-xs text-[#64766B] font-sans flex items-center justify-between">
              <span className="truncate max-w-[130px]">
                {primaryFarm ? primaryFarm.farmName : (isTa ? 'பண்ணை இல்லை' : 'No parcels yet')}
              </span>
              <button
                onClick={() => onSwitchTab('farms')}
                className="text-[#217451] hover:underline font-semibold cursor-pointer text-[11px] shrink-0"
              >
                {isTa ? 'மேலாண்மை →' : 'Manage →'}
              </button>
            </div>
          </motion.div>

          {/* 2. Recorded Crop Scans */}
          <motion.div variants={itemVariants} className="bg-white border border-[#DFE6DB] rounded-[12px] p-5 space-y-2 shadow-xs hover:border-[#217451]/50 transition-colors">
            <div className="text-xs font-mono text-[#64766B] uppercase tracking-wider flex items-center justify-between font-medium">
              <span>{isTa ? 'ஆய்வுப் பதிவுகள்' : 'SCANS RECORDED'}</span>
              <Clock className="w-4 h-4 text-[#217451]" />
            </div>
            {isScansLoading ? (
              <div className="h-9 w-16 bg-[#E5F1E8] animate-pulse rounded-[6px]" />
            ) : (
              <div className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B]">
                {scans.length}
              </div>
            )}
            <div className="text-xs text-[#64766B] font-sans flex items-center justify-between">
              <span>
                {scans.length > 0
                  ? (isTa ? 'சேமிக்கப்பட்ட பதிவுகள்' : 'Archived in cloud')
                  : (isTa ? 'முதல் ஆய்வு தயார்' : 'Ready for first scan')}
              </span>
              <button
                onClick={() => onSwitchTab('history')}
                className="text-[#217451] hover:underline font-semibold cursor-pointer text-[11px] shrink-0"
              >
                {isTa ? 'பதிவுகள் →' : 'History →'}
              </button>
            </div>
          </motion.div>

          {/* 3. Cultivated Variety */}
          <motion.div variants={itemVariants} className="bg-white border border-[#DFE6DB] rounded-[12px] p-5 space-y-2 shadow-xs hover:border-[#217451]/50 transition-colors">
            <div className="text-xs font-mono text-[#64766B] uppercase tracking-wider flex items-center justify-between font-medium">
              <span>{isTa ? 'பயிர் & ரகம்' : 'CULTIVATED VARIETY'}</span>
              <Sprout className="w-4 h-4 text-[#217451]" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] truncate" title={activeVariety}>
              {activeVariety || 'Not specified'}
            </div>
            <div className="text-xs text-[#64766B] font-sans flex items-center justify-between">
              <span className="truncate">{activeCrop} · {activeDistrict}</span>
              <button
                onClick={() => onSwitchTab('farms')}
                className="text-[#217451] hover:underline font-semibold cursor-pointer text-[11px] shrink-0"
              >
                {isTa ? 'விவரம் →' : 'Plots →'}
              </button>
            </div>
          </motion.div>

          {/* 4. Mandi Market Feed Status */}
          <motion.div variants={itemVariants} className="bg-white border border-[#DFE6DB] rounded-[12px] p-5 space-y-2 shadow-xs hover:border-[#217451]/50 transition-colors">
            <div className="text-xs font-mono text-[#64766B] uppercase tracking-wider flex items-center justify-between font-medium">
              <span>{isTa ? 'மண்டி நிலவரம்' : 'MARKET FEED'}</span>
              <IndianRupee className="w-4 h-4 text-[#B87922]" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] flex items-center gap-2">
              <span>AGMARKNET</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#70B77E] animate-pulse" title="Feed active" />
            </div>
            <div className="text-xs text-[#64766B] font-sans flex items-center justify-between">
              <span>{isTa ? 'தமிழ்நாடு விற்பனைக்கூடங்கள்' : 'Tamil Nadu Mandis'}</span>
              <button
                onClick={() => onSwitchTab('prices')}
                className="text-[#217451] hover:underline font-semibold cursor-pointer text-[11px] shrink-0"
              >
                {isTa ? 'விலைகள் →' : 'Prices →'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ========================================================
          E. RECENT FOLIAR INSPECTIONS
          ======================================================== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        className="bg-white border border-[#DFE6DB] p-6 lg:p-8 rounded-[14px] shadow-xs space-y-5 min-w-0"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFE6DB] pb-4">
          <div>
            <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] tracking-tight">
              {isTa ? 'சமீபத்திய கள ஆய்வு முடிவுகள்' : 'Recent Foliar Inspections & Assessments'}
            </h3>
            <p className="text-xs text-[#64766B] font-mono mt-0.5">
              {scans.length} {isTa ? 'ஆய்வுகள் மேகக்கணியில் சேமிக்கப்பட்டுள்ளன' : 'TOTAL FIELD ASSESSMENTS ARCHIVED IN FIRESTORE'}
            </p>
          </div>

          {scans.length > 0 && (
            <motion.button
              {...buttonHoverTap}
              onClick={() => onSwitchTab('history')}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0B241B] bg-white border border-[#DFE6DB] hover:bg-[#E5F1E8] rounded-[8px] transition-colors self-start sm:self-auto flex items-center gap-1.5 cursor-pointer min-h-[36px]"
            >
              <span>{isTa ? 'அனைத்து பதிவுகளையும் காண்க' : 'View Full Inspection Archive'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>

        {/* Loading State */}
        {isScansLoading ? (
          <div className="py-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#217451] mx-auto" />
            <p className="text-xs font-mono text-[#64766B]">
              {isTa ? 'ஆய்வுப் பதிவுகள் ஏற்றப்படுகின்றன...' : 'Loading recent inspection history from Firestore...'}
            </p>
          </div>
        ) : scansError ? (
          /* Error State with Retry */
          <div className="p-6 bg-[#FAF2F1] border border-[#B8423A]/30 rounded-[12px] space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-[#B8423A] font-semibold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>{isTa ? 'ஆய்வுப் பதிவுகளை ஏற்றுவதில் பிழை ஏற்பட்டது' : 'Unable to load foliar inspections'}</span>
            </div>
            <p className="text-xs text-[#64766B] max-w-md mx-auto">{scansError}</p>
            {onRetryScans && (
              <button
                onClick={onRetryScans}
                className="px-4 py-2 text-xs font-semibold bg-[#217451] text-white rounded-[8px] hover:bg-[#1b5e42] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isTa ? 'மீண்டும் முயற்சி செய்' : 'Retry Query'}</span>
              </button>
            )}
          </div>
        ) : scans.length === 0 ? (
          /* Empty State */
          <div className="p-8 sm:p-12 text-center bg-[#F5F4EA] border border-dashed border-[#DFE6DB] rounded-[12px] space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#E5F1E8] text-[#217451] flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#0B241B] font-['Plus_Jakarta_Sans']">
                {isTa ? 'இதுவரை ஆய்வுப் பதிவுகள் இல்லை' : 'No Field Inspections Recorded Yet'}
              </h4>
              <p className="text-xs text-[#64766B] max-w-md mx-auto leading-relaxed">
                {isTa
                  ? 'உங்கள் பயிரின் இலைகளைப் படம் எடுத்து ஆய்வு செய்யுங்கள். நோயியல் முடிவுகள், நோய் தீவிரம் மற்றும் TNAU வழிகாட்டல்கள் இங்கு தானாகவே சேமிக்கப்படும்.'
                  : 'Capture or upload a clear leaf photo to detect blast, blight, or nutrient deficiency. Results and personalized protocols are securely stored here.'}
              </p>
            </div>
            <motion.button
              {...buttonHoverTap}
              onClick={() => onSwitchTab('scan')}
              className="px-5 py-2.5 bg-[#217451] hover:bg-[#1b5e42] text-white text-xs font-semibold rounded-[8px] transition-colors cursor-pointer shadow-xs min-h-[40px]"
            >
              {isTa ? 'முதல் ஆய்வைத் தொடங்கு' : 'Perform First Foliar Scan'}
            </motion.button>
          </div>
        ) : (
          /* List of Recent Scans */
          <div className="divide-y divide-[#DFE6DB]">
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
                  onClick={() => onSelectScanForDetail(item)}
                  className="py-3.5 sm:py-4 flex items-center justify-between gap-4 hover:bg-[#F5F4EA] px-3 rounded-[10px] transition-colors cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectScanForDetail(item);
                    }
                  }}
                  aria-label={`View inspection details for ${item.possibleCondition}`}
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {item.imagePath ? (
                      <img
                        src={item.imagePath}
                        alt="Specimen thumbnail"
                        className="w-13 h-13 sm:w-14 sm:h-14 object-cover rounded-[10px] border border-[#DFE6DB] shrink-0 group-hover:border-[#217451] transition-colors"
                      />
                    ) : (
                      <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#E5F1E8] rounded-[10px] flex items-center justify-center text-[#217451] shrink-0">
                        <Sprout className="w-6 h-6" />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm sm:text-base font-bold text-[#0B241B] font-['Plus_Jakarta_Sans'] truncate">
                        {isTa ? item.possibleConditionTamil || item.possibleCondition : item.possibleCondition}
                      </div>
                      <div className="text-xs text-[#64766B] font-mono flex flex-wrap items-center gap-2">
                        <span>{formattedDate}</span>
                        <span>·</span>
                        <span>{item.cropName || 'Rice'}</span>
                        {item.variety && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[120px]">{item.variety}</span>
                          </>
                        )}
                        {item.pathogen && item.pathogen !== 'None detected' && (
                          <>
                            <span>·</span>
                            <span className="italic truncate max-w-xs text-[#217451]">{item.pathogen}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-[6px] border ${
                        isHealthy
                          ? 'bg-[#E5F1E8] text-[#217451] border-[#B8DCC1]'
                          : isSevere
                          ? 'bg-[#FAF2F1] text-[#B8423A] border-[#B8423A]/30'
                          : 'bg-[#FAF4EB] text-[#B87922] border-[#B87922]/30'
                      }`}
                    >
                      {isHealthy ? 'Healthy' : isSevere ? 'Action Needed' : 'Caution'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#64766B] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* ========================================================
          F. DAILY MARKET PRICE INSIGHTS (AGMARKNET Live Feed)
          ======================================================== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        className="bg-white border border-[#DFE6DB] p-6 lg:p-8 rounded-[14px] shadow-xs space-y-6 min-w-0"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DFE6DB] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#217451] bg-[#E5F1E8] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" />
                GOVERNMENT OF INDIA OGD · AGMARKNET FEED
              </span>
              <span className="text-[11px] font-mono text-[#64766B]">
                {activeDistrict} Basin
              </span>
              {mandiLastUpdated && (
                <span className="text-[10px] font-mono text-[#64766B]/80">
                  · Updated {new Date(mandiLastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] tracking-tight">
              {isTa ? 'தினசரி மண்டி சந்தை விலை நுண்ணறிவு' : 'Daily Mandi Market Price Insights'}
            </h3>
            <p className="text-xs sm:text-sm text-[#64766B] font-sans">
              {isTa
                ? 'ஒழுங்குமுறை விற்பனைக்கூடங்களின் நேரடி விலை நிலவரம் (₹/குவிண்டால்)'
                : 'Wholesale mandi rates verified from Ministry of Agriculture open data feeds (₹/quintal)'}
            </p>
          </div>

          {/* Commodity Quick Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" role="group" aria-label="Select Commodity">
            {['Paddy', 'Tomato', 'Onion', 'Chilli', 'Maize'].map((cropKey) => {
              const isSel = selectedMandiCrop.toLowerCase() === cropKey.toLowerCase();
              return (
                <button
                  key={cropKey}
                  onClick={() => setSelectedMandiCrop(cropKey)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-[8px] border transition-colors cursor-pointer min-h-[36px] ${
                    isSel
                      ? 'bg-[#217451] text-white border-[#217451] font-semibold shadow-xs'
                      : 'bg-white text-[#0B241B] border-[#DFE6DB] hover:border-[#217451]'
                  }`}
                  aria-pressed={isSel}
                >
                  {cropKey}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mandi Rates Grid / Loading / Error / Empty */}
        {isMandiLoading ? (
          <div className="p-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#217451] mx-auto" />
            <p className="text-xs font-mono text-[#64766B]">
              {isTa ? 'மண்டி விலைகள் சரிபார்க்கப்படுகின்றன...' : `Querying latest AGMARKNET arrivals for ${selectedMandiCrop}...`}
            </p>
          </div>
        ) : mandiError ? (
          <div className="p-6 text-center bg-[#FAF2F1] border border-[#B8423A]/20 rounded-[10px] space-y-2">
            <p className="text-xs text-[#B8423A] font-semibold">{mandiError}</p>
            <button
              onClick={loadMandiHighlights}
              className="text-xs text-[#217451] underline font-semibold cursor-pointer"
            >
              {isTa ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry feed query'}
            </button>
          </div>
        ) : mandiHighlights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
            {mandiHighlights.map((record, idx) => {
              // Calculate relative modal position between min and max price for visual spread bar
              const range = record.maxPrice - record.minPrice;
              const modalOffsetPercent =
                range > 0
                  ? Math.min(100, Math.max(0, Math.round(((record.modalPrice - record.minPrice) / range) * 100)))
                  : 50;

              return (
                <div
                  key={`${record.id || record.market}-${idx}`}
                  className="bg-white border border-[#DFE6DB] p-4.5 rounded-[12px] space-y-3 hover:border-[#217451]/60 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#0B241B] truncate max-w-[150px]">{record.market}</span>
                    <span className="text-[#217451] bg-[#E5F1E8] px-2 py-0.5 rounded-[4px] font-semibold">
                      {record.district}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-mono text-[#64766B] uppercase font-medium">Modal Price</div>
                    <div className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B]">
                      ₹{record.modalPrice.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-[#64766B] ml-1">/ qtl</span>
                    </div>
                  </div>

                  {/* Visual Price Spread Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full bg-[#E5F1E8] rounded-full relative overflow-hidden">
                      <div
                        className="h-full bg-[#217451] rounded-full"
                        style={{ width: `${modalOffsetPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#64766B]">
                      <span>Min: ₹{record.minPrice}</span>
                      <span>Max: ₹{record.maxPrice}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#DFE6DB] flex items-center justify-between text-[11px] font-mono text-[#64766B]">
                    <span className="truncate max-w-[140px]">{record.variety || 'Standard Variety'}</span>
                    <span>{record.arrivalDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-[#F5F4EA] border border-dashed border-[#DFE6DB] rounded-[10px] space-y-2">
            <p className="text-xs text-[#64766B]">
              {isTa
                ? `இன்று ${selectedMandiCrop} பயிருக்கான புதிய வரத்துகள் இந்த மாவட்ட மண்டிகளில் பதிவாகவில்லை.`
                : `No trading arrivals recorded for ${selectedMandiCrop} today in this district feed. You can explore state-wide mandis below.`}
            </p>
          </div>
        )}

        {/* Link to Full Market Prices Page */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="text-xs text-[#64766B] font-sans">
            {isTa
              ? 'தமிழ்நாட்டின் அனைத்து 38 மாவட்ட விற்பனைக்கூட விலைகள், வரத்து மற்றும் வரலாற்று புள்ளிவிவரங்களைக் காண:'
              : 'Explore all 38 Tamil Nadu districts, sort by modal price, and inspect wholesale price spreads:'}
          </div>
          <motion.button
            {...buttonHoverTap}
            onClick={() => onSwitchTab('prices')}
            className="px-4 py-2 bg-[#217451] hover:bg-[#1b5e42] text-white text-xs font-semibold rounded-[8px] transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs min-h-[38px]"
          >
            <span>{isTa ? 'முழு சந்தை விலைகளைக் காண்க' : 'Open Full Market Prices Explorer'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </motion.section>

      {/* ========================================================
          G & H. REGISTERED FARM PLOTS & TNAU GUIDANCE (2-Col Grid)
          ======================================================== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0"
      >
        {/* G. REGISTERED FARM PLOTS AND CADASTRAL INFORMATION */}
        <div className="bg-white border border-[#DFE6DB] rounded-[14px] p-6 space-y-5 min-w-0 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFE6DB] pb-3">
              <div>
                <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] tracking-tight">
                  {isTa ? 'உங்கள் பண்ணை நிலங்கள்' : 'Registered Farm Plots & Cadastre'}
                </h3>
                <p className="text-xs text-[#64766B] font-mono mt-0.5">
                  {farms.length} {isTa ? 'நிலங்கள் பதிவு செய்யப்பட்டுள்ளன' : 'PARCELS IN CADASTRE'}
                </p>
              </div>

              <button
                onClick={() => onSwitchTab('farms')}
                className="text-xs font-semibold text-[#217451] hover:underline cursor-pointer"
              >
                {isTa ? 'நிர்வகி →' : 'Manage →'}
              </button>
            </div>

            {farms.length === 0 ? (
              <div className="p-6 text-center bg-[#F5F4EA] border border-dashed border-[#DFE6DB] rounded-[10px] space-y-2.5">
                <p className="text-xs text-[#64766B]">
                  {isTa ? 'இதுவரை பண்ணைகள் பதிவு செய்யப்படவில்லை.' : 'No farm parcels registered yet.'}
                </p>
                <button
                  onClick={() => onSwitchTab('farms')}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#217451] hover:bg-[#1b5e42] text-white rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>{isTa ? 'முதல் பண்ணையைச் சேர்' : 'Add First Plot'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {farms.slice(0, 3).map((farm) => (
                  <div
                    key={farm.id}
                    className="p-3.5 sm:p-4 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[10px] flex items-center justify-between gap-3 hover:border-[#217451]/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-bold text-[#0B241B] flex items-center gap-1.5 truncate">
                        <span>{farm.farmName}</span>
                        {farm.isPrimary && (
                          <span className="text-[10px] font-mono font-bold uppercase bg-[#217451] text-white px-1.5 py-0.2 rounded-[4px]">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#64766B] font-mono truncate">
                        {farm.cropType} · {farm.riceVariety || 'Standard'} · {farm.district}
                        {farm.landSizeArea ? ` · ${farm.landSizeArea} Acres` : ''}
                      </div>
                    </div>

                    <motion.button
                      {...buttonHoverTap}
                      onClick={() => onLaunchScanForFarm(farm)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#0B241B] bg-white border border-[#DFE6DB] hover:bg-[#E5F1E8] rounded-[8px] transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer min-h-[34px]"
                      title="Inspect this parcel"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#217451]" />
                      <span>{isTa ? 'ஆய்வு' : 'Inspect'}</span>
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#DFE6DB]">
            <button
              onClick={() => onSwitchTab('farms')}
              className="text-xs font-semibold text-[#217451] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{isTa ? 'அனைத்து நிலங்களையும் நிர்வகிக்க' : 'Manage Cadastre & Add Plots'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* H. TNAU-CALIBRATED CROP GUIDANCE */}
        <div className="bg-white border border-[#DFE6DB] rounded-[14px] p-6 space-y-5 min-w-0 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFE6DB] pb-3">
              <div>
                <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] tracking-tight">
                  {isTa ? 'TNAU பரிந்துரைக்கப்பட்ட வழிகாட்டல்' : 'TNAU Calibrated Crop Guidance'}
                </h3>
                <p className="text-xs text-[#64766B] font-mono mt-0.5 uppercase">
                  {activeCrop} · {activeStage || 'Active Phase'}
                </p>
              </div>

              <button
                onClick={() => onSwitchTab('guidance')}
                className="text-xs font-semibold text-[#217451] hover:underline cursor-pointer"
              >
                {isTa ? 'முழு வழிகாட்டல் →' : 'Explore →'}
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              {guidanceItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-3.5 bg-[#F5F4EA] border-l-3 border-y border-r border-[#DFE6DB] rounded-[8px] space-y-1 ${
                    item.type === 'warning'
                      ? 'border-l-[#B87922]'
                      : item.type === 'good'
                      ? 'border-l-[#217451]'
                      : 'border-l-[#70B77E]'
                  }`}
                >
                  <div className="font-bold text-[#0B241B] flex items-center gap-1.5 font-mono uppercase text-[11px]">
                    {item.type === 'warning' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#B87922]" />
                    ) : item.type === 'good' ? (
                      <Sprout className="w-3.5 h-3.5 text-[#217451]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#217451]" />
                    )}
                    <span>{isTa ? item.titleTa : item.titleEn}</span>
                  </div>
                  <p className="text-[#64766B] leading-relaxed">
                    {isTa ? item.descTa : item.descEn}
                  </p>
                  <div className="text-[10px] font-mono text-[#64766B]/80 pt-0.5 flex items-center justify-between">
                    <span className="text-[#217451] font-semibold">{isTa ? item.actionTa : item.actionEn}</span>
                    <span className="italic">{item.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#DFE6DB]">
            <motion.button
              {...buttonHoverTap}
              onClick={() => onSwitchTab('guidance')}
              className="w-full py-2 px-4 bg-[#217451] hover:bg-[#1b5e42] text-white text-xs font-semibold rounded-[8px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[38px]"
            >
              <span>{isTa ? 'முழு TNAU வேளாண் வழிகாட்டலைத் திற' : 'Open Full Agricultural Guidance'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

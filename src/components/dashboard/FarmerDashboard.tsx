import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AnalysisResult, ScanData, FarmRecord } from '../../types';
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
import { PersonalizedGuidance } from './PersonalizedGuidance';
import { WeatherSeasonalIntelligence } from './WeatherSeasonalIntelligence';
import { ExpertKnowledgeHub } from './ExpertKnowledgeHub';
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
  Building2
} from 'lucide-react';

interface FarmerDashboardProps {
  onBackToHome: () => void;
  onOpenProfile?: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  onBackToHome,
  onOpenProfile,
}) => {
  const { language, t } = useLanguage();
  const { user, profile } = useAuth();
  const isTa = language === 'ta';

  const [activeTab, setActiveTab] = useState<'scan' | 'guidance' | 'farms' | 'history' | 'risks' | 'alerts' | 'expert'>('scan');
  const [initialScanCropId, setInitialScanCropId] = useState<string>('rice');
  const [enquiryContextForHub, setEnquiryContextForHub] = useState<any>(null);

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

  // Save scan to Firestore subcollection (and upload image to Firebase Storage if file present)
  const handleSaveToLog = async (
    result: AnalysisResult,
    imagePreview: string,
    file?: File | null,
    farmId?: string
  ) => {
    if (!user) return;
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
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F6EF] py-8 lg:py-12 border-b border-[#D9DED3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Field Cadastre Notebook Header Banner */}
        <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#D9DED3] pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#426B43] uppercase tracking-wider mb-2 font-semibold">
                <Compass className="w-4 h-4 text-[#183B2A]" />
                <span>{t('dashWorkspaceTitle')}</span>
                <span>/</span>
                <span className="text-[#4A584D]">{activeDistrict.toUpperCase()} AGRICULTURAL CADASTRE</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl sm:text-4xl text-[#183B2A] font-medium tracking-tight">
                  {isTa ? `வணக்கம், ${farmerName}` : `Vanakkam, ${farmerName}`}
                </h1>
                {onOpenProfile && (
                  <button
                    onClick={onOpenProfile}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#183B2A] bg-[#FAF9F3] hover:bg-[#E5EBDD] border border-[#D9DED3] rounded-xs cursor-pointer transition-colors"
                    title="Edit Cadastral Profile"
                  >
                    <Edit3 className="w-3 h-3 text-[#426B43]" />
                    <span>{isTa ? 'சுயவிவரம் திருத்து' : 'Edit Profile'}</span>
                  </button>
                )}
              </div>

              <p className="text-sm font-mono text-[#4A584D] mt-1.5 flex flex-wrap items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#426B43] shrink-0" />
                <span>
                  {activeLocality ? `${activeLocality}, ` : ''}
                  {activeDistrict} District
                </span>
                {user?.email && (
                  <>
                    <span>·</span>
                    <span className="text-xs text-[#667166]">{user.email}</span>
                  </>
                )}
              </p>
            </div>

            {/* Selected Farm and Crop Status Strip */}
            <div className="bg-[#FAF9F3] border border-[#E5EBDD] p-4 flex flex-col justify-between text-xs font-mono min-w-[280px]">
              <div className="text-[#4A584D] uppercase mb-1 font-semibold flex items-center justify-between">
                <span>{primaryFarm ? primaryFarm.farmName : (isTa ? 'முதன்மைப் பயிர்' : 'Active Plot')}</span>
                <Sprout className="w-4 h-4 text-[#426B43]" />
              </div>

              <div className="text-base font-semibold text-[#183B2A] font-serif mb-1">
                {activeVariety}
              </div>

              <div className="text-xs text-[#426B43] font-semibold flex flex-wrap items-center gap-1">
                {activeAcres ? (
                  <span>{activeAcres} ACRES · </span>
                ) : null}
                <span>{activeStage || (isTa ? 'வளர்ச்சிப் பருவம் பதிவு செய்யப்படவில்லை' : 'Stage not recorded')}</span>
              </div>

              {farms.length > 1 && (
                <button
                  onClick={() => setActiveTab('farms')}
                  className="mt-2 text-[11px] text-[#183B2A] underline hover:text-[#426B43] text-left cursor-pointer"
                >
                  {isTa ? `அனைத்து ${farms.length} பண்ணைகளையும் காண்க` : `View all ${farms.length} parcels`}
                </button>
              )}
            </div>
          </div>

          {/* Incomplete Profile Prompt Banner */}
          {isProfileIncomplete && (
            <div className="mb-6 p-4 bg-[#FAF9F3] border-l-4 border-[#B67B2A] border-y border-r border-[#D9DED3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#B67B2A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-sm font-semibold text-[#183B2A]">
                    {isTa ? 'உங்கள் பண்ணைப் பதிவை முழுமையாக்குங்கள்' : 'Complete Your Cadastral Plot Information'}
                  </h4>
                  <p className="text-xs text-[#4A584D] font-sans mt-0.5">
                    {farms.length === 0
                      ? (isTa ? 'துல்லியமான நோய் எச்சரிக்கைகளைப் பெற உங்கள் முதல் வயலைச் சேர்க்கவும்.' : 'Add your farm parcel and planting date to receive phenology-calibrated TNAU disease risk alerts.')
                      : (isTa ? 'பயிர் வளர்ச்சிப் பருவத்தைப் பதிவு செய்யவும்.' : 'Update your current rice growth stage to match fungal infection windows.')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => (farms.length === 0 ? setActiveTab('farms') : onOpenProfile?.())}
                className="px-4 py-2 bg-[#183B2A] text-white font-mono text-xs font-semibold hover:bg-[#122c20] rounded-xs cursor-pointer shadow-xs shrink-0 self-start sm:self-auto min-h-[38px]"
              >
                {farms.length === 0
                  ? (isTa ? 'பண்ணையைச் சேர்' : 'Register Farm Plot')
                  : (isTa ? 'சுயவிவரம் நிரப்புக' : 'Complete Details')}
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-[#D9DED3] pb-1">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'scan'
                  ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                  : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{t('dashTabScan')}</span>
            </button>

            <button
              onClick={() => setActiveTab('guidance')}
              className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'guidance'
                  ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                  : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{isTa ? 'பயிர் வழிகாட்டல்' : 'Crop Care Guidance'}</span>
            </button>

            <button
              onClick={() => setActiveTab('farms')}
              className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'farms'
                  ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                  : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isTa ? 'எனது பண்ணைகள்' : 'My Farms'}</span>
              <span className="text-[10px] bg-[#E5EBDD] text-[#183B2A] px-1.5 py-0.5 rounded-full font-bold">
                {farms.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                  : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{t('dashTabHistory')}</span>
              <span className="text-[10px] bg-[#E5EBDD] text-[#183B2A] px-1.5 py-0.5 rounded-full font-bold">
                {scans.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('risks')}
              className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'risks'
                  ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                  : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
              }`}
            >
              <CloudSun className="w-4 h-4" />
              <span>{isTa ? 'வானிலை & பருவங்கள்' : 'Weather & Seasons'}</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                  : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
              }`}
            >
              {t('dashTabAlerts')}
            </button>

            <button
              onClick={() => setActiveTab('expert')}
              className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'expert'
                  ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                  : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{isTa ? 'வல்லுநர் & அறிவு மையம்' : 'Expert & Knowledge Hub'}</span>
            </button>

            <button
              onClick={onBackToHome}
              className="ml-auto px-4 py-2 text-xs font-mono text-[#4A584D] hover:text-[#183B2A] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isTa ? 'முகப்பு பக்கம்' : 'Home Overview'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Prominent Scan Your Crop Action */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {primaryFarm && (
              <div className="bg-white border border-[#D9DED3] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-[#426B43]" />
                  <span>
                    CURRENTLY INSPECTING:{' '}
                    <strong className="text-[#183B2A]">{primaryFarm.farmName}</strong>
                    {' '}({primaryFarm.cropType} {primaryFarm.riceVariety ? `· ${primaryFarm.riceVariety}` : ''} · {primaryFarm.district})
                  </span>
                </div>
                {farms.length > 1 && (
                  <button
                    onClick={() => setActiveTab('farms')}
                    className="text-[#426B43] hover:underline cursor-pointer"
                  >
                    {isTa ? 'வேறு பண்ணையைத் தேர்ந்தெடு' : 'Switch Farm Plot'}
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
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* Tab 2: Personalized Crop Guidance */}
        {activeTab === 'guidance' && (
          <PersonalizedGuidance
            farms={farms}
            activeFarm={primaryFarm}
            onSelectFarm={(farm) => setSelectedFarm(farm)}
            onNavigateToScan={(farm, cropId) => {
              if (farm) setSelectedFarm(farm);
              if (cropId) setInitialScanCropId(cropId);
              setActiveTab('scan');
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }}
          />
        )}

        {/* Tab 3: My Farm Section */}
        {activeTab === 'farms' && (
          <FarmManagement
            onScanFarm={handleLaunchScanForFarm}
            onSelectGuidance={(farm) => {
              setSelectedFarm(farm);
              setActiveTab('guidance');
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }}
          />
        )}

        {/* Tab 3: Real Scan History from Firestore profiles/{uid}/scans */}
        {activeTab === 'history' && (
          <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 space-y-6 shadow-xs">
            <div className="border-b border-[#D9DED3] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono uppercase text-[#426B43] tracking-wider block font-semibold">
                  PROFILES/{user?.uid?.substring(0, 8)}/SCANS · FIRESTORE SUBCOLLECTION
                </span>
                <h3 className="font-serif text-2xl font-medium text-[#183B2A]">
                  {isTa ? 'வயல் ஆய்வு வரலாறு மற்றும் நோயியல் முடிவுகள்' : 'Field Scan History & Pathological Outcomes'}
                </h3>
              </div>
              <div className="text-xs font-mono text-[#4A584D]">
                {scans.length} {isTa ? 'ஆய்வுகள் பதிவு செய்யப்பட்டுள்ளன' : 'INSPECTIONS LOGGED'}
              </div>
            </div>

            {/* Loading Scans */}
            {isScansLoading && (
              <div className="py-12 text-center text-[#4A584D] font-mono text-xs flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-[#183B2A]" />
                <span>{isTa ? 'ஆய்வுப் பதிவுகள் ஏற்றப்படுகின்றன...' : 'Loading scan records from Cloud Firestore...'}</span>
              </div>
            )}

            {/* Error Scans */}
            {scansError && (
              <div className="p-4 bg-[#A94338]/10 border border-[#A94338] text-[#A94338] text-xs font-sans rounded-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{scansError}</span>
                </div>
              </div>
            )}

            {/* Useful Empty State (No Fake Records) */}
            {!isScansLoading && !scansError && scans.length === 0 && (
              <div className="p-8 sm:p-12 text-center bg-[#FAF9F3] border border-dashed border-[#D9DED3] rounded-xs space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#183B2A]/10 flex items-center justify-center text-[#183B2A]">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-xl font-medium text-[#183B2A]">
                    {isTa ? 'இதுவரை எந்த ஆய்வுப் பதிவுகளும் இல்லை' : 'No Field Inspections Recorded Yet'}
                  </h4>
                  <p className="text-xs text-[#4A584D] font-sans max-w-md mx-auto">
                    {isTa
                      ? 'உங்கள் நெற்பயிரின் இலையை புகைப்படம் எடுத்து "பயிர் பரிசோதனை" பிரிவில் ஆய்வு செய்யவும். முடிவுகள் இங்கு தானாகவே சேமிக்கப்படும்.'
                      : 'Upload or photograph a rice leaf blade to detect early blast, BLB, or sheath rot symptoms. All confirmed assessments will be chronologically archived here in Firestore.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('scan')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#183B2A] text-white font-mono text-xs font-semibold hover:bg-[#122c20] rounded-xs cursor-pointer shadow-xs min-h-[44px]"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isTa ? 'இப்போது பயிரை ஸ்கேன் செய்யவும்' : 'Scan Your First Crop Leaf'}</span>
                </button>
              </div>
            )}

            {/* Real Inspections List */}
            {!isScansLoading && scans.length > 0 && (
              <div className="divide-y divide-[#D9DED3]">
                {scans.map((item) => {
                  const formattedDate = item.createdAt?.toDate
                    ? item.createdAt.toDate().toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : (isTa ? 'சமீபத்தியது' : 'Recent');

                  return (
                    <div
                      key={item.scanId || item.id}
                      onClick={() => setSelectedScanForDetail(item)}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F3] px-3 transition-colors cursor-pointer rounded-xs"
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
                          <div className="w-16 h-16 shrink-0 bg-[#E5EBDD] border border-[#D9DED3] overflow-hidden rounded-xs">
                            <img
                              src={item.imagePath}
                              alt="Crop scan thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#4A584D]">
                            <span className="font-semibold text-[#183B2A]">{item.scanId}</span>
                            <span>·</span>
                            <span>{formattedDate}</span>
                            {item.district && (
                              <>
                                <span>·</span>
                                <span>{item.district}</span>
                              </>
                            )}
                          </div>

                          <div className="font-serif text-lg sm:text-xl font-medium text-[#183B2A]">
                            {isTa ? item.possibleConditionTamil || item.possibleCondition : item.possibleCondition}
                          </div>

                          <div className="text-xs text-[#4A584D] font-mono flex flex-wrap gap-2">
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
                          className={`text-xs font-mono font-medium px-2.5 py-1 uppercase rounded-xs ${
                            item.isHealthy
                              ? 'bg-[#426B43]/10 text-[#426B43] border border-[#426B43]/30'
                              : item.severity === 'high'
                              ? 'bg-[#A94338]/10 text-[#A94338] border border-[#A94338]/30'
                              : 'bg-[#B67B2A]/10 text-[#B67B2A] border border-[#B67B2A]/30'
                          }`}
                        >
                          {item.severity || 'nominal'} priority
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScanForDetail(item);
                          }}
                          className="px-3 py-1.5 text-xs font-mono font-medium text-[#183B2A] bg-white hover:bg-[#E5EBDD] border border-[#D9DED3] rounded-xs cursor-pointer flex items-center gap-1 transition-colors"
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

        {/* Tab 4: Real Weather & Seasonal Crop Intelligence */}
        {activeTab === 'risks' && (
          <WeatherSeasonalIntelligence
            farms={farms}
            activeFarm={primaryFarm}
            onSelectFarm={(farm) => setSelectedFarm(farm)}
            onNavigateToScan={(cropId) => {
              if (cropId) setInitialScanCropId(cropId);
              setActiveTab('scan');
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }}
          />
        )}

        {/* Tab 5: Community Alerts */}
        {activeTab === 'alerts' && <CommunityAlertsView />}

        {/* Tab 6: Agricultural Expert Support & Knowledge Hub */}
        {activeTab === 'expert' && (
          <ExpertKnowledgeHub
            farms={farms}
            activeFarm={primaryFarm}
            scans={scans}
            initialEnquiryContext={enquiryContextForHub}
            onClearEnquiryContext={() => setEnquiryContextForHub(null)}
          />
        )}

        {/* Scan Detail Modal */}
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
            window.scrollTo({ top: 350, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
};

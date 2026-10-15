import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { FarmRecord, FarmBoundary } from '../../types';
import { FarmGISMap } from './FarmGISMap';
import {
  subscribeFarms,
  createFarm,
  updateFarm,
  deleteFarm,
  setPrimaryFarm,
  updateFarmCropStage,
} from '../../services/farmService';
import {
  TN_DISTRICTS,
  AVAILABLE_CROPS,
  RICE_VARIETIES,
  CROP_STAGES,
  IRRIGATION_METHODS,
  AREA_UNITS,
} from '../auth/FarmerProfileModal';
import {
  Sprout,
  Plus,
  Edit2,
  Trash2,
  Star,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  X,
  Layers,
  Droplets,
  HelpCircle,
  Compass,
} from 'lucide-react';

interface FarmManagementProps {
  onScanFarm?: (farm: FarmRecord) => void;
  onSelectGuidance?: (farm: FarmRecord) => void;
}

export const FarmManagement: React.FC<FarmManagementProps> = ({ onScanFarm, onSelectGuidance }) => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View state: 'list' for parcel cards, 'cadastre' for interactive satellite GIS map
  const [activeView, setActiveView] = useState<'list' | 'cadastre'>('list');
  const [selectedMapFarm, setSelectedMapFarm] = useState<FarmRecord | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<FarmRecord | null>(null);
  const [isMappingDrawerOpen, setIsMappingDrawerOpen] = useState(false);
  const [boundary, setBoundary] = useState<FarmBoundary | undefined>(undefined);

  // Form Fields
  const [farmName, setFarmName] = useState('');
  const [district, setDistrict] = useState(profile?.district || 'Karur');
  const [locality, setLocality] = useState('');
  const [cropType, setCropType] = useState('Rice (Paddy)');
  const [riceVariety, setRiceVariety] = useState('CR 1009 Sub 1 (Samba)');
  const [plantingDate, setPlantingDate] = useState('');
  const [cropStage, setCropStage] = useState('Active Tillering (21-45 DAT)');
  const [landSizeArea, setLandSizeArea] = useState('2.5');
  const [areaUnit, setAreaUnit] = useState<'Acres' | 'Cents' | 'Hectares'>('Acres');
  const [irrigationMethod, setIrrigationMethod] = useState('Canal / Cauvery Basin');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Quick Stage Update Modal
  const [stageModalFarm, setStageModalFarm] = useState<FarmRecord | null>(null);
  const [quickDate, setQuickDate] = useState('');
  const [quickStage, setQuickStage] = useState('');
  const [isQuickUpdating, setIsQuickUpdating] = useState(false);

  // Subscribe to farmer farms
  useEffect(() => {
    if (!user) {
      setFarms([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const unsubscribe = subscribeFarms(
      user.uid,
      (loadedFarms) => {
        setFarms(loadedFarms);
        setIsLoading(false);
      },
      (err) => {
        console.error('Failed to load farms from Firestore:', err);
        setErrorMsg(
          err.message ||
            (isTa
              ? 'பண்ணைப் பதிவுகளை ஏற்றுவதில் பிழை ஏற்பட்டது.'
              : 'Failed to load farm records from Firestore.')
        );
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isTa]);

  const openCreateModal = () => {
    setEditingFarm(null);
    setFarmName('');
    setDistrict(profile?.district || 'Karur');
    setLocality(profile?.locality || '');
    setCropType(profile?.primaryCrop || 'Rice (Paddy)');
    setRiceVariety(profile?.activeVariety || 'CR 1009 Sub 1 (Samba)');
    setPlantingDate(profile?.plantingDate || '');
    setCropStage(profile?.cropStage || 'Active Tillering (21-45 DAT)');
    setLandSizeArea(String(profile?.landSizeArea ?? profile?.landSizeAcres ?? '2.5'));
    setAreaUnit(profile?.areaUnit || 'Acres');
    setIrrigationMethod(profile?.irrigationMethod || 'Canal / Cauvery Basin');
    setIsPrimary(farms.length === 0);
    setNotes('');
    setBoundary(undefined);
    setIsMappingDrawerOpen(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (farm: FarmRecord) => {
    setEditingFarm(farm);
    setFarmName(farm.farmName);
    setDistrict(farm.district);
    setLocality(farm.locality || '');
    setCropType(farm.cropType || 'Rice (Paddy)');
    setRiceVariety(farm.riceVariety || 'CR 1009 Sub 1 (Samba)');
    setPlantingDate(farm.plantingDate || '');
    setCropStage(farm.cropStage || 'Active Tillering (21-45 DAT)');
    setLandSizeArea(String(farm.landSizeArea ?? farm.landSizeAcres ?? '2.5'));
    setAreaUnit(farm.areaUnit || 'Acres');
    setIrrigationMethod(farm.irrigationMethod || 'Canal / Cauvery Basin');
    setIsPrimary(Boolean(farm.isPrimary));
    setNotes(farm.notes || '');
    setBoundary(farm.boundary);
    setIsMappingDrawerOpen(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    if (!farmName.trim()) {
      setFormError(isTa ? 'பண்ணையின் பெயரை உள்ளிடவும்.' : 'Please enter a farm plot name.');
      return;
    }
    if (!district.trim()) {
      setFormError(isTa ? 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select a district.');
      return;
    }

    const areaNum = parseFloat(landSizeArea) || 2.5;
    let acresEquivalent = areaNum;
    if (areaUnit === 'Cents') {
      acresEquivalent = areaNum / 100;
    } else if (areaUnit === 'Hectares') {
      acresEquivalent = areaNum * 2.471;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<FarmRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        farmName: farmName.trim(),
        district: district.trim(),
        locality: locality.trim(),
        cropType: cropType.trim(),
        riceVariety: riceVariety.trim(),
        plantingDate,
        cropStage,
        landSizeArea: areaNum,
        landSizeAcres: Math.round(acresEquivalent * 100) / 100,
        areaUnit,
        irrigationMethod,
        isPrimary,
        notes: notes.trim(),
        boundary: boundary,
      };

      if (editingFarm && editingFarm.id) {
        await updateFarm(user.uid, editingFarm.id, payload);
        showSuccess(isTa ? 'பண்ணை விவரங்கள் புதுப்பிக்கப்பட்டன!' : 'Farm details updated successfully!');
      } else {
        await createFarm(user.uid, {
          ...payload,
          isPrimary: isPrimary || farms.length === 0,
        });
        showSuccess(isTa ? 'புதிய பண்ணை சேர்க்கப்பட்டது!' : 'New farm parcel registered in Firestore!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save farm:', err);
      setFormError(
        err.message ||
          (isTa ? 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Could not save farm parcel. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPrimary = async (farm: FarmRecord) => {
    if (!user || !farm.id) return;
    try {
      await setPrimaryFarm(user.uid, farm.id);
      showSuccess(
        isTa
          ? `"${farm.farmName}" முதன்மைப் பண்ணையாக அமைக்கப்பட்டது!`
          : `"${farm.farmName}" set as primary farm parcel!`
      );
    } catch (err: any) {
      console.error('Failed to set primary farm:', err);
      setErrorMsg(err.message || 'Failed to set primary farm.');
    }
  };

  const handleDelete = async (farm: FarmRecord) => {
    if (!user || !farm.id) return;
    const confirmMsg = isTa
      ? `"${farm.farmName}" பண்ணையை நீக்க விரும்புகிறீர்களா?`
      : `Are you sure you want to delete "${farm.farmName}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteFarm(user.uid, farm.id);
      showSuccess(isTa ? 'பண்ணை நீக்கப்பட்டது.' : 'Farm parcel deleted from Firestore.');
    } catch (err: any) {
      console.error('Failed to delete farm:', err);
      setErrorMsg(err.message || 'Failed to delete farm parcel.');
    }
  };

  const openQuickStageModal = (farm: FarmRecord) => {
    setStageModalFarm(farm);
    setQuickDate(farm.plantingDate || '');
    setQuickStage(farm.cropStage || 'Active Tillering (21-45 DAT)');
  };

  const handleSaveQuickStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !stageModalFarm?.id) return;

    setIsQuickUpdating(true);
    try {
      await updateFarmCropStage(user.uid, stageModalFarm.id, quickDate, quickStage);
      showSuccess(isTa ? 'பருவ விவரங்கள் புதுப்பிக்கப்பட்டன!' : 'Planting date & growth stage updated!');
      setStageModalFarm(null);
    } catch (err: any) {
      console.error('Failed to update stage:', err);
      setErrorMsg(err.message || 'Failed to update stage.');
    } finally {
      setIsQuickUpdating(false);
    }
  };

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="surface-card p-6 lg:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE4D9] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#1F6B4A] tracking-wider font-semibold">
              <Layers className="w-4 h-4 text-[#1F6B4A]" />
              <span>CADASTRAL PLOT REGISTRY · PROFILES/{user?.uid?.substring(0, 8)}/FARMS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Manrope'] text-[#0B211A] mt-1">
              {isTa ? 'எனது பண்ணைப் பதிவேடு (My Farm Parcels)' : 'My Farm Parcels & Cadastre'}
            </h2>
            <p className="text-xs sm:text-sm text-[#52665A] font-sans mt-0.5 leading-relaxed">
              {isTa
                ? 'உங்கள் நிலப்பரப்புகள், பயிர்கள், பாசன முறைகள் மற்றும் வளர்ச்சிப் பருவங்களை நிர்வகிக்கவும்.'
                : 'Maintain separate records for each field parcel, cultivated crop, area, irrigation method, and growth stage.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Parcels List vs Satellite Cadastre */}
            <div className="bg-[#FAF9F3] border border-[#DCE4D9] p-1 rounded-[10px] flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 py-1.5 rounded-[7px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'list'
                    ? 'bg-[#183B2A] text-white font-bold shadow-xs'
                    : 'text-[#52665A] hover:text-[#0B211A]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isTa ? 'பண்ணைகள் பட்டியல்' : 'Parcels List'} ({farms.length})</span>
              </button>
              <button
                onClick={() => setActiveView('cadastre')}
                className={`px-3 py-1.5 rounded-[7px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'cadastre'
                    ? 'bg-[#217451] text-white font-bold shadow-xs'
                    : 'text-[#52665A] hover:text-[#0B211A]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{isTa ? 'செயற்கைக்கோள் வரைபடம்' : 'Satellite GIS Cadastre'}</span>
              </button>
            </div>

            <button
              onClick={openCreateModal}
              className="btn-primary text-xs py-2.5 px-4 shrink-0 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>{isTa ? 'புதிய பண்ணை சேர்க்க' : 'Add New Farm Plot'}</span>
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {actionSuccess && (
          <div className="mb-4 p-3 bg-[#EAEFE5] border border-[#B8DCC1] text-[#1F6B4A] text-xs font-sans flex items-center gap-2 rounded-[10px] animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#1F6B4A] shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-[#FAF2F1] border border-[#B8423A]/30 text-[#B8423A] text-xs font-sans flex items-center justify-between rounded-[10px]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-mono underline hover:text-[#102D24] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 text-center text-[#52665A] font-mono text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-[#1F6B4A]" />
            <span>{isTa ? 'பண்ணை விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading registered farm plots from Firestore...'}</span>
          </div>
        )}

        {/* Satellite GIS Cadastre Workspace View */}
        {activeView === 'cadastre' && (
          <div className="space-y-4">
            <FarmGISMap
              farms={farms}
              selectedFarm={selectedMapFarm}
              farmerProfile={profile}
              initialDistrict={selectedMapFarm?.district || profile?.district || 'Karur'}
              initialState={profile?.state || 'Tamil Nadu'}
              onSelectFarm={(farm) => setSelectedMapFarm(farm)}
              onSaveBoundary={async (savedBoundary, measuredAcres, measuredCents) => {
                if (selectedMapFarm && selectedMapFarm.id && user) {
                  try {
                    await updateFarm(user.uid, selectedMapFarm.id, {
                      boundary: savedBoundary,
                      landSizeArea: selectedMapFarm.areaUnit === 'Cents' ? measuredCents : measuredAcres,
                      landSizeAcres: measuredAcres,
                    });
                    showSuccess(
                      isTa
                        ? `"${selectedMapFarm.farmName}" நில எல்லை வெற்றிகரமாக புதுப்பிக்கப்பட்டது!`
                        : `Satellite boundary for "${selectedMapFarm.farmName}" updated in Firestore!`
                    );
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Failed to update boundary.');
                  }
                } else {
                  openCreateModal();
                  setBoundary(savedBoundary);
                  setLandSizeArea(areaUnit === 'Cents' ? String(measuredCents.toFixed(1)) : String(measuredAcres.toFixed(2)));
                }
              }}
            />
          </div>
        )}

        {/* Empty State in List View */}
        {activeView === 'list' && !isLoading && farms.length === 0 && (
          <div className="p-8 sm:p-12 text-center bg-[#FAF9F3] border border-dashed border-[#DCE4D9] rounded-[12px] space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#1F6B4A]/10 flex items-center justify-center text-[#1F6B4A]">
              <Sprout className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#102D24]">
                {isTa ? 'பதிவு செய்யப்பட்ட பண்ணைகள் எதுவும் இல்லை' : 'No Farm Parcels Registered Yet'}
              </h3>
              <p className="text-xs sm:text-sm text-[#52665A] font-sans max-w-md mx-auto leading-relaxed">
                {isTa
                  ? 'உங்கள் முதல் வயலைச் சேர்த்து, பயிர் ரகம், பரப்பளவு மற்றும் நடவுத் தேதியைப் பதிவு செய்யவும்.'
                  : 'Add your first farm parcel to organize your crop plots, calibrate disease alerts, and receive stage-specific agronomic advice.'}
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="btn-primary text-xs py-2.5 px-5 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>{isTa ? 'முதல் பண்ணையைச் சேர்க்க' : 'Register Your First Farm'}</span>
            </button>
          </div>
        )}

        {/* Farms Grid in List View */}
        {activeView === 'list' && !isLoading && farms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className={`p-5 bg-white border rounded-[12px] transition-all flex flex-col justify-between shadow-xs ${
                  farm.isPrimary
                    ? 'border-[#1F6B4A] ring-1 ring-[#1F6B4A]/30'
                    : 'border-[#DCE4D9] hover:border-[#1F6B4A]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-xl font-medium text-[#183B2A]">
                          {farm.farmName}
                        </h3>
                        {farm.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#183B2A] text-white rounded-xs">
                            <Star className="w-3 h-3 fill-white" />
                            <span>{isTa ? 'முதன்மை' : 'Primary'}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[#4A584D]">
                        <MapPin className="w-3.5 h-3.5 text-[#426B43] shrink-0" />
                        <span>
                          {farm.locality ? `${farm.locality}, ` : ''}
                          {farm.district}
                        </span>
                        <span>·</span>
                        <span>
                          {farm.landSizeArea ?? farm.landSizeAcres} {farm.areaUnit || 'Acres'}
                        </span>
                      </div>

                      {/* Boundary Status Badge */}
                      {farm.boundary?.coordinates ? (
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {farm.boundary.surveyStatus === 'official_source' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#F59E0B]/10 text-[#B45309] text-[11px] font-mono font-medium border border-[#F59E0B]/30">
                              <Compass className="w-3 h-3 text-[#B45309] shrink-0" />
                              <span>
                                Official Cadastre {farm.boundary.sourceMetadata?.surveyNumber ? `· Survey ${farm.boundary.sourceMetadata.surveyNumber}` : ''} ({farm.boundary.measuredAcres?.toFixed(2) || farm.landSizeAcres} Ac / {farm.boundary.measuredCents?.toFixed(1)} Cts)
                              </span>
                            </span>
                          ) : farm.boundary.surveyStatus === 'imported' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#A855F7]/10 text-[#7E22CE] text-[11px] font-mono font-medium border border-[#A855F7]/30">
                              <Compass className="w-3 h-3 text-[#7E22CE] shrink-0" />
                              <span>
                                Imported Survey ({farm.boundary.sourceMetadata?.fileName || 'File'}) · {farm.boundary.measuredAcres?.toFixed(2) || farm.landSizeAcres} Ac
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#217451]/10 text-[#217451] text-[11px] font-mono font-medium border border-[#217451]/20">
                              <Compass className="w-3 h-3 text-[#217451] shrink-0" />
                              <span>
                                {farm.boundary.measuredAcres?.toFixed(2) || farm.landSizeAcres} Ac ({farm.boundary.measuredCents?.toFixed(1) || Math.round((farm.landSizeAcres || 0)*100)} Cts) · Farmer Mapped
                              </span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-800 text-[11px] font-mono border border-amber-500/20">
                            <span>Unmapped Boundary · Manual Est.</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedMapFarm(farm);
                          setActiveView('cadastre');
                        }}
                        className="p-1.5 text-[#4A584D] hover:text-[#217451] hover:bg-[#EAEFE5] border border-transparent hover:border-[#DCE4D9] rounded-xs cursor-pointer transition-colors"
                        title={isTa ? 'செயற்கைக்கோள் வரைபடத்தில் காண்க' : 'Inspect on Satellite Map'}
                        aria-label="Inspect farm parcel on satellite map"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#217451]" />
                      </button>
                      <button
                        onClick={() => openEditModal(farm)}
                        className="p-1.5 text-[#4A584D] hover:text-[#183B2A] hover:bg-white border border-transparent hover:border-[#D9DED3] rounded-xs cursor-pointer transition-colors"
                        title={isTa ? 'திருத்து' : 'Edit Farm'}
                        aria-label="Edit farm details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(farm)}
                        className="p-1.5 text-[#4A584D] hover:text-[#A94338] hover:bg-white border border-transparent hover:border-[#D9DED3] rounded-xs cursor-pointer transition-colors"
                        title={isTa ? 'நீக்கு' : 'Delete Farm'}
                        aria-label="Delete farm parcel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Crop & Agronomic Metadata */}
                  <div className="bg-white border border-[#E5EBDD] p-3 rounded-xs space-y-2 mb-4 text-xs font-mono">
                    <div className="flex justify-between items-center border-b border-[#F0F2EB] pb-1.5">
                      <span className="text-[#667166] uppercase">{isTa ? 'பயிர் / ரகம்' : 'CROP & CULTIVAR'}:</span>
                      <span className="font-semibold text-[#183B2A] font-serif text-sm">
                        {farm.cropType} {farm.riceVariety ? `(${farm.riceVariety})` : ''}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#F0F2EB] pb-1.5">
                      <span className="text-[#667166] uppercase">{isTa ? 'வளர்ச்சிப் பருவம்' : 'GROWTH STAGE'}:</span>
                      <span className="font-semibold text-[#426B43]">
                        {farm.cropStage || 'Active Tillering'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#F0F2EB] pb-1.5">
                      <span className="text-[#667166] uppercase">{isTa ? 'பாசனம்' : 'IRRIGATION'}:</span>
                      <span className="text-[#202B22]">
                        {farm.irrigationMethod || 'Canal / Cauvery Basin'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#667166] uppercase">{isTa ? 'நடவு தேதி' : 'PLANTED'}:</span>
                      <span className="text-[#202B22]">
                        {farm.plantingDate || (isTa ? 'குறிப்பிடப்படவில்லை' : 'Not recorded')}
                      </span>
                    </div>

                    {farm.notes && (
                      <div className="pt-1.5 border-t border-[#F0F2EB] text-[11px] text-[#4A584D] italic">
                        "{farm.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Farm Card Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5EBDD]">
                  <div className="flex items-center gap-2">
                    {!farm.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(farm)}
                        className="px-2.5 py-1.5 text-[11px] font-mono text-[#183B2A] hover:bg-white border border-[#D9DED3] rounded-xs cursor-pointer transition-colors"
                      >
                        {isTa ? 'முதன்மைப் பண்ணையாக்கு' : 'Set as Primary'}
                      </button>
                    )}
                    <button
                      onClick={() => openQuickStageModal(farm)}
                      className="px-2.5 py-1.5 text-[11px] font-mono text-[#426B43] hover:bg-white border border-[#D9DED3] rounded-xs cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{isTa ? 'பருவம் மாற்று' : 'Update Stage'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onSelectGuidance && (
                      <button
                        onClick={() => onSelectGuidance(farm)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF9F3] hover:bg-[#E5EBDD] text-[#183B2A] border border-[#D9DED3] font-mono text-xs rounded-xs cursor-pointer transition-colors"
                      >
                        <Sprout className="w-3.5 h-3.5 text-[#426B43]" />
                        <span>{isTa ? 'வழிகாட்டல்' : 'Guidance'}</span>
                      </button>
                    )}

                    {onScanFarm && (
                      <button
                        onClick={() => onScanFarm(farm)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183B2A] hover:bg-[#122c20] text-white font-mono text-xs font-semibold rounded-xs cursor-pointer transition-colors shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isTa ? 'ஸ்கேன் செய்' : 'Scan Plot'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Farm Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className={`bg-[#FAF9F3] border-2 border-[#183B2A] ${isMappingDrawerOpen ? 'max-w-4xl' : 'max-w-xl'} w-full p-6 sm:p-8 shadow-2xl my-6 max-h-[92vh] overflow-y-auto transition-all`}>
            <div className="flex items-center justify-between border-b border-[#D9DED3] pb-4 mb-6">
              <div>
                <span className="text-xs font-mono text-[#426B43] uppercase tracking-wider block font-semibold">
                  CADASTRAL REGISTRATION · FIRESTORE SUBCOLLECTION
                </span>
                <h3 className="font-serif text-2xl font-medium text-[#183B2A]">
                  {editingFarm
                    ? (isTa ? 'பண்ணை விவரங்களைத் திருத்து' : 'Edit Farm Plot Details')
                    : (isTa ? 'புதிய பண்ணைப் பதிவு' : 'Register New Farm Plot')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#4A584D] hover:text-[#183B2A] p-2 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-[#A94338]/10 border border-[#A94338] text-[#A94338] text-xs font-sans rounded-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFarm} className="space-y-4">
              <div>
                <label htmlFor="farmNameInput" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                  {isTa ? 'பண்ணை / வயல் பெயர் *' : 'Farm / Parcel Name *'}
                </label>
                <input
                  id="farmNameInput"
                  type="text"
                  required
                  placeholder={isTa ? 'எ.கா: கிழக்கு வயல் (East Parcel)' : 'e.g. East Field (Kizhakku Vayal)'}
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                />
              </div>

              {/* District & Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="farmDistrictInput" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                    {isTa ? 'மாவட்டம் *' : 'District *'}
                  </label>
                  <select
                    id="farmDistrictInput"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                  >
                    {TN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="farmLocalityInput" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                    {isTa ? 'கிராமம் / தாலுகா' : 'Village / Locality'}
                  </label>
                  <input
                    id="farmLocalityInput"
                    type="text"
                    placeholder={isTa ? 'எ.கா: வலங்கைமான்' : 'e.g. Valangaiman Taluk'}
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Crop & Variety */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="farmCropTypeInput" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                    {isTa ? 'பயிரிடப்படும் பயிர் *' : 'Cultivated Crop *'}
                  </label>
                  <select
                    id="farmCropTypeInput"
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                  >
                    {AVAILABLE_CROPS.map((c) => (
                      <option key={c.id} value={c.name}>
                        {isTa ? c.nameTa : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="farmVarietyInput" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                    {isTa ? 'ரகம் / கலப்பினம்' : 'Cultivar / Variety'}
                  </label>
                  {cropType.toLowerCase().includes('rice') || cropType.toLowerCase().includes('paddy') ? (
                    <select
                      id="farmVarietyInput"
                      value={riceVariety}
                      onChange={(e) => setRiceVariety(e.target.value)}
                      className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                    >
                      {RICE_VARIETIES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="farmVarietyInput"
                      type="text"
                      placeholder="e.g. Local Hybrid / TNAU release"
                      value={riceVariety}
                      onChange={(e) => setRiceVariety(e.target.value)}
                      className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                    />
                  )}
                </div>
              </div>

              {/* Area & Irrigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="farmAreaInput" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                    {isTa ? 'நிலப்பரப்பு மற்றும் அலகு' : 'Plot Area & Unit'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="farmAreaInput"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={landSizeArea}
                      onChange={(e) => setLandSizeArea(e.target.value)}
                      className="w-2/3 p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                    />
                    <select
                      id="farmAreaUnitSelect"
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value as any)}
                      className="w-1/3 p-3 bg-white border border-[#D9DED3] text-xs font-mono text-[#202B22] focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                    >
                      {AREA_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u === 'Acres' ? (isTa ? 'ஏக்கர்' : 'Acres') : u === 'Cents' ? (isTa ? 'சென்ட்' : 'Cents') : (isTa ? 'ஹெக்.' : 'Hectares')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="farmIrrigationSelect" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                    {isTa ? 'பாசன முறை' : 'Irrigation Method'}
                  </label>
                  <select
                    id="farmIrrigationSelect"
                    value={irrigationMethod}
                    onChange={(e) => setIrrigationMethod(e.target.value)}
                    className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                  >
                    {IRRIGATION_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {isTa ? m.labelTa : m.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Satellite Cadastral Boundary Section */}
              <div className="p-4 bg-white border border-[#D9DED3] rounded-[10px] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#217451]" />
                    <span className="text-xs font-mono font-bold text-[#183B2A] uppercase">
                      {isTa ? 'செயற்கைக்கோள் எல்லை & நேரடி நில அளவீடு' : 'Satellite Cadastral Boundary & Live Measurement'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMappingDrawerOpen(!isMappingDrawerOpen)}
                    className="px-3 py-1.5 text-xs font-mono bg-[#EAEFE5] hover:bg-[#DCE4D9] text-[#217451] font-semibold rounded-[6px] border border-[#B8DCC1] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>
                      {isMappingDrawerOpen
                        ? (isTa ? 'வரைபடத்தை மறை' : 'Hide GIS Map')
                        : boundary
                        ? (isTa ? 'எல்லையை திருத்து' : 'Adjust Boundary')
                        : (isTa ? 'எல்லை வரைக' : 'Map on Satellite')}
                    </span>
                  </button>
                </div>

                {boundary ? (
                  <div className="p-3.5 bg-[#EAEFE5]/60 border border-[#B8DCC1] rounded-[8px] space-y-2 text-xs font-mono text-[#183B2A]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#217451]">
                        <CheckCircle2 className="w-4 h-4 text-[#217451]" />
                        <span>{isTa ? 'செயற்கைக்கோள் எல்லை பதிவு செய்யப்பட்டது' : 'Satellite Geodesic Polygon Captured'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBoundary(undefined)}
                        className="text-[11px] text-[#A94338] hover:underline cursor-pointer"
                      >
                        {isTa ? 'எல்லையை நீக்கு' : 'Remove Boundary'}
                      </button>
                    </div>

                    {/* Provenance Tag */}
                    <div className="flex items-center gap-2 pt-0.5 flex-wrap text-[11px]">
                      {boundary.surveyStatus === 'official_source' ? (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#F59E0B]/20 text-[#B45309] font-bold">
                          🏛️ Official Cadastral Record · {boundary.sourceMetadata?.surveyNumber ? `Survey ${boundary.sourceMetadata.surveyNumber}` : 'Government WFS'}
                        </span>
                      ) : boundary.surveyStatus === 'imported' ? (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#A855F7]/20 text-[#7E22CE] font-bold">
                          📂 Imported Survey File · {boundary.sourceMetadata?.fileName || 'Spatial File'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#217451]/20 text-[#217451] font-bold">
                          ✏️ Farmer-Mapped Outline (Unverified by e-Adangal)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div className="bg-white/80 p-2 rounded-[6px] border border-[#B8DCC1]/60">
                        <span className="text-[#52665A] block text-[10px]">ACRES:</span>
                        <span className="font-bold text-[#183B2A] text-sm">{boundary.measuredAcres?.toFixed(2)} Ac</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-[6px] border border-[#B8DCC1]/60">
                        <span className="text-[#52665A] block text-[10px]">TN CENTS:</span>
                        <span className="font-bold text-[#217451] text-sm">{boundary.measuredCents?.toFixed(1)} Cts</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-[6px] border border-[#B8DCC1]/60">
                        <span className="text-[#52665A] block text-[10px]">SQ METRES:</span>
                        <span className="font-bold text-[#183B2A]">{boundary.measuredAreaSqMeters?.toLocaleString('en-IN')} m²</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-[6px] border border-[#B8DCC1]/60">
                        <span className="text-[#52665A] block text-[10px]">PERIMETER:</span>
                        <span className="font-bold text-[#183B2A]">{boundary.measuredPerimeterMeters} m</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#52665A] pt-1.5 border-t border-[#DCE4D9] flex items-center justify-between">
                      <span>Farmer-Mapped Boundary (Unverified by Tamil Nadu Land Survey / e-Adangal)</span>
                      {boundary.centroid && (
                        <span>Centroid: {boundary.centroid[0].toFixed(4)}, {boundary.centroid[1].toFixed(4)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#52665A] font-sans leading-relaxed">
                    {isTa
                      ? 'செயற்கைக்கோள் வரைபடத்தில் உங்கள் நிலத்தின் மூலைகளைக் குறிக்கவும். பரப்பளவு தமிழ்நாட்டு சென்ட், ஏக்கர் மற்றும் சதுர மீட்டரில் தானாகவே கணக்கிடப்பட்டு படிவத்தில் நிரப்பப்படும்.'
                      : 'Draw parcel boundary corners directly on live satellite imagery. Geodesic area will be calculated automatically in Tamil Nadu Cents, Acres, and m² and applied to this record.'}
                  </p>
                )}

                {/* Embedded GIS Interactive Workspace inside Modal */}
                {isMappingDrawerOpen && (
                  <div className="pt-3 border-t border-[#D9DED3]">
                    <FarmGISMap
                      initialDistrict={district || profile?.district || 'Karur'}
                      initialState={profile?.state || 'Tamil Nadu'}
                      farmerProfile={profile}
                      selectedFarm={editingFarm ? { ...editingFarm, boundary } : boundary ? ({ farmName: farmName || 'New Plot', district, cropType, boundary } as any) : undefined}
                      className="min-h-[440px]"
                      onSaveBoundary={(newBoundary, measuredAcres, measuredCents) => {
                        setBoundary(newBoundary);
                        if (areaUnit === 'Cents') {
                          setLandSizeArea(String(measuredCents.toFixed(1)));
                        } else if (areaUnit === 'Hectares') {
                          setLandSizeArea(String(newBoundary.measuredHectares?.toFixed(3) || (measuredAcres * 0.4047).toFixed(2)));
                        } else {
                          setLandSizeArea(String(measuredAcres.toFixed(2)));
                        }
                        setIsMappingDrawerOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Stage & Planting Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="farmDateInput" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                    {isTa ? 'விதைப்பு / நடவு தேதி' : 'Planting Date'}
                  </label>
                  <input
                    id="farmDateInput"
                    type="date"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="farmStageInput" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                    {isTa ? 'வளர்ச்சிப் பருவம்' : 'Growth Stage'}
                  </label>
                  <select
                    id="farmStageInput"
                    value={cropStage}
                    onChange={(e) => setCropStage(e.target.value)}
                    className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                  >
                    {CROP_STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {isTa ? s.labelTa : s.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Farm Notes */}
              <div>
                <label htmlFor="farmNotesTextarea" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                  {isTa ? 'பண்ணைக் குறிப்புகள்' : 'Plot Notes'}
                </label>
                <textarea
                  id="farmNotesTextarea"
                  rows={2}
                  placeholder={isTa ? 'மண் தன்மை, பாசன அட்டவணை போன்ற குறிப்புகள்...' : 'Soil type, water source observations, recent amendments...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A]"
                />
              </div>

              {/* Primary checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#183B2A]">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="accent-[#183B2A] w-4 h-4 cursor-pointer"
                  />
                  <span className="font-semibold">
                    {isTa ? 'இந்த வயலை முதன்மைப் பண்ணையாக அமைக்கவும்' : 'Designate as primary field parcel for daily monitoring'}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9DED3]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-mono text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
                >
                  {isTa ? 'ரத்துசெய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#183B2A] text-white font-mono text-xs font-semibold hover:bg-[#122c20] rounded-xs cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-2 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving to Firestore...'}</span>
                    </>
                  ) : (
                    <span>{editingFarm ? (isTa ? 'புதுப்பி' : 'Update Farm') : (isTa ? 'பண்ணையைச் சேமி' : 'Save Farm Parcel')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stage Update Modal */}
      {stageModalFarm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FAF9F3] border-2 border-[#183B2A] max-w-md w-full p-6 shadow-2xl rounded-xs">
            <div className="flex items-center justify-between border-b border-[#D9DED3] pb-3 mb-4">
              <h3 className="font-serif text-xl font-medium text-[#183B2A]">
                {isTa ? 'பயிர் வளர்ச்சிப் பருவம் புதுப்பி' : 'Update Crop Stage'}
              </h3>
              <button
                onClick={() => setStageModalFarm(null)}
                className="text-[#4A584D] hover:text-[#183B2A] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-mono text-[#426B43] mb-4">
              PARCEL: <span className="font-bold text-[#183B2A]">{stageModalFarm.farmName}</span>
            </p>

            <form onSubmit={handleSaveQuickStage} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                  {isTa ? 'விதைப்பு / நடவு தேதி' : 'Planting Date'}
                </label>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                  {isTa ? 'தற்போதைய வளர்ச்சிப் பருவம்' : 'Current Crop Stage'}
                </label>
                <select
                  value={quickStage}
                  onChange={(e) => setQuickStage(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                >
                  {CROP_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {isTa ? s.labelTa : s.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9DED3]">
                <button
                  type="button"
                  onClick={() => setStageModalFarm(null)}
                  className="px-4 py-2 text-xs font-mono text-[#4A584D] cursor-pointer"
                >
                  {isTa ? 'ரத்துசெய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isQuickUpdating}
                  className="px-5 py-2.5 bg-[#183B2A] text-white font-mono text-xs font-semibold rounded-xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isQuickUpdating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  <span>{isTa ? 'சேமி' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

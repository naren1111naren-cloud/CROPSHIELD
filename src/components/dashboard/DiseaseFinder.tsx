import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnalysisResult, FarmRecord } from '../../types';
import { CROP_REGISTRY, getAllCrops, getCropConfig } from '../../config/cropRegistry';
import {
  Upload,
  Camera,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Microscope,
  FileCheck,
  BookmarkCheck,
  RotateCcw,
  ShieldAlert,
  Sprout,
  HelpCircle,
  Info,
  MapPin,
  Layers,
  ShieldCheck,
  Send,
  Check,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';

import { ContextualHelpModal, ScanContextHelp } from './ContextualHelpModal';
import { apiFetch } from '../../lib/apiClient';
import { motion, AnimatePresence } from 'motion/react';
import {
  imagePreviewVariants,
  resultRevealVariants,
  buttonHoverTap,
  cardHoverTap,
  scanLaserVariants,
  scanGridPulseVariants,
  scanReticleVariants,
  scanTargetBoxVariants,
  staggerContainer,
  itemVariants,
  meterBarVariants,
} from '../../lib/motion';
import { AnimatedCounter } from '../common/AnimatedCounter';

interface DiseaseFinderProps {
  onSaveToLog: (result: AnalysisResult, imagePreview: string, file?: File | null, farmId?: string) => void;
  initialCropId?: string;
  selectedFarm?: FarmRecord | null;
  farms?: FarmRecord[];
  farmerCrops?: string[];
  onSelectFarm?: (farm: FarmRecord) => void;
  onGetAgriculturalHelp?: (context: ScanContextHelp) => void;
  onStartFieldCaseInvestigation?: (imagePreview: string, cropId: string, variety: string, farmId?: string) => void;
  onNavigateToHistory?: () => void;
}

// Preset specimens for instant evaluation in demo/offline testing
const SAMPLE_SPECIMENS = [
  {
    id: 'rice-blast',
    cropId: 'rice',
    title: 'Rice: Suspected Blast',
    titleTa: 'நெல்: குலை நோய் சந்தேகம்',
    variety: 'BPT 5204 (Samba Mahsuri)',
    notes: 'Spindle-shaped lesions with grayish centers on upper leaves after 6 hours of morning dew.',
    svgType: 'blast',
  },
  {
    id: 'rice-blb',
    cropId: 'rice',
    title: 'Rice: Suspected BLB',
    titleTa: 'நெல்: இலைக்கருகல் சந்தேகம்',
    variety: 'CR 1009 Sub 1',
    notes: 'Wavy water-soaked yellowing running down leaf margins. Field has continuous standing water.',
    svgType: 'blb',
  },
  {
    id: 'tomato-early-blight',
    cropId: 'tomato',
    title: 'Tomato: Early Blight',
    titleTa: 'தக்காளி: முன் கருகல் நோய்',
    variety: 'Shivam Hybrid',
    notes: 'Concentric target-board rings with yellow halos on lower mature foliage.',
    svgType: 'early_blight',
  },
  {
    id: 'chilli-anthracnose',
    cropId: 'chilli',
    title: 'Chilli: Anthracnose',
    titleTa: 'மிளகாய்: காய் அழுகல் / நுனிக்கருகல்',
    variety: 'K2',
    notes: 'Sunken circular spots on upper leaves and die-back of young twig tips.',
    svgType: 'anthracnose',
  },
  {
    id: 'cotton-blight',
    cropId: 'cotton',
    title: 'Cotton: Angular Leaf Spot',
    titleTa: 'பருத்தி: கோண இலைப்புள்ளி',
    variety: 'MCU 5',
    notes: 'Angular water-soaked lesions bounded by leaf veinlets on lower canopy.',
    svgType: 'angular_spot',
  },
  {
    id: 'maize-turcicum',
    cropId: 'maize',
    title: 'Maize: Turcicum Blight',
    titleTa: 'மக்காச்சோளம்: டர்சிகம் கருகல்',
    variety: 'Pioneer 30V92',
    notes: 'Long elliptical cigar-shaped grayish-tan lesions on lower leaves.',
    svgType: 'turcicum',
  },
];

function createSpecimenDataUrl(type: string, title: string): string {
  const colorMap: Record<string, { bg: string; stroke: string; spot: string }> = {
    blast: { bg: '#EBF2E8', stroke: '#217451', spot: '#A94338' },
    blb: { bg: '#F2EFEB', stroke: '#217451', spot: '#B87922' },
    early_blight: { bg: '#F5EFE6', stroke: '#5C381E', spot: '#8C3D26' },
    anthracnose: { bg: '#F0F3E8', stroke: '#217451', spot: '#A94338' },
    angular_spot: { bg: '#EDF2EB', stroke: '#217451', spot: '#9E382A' },
    turcicum: { bg: '#F5F2EB', stroke: '#615438', spot: '#784E2D' },
  };
  const c = colorMap[type] || colorMap.blast;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="${c.bg}"/>
    <line x1="0" y1="200" x2="600" y2="200" stroke="#DFE6DB" stroke-width="1" stroke-dasharray="4 4"/>
    <path d="M 150 380 Q 280 220 300 40 Q 320 220 450 380" fill="none" stroke="${c.stroke}" stroke-width="8"/>
    <path d="M 290 80 Q 210 120 180 200" fill="none" stroke="${c.stroke}" stroke-width="4"/>
    <path d="M 310 100 Q 390 140 420 220" fill="none" stroke="${c.stroke}" stroke-width="4"/>
    <ellipse cx="230" cy="150" rx="24" ry="10" transform="rotate(-30 230 150)" fill="${c.spot}" opacity="0.85"/>
    <ellipse cx="230" cy="150" rx="10" ry="4" transform="rotate(-30 230 150)" fill="#FAF9F3"/>
    <ellipse cx="360" cy="170" rx="18" ry="8" transform="rotate(30 360 170)" fill="${c.spot}" opacity="0.85"/>
    <text x="30" y="50" font-family="monospace" font-size="14" fill="#0B241B" font-weight="bold">FIELD SPECIMEN: ${title}</text>
    <text x="30" y="75" font-family="monospace" font-size="11" fill="#64766B">TNAU AGRO-CLIMATIC PATHOLOGY CALIBRATION</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DiseaseFinder: React.FC<DiseaseFinderProps> = ({
  onSaveToLog,
  initialCropId = 'rice',
  selectedFarm,
  farms = [],
  farmerCrops = [],
  onSelectFarm,
  onGetAgriculturalHelp,
  onStartFieldCaseInvestigation,
  onNavigateToHistory,
}) => {
  const { language, t } = useLanguage();
  const isTa = language === 'ta';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Target Crop Selection
  const allCrops = getAllCrops();
  const [selectedCropId, setSelectedCropId] = useState<string>(initialCropId);
  const currentCropConfig = getCropConfig(selectedCropId);

  // Associated Farm Plot ID
  const [activeFarmId, setActiveFarmId] = useState<string>(selectedFarm?.id || '');

  // Form & Image States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVariety, setSelectedVariety] = useState<string>(
    selectedFarm?.riceVariety || currentCropConfig.sampleVarieties[0] || 'Standard Cultivar'
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(selectedFarm?.district || 'Thanjavur');
  const [cropStage, setCropStage] = useState<string>(selectedFarm?.cropStage || 'Active Tillering (21 - 45 DAT)');
  const [fieldNotes, setFieldNotes] = useState<string>('');

  // Processing & UI States
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Expert Escalation Modal States
  const [showExpertModal, setShowExpertModal] = useState<boolean>(false);
  const [expertSubmitting, setExpertSubmitting] = useState<boolean>(false);
  const [expertConfirmed, setExpertConfirmed] = useState<boolean>(false);
  const [expertPhone, setExpertPhone] = useState<string>('');
  const [expertUrgency, setExpertUrgency] = useState<'Standard' | 'Urgent'>('Standard');
  const [isContextualHelpOpen, setIsContextualHelpOpen] = useState<boolean>(false);

  // Synchronize when initialCropId changes
  useEffect(() => {
    if (initialCropId) {
      setSelectedCropId(initialCropId);
    }
  }, [initialCropId]);

  // Synchronize state when selectedFarm changes
  useEffect(() => {
    if (selectedFarm) {
      setActiveFarmId(selectedFarm.id || '');
      if (selectedFarm.district) {
        setSelectedDistrict(selectedFarm.district);
      }
      if (selectedFarm.riceVariety) {
        setSelectedVariety(selectedFarm.riceVariety);
      }
      if (selectedFarm.cropStage) {
        setCropStage(selectedFarm.cropStage);
      }

      // Map farm cropType to cropId
      const lowerCrop = (selectedFarm.cropType || '').toLowerCase();
      if (lowerCrop.includes('tomato')) setSelectedCropId('tomato');
      else if (lowerCrop.includes('chilli')) setSelectedCropId('chilli');
      else if (lowerCrop.includes('cotton')) setSelectedCropId('cotton');
      else if (lowerCrop.includes('maize')) setSelectedCropId('maize');
      else if (lowerCrop.includes('rice') || lowerCrop.includes('paddy')) setSelectedCropId('rice');
    }
  }, [selectedFarm]);

  // Update variety options when crop species selection changes
  useEffect(() => {
    const config = getCropConfig(selectedCropId);
    if (config.sampleVarieties.length > 0) {
      setSelectedVariety((prev) => {
        if (config.sampleVarieties.includes(prev)) return prev;
        return config.sampleVarieties[0];
      });
    }
  }, [selectedCropId]);

  // File validation handler (checks format, size, corruption)
  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    setAnalysisResult(null);
    setIsSaved(false);

    // 1. Format validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(
        isTa
          ? 'தவறான கோப்பு வடிவம். JPEG, PNG அல்லது WebP படங்களை மட்டுமே பயன்படுத்தவும்.'
          : 'Unsupported image format. Please select a JPEG, PNG, or WebP photograph.'
      );
      return;
    }

    // 2. Maximum file size validation (15 MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg(
        isTa
          ? 'படத்தின் அளவு 15 MBக்கு குறைவாக இருக்க வேண்டும்.'
          : 'File size exceeds 15 MB limit. Please select a compressed leaf photograph.'
      );
      return;
    }

    // 3. Minimum file size validation (detect empty/corrupt files)
    if (file.size < 512) {
      setErrorMsg(
        isTa
          ? 'தேர்ந்தெடுக்கப்பட்ட படம் காலியாக உள்ளது அல்லது சிதைந்துள்ளது.'
          : 'Selected file is empty or corrupted. Please capture a new image.'
      );
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();

    reader.onerror = () => {
      setErrorMsg(
        isTa
          ? 'படத்தைப் படிப்பதில் பிழை ஏற்பட்டது. தயவுசெய்து வேறு படத்தைத் தேர்ந்தெடுக்கவும்.'
          : 'Error reading file stream. Please try selecting the image again.'
      );
    };

    reader.onload = (e) => {
      const resultDataUrl = e.target?.result as string;
      if (!resultDataUrl) {
        setErrorMsg('Failed to process image preview.');
        return;
      }
      setImagePreview(resultDataUrl);
    };

    reader.readAsDataURL(file);
  };

  // Sample Specimen Quick Select
  const handleSelectSample = (sample: typeof SAMPLE_SPECIMENS[0]) => {
    setErrorMsg(null);
    setAnalysisResult(null);
    setIsSaved(false);
    setSelectedCropId(sample.cropId);
    setSelectedVariety(sample.variety);
    setFieldNotes(sample.notes);
    const dataUrl = createSpecimenDataUrl(sample.svgType, isTa ? sample.titleTa : sample.title);
    setImagePreview(dataUrl);
    setSelectedFile(null);
  };

  // Drag and drop handlers with active drag state
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Execute Analysis via Server-Side Specialist Pathology Pipeline
  const handleAnalyze = async () => {
    if (isLoading) return; // Prevent duplicate submissions

    if (!imagePreview) {
      setErrorMsg(
        isTa
          ? 'முதலில் ஆய்வுக்கான பயிர் இலைப் புகைப்படத்தைப் பதிவேற்றவும்.'
          : 'Please select or capture a crop leaf photograph before requesting diagnosis.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep(
      isTa
        ? 'இலைப் படத்தின் தரம், குவியம் மற்றும் வெளிச்சம் சோதிக்கப்படுகிறது...'
        : 'Evaluating leaf specimen focus, contrast, and illumination...'
    );

    const stepTimer1 = setTimeout(() => {
      setLoadingStep(
        isTa
          ? 'நோயியல் அறிகுறிகள் மற்றும் இலை விளிம்பு மாற்றங்கள் பகுப்பாய்வு செய்யப்படுகின்றன...'
          : 'Extracting lesion geometry, margin discoloration, and symptom patterns...'
      );
    }, 1400);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep(
        isTa
          ? 'TNAU பயிர் பாதுகாப்பு வழிகாட்டல்கள் மற்றும் மாவட்ட இடர் சூழலுடன் ஒப்பிடப்படுகிறது...'
          : 'Calibrating against TNAU agronomic standards and district agro-climatic conditions...'
      );
    }, 2800);

    try {
      // 25-second client timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await apiFetch('/api/analyze-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          cropId: selectedCropId,
          imageBase64: imagePreview,
          variety: selectedVariety,
          district: selectedDistrict,
          cropStage: cropStage,
          fieldNotes: fieldNotes,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let defaultMsg = `Server returned HTTP ${response.status}`;
        if (response.status === 404) {
          defaultMsg = isTa
            ? 'பயிர் ஆய்வு சர்வர் முனைப்புள்ளி கிடைக்கவில்லை (HTTP 404). சர்வர் நிலையைச் சரிபார்க்கவும்.'
            : 'Crop pathology inference endpoint was not found (HTTP 404). Please ensure backend service is active.';
        }
        throw new Error(
          (isTa && errorData.messageTamil) ||
            errorData.message ||
            defaultMsg
        );
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAnalysisResult({
          ...resData.data,
          source: resData.data.source || 'gemini-3.8-flash',
          timestamp: resData.data.timestamp || new Date().toISOString(),
        });
      } else {
        throw new Error(resData.error || 'Diagnostic evaluation failed.');
      }
    } catch (err: any) {
      console.error('Crop analysis evaluation failed:', err);
      if (err.name === 'AbortError') {
        setErrorMsg(
          isTa
            ? 'ஆய்வுக்கான கால அவகாசம் முடிவடைந்தது (Timeout). உங்கள் இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
            : 'Analysis request timed out after 25 seconds. Please check your network and retry.'
        );
      } else {
        setErrorMsg(
          err.message ||
            (isTa
              ? 'ஆய்வில் பிழை ஏற்பட்டது. மீண்டும் முயற்சி செய்யவும்.'
              : 'Failed to complete crop analysis. Please verify your connection and retry.')
        );
      }
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSaveResult = async () => {
    if (analysisResult && imagePreview && !isSaved && !isSaving) {
      setIsSaving(true);
      try {
        await onSaveToLog(analysisResult, imagePreview, selectedFile, activeFarmId || selectedFarm?.id);
        setIsSaved(true);
      } catch (err) {
        console.error('Save to log failed:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setErrorMsg(null);
    setIsSaved(false);
    setIsSaving(false);
    setShowExpertModal(false);
    setExpertConfirmed(false);
  };

  return (
    <div className="space-y-8 min-w-0">
      {/* ========================================================
          1. CROP SELECTION & FIELD PARCEL CONTEXT
          ======================================================== */}
      <div className="bg-white border border-[#DFE6DB] p-6 lg:p-8 rounded-[16px] shadow-xs space-y-6">
        <div className="border-b border-[#DFE6DB] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-xs font-mono uppercase text-[#217451] tracking-wider font-semibold flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#217451]" />
              <span>{isTa ? 'பயிர் தேர்வு மற்றும் நோயியல் ஆய்வு' : 'CROP SPECIES SELECTION & VISION PATHOLOGY'}</span>
            </span>
            <span className="text-xs font-mono text-[#64766B] bg-[#E5F1E8] px-2.5 py-0.5 rounded-full font-medium">
              {isTa ? '5 ஆதரிக்கப்படும் பயிர்கள்' : '5 SUPPORTED CROPS'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] tracking-tight">
            {isTa ? 'பயிரைத் தேர்ந்தெடுத்து இலையை ஆய்வு செய்யவும்' : 'Select Crop Species & Inspect Foliage'}
          </h2>
          <p className="text-sm sm:text-base text-[#64766B] mt-1.5 font-sans leading-relaxed max-w-3xl">
            {isTa
              ? 'உங்கள் பயிரைத் தேர்வுசெய்து, பாதிக்கப்பட்ட இலை அல்லது தண்டை இயற்கை பகல் வெளிச்சத்தில் தெளிவாகப் படம் பிடிக்கவும். கணினிப் பார்வை நோயியல் அறிகுறிகள் மற்றும் TNAU அங்கீகரித்த நெறிமுறைகளை வழங்கும்.'
              : 'Choose your crop species and capture or upload a clear, well-lit photograph of an affected leaf blade or sheath. CropShield vision pathology evaluates lesion morphology against certified agronomic standards.'}
          </p>
        </div>

        {/* Farmer Plots Quick Select Strip (if available) */}
        {(farms.length > 0 || farmerCrops.length > 0) && (
          <div className="p-4 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[12px] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-[#0B241B] font-semibold uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#217451]" />
                <span>{isTa ? 'உங்கள் பதிவு செய்யப்பட்ட பண்ணை நிலங்கள்' : 'Your Registered Farm Parcels'}</span>
              </span>
              {activeFarmId && (
                <span className="text-[11px] font-mono text-[#217451] bg-[#E5F1E8] px-2.5 py-0.5 rounded-full font-semibold">
                  {isTa ? 'பண்ணை இணைக்கப்பட்டுள்ளது' : 'Plot Connected to Inspection'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {farms.map((farm) => {
                const isCurrentFarm = farm.id === activeFarmId;
                return (
                  <button
                    key={farm.id}
                    type="button"
                    onClick={() => {
                      if (onSelectFarm) onSelectFarm(farm);
                      setActiveFarmId(farm.id || '');
                      if (farm.district) setSelectedDistrict(farm.district);
                      if (farm.riceVariety) setSelectedVariety(farm.riceVariety);
                      if (farm.cropStage) setCropStage(farm.cropStage);
                      const lower = (farm.cropType || '').toLowerCase();
                      if (lower.includes('tomato')) setSelectedCropId('tomato');
                      else if (lower.includes('chilli')) setSelectedCropId('chilli');
                      else if (lower.includes('cotton')) setSelectedCropId('cotton');
                      else if (lower.includes('maize')) setSelectedCropId('maize');
                      else if (lower.includes('rice') || lower.includes('paddy')) setSelectedCropId('rice');
                    }}
                    className={`px-3.5 py-2 text-xs font-mono rounded-[8px] border transition-colors cursor-pointer flex items-center gap-2 min-h-[38px] ${
                      isCurrentFarm
                        ? 'bg-[#0B241B] text-white border-[#0B241B] font-bold shadow-xs'
                        : 'bg-white text-[#172D24] border-[#DFE6DB] hover:border-[#217451]'
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5 text-[#70B77E]" />
                    <span>{farm.farmName}</span>
                    <span className="opacity-75 font-normal">({farm.cropType})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Crop Species Selector Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-mono text-[#64766B] uppercase font-semibold">
            {isTa ? 'ஆய்வுக்கான பயிரைத் தேர்ந்தெடுக்கவும்' : 'Target Crop Species'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {allCrops.map((crop) => {
              const isSelected = selectedCropId === crop.cropId;
              const isValidated = crop.supportedStatus === 'validated';

              return (
                <button
                  key={crop.cropId}
                  onClick={() => {
                    setSelectedCropId(crop.cropId);
                    setErrorMsg(null);
                    setAnalysisResult(null);
                  }}
                  className={`p-3.5 sm:p-4 text-left border rounded-[12px] transition-all cursor-pointer flex flex-col justify-between min-h-[96px] ${
                    isSelected
                      ? 'border-[#217451] bg-[#E5F1E8]/50 ring-2 ring-[#217451] shadow-xs'
                      : 'border-[#DFE6DB] bg-white hover:border-[#217451] hover:bg-[#F5F4EA]'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div>
                    <div className="font-bold text-base text-[#0B241B] font-['Plus_Jakarta_Sans']">
                      {isTa ? crop.cropNameTamil : crop.cropNameEnglish}
                    </div>
                    <div className="text-[11px] font-mono text-[#64766B] italic truncate mt-0.5">
                      {crop.scientificName}
                    </div>
                  </div>

                  <div className="mt-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] uppercase font-semibold ${
                        isValidated
                          ? 'bg-[#217451] text-white'
                          : 'bg-[#DFE6DB] text-[#0B241B]'
                      }`}
                    >
                      {isTa ? crop.statusBadge.ta : crop.statusBadge.en}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Model Status Note */}
          <div className="pt-1 text-xs font-mono text-[#64766B] flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#217451] shrink-0" />
            <span>
              {isTa ? currentCropConfig.description.ta : currentCropConfig.description.en}
            </span>
          </div>
        </div>

        {/* Quick Demo Sample Specimens Strip */}
        <div className="p-4 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[12px] space-y-2.5">
          <div className="text-xs font-mono text-[#0B241B] font-semibold uppercase flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Microscope className="w-4 h-4 text-[#217451]" />
              <span>{isTa ? 'மாதிரி வயல் ஒளிப்படத்தை உடனே சோதிக்க:' : 'Quick-Test with Preloaded Field Specimens:'}</span>
            </div>
            <span className="text-[11px] text-[#64766B] font-normal">
              {isTa ? 'டெமோ / கள உதாரணங்கள்' : 'Instant Pathology Demos'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {SAMPLE_SPECIMENS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`p-2.5 text-left border bg-white hover:border-[#217451] hover:bg-[#E5F1E8] transition-colors cursor-pointer rounded-[8px] min-h-[50px] shadow-2xs ${
                  selectedCropId === sample.cropId
                    ? 'border-[#217451] ring-1 ring-[#217451]/40'
                    : 'border-[#DFE6DB]'
                }`}
              >
                <div className="text-xs font-semibold text-[#0B241B] truncate">
                  {isTa ? sample.titleTa : sample.title}
                </div>
                <div className="text-[10px] font-mono text-[#64766B] truncate mt-0.5">
                  {sample.variety}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================
            2. UPLOAD & CAMERA CAPTURE WORKSPACE
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* Left Column: Dropzone & Image Preview */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!imagePreview ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed transition-all p-8 sm:p-12 text-center cursor-pointer flex flex-col items-center justify-center min-h-[320px] rounded-[16px] group ${
                    isDragging
                      ? 'border-[#217451] bg-[#E5F1E8]/70 ring-2 ring-[#217451]/30'
                      : 'border-[#DFE6DB] hover:border-[#217451] bg-[#F5F4EA] hover:bg-white'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  aria-label="Upload clear photo of your crop foliage"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />

                  <div className="w-16 h-16 rounded-[14px] bg-[#E5F1E8] text-[#217451] flex items-center justify-center mb-4 shadow-xs group-hover:scale-105 transition-transform">
                    <Camera className="w-8 h-8" />
                  </div>

                  <p className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] mb-1.5">
                    {isTa ? 'பயிரின் தெளிவான புகைப்படத்தைப் பதிவேற்றவும்' : 'Upload or capture a clear crop leaf photo'}
                  </p>
                  <p className="text-xs sm:text-sm text-[#64766B] max-w-md mb-5 leading-relaxed font-sans">
                    {isTa
                      ? 'JPEG, PNG, WebP வடிவம் · 15 MBக்கு கீழ் · இயற்கை பகல் வெளிச்சத்தில் இலை நரம்புகள் தெளிவாக தெரியுமாறு படம் எடுக்கவும்'
                      : 'Drag & drop image or browse files · Supports JPEG, PNG, WebP up to 15 MB · Natural daylight inspection recommended'}
                  </p>

                  {/* Dual Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="px-4.5 py-2.5 bg-[#217451] hover:bg-[#1b5e42] text-white text-xs font-semibold rounded-[10px] transition-colors flex items-center gap-2 cursor-pointer shadow-xs min-h-[42px]"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isTa ? 'கேமரா மூலம் படம் பிடிக்க' : 'Capture with Camera'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-4.5 py-2.5 bg-white border border-[#DFE6DB] hover:bg-[#E5F1E8] text-[#0B241B] text-xs font-semibold rounded-[10px] transition-colors flex items-center gap-2 cursor-pointer min-h-[42px]"
                    >
                      <Upload className="w-4 h-4 text-[#217451]" />
                      <span>{isTa ? 'கோப்பைத் தேர்ந்தெடு' : 'Browse Files'}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  variants={imagePreviewVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="relative border border-[#DFE6DB] bg-[#F5F4EA] p-3.5 rounded-[16px] shadow-xs"
                >
                  {/* Viewfinder Aspect Frame */}
                  <div className="relative aspect-4/3 max-h-[380px] w-full bg-black/5 overflow-hidden flex items-center justify-center rounded-[12px]">
                    <img
                      src={imagePreview}
                      alt={`${selectedCropId} leaf inspection specimen`}
                      className={`max-h-full max-w-full object-contain transition-all duration-300 ${
                        isLoading ? 'scale-[1.02] filter contrast-105' : ''
                      }`}
                    />

                    {/* Viewfinder Target Reticle / Ambient HUD */}
                    {!isLoading && (
                      <div className="absolute inset-0 pointer-events-none border border-[#0B241B]/15 flex items-center justify-center">
                        <div className="w-10 h-10 border border-[#B87922]/70 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-[#B87922] rounded-full" />
                        </div>
                      </div>
                    )}

                    {/* SOPHISTICATED LEAF PATHOLOGY SCANNING HUD OVERLAY */}
                    <AnimatePresence>
                      {isLoading && (
                        <motion.div
                          key="scanning-hud"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="absolute inset-0 pointer-events-none overflow-hidden"
                        >
                          {/* 1. Subtle Botanical Coordinate Grid */}
                          <motion.div
                            variants={scanGridPulseVariants}
                            initial="initial"
                            animate="animate"
                            className="absolute inset-0 bg-[radial-gradient(#217451_1.5px,transparent_1.5px)] [background-size:22px_22px] z-10"
                          />

                          {/* 2. Sweeping Laser Beam & Trailing Gradient Aura */}
                          <motion.div
                            variants={scanLaserVariants}
                            initial="initial"
                            animate="animate"
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#70B77E] to-transparent shadow-[0_0_20px_4px_rgba(112,183,126,0.95)] z-20"
                          />

                          {/* 3. Corner Viewfinder Brackets */}
                          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#70B77E] z-25" />
                          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#70B77E] z-25" />
                          <div className="absolute bottom-12 left-3 w-6 h-6 border-b-2 border-l-2 border-[#70B77E] z-25" />
                          <div className="absolute bottom-12 right-3 w-6 h-6 border-b-2 border-r-2 border-[#70B77E] z-25" />

                          {/* 4. Lesion Pattern Acquisition Boxes */}
                          <motion.div
                            variants={scanTargetBoxVariants}
                            initial="hidden"
                            animate={['visible', 'pulse']}
                            className="absolute top-[28%] left-[36%] w-28 h-18 border border-[#70B77E] rounded-[4px] z-25 flex flex-col justify-between p-1 bg-[#217451]/15 backdrop-blur-[1px]"
                          >
                            <div className="flex items-center justify-between text-[8px] font-mono font-bold text-[#70B77E] bg-[#0B241B]/90 px-1 py-0.5 rounded-[2px] leading-tight">
                              <span>FOLIAR LESION</span>
                              <span>ROI #01</span>
                            </div>
                            <div className="text-[7.5px] font-mono text-white/90 bg-[#0B241B]/80 px-1 rounded-[2px] self-end">
                              NECROSIS MARGIN
                            </div>
                          </motion.div>

                          <motion.div
                            variants={scanTargetBoxVariants}
                            initial="hidden"
                            animate={['visible', 'pulse']}
                            transition={{ delay: 0.35 }}
                            className="absolute bottom-[28%] right-[18%] w-24 h-14 border border-[#D7AD63] rounded-[4px] z-25 flex flex-col justify-between p-1 bg-[#D7AD63]/10 backdrop-blur-[1px]"
                          >
                            <div className="flex items-center justify-between text-[8px] font-mono font-bold text-[#D7AD63] bg-[#0B241B]/90 px-1 py-0.5 rounded-[2px] leading-tight">
                              <span>CHLOROSIS</span>
                              <span>ROI #02</span>
                            </div>
                            <div className="text-[7.5px] font-mono text-white/90 bg-[#0B241B]/80 px-1 rounded-[2px] self-end">
                              COLOR TRANSITION
                            </div>
                          </motion.div>

                          {/* 5. Top Status HUD Bar */}
                          <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-30">
                            <div className="inline-flex items-center gap-2 bg-[#0B241B]/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-mono text-[#70B77E] border border-[#70B77E]/30 shadow-md">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#70B77E] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#70B77E]" />
                              </span>
                              <span className="font-semibold tracking-wider">
                                {isTa ? 'இலை நோயியல் ஆய்வு ஸ்கேன்...' : 'DIGITAL PATHOLOGY SCAN'}
                              </span>
                            </div>

                            <div className="bg-[#0B241B]/90 backdrop-blur-md px-2.5 py-1 rounded-[6px] text-[10px] font-mono text-white/80 border border-white/10 shadow-md">
                              TNAU ENGINE
                            </div>
                          </div>

                          {/* 6. Bottom Step Progress HUD Banner */}
                          <div className="absolute bottom-3 inset-x-3 bg-[#0B241B]/90 backdrop-blur-md p-2 rounded-[8px] border border-[#217451]/50 z-30 flex items-center gap-2.5 text-xs font-mono text-[#70B77E] shadow-lg">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-[#70B77E]" />
                            <span className="truncate">
                              {loadingStep || (isTa ? 'இலை மாதிரி பகுப்பாய்வு செய்யப்படுகிறது...' : 'Evaluating leaf specimen focus & pathology...')}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Specimen Info & Replace / Remove Controls */}
                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#64766B] px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#0B241B] font-bold uppercase">
                        {isTa ? currentCropConfig.cropNameTamil : currentCropConfig.cropNameEnglish} SPECIMEN
                      </span>
                      {selectedFile && <span>({(selectedFile.size / 1024).toFixed(0)} KB)</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#217451] hover:underline cursor-pointer font-semibold p-1"
                      >
                        {isTa ? 'வேறு படம் மாற்ற' : 'Replace photo'}
                      </button>
                      <span>·</span>
                      <button
                        onClick={handleReset}
                        className="text-[#B8423A] hover:underline cursor-pointer font-semibold p-1"
                      >
                        {isTa ? 'நீக்குக' : 'Remove photo'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Banner with Retry */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-4 p-4 bg-[#FAF2F1] border border-[#B8423A]/30 text-[#B8423A] text-xs sm:text-sm font-sans flex items-start gap-3 rounded-[12px] shadow-xs"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className="font-bold block font-mono">
                      {isTa ? 'ஆய்வு அறிவிப்பு' : 'Diagnostic Inspection Notice'}
                    </span>
                    <p className="text-xs leading-relaxed">{errorMsg}</p>
                    {imagePreview && (
                      <button
                        onClick={handleAnalyze}
                        className="mt-2 text-xs font-semibold text-[#0B241B] bg-white border border-[#B8423A]/40 px-3 py-1 rounded-[6px] hover:bg-[#FAF2F1] cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{isTa ? 'மீண்டும் பகுப்பாய்வு செய்க' : 'Retry Analysis'}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Agronomic & Field Context Form */}
          <div className="lg:col-span-5 bg-[#F5F4EA] border border-[#DFE6DB] p-5 sm:p-6 space-y-4 rounded-[14px]">
            <div className="text-xs font-mono text-[#0B241B] font-bold uppercase tracking-wider border-b border-[#DFE6DB] pb-2 flex items-center justify-between">
              <span>{isTa ? 'கள சுற்றுச்சூழல் விவரங்கள்' : 'Field Environmental Context'}</span>
              <Sprout className="w-4 h-4 text-[#217451]" />
            </div>

            {/* Cultivar / Variety Select */}
            <div>
              <label htmlFor="cropVarietySelect" className="block text-xs font-mono text-[#64766B] uppercase mb-1 font-semibold">
                {isTa ? `${currentCropConfig.cropNameTamil} ரகம் / வகை` : `${currentCropConfig.cropNameEnglish} Cultivar / Variety`}
              </label>
              <select
                id="cropVarietySelect"
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#DFE6DB] text-sm text-[#0B241B] focus:border-[#217451] rounded-[8px] font-sans min-h-[42px]"
              >
                {currentCropConfig.sampleVarieties.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
                <option value="Other / Local Cultivar">
                  {isTa ? 'மற்ற உள்ளூர் ரகம்' : 'Other / Local Cultivar'}
                </option>
              </select>
            </div>

            {/* District / Basin Select */}
            <div>
              <label htmlFor="cropDistrictSelect" className="block text-xs font-mono text-[#64766B] uppercase mb-1 font-semibold">
                {isTa ? 'மாவட்டம் / பாசன மண்டலம்' : 'Field District / Agro-Climatic Basin'}
              </label>
              <select
                id="cropDistrictSelect"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#DFE6DB] text-sm text-[#0B241B] focus:border-[#217451] rounded-[8px] font-sans min-h-[42px]"
              >
                <option value="Thanjavur">Thanjavur (தஞ்சாவூர் - Cauvery Lower Basin)</option>
                <option value="Tiruvarur">Tiruvarur (திருவாரூர் - Central Delta Tail-end)</option>
                <option value="Mayiladuthurai">Mayiladuthurai (மயிலாடுதுறை - Coastal Alluvial)</option>
                <option value="Nagapattinam">Nagapattinam (நாகப்பட்டினம் - Coastal Delta)</option>
                <option value="Cuddalore">Cuddalore (கடலூர்)</option>
                <option value="Madurai">Madurai (மதுரை - Periyar-Vaigai Basin)</option>
                <option value="Tiruchirappalli">Tiruchirappalli (திருச்சிராப்பள்ளி - Upper Delta)</option>
                <option value="Pudukkottai">Pudukkottai (புதுக்கோட்டை)</option>
                <option value="Tiruvannamalai">Tiruvannamalai (திருவண்ணாமலை)</option>
                <option value="Villupuram">Villupuram (விழுப்புரம்)</option>
              </select>
            </div>

            {/* Growth Stage Select */}
            <div>
              <label htmlFor="cropStageSelect" className="block text-xs font-mono text-[#64766B] uppercase mb-1 font-semibold">
                {isTa ? 'பயிர் வளர்ச்சிப் பருவம்' : 'Crop Growth Stage'}
              </label>
              <select
                id="cropStageSelect"
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#DFE6DB] text-sm text-[#0B241B] focus:border-[#217451] rounded-[8px] font-sans min-h-[42px]"
              >
                <option value="Nursery / Seedling (1 - 20 DAT)">
                  {isTa ? 'நாற்றங்கால் / இளம் பயிர் பருவம் (1 - 20 நாட்கள்)' : 'Nursery / Seedling (1 - 20 DAT)'}
                </option>
                <option value="Active Tillering (21 - 45 DAT)">
                  {isTa ? 'தூர்கட்டும் பருவம் / கிளைப்புப் பருவம் (21 - 45 நாட்கள்)' : 'Active Tillering (21 - 45 DAT)'}
                </option>
                <option value="Panicle Initiation (46 - 65 DAT)">
                  {isTa ? 'கதிர் உருவாகும் பருவம் (46 - 65 நாட்கள்)' : 'Panicle Initiation (46 - 65 DAT)'}
                </option>
                <option value="Flowering / Grain Filling (66 - 85 DAT)">
                  {isTa ? 'பூக்கும் பருவம் / பால் பிடிக்கும் பருவம் (66 - 85 நாட்கள்)' : 'Flowering / Grain Filling (66 - 85 DAT)'}
                </option>
                <option value="Maturity / Ripening (86+ DAT)">
                  {isTa ? 'முதிர்ச்சி / அறுவடைப் பருவம் (86+ நாட்கள்)' : 'Maturity / Ripening (86+ DAT)'}
                </option>
              </select>
            </div>

            {/* Visual Observations (Optional) */}
            <div>
              <label htmlFor="cropFieldNotesTextarea" className="block text-xs font-mono text-[#64766B] uppercase mb-1 font-semibold">
                {isTa ? 'களக் குறிப்புகள் / அறிகுறிகள் (விரும்பினால்)' : 'Visual Field Observations / Notes (Optional)'}
              </label>
              <textarea
                id="cropFieldNotesTextarea"
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                placeholder={
                  isTa
                    ? 'எ.கா. காலை பனிப்பொழிவு அதிகம்; நடு இலைகளில் பழுப்பு நிறப் புள்ளிகள்; 4 நாட்களுக்கு முன் உரம் இடப்பட்டது...'
                    : 'e.g. Morning dew lasted over 6 hours; discrete necrotic spots on midribs; drained standing water yesterday...'
                }
                rows={2}
                className="w-full p-2.5 bg-white border border-[#DFE6DB] text-xs sm:text-sm text-[#0B241B] focus:border-[#217451] rounded-[8px] font-sans"
              />
            </div>

            {/* Primary Analysis Action Trigger */}
            <div className="pt-2">
              <button
                onClick={handleAnalyze}
                disabled={isLoading || !imagePreview}
                className={`w-full py-3.5 min-h-[48px] text-sm font-semibold tracking-wide transition-all rounded-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  isLoading || !imagePreview
                    ? 'bg-[#64766B]/30 text-white cursor-not-allowed'
                    : 'bg-[#217451] hover:bg-[#1b5e42] text-white shadow-sm'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{isTa ? 'ஆய்வு நடைபெறுகிறது...' : 'Analyzing Leaf Image...'}</span>
                  </>
                ) : (
                  <>
                    <Microscope className="w-5 h-5" />
                    <span>
                      {isTa
                        ? `${currentCropConfig.cropNameTamil} இலையை ஆய்வு செய்க`
                        : `Analyze ${currentCropConfig.cropNameEnglish} Foliage`}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Multi-step progress indicator */}
              {isLoading && loadingStep && (
                <div className="mt-2.5 text-center text-xs font-mono text-[#217451] animate-pulse">
                  {loadingStep}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. DIAGNOSIS RESULTS DOSSIER
          ======================================================== */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            variants={resultRevealVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white border-2 border-[#0B241B] p-6 lg:p-8 shadow-sm rounded-[16px] space-y-6"
          >
            {/* Dossier Top Bar */}
            <div className="border-b border-[#DFE6DB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#217451] uppercase tracking-wider mb-1 font-semibold">
                  <span className="bg-[#0B241B] text-white px-2 py-0.5 rounded-[4px]">
                    {analysisResult.cropName || currentCropConfig.cropNameEnglish}
                  </span>
                  <span>·</span>
                  <span>
                    {analysisResult.analysisStatus === 'inconclusive'
                      ? (isTa ? 'சரிபார்க்க முடியாத ஒளிப்படம்' : 'INCONCLUSIVE SPECIMEN')
                      : (isTa ? 'கள ஆய்வு முடிவு' : 'PRELIMINARY AI IMAGE SCREENING')}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] tracking-tight">
                  {analysisResult.analysisStatus === 'inconclusive'
                    ? (isTa ? 'தெளிவான முடிவு எட்டப்படவில்லை' : 'Inconclusive Diagnostic Evaluation')
                    : (isTa ? 'பயிர் சுகாதார ஆய்வு அறிக்கை' : 'Crop Pathology Screening Dossier')}
                </h3>
              </div>

              <div className="text-xs font-mono text-[#64766B]">
                TIMESTAMP: {new Date(analysisResult.timestamp).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Inconclusive Feedback Banner (if applicable) */}
            {analysisResult.analysisStatus === 'inconclusive' && (
              <div className="p-5 bg-[#FAF2F1] border-l-4 border-[#B8423A] border-y border-r border-[#DFE6DB] space-y-3 rounded-[10px]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#B8423A] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-base font-bold text-[#0B241B]">
                      {isTa ? 'படத்தின் தரம் போதுமானதாக இல்லை' : 'Photograph Needs Adjustment for Accurate Pathology'}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#64766B] font-sans mt-1">
                      {analysisResult.confidenceInformation ||
                        (isTa
                          ? 'வழங்கப்பட்ட ஒளிப்படத்தில் இலை நரம்புகளோ அல்லது நோய் அறிகுறிகளோ தெளிவாகத் தெரியவில்லை (குவியம் அல்லது வெளிச்சக் குறைபாடு).'
                          : 'The supplied photograph was out of focus, taken in poor lighting, or did not clearly capture characteristic leaf lesions.')}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 border border-[#DFE6DB] text-xs font-sans text-[#172D24] space-y-1.5 rounded-[8px]">
                  <strong>{isTa ? 'மறுபடியும் படம் எடுக்கும் போது கவனிக்க வேண்டியவை:' : 'How to take a better diagnostic photograph:'}</strong>
                  <ul className="list-disc pl-5 space-y-1 text-[#64766B]">
                    <li>{isTa ? 'பாதிக்கப்பட்ட இலையை உள்ளங்கையில் அல்லது சமமான பரப்பில் நேராக வைக்கவும்.' : 'Place the affected leaf blade flat against your palm or a neutral backing.'}</li>
                    <li>{isTa ? 'நிழல் விழாமல் இயற்கை பகல் வெளிச்சத்தில் படம் எடுக்கவும்.' : 'Ensure bright natural daylight without harsh shadows or camera flash reflections.'}</li>
                    <li>{isTa ? 'புள்ளிகள் மற்றும் விளிம்புகள் தெளிவாகத் தெரியும்படி 15-20 செ.மீ அருகிலிருந்து படம் எடுக்கவும்.' : 'Focus sharply on the lesion margins from 15–20 cm away.'}</li>
                  </ul>
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B241B] text-white text-xs font-mono font-semibold rounded-[8px] cursor-pointer hover:bg-[#1b5e42] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isTa ? 'புதிய புகைப்படம் எடுக்க' : 'Capture New Photograph'}</span>
                </button>
              </div>
            )}

            {/* 4-Layer Evidence Sources Distinction */}
            <div className="p-4 sm:p-5 bg-white border border-[#DFE6DB] rounded-[12px] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DFE6DB] pb-2">
                <span className="text-xs font-mono uppercase text-[#0B241B] font-semibold flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#217451]" />
                  <span>{isTa ? '4-அடுக்கு அறிவியல் ஆதார பகுப்பாய்வு' : '4-Layer Evidence Sources Distinction'}</span>
                </span>
                <span className="text-[11px] font-mono text-[#64766B]">
                  REGISTRY {analysisResult.registryVersion || 'v1.0.0'} · MODEL {analysisResult.modelVersion || 'cropshield-v1.0.0'}
                </span>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {/* 1. Specialist Model */}
                <motion.div variants={itemVariants} className="p-3 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[8px]">
                  <div className="text-[10px] font-mono uppercase text-[#217451] font-semibold flex items-center gap-1 mb-1">
                    <Microscope className="w-3.5 h-3.5 text-[#0B241B]" />
                    <span>{isTa ? 'சிறப்பு மாதிரி' : 'Specialist Model'}</span>
                  </div>
                  <p className="text-xs font-sans text-[#172D24] leading-snug">
                    {analysisResult.evidenceDistinction?.specialistPrediction ||
                      (analysisResult.isSpecialistTrainedModel
                        ? 'Trained specialist CNN weights (Paddy Doctor ResNet50)'
                        : 'Multimodal vision screening (Specialist weights host fallback)')}
                  </p>
                </motion.div>

                {/* 2. Multimodal AI Reasoning */}
                <motion.div variants={itemVariants} className="p-3 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[8px]">
                  <div className="text-[10px] font-mono uppercase text-[#0B241B] font-semibold flex items-center gap-1 mb-1">
                    <FileCheck className="w-3.5 h-3.5 text-[#217451]" />
                    <span>{isTa ? 'பார்வை பகுப்பாய்வு' : 'Vision Reasoning'}</span>
                  </div>
                  <p className="text-xs font-sans text-[#172D24] leading-snug">
                    {analysisResult.evidenceDistinction?.multimodalReasoning ||
                      'Visual foliar lesion geometry evaluated against botanical symptom boundaries.'}
                  </p>
                </motion.div>

                {/* 3. Weather Indicators */}
                <motion.div variants={itemVariants} className="p-3 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[8px]">
                  <div className="text-[10px] font-mono uppercase text-[#B87922] font-semibold flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#B87922]" />
                    <span>{isTa ? 'வானிலை இடர் சூழல்' : 'Weather Risk Context'}</span>
                  </div>
                  <p className="text-xs font-sans text-[#172D24] leading-snug">
                    {analysisResult.evidenceDistinction?.weatherRiskIndicators ||
                      `District microclimate risk evaluated for ${selectedDistrict}.`}
                  </p>
                </motion.div>

                {/* 4. Verified Agronomic Guidance */}
                <motion.div variants={itemVariants} className="p-3 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[8px]">
                  <div className="text-[10px] font-mono uppercase text-[#0B241B] font-semibold flex items-center gap-1 mb-1">
                    <Sprout className="w-3.5 h-3.5 text-[#0B241B]" />
                    <span>{isTa ? 'TNAU சரிபார்த்த நெறிமுறை' : 'Verified Agronomy'}</span>
                  </div>
                  <p className="text-xs font-sans text-[#172D24] leading-snug">
                    {analysisResult.evidenceDistinction?.verifiedAgronomicGuidance ||
                      'Strictly adheres to certified TNAU IPM non-chemical priority.'}
                  </p>
                </motion.div>
              </motion.div>

              {/* Confidence Calibration Disclaimer */}
              <div className="p-2.5 bg-[#FAF4EB] border border-[#DFE6DB] text-[11px] font-mono text-[#64766B] flex items-start gap-2 rounded-[6px]">
                <Info className="w-3.5 h-3.5 text-[#B87922] shrink-0 mt-0.5" />
                <span>
                  {isTa
                    ? 'கள ஒளிப்படங்களுக்கான நிகழ்தகவு அளவீடு (Calibration) மேற்கொள்ளப்படவில்லை. எனவே சதவீதங்களுக்கு பதிலாக பண்புசார் உறுதியான அறிகுறிகள் மட்டுமே வழங்கப்பட்டுள்ளன.'
                    : 'Diagnostic Calibration Note: Visual inferences reflect qualitative symptom geometry; model predictions are not a substitute for formal laboratory culture verification.'}
                </span>
              </div>
            </div>

            {/* Condition Identification Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-5 sm:p-6 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[12px] space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-1">
                  <div className="text-xs font-mono uppercase text-[#64766B] font-semibold">
                    {t('resultsCandidate')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B]">
                    {isTa ? analysisResult.conditionNameTamil : analysisResult.conditionName}
                  </div>
                  {analysisResult.pathogen && analysisResult.pathogen !== 'None detected' && (
                    <div className="text-xs sm:text-sm font-mono italic text-[#217451]">
                      {analysisResult.pathogen}
                    </div>
                  )}
                  <div className="text-xs font-mono text-[#64766B] pt-1">
                    {analysisResult.confidenceInformation || 'Preliminary visual interpretation.'}
                  </div>
                </div>

                <div className="md:col-span-4 md:text-right border-t md:border-t-0 md:border-l border-[#DFE6DB] pt-4 md:pt-0 md:pl-6 space-y-1">
                  <span className="text-xs font-mono uppercase text-[#64766B] block font-semibold">
                    {t('resultsSeverity')}
                  </span>
                  <span
                    className={
                      analysisResult.severity === 'high'
                        ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold font-mono uppercase bg-[#FAF2F1] text-[#B8423A] border border-[#B8423A]/30 shadow-2xs'
                        : analysisResult.severity === 'moderate'
                        ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold font-mono uppercase bg-[#FAF4EB] text-[#B87922] border border-[#B87922]/30 shadow-2xs'
                        : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold font-mono uppercase bg-[#E5F1E8] text-[#217451] border border-[#B8DCC1] shadow-2xs'
                    }
                  >
                    {analysisResult.severity.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>

              {/* Genuine Confidence Meter (only rendered if actual confidence value was returned) */}
              {(typeof (analysisResult as any).confidenceScore === 'number' || typeof (analysisResult as any).confidence === 'number') && (
                <div className="pt-3 border-t border-[#DFE6DB]">
                  {(() => {
                    const rawScore = (analysisResult as any).confidenceScore ?? (analysisResult as any).confidence;
                    const percent = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono text-[#64766B]">
                          <span>{isTa ? 'அறிகுறி பொருந்தும் அளவு (உண்மையான மாதிரித் தரவு):' : 'SYMPTOM CONGRUENCE (GENUINE INFERENCE SCORE):'}</span>
                          <span className="font-bold text-[#217451]">
                            <AnimatedCounter value={percent} />%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#DFE6DB] rounded-full overflow-hidden">
                          <motion.div
                            variants={meterBarVariants}
                            initial="hidden"
                            animate="visible"
                            custom={percent}
                            className="h-full bg-gradient-to-r from-[#217451] to-[#70B77E] rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>

            {/* Differential / Alternative Possibilities */}
            {analysisResult.alternativeConditions && analysisResult.alternativeConditions.length > 0 && (
              <div className="p-4 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[10px] space-y-2">
                <div className="text-xs font-mono uppercase text-[#B87922] font-semibold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#B87922]" />
                  <span>{isTa ? 'மாற்று சாத்தியங்கள் (வேறுபாட்டு ஆய்வு)' : 'Alternative Possibilities (Differential Evaluation)'}</span>
                </div>
                <p className="text-xs text-[#64766B] font-sans">
                  {isTa
                    ? 'இலை அறிகுறிகள் மற்ற நிலைமைகளுடனும் பொருந்தக்கூடும்:'
                    : 'Foliar lesions may share visual characteristics with the following candidate conditions:'}
                </p>
                <ul className="text-xs font-sans text-[#172D24] space-y-1">
                  {analysisResult.alternativeConditions.map((alt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#217451] font-bold">•</span>
                      <span>{alt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Symptoms & In-Field Physical Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Visible Foliar Symptoms */}
              <div className="lg:col-span-6 space-y-3">
                <h4 className="text-xs font-mono uppercase text-[#0B241B] font-semibold tracking-wider flex items-center gap-1.5 border-b border-[#DFE6DB] pb-2">
                  <FileCheck className="w-4 h-4 text-[#217451]" />
                  <span>{isTa ? 'இலையில் காணப்பட்ட அறிகுறிகள்' : 'Visible Foliar Symptoms'}</span>
                </h4>
                <ul className="space-y-2.5">
                  {(analysisResult.observedSymptoms || analysisResult.observedCharacteristics).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-[#172D24]">
                      <span className="w-2 h-2 rounded-full bg-[#217451] mt-2 shrink-0" />
                      <span className="font-sans leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* In-Field Verification Steps */}
              <div className="lg:col-span-6 space-y-3">
                <h4 className="text-xs font-mono uppercase text-[#0B241B] font-semibold tracking-wider flex items-center gap-1.5 border-b border-[#DFE6DB] pb-2">
                  <CheckCircle2 className="w-4 h-4 text-[#217451]" />
                  <span>{t('resultsInspectionSteps')}</span>
                </h4>
                <ul className="space-y-2.5">
                  {analysisResult.inspectionSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-[#172D24]">
                      <span className="text-xs font-mono font-bold text-[#0B241B] shrink-0 mt-0.5">
                        {idx + 1}.
                      </span>
                      <span className="font-sans leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Structured Treatment & Prevention Guidance */}
            <div className="space-y-4 pt-2">
              {/* Immediate Care */}
              {((analysisResult.immediateCare && analysisResult.immediateCare.length > 0) ||
                (analysisResult.recommendations && analysisResult.recommendations.length > 0)) && (
                <div className="p-5 sm:p-6 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[12px] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase text-[#0B241B] font-semibold tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#217451]" />
                      <span>{isTa ? 'உடனடிப் பராமரிப்பு நடவடிக்கைகள்' : 'Immediate Care Recommendations'}</span>
                    </h4>
                    <span className="text-[10px] font-mono text-[#64766B] italic">Source: TNAU Agritech Portal</span>
                  </div>
                  <div className="space-y-2.5 text-sm text-[#172D24] font-sans">
                    {(isTa && analysisResult.immediateCareTamil?.length
                      ? analysisResult.immediateCareTamil
                      : (analysisResult.immediateCare?.length
                          ? analysisResult.immediateCare
                          : (isTa && analysisResult.recommendationsTamil?.length
                              ? analysisResult.recommendationsTamil.slice(0, 2)
                              : analysisResult.recommendations?.slice(0, 2) || []))
                    ).map((guide, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-[#217451] font-bold">·</span>
                        <span className="leading-relaxed">{guide}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preventive Practices (Biological IPM) */}
              {((analysisResult.preventivePractices && analysisResult.preventivePractices.length > 0) ||
                (analysisResult.managementGuidance && analysisResult.managementGuidance.length > 0)) && (
                <div className="p-5 sm:p-6 bg-white border border-[#DFE6DB] rounded-[12px] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase text-[#0B241B] font-semibold tracking-wider flex items-center gap-1.5">
                      <Sprout className="w-4 h-4 text-[#217451]" />
                      <span>{isTa ? 'நீண்டகால தடுப்பு முறைகள் (IPM)' : 'Preventive Practices & Agronomic Management'}</span>
                    </h4>
                    <span className="text-[10px] font-mono text-[#64766B] italic">Source: TNAU Crop Production Guide</span>
                  </div>
                  <div className="space-y-2.5 text-sm text-[#172D24] font-sans">
                    {(isTa && analysisResult.preventivePracticesTamil?.length
                      ? analysisResult.preventivePracticesTamil
                      : (analysisResult.preventivePractices?.length
                          ? analysisResult.preventivePractices
                          : (isTa && analysisResult.managementGuidanceTamil?.length
                              ? analysisResult.managementGuidanceTamil
                              : analysisResult.managementGuidance || []))
                    ).map((guide, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-[#217451] font-bold">✓</span>
                        <span className="leading-relaxed">{guide}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Extension Officer Consultation Advice & Disclaimers */}
            <div className="border-t border-[#DFE6DB] pt-5 space-y-4">
              <div className="flex items-start gap-3 p-4 sm:p-5 bg-[#FAF4EB] border border-[#B87922]/30 text-xs sm:text-sm text-[#172D24] rounded-[10px]">
                <ShieldAlert className="w-5 h-5 text-[#B87922] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-[#0B241B] uppercase font-mono block">
                    {isTa ? 'வேளாண் அலுவலர் ஆய்வு வழிகாட்டுதல்' : 'Extension Officer Consultation Advice'}
                  </span>
                  <p className="font-sans leading-relaxed text-[#64766B]">
                    {isTa && analysisResult.expertReviewAdviceTamil
                      ? analysisResult.expertReviewAdviceTamil
                      : analysisResult.expertReviewAdvice}
                  </p>
                  <p className="text-[11px] text-[#64766B]/80 font-mono pt-1">
                    {isTa && analysisResult.uncertaintyNoticeTamil
                      ? analysisResult.uncertaintyNoticeTamil
                      : analysisResult.uncertaintyNotice || analysisResult.disclaimer}
                  </p>
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="text-xs font-mono text-[#64766B]">
                  MODEL: {analysisResult.analysisMethod || 'gemini-3.8-flash (preliminary screening)'}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Contextual Help */}
                  <button
                    type="button"
                    onClick={() => {
                      const ctx: ScanContextHelp = {
                        cropId: selectedCropId,
                        cropName: currentCropConfig.cropNameEnglish,
                        conditionName: analysisResult.conditionName,
                        conditionNameTamil: analysisResult.conditionNameTamil,
                        severity: analysisResult.severity,
                        pathogen: analysisResult.pathogen,
                        imagePath: imagePreview || undefined,
                        observedSymptoms: analysisResult.observedSymptoms,
                        district: selectedDistrict,
                      };
                      if (onGetAgriculturalHelp) {
                        onGetAgriculturalHelp(ctx);
                      } else {
                        setIsContextualHelpOpen(true);
                      }
                    }}
                    className="px-4 py-2 min-h-[42px] text-xs font-mono font-semibold text-[#0B241B] border border-[#DFE6DB] bg-white hover:bg-[#E5F1E8] rounded-[8px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-[#217451]" />
                    <span>{isTa ? 'விவசாய உதவி பெறுக' : 'Get Agricultural Help'}</span>
                  </button>

                  {/* Expert Confirmation Request */}
                  <button
                    type="button"
                    onClick={() => setShowExpertModal(true)}
                    className="px-4 py-2 min-h-[42px] text-xs font-mono font-semibold text-[#0B241B] border border-[#DFE6DB] bg-white hover:bg-[#E5F1E8] rounded-[8px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#217451]" />
                    <span>{isTa ? 'வல்லுநர் கள ஆய்வு கோருக' : 'Request Expert Confirmation'}</span>
                  </button>

                  {/* Save to Log */}
                  <button
                    onClick={handleSaveResult}
                    disabled={isSaved || isSaving}
                    className={`px-5 py-2 min-h-[42px] text-xs font-mono font-semibold rounded-[8px] flex items-center gap-2 cursor-pointer transition-colors shadow-xs ${
                      isSaved
                        ? 'bg-[#E5F1E8] text-[#217451] border border-[#B8DCC1]'
                        : 'bg-[#217451] text-white hover:bg-[#1b5e42]'
                    }`}
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>
                      {isSaving
                        ? (isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving to Log...')
                        : isSaved
                        ? (isTa ? 'பதிவு செய்யப்பட்டது ✓' : 'Saved to Cloud Archive ✓')
                        : t('resultsSaveLog')}
                    </span>
                  </button>

                  {/* If saved, offer shortcut to Scan History */}
                  {isSaved && onNavigateToHistory && (
                    <button
                      onClick={onNavigateToHistory}
                      className="px-4 py-2 min-h-[42px] text-xs font-mono font-semibold text-[#217451] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{isTa ? 'வரலாற்றைக் காண்க →' : 'View in History →'}</span>
                    </button>
                  )}

                  {/* Field Case Investigation Trigger */}
                  {onStartFieldCaseInvestigation && (
                    <button
                      onClick={() =>
                        onStartFieldCaseInvestigation(
                          imagePreview || '',
                          selectedCropId,
                          selectedVariety,
                          selectedFarm?.id
                        )
                      }
                      className="px-4 py-2 min-h-[42px] text-xs font-mono font-semibold rounded-[8px] cursor-pointer flex items-center gap-1.5 bg-white text-[#0B241B] border border-[#DFE6DB] hover:bg-[#E5F1E8] transition-colors shadow-xs"
                    >
                      <Layers className="w-4 h-4 text-[#217451]" />
                      <span>{isTa ? 'கள ஆய்வு வழக்காகத் தொடங்கு' : 'Start Field Case'}</span>
                    </button>
                  )}

                  {/* Inspect Another Leaf */}
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 min-h-[42px] text-xs font-mono text-[#0B241B] border border-[#DFE6DB] hover:bg-[#F5F4EA] rounded-[8px] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isTa ? 'மற்றொரு இலை ஆய்வு' : 'Inspect Another Leaf'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          4. EXPERT CONFIRMATION ESCALATION MODAL
          ======================================================== */}
      {showExpertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#DFE6DB] max-w-lg w-full p-6 sm:p-8 rounded-[16px] shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#DFE6DB] pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-[#217451] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#217451]" />
                  <span>{isTa ? 'வேளாண் வல்லுநர் கள உறுதிப்படுத்தல்' : 'TNAU / KVK EXPERT CONFIRMATION'}</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B] mt-1">
                  {isTa ? 'நேரடி கள ஆய்வுக்கு விண்ணப்பிக்க' : 'Request On-Site Sample Escalation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExpertModal(false)}
                className="p-1 text-[#64766B] hover:text-[#0B241B] cursor-pointer rounded-[6px]"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!expertConfirmed ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setExpertSubmitting(true);
                  setTimeout(() => {
                    setExpertSubmitting(false);
                    setExpertConfirmed(true);
                  }, 800);
                }}
                className="space-y-4"
              >
                <p className="text-xs sm:text-sm text-[#64766B] font-sans leading-relaxed">
                  {isTa
                    ? 'AI கணிப்புகள் ஆரம்ப வழிகாட்டல் மட்டுமே. ரசாயன மருந்துகளைப் பயன்படுத்துவதற்கு முன் வட்டார வேளாண்மை விரிவாக்க அலுவலர் (AEO) அல்லது வேளாண் அறிவியல் மையம் (KVK) நேரடி ஆய்வுக்கு கோரிக்கை அனுப்பவும்.'
                    : 'AI visual screening provides preliminary triage. For severe foliar blight, escalate to your local Village Agricultural Extension Officer (AEO) or Krishi Vigyan Kendra (KVK) specialist.'}
                </p>

                <div className="p-3.5 bg-[#F5F4EA] border border-[#DFE6DB] rounded-[10px] text-xs font-mono space-y-1">
                  <div><strong>CROP:</strong> {selectedCropId.toUpperCase()} ({selectedVariety})</div>
                  <div><strong>DISTRICT:</strong> {selectedDistrict}, Tamil Nadu</div>
                  <div><strong>SUSPECTED:</strong> {analysisResult?.conditionName}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#64766B] mb-1 font-semibold">
                    {isTa ? 'தொடர்பு தொலைபேசி எண்' : 'Farmer Contact Phone Number'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={expertPhone}
                    onChange={(e) => setExpertPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#DFE6DB] text-sm text-[#0B241B] font-mono rounded-[8px] focus:border-[#217451]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#64766B] mb-1 font-semibold">
                    {isTa ? 'அவசர நிலை' : 'Urgency Level'}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        checked={expertUrgency === 'Standard'}
                        onChange={() => setExpertUrgency('Standard')}
                        className="accent-[#217451]"
                      />
                      <span>{isTa ? 'வழக்கமான ஆய்வு (2-3 நாட்கள்)' : 'Standard (2-3 days)'}</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        checked={expertUrgency === 'Urgent'}
                        onChange={() => setExpertUrgency('Urgent')}
                        className="accent-[#B8423A]"
                      />
                      <span className="text-[#B8423A] font-semibold">{isTa ? 'அவசரம் (24 மணி நேரம்)' : 'High Priority (24h)'}</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DFE6DB]">
                  <button
                    type="button"
                    onClick={() => setShowExpertModal(false)}
                    className="px-4 py-2 text-xs font-mono text-[#64766B] hover:text-[#0B241B] cursor-pointer"
                  >
                    {isTa ? 'ரத்து செய்க' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={expertSubmitting}
                    className="px-5 py-2.5 bg-[#217451] hover:bg-[#1b5e42] text-white text-xs font-mono font-semibold rounded-[8px] flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {expertSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{isTa ? 'பதிவாகிறது...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isTa ? 'கோரிக்கையை அனுப்புக' : 'Submit Escalation Request'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-[#E5F1E8] text-[#217451] rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-[#217451]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#0B241B]">
                    {isTa ? 'கோரிக்கை பதிவு செய்யப்பட்டது!' : 'Expert Request Logged Successfully'}
                  </h4>
                  <p className="text-xs font-mono text-[#217451] mt-1 font-semibold">
                    TOKEN: TN-KVK-{selectedDistrict.toUpperCase().slice(0, 3)}-{Math.floor(1000 + Math.random() * 9000)}
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-[#64766B] font-sans leading-relaxed max-w-sm mx-auto">
                  {isTa
                    ? `${selectedDistrict} வட்டார வேளாண்மை விரிவாக்க அலுவலர் அல்லது KVK தொழில்நுட்ப வல்லுநர் தங்கள் இலை மாதிரியை ஆய்வு செய்ய விரைவில் தொடர்பு கொள்வார்கள்.`
                    : `The Agricultural Extension Officer (AEO) serving ${selectedDistrict} has received your foliar specimen dossier and will contact ${expertPhone || 'your registered phone'}.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowExpertModal(false);
                    setExpertConfirmed(false);
                  }}
                  className="px-6 py-2.5 bg-[#217451] text-white text-xs font-mono font-semibold rounded-[8px] cursor-pointer hover:bg-[#1b5e42]"
                >
                  {isTa ? 'முடிந்தது' : 'Done'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          5. CONTEXTUAL HELP MODAL
          ======================================================== */}
      {isContextualHelpOpen && analysisResult && (
        <ContextualHelpModal
          isOpen={isContextualHelpOpen}
          onClose={() => setIsContextualHelpOpen(false)}
          scanContext={{
            cropId: selectedCropId,
            cropName: currentCropConfig.cropNameEnglish,
            conditionName: analysisResult.conditionName,
            conditionNameTamil: analysisResult.conditionNameTamil,
            severity: analysisResult.severity,
            pathogen: analysisResult.pathogen,
            imagePath: imagePreview || undefined,
            observedSymptoms: analysisResult.observedSymptoms,
            district: selectedDistrict,
          }}
          onEscalateToEnquiry={(ctx) => {
            setIsContextualHelpOpen(false);
            if (onGetAgriculturalHelp) {
              onGetAgriculturalHelp(ctx);
            } else {
              setShowExpertModal(true);
            }
          }}
        />
      )}
    </div>
  );
};

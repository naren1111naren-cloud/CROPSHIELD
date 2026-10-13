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
  Check
} from 'lucide-react';

import { ContextualHelpModal, ScanContextHelp } from './ContextualHelpModal';

interface DiseaseFinderProps {
  onSaveToLog: (result: AnalysisResult, imagePreview: string, file?: File | null, farmId?: string) => void;
  initialCropId?: string;
  selectedFarm?: FarmRecord | null;
  farms?: FarmRecord[];
  farmerCrops?: string[];
  onSelectFarm?: (farm: FarmRecord) => void;
  onGetAgriculturalHelp?: (context: ScanContextHelp) => void;
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
    blast: { bg: '#EBF2E8', stroke: '#426B43', spot: '#A94338' },
    blb: { bg: '#F2EFEB', stroke: '#426B43', spot: '#B67B2A' },
    early_blight: { bg: '#F5EFE6', stroke: '#5C381E', spot: '#8C3D26' },
    anthracnose: { bg: '#F0F3E8', stroke: '#2A4A32', spot: '#A94338' },
    angular_spot: { bg: '#EDF2EB', stroke: '#36533A', spot: '#9E382A' },
    turcicum: { bg: '#F5F2EB', stroke: '#615438', spot: '#784E2D' },
  };
  const c = colorMap[type] || colorMap.blast;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="${c.bg}"/>
    <line x1="0" y1="200" x2="600" y2="200" stroke="#D9DED3" stroke-width="1" stroke-dasharray="4 4"/>
    <path d="M 150 380 Q 280 220 300 40 Q 320 220 450 380" fill="none" stroke="${c.stroke}" stroke-width="8"/>
    <path d="M 290 80 Q 210 120 180 200" fill="none" stroke="${c.stroke}" stroke-width="4"/>
    <path d="M 310 100 Q 390 140 420 220" fill="none" stroke="${c.stroke}" stroke-width="4"/>
    <ellipse cx="230" cy="150" rx="24" ry="10" transform="rotate(-30 230 150)" fill="${c.spot}" opacity="0.85"/>
    <ellipse cx="230" cy="150" rx="10" ry="4" transform="rotate(-30 230 150)" fill="#FAF9F3"/>
    <ellipse cx="360" cy="170" rx="18" ry="8" transform="rotate(30 360 170)" fill="${c.spot}" opacity="0.85"/>
    <text x="30" y="50" font-family="monospace" font-size="14" fill="#183B2A" font-weight="bold">FIELD SPECIMEN: ${title}</text>
    <text x="30" y="75" font-family="monospace" font-size="11" fill="#4A584D">TNAU AGRO-CLIMATIC PATHOLOGY CALIBRATION</text>
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
}) => {
  const { language, t } = useLanguage();
  const isTa = language === 'ta';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Crop Selection
  const allCrops = getAllCrops();
  const [selectedCropId, setSelectedCropId] = useState<string>(initialCropId);
  const currentCropConfig = getCropConfig(selectedCropId);

  // Associated Farm Plot ID
  const [activeFarmId, setActiveFarmId] = useState<string>(selectedFarm?.id || '');

  // States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVariety, setSelectedVariety] = useState<string>(
    selectedFarm?.riceVariety || currentCropConfig.sampleVarieties[0] || 'Standard Cultivar'
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(selectedFarm?.district || 'Thanjavur');
  const [fieldNotes, setFieldNotes] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showExpertModal, setShowExpertModal] = useState<boolean>(false);
  const [expertSubmitting, setExpertSubmitting] = useState<boolean>(false);
  const [expertConfirmed, setExpertConfirmed] = useState<boolean>(false);
  const [expertPhone, setExpertPhone] = useState<string>('');
  const [expertUrgency, setExpertUrgency] = useState<'Standard' | 'Urgent'>('Standard');
  const [isContextualHelpOpen, setIsContextualHelpOpen] = useState<boolean>(false);

  // Sync when initialCropId changes
  useEffect(() => {
    if (initialCropId) {
      setSelectedCropId(initialCropId);
    }
  }, [initialCropId]);

  // Sync state when selectedFarm changes
  useEffect(() => {
    if (selectedFarm) {
      setActiveFarmId(selectedFarm.id || '');
      if (selectedFarm.district) {
        setSelectedDistrict(selectedFarm.district);
      }
      if (selectedFarm.riceVariety) {
        setSelectedVariety(selectedFarm.riceVariety);
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

  // Update variety when crop selection changes (unless currently set from farm)
  useEffect(() => {
    const config = getCropConfig(selectedCropId);
    if (config.sampleVarieties.length > 0) {
      setSelectedVariety((prev) => {
        if (config.sampleVarieties.includes(prev)) return prev;
        return config.sampleVarieties[0];
      });
    }
  }, [selectedCropId]);

  // File selection handler with size and format validation
  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    setAnalysisResult(null);
    setIsSaved(false);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(
        isTa
          ? 'தவறான கோப்பு வடிவம். JPEG, PNG அல்லது WebP படங்களை மட்டுமே பயன்படுத்தவும்.'
          : 'Unsupported image format. Please select a JPEG, PNG, or WebP photograph.'
      );
      return;
    }

    // Validate size (< 15MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg(
        isTa
          ? 'படத்தின் அளவு 15MB க்கும் குறைவாக இருக்க வேண்டும்.'
          : 'File size exceeds 15 MB. Please select a smaller photograph.'
      );
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Sample Specimen Select
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

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Execute Analysis via Server-Side API
  const handleAnalyze = async () => {
    if (!imagePreview) {
      setErrorMsg(
        isTa
          ? 'முதலில் ஆய்வுக்கான இலைப் புகைப்படத்தைப் பதிவேற்றவும்.'
          : 'Please select or upload a crop leaf photograph first.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep(
      isTa
        ? 'இலைப் படத்தின் தரம் மற்றும் குவியம் சோதிக்கப்படுகிறது...'
        : 'Evaluating leaf focus, contrast, and resolution...'
    );

    const stepTimer = setTimeout(() => {
      setLoadingStep(
        isTa
          ? 'நோயியல் அறிகுறிகள் மற்றும் TNAU வழிகாட்டல்கள் ஒப்பிடப்படுகின்றன...'
          : 'Analyzing pathological symptom patterns and TNAU IPM protocols...'
      );
    }, 1500);

    try {
      const response = await fetch('/api/analyze-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropId: selectedCropId,
          imageBase64: imagePreview,
          variety: selectedVariety,
          district: selectedDistrict,
          fieldNotes: fieldNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (isTa && errorData.messageTamil) ||
            errorData.message ||
            `Server returned HTTP ${response.status}`
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
      console.error('Crop analysis failed:', err);
      setErrorMsg(
        err.message ||
          (isTa
            ? 'ஆய்வில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
            : 'Failed to complete crop analysis. Please verify your connection and retry.')
      );
    } finally {
      clearTimeout(stepTimer);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSaveResult = () => {
    if (analysisResult && imagePreview) {
      onSaveToLog(analysisResult, imagePreview, selectedFile, activeFarmId || selectedFarm?.id);
      setIsSaved(true);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setErrorMsg(null);
    setIsSaved(false);
    setShowExpertModal(false);
    setExpertConfirmed(false);
  };

  return (
    <div className="space-y-8">
      {/* 1. Crop Selection Header & Tabs */}
      <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs">
        <div className="border-b border-[#D9DED3] pb-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-xs font-mono uppercase text-[#426B43] tracking-wider font-semibold flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#183B2A]" />
              <span>{isTa ? 'பயிர் தேர்வு மற்றும் நோயியல் ஆய்வு' : 'CROP SELECTION & PATHOLOGY SCANNER'}</span>
            </span>
            <span className="text-xs font-mono text-[#4A584D]">
              {isTa ? 'ஆதரிக்கப்படும் பயிர்கள்: 5' : '5 SUPPORTED CROPS'}
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A]">
            {isTa ? 'பயிரைத் தேர்ந்தெடுத்து இலையை ஆய்வு செய்யவும்' : 'Select Crop & Inspect Foliage'}
          </h2>
          <p className="text-sm sm:text-base text-[#4A584D] mt-1 font-sans">
            {isTa
              ? 'உங்கள் பயிரைத் தேர்வுசெய்து, பாதிக்கப்பட்ட இலை அல்லது தண்டை இயற்கை வெளிச்சத்தில் தெளிவாகப் படம் பிடிக்கவும்.'
              : 'Choose your crop species and capture or upload a clear, well-lit leaf photograph for preliminary pathology screening.'}
          </p>
        </div>

        {/* Farmer Plots & Convenient Crop Selection */}
        {(farms.length > 0 || farmerCrops.length > 0) && (
          <div className="mb-6 p-4 bg-[#FAF9F3] border border-[#E5EBDD] rounded-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-[#183B2A] font-semibold uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#426B43]" />
                <span>{isTa ? 'உங்கள் பதிவு செய்யப்பட்ட பண்ணைகள் & பயிர்கள்' : 'Your Registered Plots & Cultivated Crops'}</span>
              </span>
              {activeFarmId && (
                <span className="text-[11px] font-mono text-[#426B43] bg-[#E5EBDD] px-2 py-0.5 rounded-xs font-semibold">
                  {isTa ? 'வயல் இணைக்கப்பட்டுள்ளது' : 'Plot Connected to Scan'}
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
                      const lower = (farm.cropType || '').toLowerCase();
                      if (lower.includes('tomato')) setSelectedCropId('tomato');
                      else if (lower.includes('chilli')) setSelectedCropId('chilli');
                      else if (lower.includes('cotton')) setSelectedCropId('cotton');
                      else if (lower.includes('maize')) setSelectedCropId('maize');
                      else if (lower.includes('rice') || lower.includes('paddy')) setSelectedCropId('rice');
                    }}
                    className={`px-3 py-2 text-xs font-mono rounded-xs border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isCurrentFarm
                        ? 'bg-[#183B2A] text-white border-[#183B2A] font-bold shadow-xs'
                        : 'bg-white text-[#202B22] border-[#D9DED3] hover:border-[#426B43]'
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5 text-[#426B43]" />
                    <span>{farm.farmName}</span>
                    <span className="opacity-80">({farm.cropType})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Crop Selection Button Strip */}
        <div className="mb-8">
          <label className="block text-xs font-mono text-[#4A584D] uppercase mb-2 font-semibold">
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
                  className={`p-3.5 text-left border rounded-xs transition-all cursor-pointer flex flex-col justify-between min-h-[76px] ${
                    isSelected
                      ? 'border-[#183B2A] bg-[#FAF9F3] ring-1 ring-[#183B2A] shadow-xs'
                      : 'border-[#D9DED3] bg-white hover:border-[#426B43] hover:bg-[#FAF9F3]'
                  }`}
                >
                  <div>
                    <div className="font-serif text-base font-semibold text-[#183B2A]">
                      {isTa ? crop.cropNameTamil : crop.cropNameEnglish}
                    </div>
                    <div className="text-[11px] font-mono text-[#4A584D] italic truncate">
                      {crop.scientificName}
                    </div>
                  </div>

                  <div className="mt-2">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs uppercase font-medium ${
                        isValidated
                          ? 'bg-[#183B2A] text-white'
                          : 'bg-[#E5EBDD] text-[#183B2A]'
                      }`}
                    >
                      {isTa ? crop.statusBadge.ta : crop.statusBadge.en}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Model Status Notice */}
          <div className="mt-3 text-xs font-mono text-[#4A584D] flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#426B43] shrink-0" />
            <span>
              {isTa ? currentCropConfig.description.ta : currentCropConfig.description.en}
            </span>
          </div>
        </div>

        {/* Quick Test Sample Specimen Strip */}
        <div className="mb-8 p-4 bg-[#FAF9F3] border border-[#E5EBDD] rounded-xs">
          <div className="text-xs font-mono text-[#183B2A] font-semibold uppercase mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Microscope className="w-4 h-4 text-[#426B43]" />
              <span>{isTa ? 'மாதிரி வயல் ஒளிப்படத்தை உடனே சோதிக்க:' : 'Quick-Test with Preloaded Field Specimens:'}</span>
            </div>
            <span className="text-[11px] text-[#4A584D] font-normal">
              {isTa ? 'டெமோ / கள உதாரணங்கள்' : 'Instant Field Demos'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {SAMPLE_SPECIMENS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`p-2.5 text-left border bg-white hover:border-[#183B2A] hover:bg-[#F7F6EF] transition-colors cursor-pointer rounded-xs min-h-[48px] ${
                  selectedCropId === sample.cropId
                    ? 'border-[#426B43] ring-1 ring-[#426B43]/30'
                    : 'border-[#D9DED3]'
                }`}
              >
                <div className="text-xs font-serif font-medium text-[#183B2A] truncate">
                  {isTa ? sample.titleTa : sample.title}
                </div>
                <div className="text-[10px] font-mono text-[#4A584D] truncate mt-0.5">
                  {sample.variety}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Upload / Camera Capture Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-6">
          {/* Left Column: Dropzone & Image Preview */}
          <div className="lg:col-span-7">
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative border-2 border-dashed border-[#D9DED3] hover:border-[#426B43] transition-colors p-8 sm:p-12 text-center bg-[#FAF9F3] cursor-pointer flex flex-col items-center justify-center min-h-[300px] rounded-xs"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Upload crop leaf photograph"
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

                <div className="w-14 h-14 rounded-xs bg-[#E5EBDD] text-[#183B2A] flex items-center justify-center mb-4 shadow-2xs">
                  <Upload className="w-7 h-7" />
                </div>

                <p className="text-base sm:text-lg font-serif font-medium text-[#183B2A] mb-1">
                  {isTa ? 'இலைப் புகைப்படத்தைப் பதிவேற்ற அழுத்தவும்' : 'Tap to upload a leaf photograph'}
                </p>
                <p className="text-xs font-mono text-[#4A584D] max-w-sm mb-4">
                  {isTa
                    ? 'JPEG, PNG, WebP · 15 MBக்கு கீழ் · இயற்கை பகல் வெளிச்சம் சிறந்தது'
                    : 'Supports JPEG, PNG, WebP · Under 15 MB · Natural daylight recommended'}
                </p>

                {/* Mobile Camera Option Button */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 min-h-[44px] text-xs font-mono font-semibold text-[#183B2A] border border-[#D9DED3] bg-white hover:bg-[#E5EBDD] rounded-xs flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-4 h-4 text-[#426B43]" />
                    <span>{isTa ? 'நேரடி கேமரா மூலம் படம் பிடிக்க' : 'Take Photo with Camera'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 min-h-[44px] text-xs font-mono font-medium text-[#4A584D] border border-[#D9DED3] bg-white hover:bg-[#FAF9F3] rounded-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isTa ? 'கோப்பைத் தேர்ந்தெடு' : 'Browse Files'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative border border-[#D9DED3] bg-[#FAF9F3] p-3 rounded-xs">
                {/* Image Frame with Registration Crosshairs */}
                <div className="relative aspect-4/3 max-h-[360px] w-full bg-black/5 overflow-hidden flex items-center justify-center rounded-xs">
                  <img
                    src={imagePreview}
                    alt={`${selectedCropId} leaf inspection specimen`}
                    className="max-h-full max-w-full object-contain"
                  />
                  {/* Inspection Crosshair Overlay */}
                  <div className="absolute inset-0 pointer-events-none border border-[#183B2A]/20 flex items-center justify-center">
                    <div className="w-8 h-8 border border-[#B67B2A]/60 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-[#B67B2A] rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Replace / Remove Controls */}
                <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#4A584D]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#183B2A] font-semibold uppercase">
                      {isTa ? currentCropConfig.cropNameTamil : currentCropConfig.cropNameEnglish} SPECIMEN
                    </span>
                    {selectedFile && <span>({(selectedFile.size / 1024).toFixed(0)} KB)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="hover:text-[#183B2A] underline cursor-pointer p-1"
                    >
                      {isTa ? 'வேறு படம் மாற்ற' : 'Replace photo'}
                    </button>
                    <span>·</span>
                    <button
                      onClick={handleReset}
                      className="text-[#A94338] hover:underline cursor-pointer p-1"
                    >
                      {isTa ? 'நீக்குக' : 'Remove photo'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 p-4 bg-[#FAF3F2] border border-[#A94338]/40 text-[#A94338] text-xs sm:text-sm font-sans flex items-start gap-2.5 rounded-xs">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block font-mono">
                    {isTa ? 'ஆய்வு பிழை' : 'Inspection Notice'}
                  </span>
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Agronomic Context Inputs */}
          <div className="lg:col-span-5 bg-[#FAF9F3] border border-[#E5EBDD] p-5 sm:p-6 space-y-4 rounded-xs">
            <div className="text-xs font-mono text-[#183B2A] font-semibold uppercase tracking-wider border-b border-[#D9DED3] pb-2">
              {isTa ? 'கள சுற்றுச்சூழல் விவரங்கள்' : 'Field Environmental Context'}
            </div>

            <div>
              <label htmlFor="cropVarietySelect" className="block text-xs font-mono text-[#4A584D] uppercase mb-1 font-semibold">
                {isTa ? `${currentCropConfig.cropNameTamil} ரகம் / வகை` : `${currentCropConfig.cropNameEnglish} Cultivar / Variety`}
              </label>
              <select
                id="cropVarietySelect"
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A] font-sans min-h-[44px] rounded-xs"
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

            <div>
              <label htmlFor="cropDistrictSelect" className="block text-xs font-mono text-[#4A584D] uppercase mb-1 font-semibold">
                {isTa ? 'மாவட்டம் / பாசன மண்டலம்' : 'Field District / Agro-Climatic Basin'}
              </label>
              <select
                id="cropDistrictSelect"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A] font-sans min-h-[44px] rounded-xs"
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

            <div>
              <label htmlFor="cropFieldNotesTextarea" className="block text-xs font-mono text-[#4A584D] uppercase mb-1 font-semibold">
                {isTa ? 'களக் குறிப்புகள் / அறிகுறிகள் (விரும்பினால்)' : 'Visual Field Observations / Notes (Optional)'}
              </label>
              <textarea
                id="cropFieldNotesTextarea"
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                placeholder={
                  isTa
                    ? 'எ.கா. காலை பனிப்பொழிவு அதிகம்; நடு இலைகளில் பழுப்பு நிறப் புள்ளிகள்; 4 நாட்களுக்கு முன் உரம் இடப்பட்டது...'
                    : 'e.g. Heavy overnight dew; spindle spots noticed on middle leaves; standing water drained 2 days ago...'
                }
                rows={3}
                className="w-full p-3 bg-white border border-[#D9DED3] text-xs sm:text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A] font-sans rounded-xs"
              />
            </div>

            {/* Analyze Action Trigger */}
            <div className="pt-2">
              <button
                onClick={handleAnalyze}
                disabled={isLoading || !imagePreview}
                className={`w-full py-4 min-h-[48px] text-sm font-semibold tracking-wide uppercase transition-colors rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  isLoading || !imagePreview
                    ? 'bg-[#4A584D]/40 text-white cursor-not-allowed'
                    : 'bg-[#183B2A] hover:bg-[#122c20] text-white active:scale-[0.99]'
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
                    <span>{isTa ? `${currentCropConfig.cropNameTamil} இலையை ஆய்வு செய்க` : `Analyze ${currentCropConfig.cropNameEnglish} Foliage`}</span>
                  </>
                )}
              </button>

              {/* Progress step message */}
              {isLoading && loadingStep && (
                <div className="mt-2 text-center text-xs font-mono text-[#426B43] animate-pulse">
                  {loadingStep}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Analysis Results Dossier */}
      {analysisResult && (
        <div className="bg-white border-2 border-[#183B2A] p-6 lg:p-8 animate-fadeIn shadow-sm rounded-xs">
          {/* Results Dossier Top Bar */}
          <div className="border-b border-[#D9DED3] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#426B43] uppercase tracking-wider mb-1 font-semibold">
                <span className="bg-[#183B2A] text-white px-2 py-0.5 rounded-xs">
                  {analysisResult.cropName || currentCropConfig.cropNameEnglish}
                </span>
                <span>·</span>
                <span>
                  {analysisResult.analysisStatus === 'inconclusive'
                    ? (isTa ? 'சரிபார்க்க முடியாத ஒளிப்படம்' : 'INCONCLUSIVE SPECIMEN')
                    : (isTa ? 'கள ஆய்வு முடிவு' : 'PRELIMINARY AI IMAGE SCREENING')}
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A]">
                {analysisResult.analysisStatus === 'inconclusive'
                  ? (isTa ? 'தெளிவான முடிவு எட்டப்படவில்லை' : 'Inconclusive Diagnostic Evaluation')
                  : (isTa ? 'பயிர் சுகாதார ஆய்வு அறிக்கை' : 'Crop Pathology Screening Dossier')}
              </h3>
            </div>

            <div className="text-xs font-mono text-[#4A584D]">
              TIMESTAMP: {new Date(analysisResult.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Inconclusive Feedback Banner */}
          {analysisResult.analysisStatus === 'inconclusive' && (
            <div className="mb-6 p-5 bg-[#FAF3F2] border-l-4 border-[#A94338] border-y border-r border-[#D9DED3] space-y-3 rounded-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#A94338] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-base font-semibold text-[#183B2A]">
                    {isTa ? 'படத்தின் தரம் போதுமானதாக இல்லை' : 'Photograph Needs Adjustment for Accurate Pathology'}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4A584D] font-sans mt-1">
                    {analysisResult.confidenceInformation ||
                      (isTa
                        ? 'வழங்கப்பட்ட ஒளிப்படத்தில் இலை நரம்புகளோ அல்லது நோய் அறிகுறிகளோ தெளிவாகத் தெரியவில்லை (குவியம் அல்லது வெளிச்சக் குறைபாடு).'
                        : 'The supplied photograph was out of focus, taken in poor lighting, or did not clearly capture characteristic leaf lesions.')}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 border border-[#D9DED3] text-xs font-sans text-[#202B22] space-y-1">
                <strong>{isTa ? 'மறுபடியும் படம் எடுக்கும் போது கவனிக்க வேண்டியவை:' : 'How to take a better diagnostic photograph:'}</strong>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{isTa ? 'பாதிக்கப்பட்ட இலையை உள்ளங்கையில் அல்லது சமமான பரப்பில் நேராக வைக்கவும்.' : 'Place the affected leaf blade flat against your palm or a neutral backing.'}</li>
                  <li>{isTa ? 'நிழல் விழாமல் இயற்கை பகல் வெளிச்சத்தில் படம் எடுக்கவும்.' : 'Ensure bright natural daylight without harsh shadows or camera flare.'}</li>
                  <li>{isTa ? 'புள்ளிகள் மற்றும் விளிம்புகள் தெளிவாகத் தெரியும்படி 15-20 செ.மீ அருகிலிருந்து படம் எடுக்கவும்.' : 'Focus sharply on the lesion margins from 15–20 cm away.'}</li>
                </ul>
              </div>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#183B2A] text-white text-xs font-mono font-semibold rounded-xs cursor-pointer hover:bg-[#122c20]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isTa ? 'புதிய புகைப்படம் எடுக்க' : 'Capture New Photograph'}</span>
              </button>
            </div>
          )}

          {/* Multi-Source Evidence Distinction (Phase 5 Requirement) */}
          <div className="mb-6 p-4 sm:p-5 bg-white border border-[#D9DED3] rounded-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9DED3] pb-2">
              <span className="text-xs font-mono uppercase text-[#183B2A] font-semibold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#426B43]" />
                <span>{isTa ? '4-அடுக்கு அறிவியல் ஆதார பகுப்பாய்வு' : '4-Layer Evidence Sources Distinction'}</span>
              </span>
              <span className="text-[11px] font-mono text-[#4A584D]">
                REGISTRY {analysisResult.registryVersion || 'v1.0.0'} · MODEL {analysisResult.modelVersion || 'cropshield-v1.0.0'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Specialist Model */}
              <div className="p-3 bg-[#FAF9F3] border border-[#D9DED3] rounded-xs">
                <div className="text-[10px] font-mono uppercase text-[#426B43] font-semibold flex items-center gap-1 mb-1">
                  <Microscope className="w-3.5 h-3.5 text-[#183B2A]" />
                  <span>{isTa ? 'சிறப்பு மாதிரி' : 'Specialist Model'}</span>
                </div>
                <p className="text-xs font-sans text-[#202B22] leading-snug">
                  {analysisResult.evidenceDistinction?.specialistPrediction ||
                    (analysisResult.isSpecialistTrainedModel
                      ? 'Trained specialist CNN weights (Paddy Doctor ResNet50)'
                      : 'Multimodal screening active (Specialist weights pending GPU host)')}
                </p>
              </div>

              {/* 2. Multimodal AI Reasoning */}
              <div className="p-3 bg-[#FAF9F3] border border-[#D9DED3] rounded-xs">
                <div className="text-[10px] font-mono uppercase text-[#183B2A] font-semibold flex items-center gap-1 mb-1">
                  <FileCheck className="w-3.5 h-3.5 text-[#426B43]" />
                  <span>{isTa ? 'பார்வை பகுப்பாய்வு' : 'Vision Reasoning'}</span>
                </div>
                <p className="text-xs font-sans text-[#202B22] leading-snug">
                  {analysisResult.evidenceDistinction?.multimodalReasoning ||
                    'Visual foliar lesion pattern evaluated against botanical symptom boundaries.'}
                </p>
              </div>

              {/* 3. Weather Indicators */}
              <div className="p-3 bg-[#FAF9F3] border border-[#D9DED3] rounded-xs">
                <div className="text-[10px] font-mono uppercase text-[#B67B2A] font-semibold flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#B67B2A]" />
                  <span>{isTa ? 'வானிலை இடர் சூழல்' : 'Weather Risk Context'}</span>
                </div>
                <p className="text-xs font-sans text-[#202B22] leading-snug">
                  {analysisResult.evidenceDistinction?.weatherRiskIndicators ||
                    `District microclimate risk evaluated for ${selectedDistrict}.`}
                </p>
              </div>

              {/* 4. Verified Agronomic Guidance */}
              <div className="p-3 bg-[#FAF9F3] border border-[#D9DED3] rounded-xs">
                <div className="text-[10px] font-mono uppercase text-[#183B2A] font-semibold flex items-center gap-1 mb-1">
                  <Sprout className="w-3.5 h-3.5 text-[#183B2A]" />
                  <span>{isTa ? 'TNAU சரிபார்த்த நெறிமுறை' : 'Verified Agronomy'}</span>
                </div>
                <p className="text-xs font-sans text-[#202B22] leading-snug">
                  {analysisResult.evidenceDistinction?.verifiedAgronomicGuidance ||
                    'Adheres strictly to TNAU IPM recommendations. Non-chemical priority.'}
                </p>
              </div>
            </div>

            {/* Confidence Calibration Boundary Disclaimer */}
            <div className="p-2.5 bg-[#FAF3F2] border border-[#D9DED3] text-[11px] font-mono text-[#4A584D] flex items-start gap-2 rounded-xs">
              <Info className="w-3.5 h-3.5 text-[#B67B2A] shrink-0 mt-0.5" />
              <span>
                {isTa
                  ? 'கள ஒளிப்படங்களுக்கான நிகழ்தகவு அளவீடு (Temperature Calibration) மேற்கொள்ளப்படவில்லை. எனவே சதவீத கணிப்புகளுக்கு பதிலாக பண்புசார் உறுதியான அறிகுறிகள் மட்டுமே வழங்கப்பட்டுள்ளன.'
                  : 'Scientific Confidence Calibration Note: Softmax probabilities are uncalibrated (ECE not measured) on local farm photographs; qualitative diagnostic certainty provided to prevent misleading claims.'}
              </span>
            </div>
          </div>

          {/* Condition Identification Header */}
          <div className="p-5 sm:p-6 bg-[#FAF9F3] border border-[#E5EBDD] mb-8 rounded-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8">
                <div className="text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                  {t('resultsCandidate')}
                </div>
                <div className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A] mb-1">
                  {isTa ? analysisResult.conditionNameTamil : analysisResult.conditionName}
                </div>
                {analysisResult.pathogen && analysisResult.pathogen !== 'None detected' && (
                  <div className="text-xs sm:text-sm font-mono italic text-[#4A584D]">
                    {analysisResult.pathogen}
                  </div>
                )}
                <div className="mt-2 text-xs font-mono text-[#426B43]">
                  {analysisResult.confidenceInformation || 'Preliminary visual interpretation.'}
                </div>
              </div>

              <div className="md:col-span-4 md:text-right border-t md:border-t-0 md:border-l border-[#D9DED3] pt-4 md:pt-0 md:pl-6">
                <span className="text-xs font-mono uppercase text-[#4A584D] block mb-1 font-semibold">
                  {t('resultsSeverity')}
                </span>
                <span
                  className={`inline-block font-mono text-xs sm:text-sm uppercase font-semibold px-3 py-1.5 rounded-xs ${
                    analysisResult.severity === 'high'
                      ? 'bg-[#A94338]/10 text-[#A94338] border border-[#A94338]/30'
                      : analysisResult.severity === 'moderate'
                      ? 'bg-[#B67B2A]/10 text-[#B67B2A] border border-[#B67B2A]/30'
                      : 'bg-[#426B43]/10 text-[#426B43] border border-[#426B43]/30'
                  }`}
                >
                  {analysisResult.severity.toUpperCase()} PRIORITY
                </span>
              </div>
            </div>
          </div>

          {/* Alternative Explanations / Differential Diagnosis */}
          {analysisResult.alternativeConditions && analysisResult.alternativeConditions.length > 0 && (
            <div className="mb-8 p-4 bg-[#FAF9F3] border border-[#E5EBDD] rounded-xs space-y-2">
              <div className="text-xs font-mono uppercase text-[#B67B2A] font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#B67B2A]" />
                <span>{isTa ? 'மாற்று சாத்தியங்கள் (வேறுபாட்டு ஆய்வு)' : 'Alternative Possibilities (Differential Evaluation)'}</span>
              </div>
              <p className="text-xs text-[#4A584D] font-sans">
                {isTa
                  ? 'இலை அறிகுறிகள் மற்ற நிலைமைகளுடனும் பொருந்தக்கூடும்:'
                  : 'Foliar lesions may share visual characteristics with the following candidate conditions:'}
              </p>
              <ul className="text-xs font-sans text-[#202B22] space-y-1">
                {analysisResult.alternativeConditions.map((alt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#426B43]">•</span>
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Observation Details & In-Field Verification */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Characteristics / Observed Symptoms */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider flex items-center gap-1.5 border-b border-[#D9DED3] pb-2">
                <FileCheck className="w-4 h-4 text-[#426B43]" />
                <span>{isTa ? 'இலையில் காணப்பட்ட அறிகுறிகள்' : 'Visible Foliar Symptoms'}</span>
              </h4>
              <ul className="space-y-3">
                {(analysisResult.observedSymptoms || analysisResult.observedCharacteristics).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[#202B22]">
                    <span className="w-2 h-2 rounded-full bg-[#426B43] mt-2 shrink-0"></span>
                    <span className="font-sans leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* In-Field Physical Steps */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider flex items-center gap-1.5 border-b border-[#D9DED3] pb-2">
                <CheckCircle2 className="w-4 h-4 text-[#426B43]" />
                <span>{t('resultsInspectionSteps')}</span>
              </h4>
              <ul className="space-y-3">
                {analysisResult.inspectionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[#202B22]">
                    <span className="text-xs font-mono font-semibold text-[#183B2A] shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>
                    <span className="font-sans leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Immediate Care Recommendations */}
          {((analysisResult.immediateCare && analysisResult.immediateCare.length > 0) ||
            (analysisResult.recommendations && analysisResult.recommendations.length > 0)) && (
            <div className="p-5 sm:p-6 bg-[#FAF9F3] border border-[#E5EBDD] mb-6 rounded-xs">
              <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#426B43]" />
                <span>{isTa ? 'உடனடிப் பராமரிப்பு நடவடிக்கைகள்' : 'Immediate Care Recommendations'}</span>
              </h4>
              <div className="space-y-3 text-sm sm:text-base text-[#202B22] font-sans">
                {(isTa && analysisResult.immediateCareTamil?.length
                  ? analysisResult.immediateCareTamil
                  : (analysisResult.immediateCare?.length
                      ? analysisResult.immediateCare
                      : (isTa && analysisResult.recommendationsTamil?.length
                          ? analysisResult.recommendationsTamil.slice(0, 2)
                          : analysisResult.recommendations?.slice(0, 2) || []))
                ).map((guide, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-[#426B43] font-bold">·</span>
                    <span className="leading-relaxed">{guide}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preventive Practices */}
          {((analysisResult.preventivePractices && analysisResult.preventivePractices.length > 0) ||
            (analysisResult.managementGuidance && analysisResult.managementGuidance.length > 0)) && (
            <div className="p-5 sm:p-6 bg-white border border-[#D9DED3] mb-8 rounded-xs">
              <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider mb-3 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-[#426B43]" />
                <span>{isTa ? 'நீண்டகால தடுப்பு முறைகள் (IPM)' : 'Preventive Practices & Agronomic Management'}</span>
              </h4>
              <div className="space-y-3 text-sm sm:text-base text-[#202B22] font-sans">
                {(isTa && analysisResult.preventivePracticesTamil?.length
                  ? analysisResult.preventivePracticesTamil
                  : (analysisResult.preventivePractices?.length
                      ? analysisResult.preventivePractices
                      : (isTa && analysisResult.managementGuidanceTamil?.length
                          ? analysisResult.managementGuidanceTamil
                          : analysisResult.managementGuidance || []))
                ).map((guide, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-[#426B43] font-bold">✓</span>
                    <span className="leading-relaxed">{guide}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expert Review & Disclaimers */}
          <div className="border-t border-[#D9DED3] pt-6 space-y-4">
            <div className="flex items-start gap-3 p-4 sm:p-5 bg-[#FAF3F2] border border-[#A94338]/30 text-xs sm:text-sm text-[#202B22] rounded-xs">
              <ShieldAlert className="w-5 h-5 text-[#A94338] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#A94338] uppercase font-mono block mb-1">
                  {isTa ? 'வேளாண் அலுவலர் ஆய்வு வழிகாட்டுதல்' : 'Extension Officer Consultation Advice'}
                </span>
                <p className="font-sans leading-relaxed text-[#202B22]/90">
                  {isTa && analysisResult.expertReviewAdviceTamil
                    ? analysisResult.expertReviewAdviceTamil
                    : analysisResult.expertReviewAdvice}
                </p>
                <p className="mt-2 text-[#4A584D] font-mono text-xs">
                  {isTa && analysisResult.uncertaintyNoticeTamil
                    ? analysisResult.uncertaintyNoticeTamil
                    : analysisResult.uncertaintyNotice || analysisResult.disclaimer}
                </p>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-xs font-mono text-[#4A584D]">
                MODEL: {analysisResult.analysisMethod || 'gemini-3.8-flash (preliminary screening)'}
              </div>

              <div className="flex flex-wrap items-center gap-3">
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
                  className="px-4 py-2.5 min-h-[44px] text-xs font-mono font-semibold text-[#183B2A] border border-[#183B2A] bg-[#FAF9F3] hover:bg-[#E5EBDD] rounded-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <HelpCircle className="w-4 h-4 text-[#183B2A]" />
                  <span>{isTa ? 'விவசாய உதவி பெறுக' : 'Get Agricultural Help'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExpertModal(true)}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-mono font-semibold text-[#183B2A] border border-[#183B2A] bg-white hover:bg-[#E5EBDD] rounded-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-[#183B2A]" />
                  <span>{isTa ? 'வல்லுநர் கள ஆய்வு கோருக' : 'Request Expert Confirmation'}</span>
                </button>

                <button
                  onClick={handleSaveResult}
                  disabled={isSaved}
                  className={`px-5 py-2.5 min-h-[44px] text-xs font-mono font-semibold rounded-xs flex items-center gap-2 cursor-pointer transition-colors ${
                    isSaved
                      ? 'bg-[#E5EBDD] text-[#183B2A]'
                      : 'bg-[#183B2A] text-white hover:bg-[#122c20]'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>{isSaved ? t('resultsSaved') : t('resultsSaveLog')}</span>
                </button>

                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 min-h-[44px] text-xs font-mono text-[#183B2A] border border-[#D9DED3] hover:bg-[#E5EBDD] rounded-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isTa ? 'மற்றொரு இலையை ஆய்வு செய்க' : 'Inspect Another Leaf'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expert Confirmation Request Modal */}
      {showExpertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-[#183B2A] max-w-lg w-full p-6 sm:p-8 rounded-xs shadow-xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#D9DED3] pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-[#426B43] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#183B2A]" />
                  <span>{isTa ? 'வேளாண் வல்லுநர் கள உறுதிப்படுத்தல்' : 'TNAU / KVK EXPERT CONFIRMATION'}</span>
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#183B2A] mt-1">
                  {isTa ? 'நேரடி கள ஆய்வுக்கு விண்ணப்பிக்க' : 'Request On-Site Sample Escalation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExpertModal(false)}
                className="p-1 text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
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
                <p className="text-xs sm:text-sm text-[#4A584D] font-sans leading-relaxed">
                  {isTa
                    ? 'AI கணிப்புகள் ஆரம்ப வழிகாட்டல் மட்டுமே. ரசாயன மருந்துகளைப் பயன்படுத்துவதற்கு முன் வட்டார வேளாண்மை விரிவாக்க அலுவலர் (AEO) அல்லது வேளாண் அறிவியல் மையம் (KVK) நேரடி ஆய்வுக்கு கோரிக்கை அனுப்பவும்.'
                    : 'AI visual screening provides preliminary triage. For severe foliar blight, escalate to your local Village Agricultural Extension Officer (AEO) or Krishi Vigyan Kendra (KVK) specialist.'}
                </p>

                <div className="p-3 bg-[#FAF9F3] border border-[#D9DED3] rounded-xs text-xs font-mono space-y-1">
                  <div><strong>CROP:</strong> {selectedCropId.toUpperCase()} ({selectedVariety})</div>
                  <div><strong>DISTRICT:</strong> {selectedDistrict}, Tamil Nadu</div>
                  <div><strong>SUSPECTED:</strong> {analysisResult?.conditionName}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                    {isTa ? 'தொடர்பு தொலைபேசி எண்' : 'Farmer Contact Phone Number'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={expertPhone}
                    onChange={(e) => setExpertPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-mono rounded-xs focus:outline-hidden focus:border-[#183B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                    {isTa ? 'அவசர நிலை' : 'Urgency Level'}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        checked={expertUrgency === 'Standard'}
                        onChange={() => setExpertUrgency('Standard')}
                        className="accent-[#183B2A]"
                      />
                      <span>{isTa ? 'வழக்கமான ஆய்வு (2-3 நாட்கள்)' : 'Standard (2-3 days)'}</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        checked={expertUrgency === 'Urgent'}
                        onChange={() => setExpertUrgency('Urgent')}
                        className="accent-[#A94338]"
                      />
                      <span className="text-[#A94338] font-semibold">{isTa ? 'அவசரம் (24 மணி நேரம்)' : 'High Priority (24h)'}</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9DED3]">
                  <button
                    type="button"
                    onClick={() => setShowExpertModal(false)}
                    className="px-4 py-2 text-xs font-mono text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
                  >
                    {isTa ? 'ரத்து செய்க' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={expertSubmitting}
                    className="px-5 py-2.5 bg-[#183B2A] hover:bg-[#122c20] text-white text-xs font-mono font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer"
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
                <div className="w-12 h-12 bg-[#E5EBDD] text-[#183B2A] rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-[#183B2A]" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-medium text-[#183B2A]">
                    {isTa ? 'கோரிக்கை பதிவு செய்யப்பட்டது!' : 'Expert Request Logged Successfully'}
                  </h4>
                  <p className="text-xs font-mono text-[#426B43] mt-1 font-semibold">
                    TOKEN: TN-KVK-{selectedDistrict.toUpperCase().slice(0, 3)}-{Math.floor(1000 + Math.random() * 9000)}
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-[#4A584D] font-sans leading-relaxed max-w-sm mx-auto">
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
                  className="px-6 py-2.5 bg-[#183B2A] text-white text-xs font-mono font-semibold rounded-xs cursor-pointer hover:bg-[#122c20]"
                >
                  {isTa ? 'முடிந்தது' : 'Done'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contextual Crop-Care Help Modal */}
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


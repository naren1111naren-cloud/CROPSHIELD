import React, { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AnalysisResult } from '../../types';
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
  FileText
} from 'lucide-react';

interface DiseaseFinderProps {
  onSaveToLog: (result: AnalysisResult, imagePreview: string) => void;
}

// Preset specimens for instant evaluation in demo/offline testing
const SAMPLE_SPECIMENS = [
  {
    id: 'blast-sample',
    title: 'Sample A: Suspected Blast',
    variety: 'BPT 5204 (Samba Mahsuri)',
    notes: 'Spindle-shaped lesions with grayish centers observed on upper leaves following 6 hours of morning dew.',
    badge: 'Leaf Blast Specimen',
    svgType: 'blast',
  },
  {
    id: 'blb-sample',
    title: 'Sample B: Suspected BLB',
    variety: 'CR 1009 Sub 1',
    notes: 'Wavy water-soaked yellowing running down leaf edge. Field has standing water after rain.',
    badge: 'Bacterial Blight Specimen',
    svgType: 'blb',
  },
  {
    id: 'brownspot-sample',
    title: 'Sample C: Suspected Brown Spot',
    variety: 'ADT 45',
    notes: 'Round sesame-like brown spots across mature leaves. Sandy loam soil with possible potash deficiency.',
    badge: 'Brown Spot Specimen',
    svgType: 'brownspot',
  },
  {
    id: 'healthy-sample',
    title: 'Sample D: Healthy Leaf',
    variety: 'CO 51',
    notes: 'Uniform emerald green coloration, active tillering, no fungal spots or lesions.',
    badge: 'Healthy Foliage Specimen',
    svgType: 'healthy',
  },
];

function createSpecimenDataUrl(type: string, title: string): string {
  const colorMap: Record<string, { bg: string; stroke: string; spot: string }> = {
    blast: { bg: '#EBF2E8', stroke: '#426B43', spot: '#A94338' },
    blb: { bg: '#F2EFEB', stroke: '#426B43', spot: '#B67B2A' },
    brownspot: { bg: '#EDEFEB', stroke: '#426B43', spot: '#543A26' },
    healthy: { bg: '#E5EBDD', stroke: '#183B2A', spot: '#78965C' },
  };
  const c = colorMap[type] || colorMap.blast;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="${c.bg}"/>
    <line x1="0" y1="200" x2="600" y2="200" stroke="#D9DED3" stroke-width="1" stroke-dasharray="4 4"/>
    <path d="M 150 380 Q 280 220 300 40 Q 320 220 450 380" fill="none" stroke="${c.stroke}" stroke-width="8"/>
    <path d="M 290 80 Q 210 120 180 200" fill="none" stroke="${c.stroke}" stroke-width="4"/>
    <path d="M 310 100 Q 390 140 420 220" fill="none" stroke="${c.stroke}" stroke-width="4"/>
    <ellipse cx="230" cy="150" rx="20" ry="8" transform="rotate(-30 230 150)" fill="${c.spot}" opacity="0.8"/>
    <ellipse cx="230" cy="150" rx="8" ry="3" transform="rotate(-30 230 150)" fill="#FAF9F3"/>
    <ellipse cx="360" cy="170" rx="16" ry="6" transform="rotate(30 360 170)" fill="${c.spot}" opacity="0.8"/>
    <text x="30" y="50" font-family="monospace" font-size="14" fill="#183B2A" font-weight="bold">SPECIMEN FIELD CAPTURE: ${title}</text>
    <text x="30" y="75" font-family="monospace" font-size="11" fill="#4A584D">BOTANICAL REF: ORYZA SATIVA L. · TNAU ADUTHURAI PROTOCOL</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DiseaseFinder: React.FC<DiseaseFinderProps> = ({ onSaveToLog }) => {
  const { language, t } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // States are kept in memory and preserved across language toggling
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVariety, setSelectedVariety] = useState<string>('CR 1009 Sub 1');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Thanjavur');
  const [fieldNotes, setFieldNotes] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // File selection handler with size and format validation
  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    setAnalysisResult(null);
    setIsSaved(false);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(
        language === 'ta'
          ? 'தவறான கோப்பு வடிவம். JPEG, PNG அல்லது WebP படங்களை மட்டுமே பயன்படுத்தவும்.'
          : 'Unsupported format. Please select a JPEG, PNG, or WebP crop image.'
      );
      return;
    }

    // Validate size (< 15MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg(
        language === 'ta'
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
    setSelectedVariety(sample.variety);
    setFieldNotes(sample.notes);
    const dataUrl = createSpecimenDataUrl(sample.svgType, sample.title);
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
        language === 'ta'
          ? 'முதலில் ஆய்வுக்கான நெல் இலைப் புகைப்படத்தைப் பதிவேற்றவும்.'
          : 'Please select or upload a crop photograph first.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/analyze-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          variety: selectedVariety,
          district: selectedDistrict,
          fieldNotes: fieldNotes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAnalysisResult({
          ...resData.data,
          source: resData.source,
          timestamp: resData.timestamp,
          isFallback: resData.isFallback,
        });
      } else {
        throw new Error(resData.error || 'Diagnostic evaluation failed.');
      }
    } catch (err: any) {
      console.error('Crop analysis failed:', err);
      setErrorMsg(
        language === 'ta'
          ? 'ஆய்வில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
          : 'Failed to complete crop analysis. Please verify your connection and retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResult = () => {
    if (analysisResult && imagePreview) {
      onSaveToLog(analysisResult, imagePreview);
      setIsSaved(true);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setErrorMsg(null);
    setIsSaved(false);
  };

  return (
    <div className="space-y-8">
      {/* Upload & Context Workspace */}
      <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs">
        <div className="border-b border-[#D9DED3] pb-4 mb-6">
          <span className="text-xs font-mono uppercase text-[#426B43] tracking-wider block mb-1 font-semibold">
            {language === 'ta' ? 'முதன்மை பயிர் பரிசோதனை' : 'SIGNATURE WORKFLOW · PADDY HEALTH SCAN'}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A]">
            {t('scannerTitle')}
          </h2>
          <p className="text-sm sm:text-base text-[#4A584D] mt-1 font-sans">
            {t('scannerSubtitle')}
          </p>
        </div>

        {/* Quick Test Sample Specimen Strip */}
        <div className="mb-6 p-4 bg-[#FAF9F3] border border-[#E5EBDD]">
          <div className="text-xs font-mono text-[#183B2A] font-semibold uppercase mb-2 flex items-center gap-1.5">
            <Microscope className="w-4 h-4 text-[#426B43]" />
            <span>{t('scannerQuickTestLabel')}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_SPECIMENS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className="p-3 text-left border border-[#D9DED3] bg-white hover:border-[#183B2A] hover:bg-[#F7F6EF] transition-colors cursor-pointer rounded-xs min-h-[44px]"
              >
                <div className="text-xs sm:text-sm font-serif font-medium text-[#183B2A] truncate">
                  {sample.title}
                </div>
                <div className="text-[11px] font-mono text-[#4A584D] truncate mt-0.5">
                  {sample.variety}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Image Dropzone & Preview Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
          <div className="lg:col-span-7">
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative border-2 border-dashed border-[#D9DED3] hover:border-[#426B43] transition-colors p-8 sm:p-12 text-center bg-[#FAF9F3] cursor-pointer flex flex-col items-center justify-center min-h-[300px]"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Upload crop image"
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

                <div className="w-14 h-14 rounded-xs bg-[#E5EBDD] text-[#183B2A] flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7" />
                </div>

                <p className="text-base sm:text-lg font-serif font-medium text-[#183B2A] mb-1">
                  {t('scannerDragDrop')}
                </p>
                <p className="text-xs font-mono text-[#4A584D] max-w-sm">
                  {t('scannerFormatNotice')}
                </p>

                {/* Mobile Camera Option Button */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 min-h-[44px] text-xs font-mono font-medium text-[#183B2A] border border-[#D9DED3] bg-white hover:bg-[#E5EBDD] rounded-xs flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-4 h-4 text-[#426B43]" />
                    <span>{language === 'ta' ? 'கேமரா மூலம் எடுக்க' : 'Camera Capture'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative border border-[#D9DED3] bg-[#FAF9F3] p-3">
                {/* Image Frame with Registration Crosshairs */}
                <div className="relative aspect-4/3 max-h-[360px] w-full bg-black/5 overflow-hidden flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Rice Crop Inspection Specimen"
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
                    <span className="text-[#183B2A] font-semibold">LOADED SPECIMEN</span>
                    {selectedFile && <span>({(selectedFile.size / 1024).toFixed(0)} KB)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="hover:text-[#183B2A] underline cursor-pointer p-1"
                    >
                      {t('scannerReplaceImage')}
                    </button>
                    <span>·</span>
                    <button
                      onClick={handleReset}
                      className="text-[#A94338] hover:underline cursor-pointer p-1"
                    >
                      {t('scannerRemoveImage')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 p-3.5 bg-[#FAF3F2] border border-[#A94338]/40 text-[#A94338] text-xs sm:text-sm font-sans flex items-start gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Right Column: Agronomic Field Context Inputs */}
          <div className="lg:col-span-5 bg-[#FAF9F3] border border-[#E5EBDD] p-5 sm:p-6 space-y-4">
            <div className="text-xs font-mono text-[#183B2A] font-semibold uppercase tracking-wider border-b border-[#D9DED3] pb-2">
              Field Environmental Context
            </div>

            <div>
              <label htmlFor="cropVarietySelect" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                Rice Cultivar / Variety
              </label>
              <select
                id="cropVarietySelect"
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A] font-sans min-h-[44px]"
              >
                <option value="CR 1009 Sub 1">CR 1009 Sub 1 (Long duration · Samba)</option>
                <option value="BPT 5204 (Samba Mahsuri)">BPT 5204 (Fine grain · High blast susceptibility)</option>
                <option value="ADT 45">ADT 45 (Kuruvai short duration)</option>
                <option value="CO 51">CO 51 (Medium duration · TNAU release)</option>
                <option value="TKM 13">TKM 13 (Export fine grain)</option>
                <option value="Karuppu Kavuni">Karuppu Kavuni (Traditional Black Rice)</option>
              </select>
            </div>

            <div>
              <label htmlFor="cropDistrictSelect" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                Field Location / District
              </label>
              <select
                id="cropDistrictSelect"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A] font-sans min-h-[44px]"
              >
                <option value="Thanjavur">Thanjavur (Cauvery Lower Basin)</option>
                <option value="Tiruvarur">Tiruvarur (Central Delta Tail-end)</option>
                <option value="Mayiladuthurai">Mayiladuthurai (Coastal Alluvial)</option>
                <option value="Nagapattinam">Nagapattinam (Coastal Delta)</option>
                <option value="Madurai">Madurai (Periyar-Vaigai Basin)</option>
                <option value="Tiruchirappalli">Tiruchirappalli (Upper Delta)</option>
              </select>
            </div>

            <div>
              <label htmlFor="cropFieldNotesTextarea" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                Visual Field Notes / Weather Observation
              </label>
              <textarea
                id="cropFieldNotesTextarea"
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                placeholder="e.g. Morning mist lasting until 8 AM; spots starting on middle leaves; applied urea 4 days ago..."
                rows={3}
                className="w-full p-3 bg-white border border-[#D9DED3] text-xs sm:text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A] font-sans"
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
                    <span>{t('scannerAnalyzing')}</span>
                  </>
                ) : (
                  <>
                    <Microscope className="w-5 h-5" />
                    <span>{t('scannerButtonAnalyze')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results Dossier (Signature Experience) */}
      {analysisResult && (
        <div className="bg-white border-2 border-[#183B2A] p-6 lg:p-8 animate-fadeIn shadow-sm">
          {/* Results Dossier Top Bar */}
          <div className="border-b border-[#D9DED3] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-[#426B43] uppercase tracking-wider block font-semibold">
                {language === 'ta' ? 'அதிகாரப்பூர்வ கள ஆய்வு முடிவு' : 'CALIBRATED AGRICULTURAL INSPECTION REPORT'}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A]">
                {t('resultsTitle')}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#4A584D]">
                TIMESTAMP: {new Date(analysisResult.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Condition Identification Header */}
          <div className="p-5 sm:p-6 bg-[#FAF9F3] border border-[#E5EBDD] mb-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8">
                <div className="text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                  {t('resultsCandidate')}
                </div>
                <div className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A] mb-1">
                  {language === 'ta' ? analysisResult.conditionNameTamil : analysisResult.conditionName}
                </div>
                <div className="text-xs sm:text-sm font-mono italic text-[#4A584D]">
                  {analysisResult.pathogen}
                </div>
              </div>

              <div className="md:col-span-4 md:text-right border-t md:border-t-0 md:border-l border-[#D9DED3] pt-4 md:pt-0 md:pl-6">
                <span className="text-xs font-mono uppercase text-[#4A584D] block mb-1 font-semibold">
                  {t('resultsSeverity')}
                </span>
                <span
                  className={`inline-block font-mono text-sm uppercase font-semibold px-3 py-1.5 ${
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

          {/* Observation Details & In-Field Verification */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Characteristics */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider flex items-center gap-1.5 border-b border-[#D9DED3] pb-2">
                <FileCheck className="w-4 h-4 text-[#426B43]" />
                <span>{t('resultsCharacteristics')}</span>
              </h4>
              <ul className="space-y-3">
                {analysisResult.observedCharacteristics.map((item, idx) => (
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

          {/* TNAU Recommended Management Protocol */}
          <div className="p-5 sm:p-6 bg-[#FAF9F3] border border-[#E5EBDD] mb-8">
            <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider mb-3">
              {t('resultsManagement')}
            </h4>
            <div className="space-y-3 text-sm sm:text-base text-[#202B22] font-sans">
              {(language === 'ta' && analysisResult.managementGuidanceTamil
                ? analysisResult.managementGuidanceTamil
                : analysisResult.managementGuidance
              ).map((guide, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[#426B43] font-semibold">·</span>
                  <span className="leading-relaxed">{guide}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expert Review & Disclaimers */}
          <div className="border-t border-[#D9DED3] pt-6 space-y-4">
            <div className="flex items-start gap-3 p-4 sm:p-5 bg-[#FAF3F2] border border-[#A94338]/30 text-xs sm:text-sm text-[#202B22]">
              <AlertTriangle className="w-5 h-5 text-[#A94338] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#A94338] uppercase font-mono block mb-1">
                  Extension Officer Verification Notice
                </span>
                <p className="font-sans leading-relaxed text-[#202B22]/90">
                  {language === 'ta' && analysisResult.disclaimerTamil
                    ? analysisResult.disclaimerTamil
                    : analysisResult.disclaimer}
                </p>
                <p className="mt-2 text-[#4A584D] font-mono text-xs">
                  {language === 'ta' && analysisResult.expertReviewAdviceTamil
                    ? analysisResult.expertReviewAdviceTamil
                    : analysisResult.expertReviewAdvice}
                </p>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-xs font-mono text-[#4A584D]">
                EVALUATION SOURCE: {analysisResult.source}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveResult}
                  disabled={isSaved}
                  className={`px-5 py-2.5 min-h-[44px] text-xs font-mono font-medium rounded-xs flex items-center gap-2 cursor-pointer transition-colors ${
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
                  className="px-5 py-2.5 min-h-[44px] text-xs font-mono text-[#183B2A] border border-[#D9DED3] hover:bg-[#E5EBDD] rounded-xs cursor-pointer"
                >
                  {t('resultsReset')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

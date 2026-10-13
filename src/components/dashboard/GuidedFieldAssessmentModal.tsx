import React, { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  FieldObservationInput,
  DifferentialCandidate,
  ActionPlan,
  EvidenceSeparation,
  FarmRecord,
  FieldCaseRecord,
} from '../../types';
import { createFieldCase, addFollowUpObservation } from '../../services/fieldCaseService';
import { evaluateFieldDifferential } from '../../services/differentialEngine';
import { ALL_TAMIL_NADU_DISTRICTS } from '../../config/tamilNaduDistricts';
import {
  X,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sprout,
  ShieldAlert,
  BookOpen,
  Calendar,
  Layers,
  FileCheck,
  ChevronDown,
  Info,
  ExternalLink,
  RotateCcw,
  Plus,
} from 'lucide-react';

interface GuidedFieldAssessmentModalProps {
  initialImagePreview?: string;
  initialImageFile?: File | null;
  initialCropId?: string;
  initialVariety?: string;
  selectedFarm?: FarmRecord | null;
  farms?: FarmRecord[];
  targetExistingCase?: FieldCaseRecord | null;
  onClose: () => void;
  onCaseCreated?: (newCase: FieldCaseRecord) => void;
  onObservationAdded?: () => void;
  onEscalateToExpert?: (caseToken: string, crop: string, notes: string) => void;
}

export const GuidedFieldAssessmentModal: React.FC<GuidedFieldAssessmentModalProps> = ({
  initialImagePreview,
  initialImageFile,
  initialCropId = 'rice',
  initialVariety = 'CR 1009 Sub 1',
  selectedFarm,
  farms = [],
  targetExistingCase,
  onClose,
  onCaseCreated,
  onObservationAdded,
  onEscalateToExpert,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isTa = language === 'ta';

  // Step state: 1 = Image & Crop Setup, 2 = Adaptive Questions, 3 = Synthesis & Action Plan
  const [step, setStep] = useState<number>(initialImagePreview ? 2 : 1);

  // Form inputs
  const [cropId, setCropId] = useState<string>(targetExistingCase?.cropId || initialCropId);
  const [variety, setVariety] = useState<string>(targetExistingCase?.variety || initialVariety || 'BPT 5204');
  const [district, setDistrict] = useState<string>(targetExistingCase?.district || selectedFarm?.district || 'Thanjavur');
  const [farmId, setFarmId] = useState<string>(targetExistingCase?.farmId || selectedFarm?.id || '');
  const [farmName, setFarmName] = useState<string>(targetExistingCase?.farmName || selectedFarm?.farmName || '');

  // Photographs
  const [imagePreview, setImagePreview] = useState<string>(initialImagePreview || '');
  const [imageFile, setImageFile] = useState<File | null>(initialImageFile || null);
  const [secondaryImagePreview, setSecondaryImagePreview] = useState<string>('');
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  // Guided Questionnaire State
  const [affectedParts, setAffectedParts] = useState<FieldObservationInput['affectedParts']>(['upper_leaf']);
  const [fieldDistribution, setFieldDistribution] = useState<FieldObservationInput['fieldDistribution']>('isolated_spots');
  const [estimatedIncidence, setEstimatedIncidence] = useState<FieldObservationInput['estimatedIncidence']>('<5% (low)');
  const [growthStage, setGrowthStage] = useState<string>('Active Tillering (25-35 DAT)');
  const [symptomSpread, setSymptomSpread] = useState<FieldObservationInput['symptomSpread']>('gradual_weeks');
  const [weatherTriggers, setWeatherTriggers] = useState<string[]>(['heavy_morning_dew']);
  const [farmerNotes, setFarmerNotes] = useState<string>('');
  const [progressionNote, setProgressionNote] = useState<string>('');

  // Assessment Engine Result State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    isInconclusive: boolean;
    inconclusiveReason?: string;
    inconclusiveReasonTamil?: string;
    candidates: DifferentialCandidate[];
    actionPlan: ActionPlan;
    evidenceSeparation: EvidenceSeparation;
  } | null>(null);

  // Save / Submit State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessToken, setSaveSuccessToken] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Handle Image Upload
  const handlePrimaryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert(isTa ? 'ஒளிப்படம் 15 MBக்கு குறைவாக இருக்க வேண்டும்.' : 'Image exceeds 15 MB limit.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        if (step === 1) setStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecondaryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSecondaryImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setSecondaryImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const togglePart = (part: any) => {
    setAffectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const toggleWeatherTrigger = (trigger: string) => {
    setWeatherTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  // Run Differential Assessment
  const handleRunDifferential = async () => {
    if (!imagePreview) {
      alert(isTa ? 'தயவுசெய்து பயிரின் ஒளிப்படத்தை பதிவேற்றவும்.' : 'Please provide a crop leaf photograph.');
      return;
    }

    setIsEvaluating(true);
    setSaveError(null);

    const farmerInput: FieldObservationInput = {
      affectedParts,
      fieldDistribution,
      estimatedIncidence,
      growthStage,
      symptomSpread,
      weatherTriggersObserved: weatherTriggers,
      farmerNotes,
    };

    try {
      // Call backend /api/field-case/assess
      const res = await fetch('/api/field-case/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          cropId,
          variety,
          district,
          farmerObservations: farmerInput,
          previousObservationNote: progressionNote,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setEvaluationResult(json.data);
      } else {
        throw new Error(json.message || 'Evaluation failed');
      }
    } catch (err) {
      console.warn('Backend differential endpoint fallback:', err);
      // Fallback directly to client deterministic engine
      const localResult = evaluateFieldDifferential({
        cropId,
        variety,
        district,
        farmerInput,
        visualSummary: 'Foliar surface reveals localized discoloration with chlorotic margin.',
        detectedLesionTypes: ['foliar_spots'],
      });
      setEvaluationResult(localResult);
    } finally {
      setIsEvaluating(false);
      setStep(3);
    }
  };

  // Save as New Case or Add Observation
  const handleSaveCase = async () => {
    if (!user || !evaluationResult) return;

    setIsSaving(true);
    setSaveError(null);

    const farmerInput: FieldObservationInput = {
      affectedParts,
      fieldDistribution,
      estimatedIncidence,
      growthStage,
      symptomSpread,
      weatherTriggersObserved: weatherTriggers,
      farmerNotes,
    };

    try {
      if (targetExistingCase) {
        // Appending to an existing Field Case
        await addFollowUpObservation(user.uid, targetExistingCase.id, {
          imageFile,
          imageUrlFallback: imagePreview,
          secondaryImageFile,
          secondaryImageUrlFallback: secondaryImagePreview,
          cropStage: growthStage,
          farmerInput,
          differentialAssessment: evaluationResult.candidates,
          actionPlan: evaluationResult.actionPlan,
          evidenceSeparation: evaluationResult.evidenceSeparation,
          isInconclusive: evaluationResult.isInconclusive,
          inconclusiveReason: evaluationResult.inconclusiveReason,
          inconclusiveReasonTamil: evaluationResult.inconclusiveReasonTamil,
          farmerReportedProgressionNote: progressionNote,
        });
        setSaveSuccessToken(targetExistingCase.caseToken);
        onObservationAdded?.();
      } else {
        // Creating a new Field Case
        const { caseRecord } = await createFieldCase(user.uid, {
          cropId: cropId as any,
          cropName: cropId === 'rice' ? 'Rice (Paddy)' : cropId.toUpperCase(),
          cropNameTamil: cropId === 'rice' ? 'நெல் (பயிர்)' : cropId,
          variety,
          district,
          farmId,
          farmName,
          imageFile,
          imageUrlFallback: imagePreview,
          secondaryImageFile,
          secondaryImageUrlFallback: secondaryImagePreview,
          cropStage: growthStage,
          farmerInput,
          differentialAssessment: evaluationResult.candidates,
          actionPlan: evaluationResult.actionPlan,
          evidenceSeparation: evaluationResult.evidenceSeparation,
          isInconclusive: evaluationResult.isInconclusive,
          inconclusiveReason: evaluationResult.inconclusiveReason,
          inconclusiveReasonTamil: evaluationResult.inconclusiveReasonTamil,
        });
        setSaveSuccessToken(caseRecord.caseToken);
        onCaseCreated?.(caseRecord);
      }
    } catch (err: any) {
      console.error('Error saving field case:', err);
      setSaveError(err.message || 'Failed to persist case to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF9F3] border border-stone-200 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-white/70">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                {targetExistingCase
                  ? (isTa ? `தொடர் பதிவு: ${targetExistingCase.caseToken}` : `Follow-up: ${targetExistingCase.caseToken}`)
                  : (isTa ? 'வழிகாட்டப்பட்ட கள ஆய்வு' : 'Guided Field Case Assessment')}
              </span>
              <span className="text-xs text-stone-500">
                • {cropId === 'rice' ? (isTa ? 'நெல் பயிர்' : 'Rice') : cropId}
              </span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#183B2A]">
              {targetExistingCase
                ? (isTa ? 'கள ஆய்வில் புதிய பதிவை சேர்த்தல்' : 'Append Follow-up Field Observation')
                : (isTa ? 'கள அறிகுறிகள் மற்றும் மாற்று நோய் ஒப்பீடு' : 'Field Symptoms & Differential Assessment')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="px-6 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'font-bold text-emerald-800' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">1</span>
            {isTa ? 'ஒளிப்படம் & பயிர்' : 'Photo & Crop'}
          </div>
          <span className="text-stone-300">───</span>
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'font-bold text-emerald-800' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'}`}>2</span>
            {isTa ? 'கள வினாக்கள்' : 'Field Questions'}
          </div>
          <span className="text-stone-300">───</span>
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'font-bold text-emerald-800' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'}`}>3</span>
            {isTa ? 'முடிவு & செயல் திட்டம்' : 'Differential & Plan'}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Photo & Basic Crop Setup */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-900 leading-relaxed flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">
                    {isTa ? 'ஆரம்ப கள ஒளிப்படம்:' : 'Primary Field Photograph:'}
                  </strong>
                  {isTa
                    ? 'பாதிக்கப்பட்ட பயிர் இலையின் தெளிவான படத்தை பதிவேற்றவும். ஒரு ஒளிப்படம் ஒரு முடிவல்ல, விரிவான கள ஆய்வின் தொடக்கமாகும்.'
                    : 'Upload a clear photograph of the symptomatic leaf. A single photo begins an investigation — guided questions will follow.'}
                </div>
              </div>

              {/* Photo Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-emerald-600 bg-white rounded-2xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePrimaryFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Crop specimen"
                      className="max-h-56 mx-auto rounded-lg object-contain shadow-xs"
                    />
                    <p className="text-xs text-stone-500 font-medium">
                      {isTa ? 'படத்தை மாற்ற கிளிக் செய்யவும்' : 'Click to change photo'}
                    </p>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <Upload className="w-10 h-10 text-emerald-800 mx-auto stroke-1" />
                    <p className="font-serif font-bold text-stone-800 text-base">
                      {isTa ? 'இலை ஒளிப்படத்தை பதிவேற்றவும்' : 'Upload Leaf Photograph'}
                    </p>
                    <p className="text-xs text-stone-500">
                      JPEG, PNG, WebP (Max 15 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Basic Crop & District Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {isTa ? 'பயிர் வகை' : 'Crop'}
                  </label>
                  <select
                    value={cropId}
                    onChange={(e) => setCropId(e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-700"
                  >
                    <option value="rice">{isTa ? 'நெல் (Paddy - முதன்மை ஆய்வு)' : 'Rice (Paddy - Evaluated)'}</option>
                    <option value="tomato">{isTa ? 'தக்காளி (Tomato - பொது ஆய்வு)' : 'Tomato (Vegetable)'}</option>
                    <option value="chilli">{isTa ? 'மிளகாய் (Chilli)' : 'Chilli'}</option>
                    <option value="cotton">{isTa ? 'பருத்தி (Cotton)' : 'Cotton'}</option>
                    <option value="maize">{isTa ? 'மக்காச்சோளம் (Maize)' : 'Maize'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {isTa ? 'பயிர் ரகம்' : 'Cultivar / Variety'}
                  </label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. CR 1009, BPT 5204, ADT 45"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {isTa ? 'மாவட்டம்' : 'District'}
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-700"
                  >
                    {ALL_TAMIL_NADU_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {isTa ? d.nameTamil : d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {farms.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {isTa ? 'தொடர்புடைய பண்ணை' : 'Associated Farm'}
                    </label>
                    <select
                      value={farmId}
                      onChange={(e) => {
                        setFarmId(e.target.value);
                        const matched = farms.find((f) => f.id === e.target.value);
                        setFarmName(matched?.farmName || '');
                      }}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-700"
                    >
                      <option value="">{isTa ? '-- பொது வயல் --' : '-- General Field --'}</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.farmName} ({f.district})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Guided Field Evidence Questions */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Photo preview ribbon */}
              <div className="flex items-center gap-3 p-3 bg-stone-100 rounded-xl">
                <img
                  src={imagePreview}
                  alt="Crop preview"
                  className="w-14 h-14 rounded-lg object-cover border border-stone-300 shrink-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-stone-800 block">
                    {cropId === 'rice' ? (isTa ? 'நெல்' : 'Rice') : cropId} • {variety}
                  </span>
                  <span className="text-stone-500">{district}</span>
                </div>
              </div>

              {/* Notice */}
              <div className="text-xs text-stone-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                {isTa
                  ? 'கள விவரங்களை தெரிவு செய்யவும். தெரியாத வினாக்களை தவிர்க்கலாம் (Skip). உங்கள் பதில்கள் மாற்று நோய்களை துல்லியமாக ஒப்பிட உதவும்.'
                  : 'Answer what you observe in your field. You may skip any question you are unsure of. Your observations guide the differential engine.'}
              </div>

              {/* If follow-up on existing case: Ask what changed */}
              {targetExistingCase && (
                <div className="space-y-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <label className="block text-xs font-bold text-amber-950">
                    {isTa ? 'முந்தைய ஆய்வுக்குப் பிறகு ஏற்பட்டுள்ள மாற்றங்கள்:' : 'Changes Observed Since Previous Visit:'}
                  </label>
                  <input
                    type="text"
                    value={progressionNote}
                    onChange={(e) => setProgressionNote(e.target.value)}
                    placeholder={
                      isTa
                        ? 'எ.கா. கடந்த 4 நாட்களில் புள்ளிகள் இருமடங்காகப் பரவியுள்ளன / குறைந்துள்ளன'
                        : 'e.g. Lesions expanded to ~15% of tillers after rain / drying out'
                    }
                    className="w-full text-xs sm:text-sm p-2 rounded-lg border border-amber-300 bg-white focus:outline-none"
                  />
                </div>
              )}

              {/* Question 1: Affected Plant Parts */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800">
                  1. {isTa ? 'பயிரின் எந்தப் பகுதியில் அறிகுறிகள் உள்ளன?' : 'Where on the plant are symptoms visible?'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'upper_leaf', labelEn: 'Upper Leaf Blades', labelTa: 'மேல் இலைகள்' },
                    { id: 'lower_leaf', labelEn: 'Lower Foliage', labelTa: 'கீழ் இலைகள்' },
                    { id: 'sheath_stem', labelEn: 'Sheath near Water', labelTa: 'இலை உறை / தண்டு' },
                    { id: 'panicle_neck', labelEn: 'Panicle Neck / Grain', labelTa: 'கதிர் கழுத்து / தானியம்' },
                    { id: 'whole_plant', labelEn: 'Whole Plant Wilting', labelTa: 'முழு பயிர் வாடல்' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => togglePart(opt.id)}
                      className={`text-xs p-2.5 rounded-xl border text-left transition-all ${
                        affectedParts.includes(opt.id as any)
                          ? 'bg-[#183B2A] text-white border-[#183B2A] font-semibold shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-600'
                      }`}
                    >
                      {isTa ? opt.labelTa : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Field Distribution */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800">
                  2. {isTa ? 'வயலில் இந்த அறிகுறிகள் எவ்வாறு பரவியுள்ளன?' : 'How are symptoms distributed across your field?'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'isolated_spots', labelEn: 'Isolated individual plants', labelTa: 'ஆங்காங்கே தனித்தனி பயிர்கள்' },
                    { id: 'patchy_areas', labelEn: 'Patchy circular zones', labelTa: 'திட்டு திட்டாக (வட்ட வடிவில்)' },
                    { id: 'widespread_field', labelEn: 'Widespread across entire field', labelTa: 'வயல் முழுவதும் பரவலாக' },
                    { id: 'along_bunds_inlet', labelEn: 'Along bunds or water inlets', labelTa: 'வரப்புகள் / நீர் பாயும் வாய்மடை அருகில்' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setFieldDistribution(opt.id as any)}
                      className={`text-xs p-2.5 rounded-xl border text-left transition-all ${
                        fieldDistribution === opt.id
                          ? 'bg-[#183B2A] text-white border-[#183B2A] font-semibold shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-600'
                      }`}
                    >
                      {isTa ? opt.labelTa : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Estimated Incidence */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800">
                  3. {isTa ? 'எத்தனை பயிர்கள் பாதிக்கப்பட்டுள்ளன?' : 'Estimated proportion of affected plants:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '<5% (low)', labelEn: '< 5% (Low)', labelTa: '< 5% (குறைவு)' },
                    { id: '5-25% (moderate)', labelEn: '5 - 25% (Moderate)', labelTa: '5 - 25% (மிதமானது)' },
                    { id: '>25% (severe)', labelEn: '> 25% (Heavy)', labelTa: '> 25% (தீவிரமானது)' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setEstimatedIncidence(opt.id as any)}
                      className={`text-xs p-2.5 rounded-xl border text-center transition-all ${
                        estimatedIncidence === opt.id
                          ? 'bg-[#183B2A] text-white border-[#183B2A] font-semibold shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-600'
                      }`}
                    >
                      {isTa ? opt.labelTa : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4: Crop Growth Stage */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800">
                  4. {isTa ? 'பயிரின் தற்போதைய வளர்ச்சிப் பருவம்:' : 'Crop cultivation stage:'}
                </label>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-700"
                >
                  <option value="Nursery / Seedling (10-20 DAT)">{isTa ? 'நாற்றுப் பருவம் (Nursery)' : 'Nursery / Seedling (10-20 DAT)'}</option>
                  <option value="Active Tillering (25-35 DAT)">{isTa ? 'தூர்கட்டும் பருவம் (Tillering)' : 'Active Tillering (25-35 DAT)'}</option>
                  <option value="Panicle Initiation / Booting (45-60 DAT)">{isTa ? 'கதிர் உருவாகும் பருவம் (Booting)' : 'Panicle Initiation / Booting (45-60 DAT)'}</option>
                  <option value="Flowering / Grain Filling (65-80 DAT)">{isTa ? 'பூக்கும் / பால் பிடிக்கும் பருவம் (Flowering)' : 'Flowering / Grain Filling (65-80 DAT)'}</option>
                  <option value="Maturity / Harvest (85+ DAT)">{isTa ? 'முதிர்ச்சிப் பருவம் (Maturity)' : 'Maturity / Harvest (85+ DAT)'}</option>
                </select>
              </div>

              {/* Question 5: Environmental Triggers */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800">
                  5. {isTa ? 'வானிலை அல்லது சூழல் காரணிகள் ஏதேனும் உண்டா?' : 'Observed environmental / weather triggers:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'heavy_morning_dew', labelEn: 'Heavy Morning Mist / Dew', labelTa: 'அதிக காலை பனிப்பொழிவு' },
                    { id: 'recent_inundation', labelEn: 'Standing Water / Rain Flooding', labelTa: 'தேங்கிய நீர் / மழை வெள்ளம்' },
                    { id: 'persistent_cloudiness', labelEn: 'Continuous Cloudy Days', labelTa: 'தொடர் மேகமூட்டம்' },
                    { id: 'none_dry', labelEn: 'Dry / Warm Weather', labelTa: 'வறண்ட / இயல்பான வானிலை' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => toggleWeatherTrigger(opt.id)}
                      className={`text-xs p-2.5 rounded-xl border text-left transition-all ${
                        weatherTriggers.includes(opt.id)
                          ? 'bg-emerald-800 text-white border-emerald-800 font-semibold'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-600'
                      }`}
                    >
                      {isTa ? opt.labelTa : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Secondary Photo */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">
                    {isTa ? 'கூடுதல் ஒளிப்படம் (விருப்பத்தேர்வு):' : 'Additional Photo (Optional):'}
                  </label>
                  <span className="text-[11px] text-stone-400">
                    {isTa ? 'வயல் காட்சி அல்லது தண்டுப் பகுதி' : 'Plot wide shot or stem base'}
                  </span>
                </div>
                <input
                  type="file"
                  ref={secondaryFileInputRef}
                  onChange={handleSecondaryFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                {secondaryImagePreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={secondaryImagePreview}
                      alt="Secondary specimen"
                      className="w-12 h-12 rounded object-cover border border-stone-300"
                    />
                    <button
                      type="button"
                      onClick={() => setSecondaryImagePreview('')}
                      className="text-xs text-red-700 underline"
                    >
                      {isTa ? 'அகற்று' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => secondaryFileInputRef.current?.click()}
                    className="w-full py-2 border border-dashed border-stone-300 rounded-lg text-xs text-stone-600 hover:border-emerald-700 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {isTa ? '+ கூடுதல் படம் சேர்க்க' : '+ Attach secondary angle'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Differential Results & Action Plan */}
          {step === 3 && evaluationResult && (
            <div className="space-y-6">
              {/* Success Token Alert if saved */}
              {saveSuccessToken && (
                <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif font-bold text-sm">
                      {isTa ? 'கள ஆய்வு வெற்றிகரமாகப் பதிவானது!' : 'Field Case Recorded Successfully!'}
                    </h4>
                    <p className="text-xs mt-0.5 font-mono">
                      {isTa ? 'வழக்கு எண்:' : 'Case Reference Token:'} <strong>{saveSuccessToken}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Inconclusive Warning if applicable */}
              {evaluationResult.isInconclusive && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block mb-0.5">
                      {isTa ? 'திட்டவட்டமற்ற கள ஆய்வு (Inconclusive):' : 'Inconclusive Differential Assessment:'}
                    </strong>
                    {isTa ? evaluationResult.inconclusiveReasonTamil : evaluationResult.inconclusiveReason}
                  </div>
                </div>
              )}

              {/* SECTION 1: WHAT WE OBSERVED */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
                <h3 className="font-serif font-bold text-[#183B2A] text-sm sm:text-base flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  {isTa ? '1. நாம் களத்தில் கவனித்தவை (What We Observed)' : '1. What We Observed'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  {isTa ? evaluationResult.actionPlan.whatWeObserved.summaryTamil : evaluationResult.actionPlan.whatWeObserved.summary}
                </p>
                <ul className="text-xs text-stone-600 space-y-1 pt-1 list-disc list-inside">
                  {(isTa
                    ? evaluationResult.actionPlan.whatWeObserved.symptomsTamil
                    : evaluationResult.actionPlan.whatWeObserved.symptoms
                  ).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* SECTION 2: WHAT MIGHT EXPLAIN IT (DIFFERENTIAL CANDIDATES) */}
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-[#183B2A] text-sm sm:text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  {isTa ? '2. சாத்தியமான விளக்கங்கள் — மாற்று நோய் ஒப்பீடு (What Might Explain It)' : '2. What Might Explain It (Differential Candidates)'}
                </h3>

                <div className="space-y-3">
                  {evaluationResult.candidates.map((cand, idx) => {
                    const badgeStyles = {
                      high: 'bg-red-50 text-red-800 border-red-200',
                      moderate: 'bg-amber-50 text-amber-800 border-amber-200',
                      unlikely_but_possible: 'bg-stone-100 text-stone-700 border-stone-200',
                    }[cand.plausibilityLevel];

                    return (
                      <div
                        key={cand.conditionId}
                        className="bg-white rounded-xl border border-stone-200 p-4 space-y-3 shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                          <div>
                            <span className="text-xs text-stone-400 font-mono">#{idx + 1}</span>{' '}
                            <span className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                              {isTa ? cand.conditionNameTamil : cand.conditionName}
                            </span>
                            <span className="text-[11px] text-stone-500 italic block">
                              {cand.scientificName}
                            </span>
                          </div>
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badgeStyles}`}>
                            {cand.plausibilityLevel === 'high'
                              ? (isTa ? 'அதிக சாத்தியம்' : 'High Plausibility')
                              : cand.plausibilityLevel === 'moderate'
                              ? (isTa ? 'மிதமான சாத்தியம்' : 'Moderate Candidate')
                              : (isTa ? 'குறைந்த சாத்தியம்' : 'Unlikely / Alternative')}
                          </span>
                        </div>

                        {/* Supporting vs Contradictory */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                            <span className="font-bold text-emerald-900 block mb-1">
                              ✓ {isTa ? 'ஆதரிக்கும் அறிகுறிகள்:' : 'Supporting Evidence:'}
                            </span>
                            <ul className="text-emerald-950 space-y-0.5 list-disc list-inside">
                              {(isTa ? cand.supportingEvidenceTamil : cand.supportingEvidence).map((pt, pIdx) => (
                                <li key={pIdx}>{pt}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                            <span className="font-bold text-amber-900 block mb-1">
                              ✗ {isTa ? 'எதிரான / இல்லாத சான்றுகள்:' : 'Missing / Contradictory:'}
                            </span>
                            <ul className="text-amber-950 space-y-0.5 list-disc list-inside">
                              {(isTa ? cand.missingOrContradictoryEvidenceTamil : cand.missingOrContradictoryEvidence).map((pt, pIdx) => (
                                <li key={pIdx}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Distinguishing test */}
                        <div className="text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                          <strong className="text-stone-800 block mb-0.5">
                            🔍 {isTa ? 'வேறுபடுத்தி அறியும் கள ஆய்வு:' : 'Distinguishing In-Field Check:'}
                          </strong>
                          <span className="text-stone-700">
                            {isTa ? cand.distinguishingObservationTamil : cand.distinguishingObservation}
                          </span>
                        </div>

                        {/* Verified source reference */}
                        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                          <span>
                            {isTa ? 'ஆதாரம்:' : 'Source:'} <strong>{cand.trustedReference.source}</strong>
                          </span>
                          {cand.trustedReference.url && (
                            <a
                              href={cand.trustedReference.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              {isTa ? 'TNAU கையேடு' : 'TNAU Protocol'} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: WHAT TO CHECK NEXT */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
                <h3 className="font-serif font-bold text-[#183B2A] text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  {isTa ? '3. அடுத்து சரிபார்க்க வேண்டியவை (What To Check Next)' : '3. What To Check Next'}
                </h3>
                <ul className="text-xs text-stone-700 space-y-1.5 list-disc list-inside">
                  {(isTa
                    ? evaluationResult.actionPlan.whatToCheckNext.observationsToMakeTamil
                    : evaluationResult.actionPlan.whatToCheckNext.observationsToMake
                  ).map((chk, cIdx) => (
                    <li key={cIdx}>{chk}</li>
                  ))}
                </ul>
              </div>

              {/* SECTION 4: WHAT TO DO NOW (CONSERVATIVE ACTIONS) */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                <h3 className="font-serif font-bold text-[#183B2A] text-sm sm:text-base flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  {isTa ? '4. தற்போது செய்ய வேண்டியவை (What To Do Now)' : '4. What To Do Now (Cultural Care)'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 space-y-1">
                    <span className="font-bold text-emerald-900 block">
                      {isTa ? 'பரிந்துரைக்கப்பட்ட பாதுகாப்பான முறைகள்:' : 'Recommended Cultural & Bio-Care:'}
                    </span>
                    <ul className="text-emerald-950 space-y-1 list-disc list-inside">
                      {(isTa
                        ? evaluationResult.actionPlan.whatToDoNow.immediateCulturalCareTamil
                        : evaluationResult.actionPlan.whatToDoNow.immediateCulturalCare
                      ).map((m, mIdx) => (
                        <li key={mIdx}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-50/60 p-3 rounded-lg border border-red-200 space-y-1">
                    <span className="font-bold text-red-900 block">
                      {isTa ? 'கட்டாயம் தவிர்க்க வேண்டியவை:' : 'Strictly Avoid:'}
                    </span>
                    <ul className="text-red-950 space-y-1 list-disc list-inside">
                      {(isTa
                        ? evaluationResult.actionPlan.whatToDoNow.strictlyAvoidTamil
                        : evaluationResult.actionPlan.whatToDoNow.strictlyAvoid
                      ).map((m, mIdx) => (
                        <li key={mIdx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECTION 5: WHEN TO SEEK EXPERT HELP */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                <h3 className="font-serif font-bold text-amber-950 text-sm sm:text-base flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  {isTa ? '5. எப்போது வேளாண் அதிகாரியை அணுக வேண்டும்?' : '5. When To Seek Professional Help'}
                </h3>
                <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                  {(isTa
                    ? evaluationResult.actionPlan.whenToSeekExpertHelp.triggersTamil
                    : evaluationResult.actionPlan.whenToSeekExpertHelp.triggers
                  ).map((tr, tIdx) => (
                    <li key={tIdx}>{tr}</li>
                  ))}
                </ul>
              </div>

              {/* SECTION 6: EVIDENCE SEPARATION */}
              <div className="p-3 bg-stone-100 rounded-xl text-[11px] text-stone-600 space-y-1">
                <strong className="block text-stone-800">
                  {isTa ? 'ஆதாரங்களின் வெளிப்படையான பிரிப்பு (Evidence Breakdown):' : 'Transparent Evidence Separation:'}
                </strong>
                <div>• <strong>Gemini Multimodal Interpretation:</strong> {evaluationResult.evidenceSeparation.geminiVisualInterpretation.summary}</div>
                <div>• <strong>Farmer Inputs:</strong> {evaluationResult.evidenceSeparation.farmerFieldObservations.partsReported.join(', ')} ({evaluationResult.evidenceSeparation.farmerFieldObservations.distributionReported})</div>
                <div>• <strong>Agronomic Engine:</strong> {evaluationResult.evidenceSeparation.specialistRulesOrModel.engineUsed}</div>
                {evaluationResult.evidenceSeparation.weatherContextApplied && (
                  <div>• <strong>Weather Context:</strong> {evaluationResult.evidenceSeparation.weatherContextApplied.weatherRiskNote}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-stone-200 bg-white/80 flex items-center justify-between">
          {step > 1 && !saveSuccessToken ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="px-4 py-2 text-stone-700 text-xs sm:text-sm font-medium hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              {isTa ? 'பின்செல்' : 'Back'}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!imagePreview}
                className="px-5 py-2.5 bg-[#183B2A] text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-[#122e20] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isTa ? 'அடுத்த வினாக்கள்' : 'Next Questions'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleRunDifferential}
                disabled={isEvaluating}
                className="px-5 py-2.5 bg-[#183B2A] text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-[#122e20] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isEvaluating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    {isTa ? 'ஆய்வு நடைபெறுகிறது...' : 'Synthesizing Field Evidence...'}
                  </>
                ) : (
                  <>
                    {isTa ? 'கள ஒப்பீட்டை உருவாக்கு' : 'Generate Differential Assessment'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {step === 3 && (
              <>
                {!saveSuccessToken ? (
                  <button
                    type="button"
                    onClick={handleSaveCase}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-[#183B2A] text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-[#122e20] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        {isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving Field Case...'}
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        {targetExistingCase
                          ? (isTa ? 'தொடர் பதிவாகச் சேமி' : 'Save Follow-up to Case')
                          : (isTa ? 'புதிய கள வழக்காகப் பதிவுசெய்' : 'Save as New Field Case')}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-[#183B2A] text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-[#122e20] transition-colors"
                  >
                    {isTa ? 'நன்றி / மூடு' : 'Close Dossier'}
                  </button>
                )}

                {onEscalateToExpert && evaluationResult && (
                  <button
                    type="button"
                    onClick={() => {
                      onEscalateToExpert(
                        saveSuccessToken || targetExistingCase?.caseToken || 'CASE-DRAFT',
                        cropId,
                        evaluationResult.actionPlan.whatWeObserved.summary
                      );
                      onClose();
                    }}
                    className="px-4 py-2.5 border border-emerald-800 text-emerald-900 rounded-xl text-xs sm:text-sm font-medium hover:bg-emerald-50 transition-colors"
                  >
                    {isTa ? 'வேளாண் அலுவலரிடம் கேட்க' : 'Escalate to Expert'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

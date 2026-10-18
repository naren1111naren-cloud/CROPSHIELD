import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ScanData } from '../../types';
import { motion } from 'motion/react';
import { backdropVariants, modalVariants } from '../../lib/motion';
import {
  X,
  Calendar,
  MapPin,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  ShieldAlert,
  Trash2,
  RefreshCw,
  ExternalLink,
  Info,
  HelpCircle
} from 'lucide-react';

interface ScanDetailModalProps {
  isOpen: boolean;
  scan: ScanData | null;
  onClose: () => void;
  onDelete?: (scanId: string) => Promise<void>;
  onGetAgriculturalHelp?: (scan: ScanData) => void;
}

export const ScanDetailModal: React.FC<ScanDetailModalProps> = ({
  isOpen,
  scan,
  onClose,
  onDelete,
  onGetAgriculturalHelp,
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Keyboard accessibility: ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !scan) return null;

  const formattedDate = scan.createdAt?.toDate
    ? scan.createdAt.toDate().toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : (isTa ? 'சமீபத்திய ஆய்வு' : 'Recent Inspection');

  const handleDelete = async () => {
    if (!scan.scanId || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(scan.scanId);
      onClose();
    } catch (err) {
      console.error('Failed to delete scan record:', err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const observationsList = Array.isArray(scan.observedSymptoms) && scan.observedSymptoms.length > 0
    ? scan.observedSymptoms
    : (Array.isArray(scan.observations) ? scan.observations : (typeof scan.observations === 'string' ? [scan.observations] : []));

  const immediateCareList = Array.isArray(scan.immediateCare) && scan.immediateCare.length > 0
    ? (isTa && scan.immediateCareTamil?.length ? scan.immediateCareTamil : scan.immediateCare)
    : (Array.isArray(scan.recommendations) ? scan.recommendations.slice(0, 2) : []);

  const preventiveList = Array.isArray(scan.preventivePractices) && scan.preventivePractices.length > 0
    ? (isTa && scan.preventivePracticesTamil?.length ? scan.preventivePracticesTamil : scan.preventivePractices)
    : (Array.isArray(scan.recommendations) ? scan.recommendations.slice(2) : []);

  const generalRecommendations = Array.isArray(scan.recommendations)
    ? (isTa && scan.recommendationsTamil?.length ? scan.recommendationsTamil : scan.recommendations)
    : (typeof scan.recommendations === 'string' ? [scan.recommendations] : []);

  const severityBadgeClass =
    scan.severity === 'high'
      ? 'badge-alert'
      : scan.severity === 'moderate'
      ? 'badge-caution'
      : 'badge-healthy';

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs"
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-4xl bg-white border border-[#DCE4D9] shadow-2xl my-8 overflow-hidden rounded-[16px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-detail-title"
      >
        {/* Modal Top Header */}
        <div className="bg-[#FAF9F3] border-b border-[#DCE4D9] p-5 sm:p-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#1F6B4A] uppercase tracking-wider mb-1 font-semibold">
              <span>{scan.cropName || 'Crop'}</span>
              <span>·</span>
              <span>{scan.scanId}</span>
              <span>·</span>
              <span className="text-[#52665A]">{formattedDate}</span>
            </div>
            <h3
              id="scan-detail-title"
              className="text-2xl sm:text-3xl font-bold font-['Manrope'] text-[#0B211A]"
            >
              {isTa ? scan.possibleConditionTamil || scan.possibleCondition : scan.possibleCondition}
            </h3>
            {scan.pathogen && scan.pathogen !== 'None detected' && (
              <p className="text-xs sm:text-sm font-mono text-[#52665A] italic mt-0.5">
                {scan.pathogen}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs font-mono font-semibold uppercase ${severityBadgeClass}`}
            >
              {scan.severity || 'nominal'} priority
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-[#52665A] hover:text-[#0B211A] hover:bg-[#EAEFE5] rounded-[8px] cursor-pointer transition-colors"
              aria-label="Close inspection dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 lg:p-8 max-h-[75vh] overflow-y-auto space-y-6 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Specimen Photograph & Meta */}
            <div className="md:col-span-5 space-y-4">
              <div className="border border-[#D9DED3] bg-[#F7F6EF] p-2 rounded-xs">
                {scan.imagePath ? (
                  <img
                    src={scan.imagePath}
                    alt={scan.possibleCondition}
                    className="w-full h-auto max-h-[320px] object-cover rounded-xs"
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs font-mono text-[#4A584D]">
                    {isTa ? 'புகைப்படம் கிடைக்கவில்லை' : 'Specimen photo unavailable'}
                  </div>
                )}
              </div>

              {/* Cadastral context details */}
              <div className="p-4 bg-[#FAF9F3] border border-[#E5EBDD] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-[#4A584D]">
                  <span>CULTIVAR:</span>
                  <strong className="text-[#183B2A]">{scan.variety || 'Standard Cultivar'}</strong>
                </div>
                {scan.district && (
                  <div className="flex items-center justify-between text-[#4A584D]">
                    <span>DISTRICT:</span>
                    <strong className="text-[#183B2A]">{scan.district}</strong>
                  </div>
                )}
                <div className="flex items-center justify-between text-[#4A584D]">
                  <span>DIAGNOSTIC STATUS:</span>
                  <span className="uppercase text-[#183B2A] font-semibold">{scan.status}</span>
                </div>
                <div className="flex items-center justify-between text-[#4A584D]">
                  <span>EVALUATION ENGINE:</span>
                  <span className="text-[#426B43]">{scan.analysisMethod || 'gemini-3.8-flash'}</span>
                </div>
              </div>

              {/* Differential Diagnosis / Alternatives if any */}
              {scan.alternativeConditions && scan.alternativeConditions.length > 0 && (
                <div className="p-4 bg-white border border-[#D9DED3] space-y-2">
                  <div className="text-xs font-mono uppercase text-[#B67B2A] font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>{isTa ? 'மாற்று சாத்தியங்கள் (வேறுபாடுகள்)' : 'Alternative Possibilities'}</span>
                  </div>
                  <ul className="text-xs text-[#4A584D] space-y-1 font-sans">
                    {scan.alternativeConditions.map((alt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{alt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Pathological Findings & Agronomic Protocols */}
            <div className="md:col-span-7 space-y-6">
              {/* Visible Symptoms */}
              {observationsList.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider flex items-center gap-1.5 border-b border-[#D9DED3] pb-2 mb-3">
                    <FileCheck className="w-4 h-4 text-[#426B43]" />
                    <span>{isTa ? 'இலையில் காணப்பட்ட அறிகுறிகள்' : 'Observed Foliar Symptoms'}</span>
                  </h4>
                  <ul className="space-y-2">
                    {observationsList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#202B22]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#426B43] mt-2 shrink-0"></span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Immediate Care Recommendations */}
              {immediateCareList.length > 0 && (
                <div className="p-4 sm:p-5 bg-[#FAF9F3] border border-[#E5EBDD] space-y-2">
                  <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#426B43]" />
                    <span>{isTa ? 'உடனடிப் பராமரிப்பு நடவடிக்கைகள்' : 'Immediate Care Recommendations'}</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-[#202B22]">
                    {immediateCareList.map((action, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-[#426B43] font-bold">·</span>
                        <span className="leading-relaxed">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preventive Practices */}
              {(preventiveList.length > 0 || generalRecommendations.length > 0) && (
                <div>
                  <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider flex items-center gap-1.5 border-b border-[#D9DED3] pb-2 mb-3">
                    <Sprout className="w-4 h-4 text-[#426B43]" />
                    <span>{isTa ? 'நீண்டகால தடுப்பு முறைகள் (IPM)' : 'Preventive Practices (TNAU IPM)'}</span>
                  </h4>
                  <ul className="space-y-2">
                    {(preventiveList.length > 0 ? preventiveList : generalRecommendations).map((rec, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#202B22]">
                        <span className="text-[#426B43] font-bold">✓</span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expert Review Advice */}
              <div className="p-4 bg-[#FAF3F2] border border-[#A94338]/30 rounded-xs space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-[#A94338] font-semibold uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{isTa ? 'வேளாண் அலுவலர் ஆய்வு வழிகாட்டுதல்' : 'Extension Officer Consultation Advice'}</span>
                </div>
                <p className="text-[#202B22] font-sans leading-relaxed">
                  {isTa
                    ? scan.expertReviewAdviceTamil || scan.expertReviewAdvice || 'ரசாயன மருந்துகளைப் பயன்படுத்துவதற்கு முன் வட்டார வேளாண்மை அலுவலரின் ஆலோசனையைப் பெறவும்.'
                    : scan.expertReviewAdvice || 'Consult your local Village Agricultural Extension Officer before taking chemical action.'}
                </p>
              </div>

              {/* Uncertainty and Diagnostic Transparency Notice */}
              <div className="p-3 bg-[#FAF9F3] border border-[#D9DED3] text-[11px] font-mono text-[#4A584D] space-y-1">
                <div className="font-semibold text-[#183B2A] uppercase">
                  {isTa ? 'பூர்வாங்க ஆய்வு வெளிப்படைத்தன்மை' : 'Diagnostic Uncertainty & Safety Notice'}
                </div>
                <p>
                  {isTa
                    ? scan.uncertaintyNoticeTamil || scan.uncertaintyNotice || 'இது AI துணையுடன் மேற்கொள்ளப்பட்ட பூர்வாங்க புகைப்பட கணிப்பு மட்டுமே. ஆய்வக பரிசோதனைக்கு மாற்றாகாது.'
                    : scan.uncertaintyNotice || 'Preliminary AI image analysis only. Not a certified laboratory diagnostic. In-field verification by an authorized Agricultural Extension Officer (AEO) or Krishi Vigyan Kendra (KVK) is recommended before applying chemical inputs.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-[#FAF9F3] border-t border-[#D9DED3] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            {onDelete && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-mono text-[#A94338] hover:underline flex items-center gap-1 cursor-pointer py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isTa ? 'இப்பதிவை நீக்கு' : 'Delete Inspection Record'}</span>
              </button>
            )}

            {onDelete && confirmDelete && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[#A94338] font-semibold">
                  {isTa ? 'உறுதியாக நீக்கவா?' : 'Confirm delete?'}
                </span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-[#A94338] text-white rounded-xs cursor-pointer hover:bg-[#8e382f]"
                >
                  {isDeleting ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : (isTa ? 'ஆம்' : 'Yes, Delete')}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-[#4A584D] hover:underline cursor-pointer"
                >
                  {isTa ? 'ரத்து' : 'Cancel'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onGetAgriculturalHelp && (
              <button
                type="button"
                onClick={() => {
                  if (scan) {
                    onClose();
                    onGetAgriculturalHelp(scan);
                  }
                }}
                className="btn-secondary text-xs py-2 px-3.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#1F6B4A]" />
                <span>{isTa ? 'விவசாய உதவி பெறுக' : 'Get Agricultural Help'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="btn-primary text-xs py-2 px-5"
            >
              {isTa ? 'மூடுக' : 'Close Dossier'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

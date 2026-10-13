import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { queryKnowledgeArticles } from '../../config/knowledgeHubRegistry';
import { KnowledgeArticle } from '../../types';
import {
  X,
  HelpCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  BookOpen,
  Sprout,
  CheckCircle2,
  Info
} from 'lucide-react';

export interface ScanContextHelp {
  scanId?: string;
  cropId?: string;
  cropName?: string;
  conditionName: string;
  conditionNameTamil?: string;
  severity?: string;
  pathogen?: string;
  imagePath?: string;
  observedSymptoms?: string[];
  district?: string;
}

interface ContextualHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanContext: ScanContextHelp | null;
  onEscalateToEnquiry: (context: ScanContextHelp) => void;
  onOpenKnowledgeHub?: () => void;
  onOpenDirectory?: (district?: string) => void;
}

export const ContextualHelpModal: React.FC<ContextualHelpModalProps> = ({
  isOpen,
  onClose,
  scanContext,
  onEscalateToEnquiry,
  onOpenKnowledgeHub,
  onOpenDirectory,
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  if (!isOpen || !scanContext) return null;

  // Query articles matching target condition or crop
  const targetCondition = scanContext.conditionName.toLowerCase();
  let conditionKey = '';
  if (targetCondition.includes('blast')) conditionKey = 'rice_blast';
  else if (targetCondition.includes('bacterial') || targetCondition.includes('blight')) conditionKey = 'bacterial_leaf_blight';
  else if (targetCondition.includes('brown spot')) conditionKey = 'brown_spot';
  else if (targetCondition.includes('sheath')) conditionKey = 'sheath_blight';
  else if (targetCondition.includes('stem borer') || targetCondition.includes('dead heart')) conditionKey = 'stem_borer';

  const relevantArticles = queryKnowledgeArticles({
    cropId: scanContext.cropId || 'rice',
    targetConditionId: conditionKey || undefined,
  }).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white border border-[#D9DED3] shadow-2xl my-8 rounded-xs overflow-hidden">
        {/* Top Banner */}
        <div className="bg-[#FAF9F3] border-b border-[#D9DED3] p-5 sm:p-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#426B43] uppercase tracking-wider mb-1 font-semibold">
              <HelpCircle className="w-4 h-4 text-[#183B2A]" />
              <span>{isTa ? 'சூழ்நிலை பயிர் வழிகாட்டல்' : 'CONTEXTUAL CROP-CARE HELP'}</span>
              <span>·</span>
              <span className="text-[#183B2A]">{scanContext.cropName || 'Crop'}</span>
            </div>

            <h3 className="font-serif text-2xl font-medium text-[#183B2A]">
              {isTa
                ? `${scanContext.conditionNameTamil || scanContext.conditionName} — கூடுதல் வழிகாட்டல்`
                : `Assistance for ${scanContext.conditionName}`}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Context Specimen Overview */}
          <div className="p-4 bg-[#FAF9F3] border border-[#E5EBDD] rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {scanContext.imagePath && (
                <div className="w-16 h-16 shrink-0 bg-white border border-[#D9DED3] overflow-hidden rounded-xs">
                  <img
                    src={scanContext.imagePath}
                    alt="Scan specimen"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="text-xs font-mono text-[#4A584D]">
                  {scanContext.scanId ? `SCAN ${scanContext.scanId}` : 'PRELIMINARY SCAN SPECIMEN'}
                </div>
                <div className="font-serif text-lg font-semibold text-[#183B2A]">
                  {isTa ? scanContext.conditionNameTamil || scanContext.conditionName : scanContext.conditionName}
                </div>
                {scanContext.pathogen && (
                  <div className="text-xs font-mono italic text-[#4A584D]">
                    {scanContext.pathogen}
                  </div>
                )}
              </div>
            </div>

            <span
              className={`text-xs font-mono font-semibold px-3 py-1 uppercase rounded-xs self-start sm:self-auto ${
                scanContext.severity === 'high'
                  ? 'bg-[#A94338]/10 text-[#A94338] border border-[#A94338]/30'
                  : 'bg-[#B67B2A]/10 text-[#B67B2A] border border-[#B67B2A]/30'
              }`}
            >
              {scanContext.severity || 'MODERATE'} PRIORITY
            </span>
          </div>

          {/* 2. Diagnostic Uncertainty & Safety Notice */}
          <div className="p-4 bg-[#FAF3F2] border-l-4 border-[#B67B2A] border-y border-r border-[#D9DED3] rounded-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#B67B2A] uppercase">
              <AlertTriangle className="w-4 h-4 text-[#B67B2A]" />
              <span>{isTa ? 'பூர்வாங்க ஆய்வு வரம்பு எச்சரிக்கை' : 'Scientific Uncertainty & Safety Boundary'}</span>
            </div>
            <p className="text-xs sm:text-sm text-[#202B22] font-sans leading-relaxed">
              {isTa
                ? 'AI புகைப்பட ஆய்வு ஆரம்ப எச்சரிக்கை மட்டுமே. இலைக்கருகல் அறிகுறிகள் சாம்பல் சத்து குறைபாடு அல்லது நீர் தேக்கத்துடனும் ஒத்துப்போகக்கூடும். ஆய்வகப் பரிசோதனை அல்லது வேளாண் அலுவலர் நேரடி ஆய்வு இல்லாமல் வலிமையான ரசாயன பூச்சிக்கொல்லிகளை தெளிக்க வேண்டாம்.'
                : 'AI foliar screening provides preliminary visual triage. Foliar necrosis symptoms can easily overlap between fungal blights, potassium starvation, and soil drainage stress. Do not apply strong chemical fungicides without confirmed in-field escalation.'}
            </p>
          </div>

          {/* 3. Recommended In-Field Physical Observations */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold flex items-center gap-1.5 border-b border-[#D9DED3] pb-2">
              <CheckCircle2 className="w-4 h-4 text-[#426B43]" />
              <span>{isTa ? 'வயலில் நீங்கள் கவனிக்க வேண்டிய கூடுதல் அறிகுறிகள்' : 'Recommended In-Field Supplementary Observations'}</span>
            </h4>

            <ul className="space-y-2 text-xs sm:text-sm text-[#202B22] font-sans">
              <li className="flex items-start gap-2">
                <span className="text-[#426B43] font-bold">•</span>
                <span>
                  {isTa
                    ? 'புள்ளிகளின் விளிம்பை கவனிக்கவும்: அடர் பழுப்பு நிற விளிம்பு அல்லது மஞ்சள் வளையம் உள்ளதா?'
                    : 'Check lesion margins: Is there a distinct dark-brown border or yellowish halo surrounding the spots?'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#426B43] font-bold">•</span>
                <span>
                  {isTa
                    ? 'காலை பனிப்பொழிவு உள்ளதா? இலைகளில் 4 மணி நேரத்திற்கு மேல் பனித்துளிகள் தங்கியுள்ளதா?'
                    : 'Observe morning dew persistence: Does free moisture remain on leaf surfaces for >4 hours?'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#426B43] font-bold">•</span>
                <span>
                  {isTa
                    ? 'தண்டு மற்றும் கணுக்களைப் பார்க்கவும்: கருமை நிற வளையங்கள் அல்லது குருத்து வாடல் காணப்படுகிறதா?'
                    : 'Inspect lower stems and nodes: Are there blackish girdling rings or severed central tillers?'}
                </span>
              </li>
            </ul>
          </div>

          {/* 4. Verified Knowledge Hub Articles */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-[#183B2A] font-semibold flex items-center gap-1.5 border-b border-[#D9DED3] pb-2">
              <BookOpen className="w-4 h-4 text-[#426B43]" />
              <span>{isTa ? 'TNAU சரிபார்த்த வழிகாட்டல் கட்டுரைகள்' : 'Verified Knowledge Articles for this Condition'}</span>
            </h4>

            <div className="space-y-3">
              {relevantArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-4 bg-[#FAF9F3] border border-[#D9DED3] rounded-xs hover:border-[#183B2A] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#426B43] font-semibold mb-0.5">
                        {article.sourceName}
                      </div>
                      <h5 className="font-serif text-base font-semibold text-[#183B2A]">
                        {isTa ? article.titleTamil : article.title}
                      </h5>
                      <p className="text-xs text-[#4A584D] font-sans mt-1 line-clamp-2">
                        {isTa ? article.summaryTamil : article.summary}
                      </p>
                    </div>

                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-[#426B43] hover:text-[#183B2A] shrink-0"
                      title="View TNAU Reference Source"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Immediate Actionable Preview */}
                  <div className="mt-3 pt-3 border-t border-[#D9DED3] text-xs font-sans text-[#202B22] space-y-1">
                    <strong>{isTa ? 'பரிந்துரைக்கப்பட்ட முதல் நடவடிக்கை:' : 'Recommended First Step:'}</strong>
                    <p className="text-[#4A584D]">
                      {isTa ? article.actionableStepsTamil[0] : article.actionableSteps[0]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#FAF9F3] border-t border-[#D9DED3] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onOpenDirectory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDirectory(scanContext.district);
                }}
                className="px-4 py-2.5 text-xs font-mono text-[#183B2A] bg-white border border-[#D9DED3] hover:bg-[#E5EBDD] rounded-xs cursor-pointer flex items-center gap-1.5"
              >
                <Sprout className="w-3.5 h-3.5 text-[#426B43]" />
                <span>{isTa ? 'வட்டார KVK முகவரி காண்க' : 'Find Local KVK'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEscalateToEnquiry(scanContext);
              }}
              className="px-5 py-2.5 bg-[#183B2A] hover:bg-[#122c20] text-white text-xs font-mono font-semibold rounded-xs flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTa ? 'இவ்வாய்வை வைத்து வல்லுநர் கோரிக்கை அனுப்புக' : 'Draft Expert Enquiry with this Scan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

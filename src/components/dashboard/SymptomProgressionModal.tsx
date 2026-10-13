import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FieldCaseRecord, FieldObservation } from '../../types';
import {
  X,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  Sprout,
  HelpCircle,
} from 'lucide-react';

interface SymptomProgressionModalProps {
  caseRecord: FieldCaseRecord;
  observations: FieldObservation[];
  onClose: () => void;
}

export const SymptomProgressionModal: React.FC<SymptomProgressionModalProps> = ({
  caseRecord,
  observations,
  onClose,
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  if (observations.length < 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#FAF9F3] border border-stone-200 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
          <Info className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-[#183B2A] mb-2">
            {isTa ? 'போதிய பதிவுகள் இல்லை' : 'Insufficient Observations'}
          </h3>
          <p className="text-sm text-stone-600 mb-6">
            {isTa
              ? 'அறிகுறிகளின் மாற்றத்தை ஒப்பிட குறைந்தபட்சம் இரண்டு களப் பதிவுகள் தேவை. உங்கள் வயலை மீண்டும் ஆய்வு செய்து புதிய படத்தை சேர்க்கவும்.'
              : 'Symptom progression comparison requires at least 2 distinct observations recorded over time. Please add a follow-up observation first.'}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#183B2A] text-white rounded-xl font-medium hover:bg-[#122e20] transition-colors"
          >
            {isTa ? 'மூடு' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  // Earliest and latest observations
  const earliestObs = observations[0];
  const latestObs = observations[observations.length - 1];

  const earliestDate = new Date(earliestObs.createdAt).toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const latestDate = new Date(latestObs.createdAt).toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const farmerProgressionReport = latestObs.farmerReportedProgressionNote || latestObs.farmerInput?.symptomSpread;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF9F3] border border-stone-200 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-white/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                {caseRecord.caseToken}
              </span>
              <span className="text-xs text-stone-500">• {caseRecord.cropName} ({caseRecord.variety})</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#183B2A]">
              {isTa ? 'அறிகுறிகளின் முன்னேற்ற ஒப்பீடு' : 'Field Symptom Progression Comparison'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Cautious Progression Notice */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <strong className="font-semibold block mb-0.5">
                {isTa ? 'எச்சரிக்கையான ஒப்பீட்டு விதிமுறை:' : 'Scientific Assessment Precaution:'}
              </strong>
              {isTa
                ? 'சூரிய ஒளி, நிழல், கேமரா கோணம் மற்றும் இலையின் அமைப்பால் இரு ஒளிப்படங்களின் தோற்றம் மாறுபடலாம். ஒளிப்படங்களை மட்டும் வைத்து நோயின் தீவிரம் கூடியதாகவோ குறைந்ததாகவோ கருதக்கூடாது. உண்மையான முன்னேற்றத்தை அறிய வயலில் 10 தூர்களில் உள்ள புள்ளிகளை நேரில் எண்ணி சரிபார்க்கவும்.'
                : 'Variations in daylight, camera angle, and leaf curvature alter visual contrast. The system does not claim disease severity has changed solely because two photographs appear different. Field confirmation via 10-hill infected tiller counts remains essential.'}
            </div>
          </div>

          {/* Side by Side Images & Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earlier Observation */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm flex flex-col">
              <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  {isTa ? `ஆரம்பப் பதிவு (#${earliestObs.observationIndex})` : `Baseline Observation (#${earliestObs.observationIndex})`}
                </span>
                <span className="text-xs text-stone-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {earliestDate}
                </span>
              </div>
              <div className="relative aspect-video bg-stone-100 border-b border-stone-100 flex items-center justify-center overflow-hidden">
                <img
                  src={earliestObs.imageUrl}
                  alt="Baseline observation"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[11px] rounded backdrop-blur-xs font-mono">
                  {earliestObs.cropStage || 'Baseline Stage'}
                </span>
              </div>
              <div className="p-4 space-y-2 text-xs flex-1">
                <div>
                  <span className="text-stone-500 font-medium block">
                    {isTa ? 'கள அறிகுறிகள்:' : 'Reported Symptoms:'}
                  </span>
                  <p className="text-stone-800 mt-0.5">
                    {earliestObs.farmerInput?.affectedParts?.join(', ') || 'Foliar tissue'} •{' '}
                    {earliestObs.farmerInput?.estimatedIncidence || '<5% incidence'}
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-stone-500 font-medium block">
                    {isTa ? 'முதன்மை சந்தேகம்:' : 'Primary Differential:'}
                  </span>
                  <p className="font-semibold text-emerald-900 mt-0.5">
                    {isTa
                      ? earliestObs.differentialAssessment?.[0]?.conditionNameTamil || earliestObs.differentialAssessment?.[0]?.conditionName
                      : earliestObs.differentialAssessment?.[0]?.conditionName || 'Preliminary Evaluation'}
                  </p>
                </div>
              </div>
            </div>

            {/* Latest Observation */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm flex flex-col">
              <div className="px-4 py-3 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  {isTa ? `சமீபத்திய பதிவு (#${latestObs.observationIndex})` : `Latest Follow-up (#${latestObs.observationIndex})`}
                </span>
                <span className="text-xs text-emerald-700 flex items-center gap-1 font-semibold">
                  <Calendar className="w-3.5 h-3.5" /> {latestDate}
                </span>
              </div>
              <div className="relative aspect-video bg-stone-100 border-b border-stone-100 flex items-center justify-center overflow-hidden">
                <img
                  src={latestObs.imageUrl}
                  alt="Latest observation"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[11px] rounded backdrop-blur-xs font-mono">
                  {latestObs.cropStage || 'Current Stage'}
                </span>
              </div>
              <div className="p-4 space-y-2 text-xs flex-1">
                <div>
                  <span className="text-stone-500 font-medium block">
                    {isTa ? 'கள அறிகுறிகள்:' : 'Reported Symptoms:'}
                  </span>
                  <p className="text-stone-800 mt-0.5">
                    {latestObs.farmerInput?.affectedParts?.join(', ') || 'Foliar tissue'} •{' '}
                    {latestObs.farmerInput?.estimatedIncidence || 'Recorded incidence'}
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-stone-500 font-medium block">
                    {isTa ? 'தற்போதைய சந்தேகம்:' : 'Current Differential:'}
                  </span>
                  <p className="font-semibold text-emerald-900 mt-0.5">
                    {isTa
                      ? latestObs.differentialAssessment?.[0]?.conditionNameTamil || latestObs.differentialAssessment?.[0]?.conditionName
                      : latestObs.differentialAssessment?.[0]?.conditionName || 'Follow-up Evaluation'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Farmer-Reported In-Field Progression */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <h4 className="font-serif font-bold text-[#183B2A] text-sm mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              {isTa ? 'விவசாயி பதிவு செய்த கள மாற்றங்கள்:' : 'Farmer-Reported Temporal Changes:'}
            </h4>
            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
              {farmerProgressionReport ? (
                <span>
                  {typeof farmerProgressionReport === 'string' && farmerProgressionReport.startsWith('rapid')
                    ? (isTa ? 'அறிகுறிகள் சில நாட்களிலேயே வேகமாகப் பரவுவதாகப் பதிவு செய்யப்பட்டது.' : 'Symptoms reported spreading rapidly over a few days.')
                    : (isTa ? `குறிப்பு: ${farmerProgressionReport}` : `Field update note: ${farmerProgressionReport}`)}
                </span>
              ) : (
                <span className="italic text-stone-500">
                  {isTa ? 'விவசாயி வெளிப்படையான மாற்றுக் குறிப்புகளை அளிக்கவில்லை.' : 'No explicit textual progression note recorded for this transition.'}
                </span>
              )}
            </div>
          </div>

          {/* Model Interpretation Changes */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4">
            <h4 className="font-serif font-bold text-[#183B2A] text-sm mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              {isTa ? 'ஆய்வுப் பொறிமுறையின் ஒப்பீட்டு மதிப்பீடு:' : 'Differential Engine Progression Analysis:'}
            </h4>
            <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
              {earliestObs.differentialAssessment?.[0]?.conditionId === latestObs.differentialAssessment?.[0]?.conditionId
                ? (isTa
                    ? `ஆரம்ப நிலை மற்றும் தற்போதைய ஆய்வுகள் இரண்டும் ${earliestObs.differentialAssessment?.[0]?.conditionNameTamil || 'ஒரே நோயை'} முதன்மையாகக் காட்டுகின்றன. விளிம்புகளில் தொடர் விரிவடைதல் உள்ளதா என 10 தூர்களில் சரிபார்க்கவும்.`
                    : `Both baseline and follow-up inspections continue to point toward ${earliestObs.differentialAssessment?.[0]?.conditionName} as the primary candidate. Continue monitoring whether lesions are expanding or drying out under current cultural care.`)
                : (isTa
                    ? `அறிகுறிகளில் மாறுதல்கள் தென்படுகின்றன. ஆரம்ப ஆய்வு ${earliestObs.differentialAssessment?.[0]?.conditionNameTamil || 'ஒன்றையும்'}, பிந்தைய ஆய்வு ${latestObs.differentialAssessment?.[0]?.conditionNameTamil || 'மற்றொன்றையும்'} சுட்டிக்காட்டுகிறது. கூடுதல் களப் பரிசோதனை அல்லது வேளாண் அலுவலர் உதவி பரிந்துரைக்கப்படுகிறது.`
                    : `Differential candidate shifts detected between observations (${earliestObs.differentialAssessment?.[0]?.conditionName} -> ${latestObs.differentialAssessment?.[0]?.conditionName}). Direct in-field confirmation via bacterial ooze or sheath examination is recommended.`)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-white/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#183B2A] text-white rounded-xl font-medium hover:bg-[#122e20] transition-colors"
          >
            {isTa ? 'முடிந்தது' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  FieldCaseRecord,
  FieldObservation,
  FarmRecord,
  FieldCaseStatus,
} from '../../types';
import {
  subscribeFarmerFieldCases,
  fetchCaseObservations,
  updateFieldCaseStatus,
} from '../../services/fieldCaseService';
import { GuidedFieldAssessmentModal } from './GuidedFieldAssessmentModal';
import { SymptomProgressionModal } from './SymptomProgressionModal';
import {
  FileText,
  Plus,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sprout,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Camera,
  Eye,
  Filter,
  X,
  Send,
} from 'lucide-react';

interface FieldCaseHubProps {
  farms?: FarmRecord[];
  onEscalateToExpert?: (caseToken: string, crop: string, notes: string) => void;
  onRequestNewInvestigation?: () => void;
}

export const FieldCaseHub: React.FC<FieldCaseHubProps> = ({
  farms = [],
  onEscalateToExpert,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isTa = language === 'ta';

  // Cases state
  const [cases, setCases] = useState<FieldCaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<'all' | FieldCaseStatus>('all');

  // Selected Case for Detailed Dossier Drawer
  const [selectedCase, setSelectedCase] = useState<FieldCaseRecord | null>(null);
  const [caseObservations, setCaseObservations] = useState<FieldObservation[]>([]);
  const [isLoadingObservations, setIsLoadingObservations] = useState<boolean>(false);

  // Modals
  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [targetCaseForFollowUp, setTargetCaseForFollowUp] = useState<FieldCaseRecord | null>(null);
  const [showProgressionModal, setShowProgressionModal] = useState<boolean>(false);

  // Subscribe to farmer's field cases
  useEffect(() => {
    if (!user) {
      setCases([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeFarmerFieldCases(
      user.uid,
      (loaded) => {
        setCases(loaded);
        setIsLoading(false);
      },
      (err) => {
        console.error('Field cases subscription error:', err);
        setError(err.message || 'Failed to load field cases.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // When a case is selected, fetch its observations
  const handleSelectCase = async (c: FieldCaseRecord) => {
    setSelectedCase(c);
    if (!user) return;
    setIsLoadingObservations(true);
    try {
      const obs = await fetchCaseObservations(user.uid, c.id);
      setCaseObservations(obs);
    } catch (err) {
      console.error('Failed to load observations:', err);
    } finally {
      setIsLoadingObservations(false);
    }
  };

  const handleStatusChange = async (newStatus: FieldCaseStatus) => {
    if (!user || !selectedCase) return;
    try {
      await updateFieldCaseStatus(user.uid, selectedCase.id, newStatus);
      setSelectedCase((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      console.error('Error updating case status:', err);
    }
  };

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  const activeCount = cases.filter((c) => c.status === 'active').length;
  const monitoringCount = cases.filter((c) => c.status === 'monitoring').length;
  const resolvedCount = cases.filter((c) => c.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FAF9F3] border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {isTa ? 'கள ஆய்வு நினைவகம்' : 'Field Case Memory'}
            </span>
            <span className="text-xs text-stone-500">
              • {isTa ? 'தொடர் கண்காணிப்பு' : 'Longitudinal Monitoring'}
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#183B2A]">
            {isTa ? 'கள ஆய்வு வழக்குகள்' : 'Field Case Intelligence'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            {isTa
              ? 'ஒரு ஒளிப்படம் ஒரு தொடக்கமே. உங்கள் வயலின் அறிகுறிகளை காலம் கடந்து கண்காணிக்கவும், புதிய படங்களை இணைத்து நோயின் முன்னேற்றத்தை ஒப்பிடவும்.'
              : 'A single photo begins an investigation. Track foliar symptoms over time, append follow-up observations, and compare side-by-side progression without overwriting historical records.'}
          </p>
        </div>

        <button
          onClick={() => setShowNewCaseModal(true)}
          className="px-5 py-3 bg-[#183B2A] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#122e20] transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          {isTa ? 'புதிய கள ஆய்வு தொடங்க' : 'Start Field Investigation'}
        </button>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-2xs">
          <span className="text-xs text-stone-500 block">{isTa ? 'மொத்த வழக்குகள்' : 'Total Cases'}</span>
          <span className="font-serif text-2xl font-bold text-stone-900 mt-0.5 block">{cases.length}</span>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-2xs">
          <span className="text-xs text-emerald-700 font-semibold block">{isTa ? 'செயலில் உள்ளவை' : 'Active Cases'}</span>
          <span className="font-serif text-2xl font-bold text-emerald-900 mt-0.5 block">{activeCount}</span>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-2xs">
          <span className="text-xs text-amber-700 font-semibold block">{isTa ? 'கண்காணிப்பில்' : 'Under Monitoring'}</span>
          <span className="font-serif text-2xl font-bold text-amber-900 mt-0.5 block">{monitoringCount}</span>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-2xs">
          <span className="text-xs text-stone-600 block">{isTa ? 'சரிசெய்யப்பட்டவை' : 'Resolved'}</span>
          <span className="font-serif text-2xl font-bold text-stone-800 mt-0.5 block">{resolvedCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-stone-400 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> {isTa ? 'வடிகட்டி:' : 'Filter:'}
        </span>
        {[
          { id: 'all', labelEn: 'All Cases', labelTa: 'அனைத்தும்' },
          { id: 'active', labelEn: 'Active', labelTa: 'செயலில்' },
          { id: 'monitoring', labelEn: 'Monitoring', labelTa: 'கண்காணிப்பில்' },
          { id: 'resolved', labelEn: 'Resolved', labelTa: 'சரிசெய்யப்பட்டது' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors shrink-0 ${
              statusFilter === tab.id
                ? 'bg-[#183B2A] text-white border-[#183B2A]'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {isTa ? tab.labelTa : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Case List or Empty State */}
      {isLoading ? (
        <div className="py-16 text-center text-stone-500 space-y-2">
          <RotateCcw className="w-6 h-6 animate-spin mx-auto text-emerald-800" />
          <p className="text-xs">{isTa ? 'வழக்குகள் ஏற்றப்படுகின்றன...' : 'Loading field cases...'}</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-2xs space-y-3">
          <Sprout className="w-10 h-10 text-stone-400 mx-auto stroke-1" />
          <h3 className="font-serif text-lg font-bold text-stone-800">
            {isTa ? 'கள ஆய்வு வழக்குகள் எதுவும் இல்லை' : 'No Field Cases Found'}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            {isTa
              ? 'உங்கள் பயிரில் தென்படும் அறிகுறிகளை ஆய்வு செய்து தொடர் வழக்காக பதிவு செய்யுங்கள்.'
              : 'Begin by capturing leaf symptoms in your field. Cases maintain your observation history and let you track symptom progression over time.'}
          </p>
          <button
            onClick={() => setShowNewCaseModal(true)}
            className="px-5 py-2.5 bg-[#183B2A] text-white rounded-xl text-xs font-semibold hover:bg-[#122e20] transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {isTa ? 'முதல் கள ஆய்வை தொடங்குக' : 'Create First Field Case'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((c) => {
            const statusConfig = {
              active: { bg: 'bg-red-50 text-red-800 border-red-200', textEn: 'Active', textTa: 'செயலில்' },
              monitoring: { bg: 'bg-amber-50 text-amber-800 border-amber-200', textEn: 'Monitoring', textTa: 'கண்காணிப்பில்' },
              resolved: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', textEn: 'Resolved', textTa: 'சரிசெய்யப்பட்டது' },
              escalated: { bg: 'bg-purple-50 text-purple-800 border-purple-200', textEn: 'Escalated', textTa: 'பரிந்துரைக்கப்பட்டது' },
            }[c.status || 'active'];

            const formattedDate = new Date(c.latestObservationDate || c.initialDate).toLocaleDateString(
              isTa ? 'ta-IN' : 'en-IN',
              { day: 'numeric', month: 'short', year: 'numeric' }
            );

            return (
              <div
                key={c.id}
                onClick={() => handleSelectCase(c)}
                className="bg-white border border-stone-200 hover:border-emerald-700 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {c.caseToken}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.bg}`}>
                      {isTa ? statusConfig.textTa : statusConfig.textEn}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-stone-900 text-base line-clamp-1">
                    {isTa ? c.primarySuspectedConditionTamil : c.primarySuspectedCondition}
                  </h3>

                  <div className="text-xs text-stone-500 mt-1 space-y-0.5">
                    <div>
                      {c.cropName} ({c.variety}) • {c.district}
                    </div>
                    {c.farmName && (
                      <div className="text-stone-400">
                        {isTa ? 'பண்ணை:' : 'Farm:'} {c.farmName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-medium text-stone-700">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    {c.observationCount} {isTa ? 'பதிவுகள்' : c.observationCount === 1 ? 'Observation' : 'Observations'}
                  </span>
                  <span className="text-[11px] text-stone-400">{formattedDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Case Dossier Drawer Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FAF9F3] border border-stone-200 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-white/70">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedCase.caseToken}
                  </span>
                  <span className="text-xs text-stone-500">
                    {selectedCase.cropName} ({selectedCase.variety}) • {selectedCase.district}
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#183B2A]">
                  {isTa ? selectedCase.primarySuspectedConditionTamil : selectedCase.primarySuspectedCondition}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Dossier Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Quick Actions & Status Control */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-stone-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-700">
                    {isTa ? 'வழக்கு நிலை:' : 'Case Status:'}
                  </span>
                  <select
                    value={selectedCase.status}
                    onChange={(e) => handleStatusChange(e.target.value as FieldCaseStatus)}
                    className="text-xs font-semibold p-1.5 rounded-lg border border-stone-300 bg-white focus:outline-none"
                  >
                    <option value="active">{isTa ? 'செயலில் (Active)' : 'Active'}</option>
                    <option value="monitoring">{isTa ? 'கண்காணிப்பில் (Monitoring)' : 'Monitoring'}</option>
                    <option value="resolved">{isTa ? 'சரிசெய்யப்பட்டது (Resolved)' : 'Resolved'}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {caseObservations.length >= 2 && (
                    <button
                      onClick={() => setShowProgressionModal(true)}
                      className="px-3 py-2 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {isTa ? 'முன்னேற்ற ஒப்பீடு' : 'Compare Progression'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setTargetCaseForFollowUp(selectedCase);
                      setShowNewCaseModal(true);
                    }}
                    className="px-3.5 py-2 bg-[#183B2A] text-white rounded-xl text-xs font-semibold hover:bg-[#122e20] transition-colors flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {isTa ? '+ தொடர் ஆய்வு சேர்க்க' : '+ Add Follow-up'}
                  </button>

                  {onEscalateToExpert && (
                    <button
                      onClick={() => {
                        onEscalateToExpert(
                          selectedCase.caseToken,
                          selectedCase.cropId,
                          selectedCase.latestActionPlan.whatWeObserved.summary
                        );
                        setSelectedCase(null);
                      }}
                      className="px-3 py-2 border border-emerald-800 text-emerald-900 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isTa ? 'வேளாண் அலுவலரிடம் கேட்க' : 'Escalate'}
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline of Observations */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-700" />
                  {isTa ? 'களப் பதிவுகளின் வரிசை (Observation History)' : 'Observation Timeline'}
                  <span className="text-xs text-stone-400 font-sans font-normal">
                    ({caseObservations.length} {isTa ? 'பதிவுகள்' : 'Recorded'})
                  </span>
                </h3>

                {isLoadingObservations ? (
                  <div className="py-8 text-center text-stone-400">
                    <RotateCcw className="w-5 h-5 animate-spin mx-auto text-emerald-800" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {caseObservations.map((obs) => {
                      const obsDate = new Date(obs.createdAt).toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={obs.id}
                          className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <span className="text-xs font-bold text-emerald-900 font-mono">
                              #{obs.observationIndex} {obs.observationIndex === 1 ? (isTa ? 'ஆரம்பப் பதிவு' : 'Baseline Observation') : (isTa ? 'தொடர் கள ஆய்வு' : 'Follow-up Inspection')}
                            </span>
                            <span className="text-xs text-stone-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {obsDate}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-1">
                              <img
                                src={obs.imageUrl}
                                alt="Leaf specimen"
                                className="w-full h-36 object-cover rounded-lg border border-stone-200"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-2 text-xs">
                              <div>
                                <span className="font-semibold text-stone-600 block">
                                  {isTa ? 'வளர்ச்சிப் பருவம் & பாதிக்கப்பட்ட பகுதிகள்:' : 'Stage & Parts:'}
                                </span>
                                <p className="text-stone-800 mt-0.5">
                                  {obs.cropStage} • {obs.farmerInput?.affectedParts?.join(', ') || 'Leaves'}
                                </p>
                              </div>

                              <div>
                                <span className="font-semibold text-stone-600 block">
                                  {isTa ? 'முதன்மை மாற்று நோய் சந்தேகம்:' : 'Primary Differential Hypothesis:'}
                                </span>
                                <p className="font-bold text-emerald-950 mt-0.5">
                                  {isTa
                                    ? obs.differentialAssessment?.[0]?.conditionNameTamil || obs.differentialAssessment?.[0]?.conditionName
                                    : obs.differentialAssessment?.[0]?.conditionName || 'Preliminary Review'}
                                </p>
                              </div>

                              {obs.farmerReportedProgressionNote && (
                                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-950">
                                  <strong>{isTa ? 'விவசாயி குறிப்பு:' : 'Farmer Progression Note:'}</strong> {obs.farmerReportedProgressionNote}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-stone-200 bg-white/70 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-5 py-2.5 bg-[#183B2A] text-white rounded-xl font-medium hover:bg-[#122e20] transition-colors text-xs sm:text-sm"
              >
                {isTa ? 'மூடு' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Assessment Modal for New Case or Follow-up */}
      {showNewCaseModal && (
        <GuidedFieldAssessmentModal
          targetExistingCase={targetCaseForFollowUp}
          farms={farms}
          onClose={() => {
            setShowNewCaseModal(false);
            setTargetCaseForFollowUp(null);
          }}
          onCaseCreated={(newCase) => {
            setShowNewCaseModal(false);
            handleSelectCase(newCase);
          }}
          onObservationAdded={() => {
            setShowNewCaseModal(false);
            if (targetCaseForFollowUp) {
              handleSelectCase(targetCaseForFollowUp);
            }
          }}
          onEscalateToExpert={onEscalateToExpert}
        />
      )}

      {/* Symptom Progression Modal */}
      {showProgressionModal && selectedCase && (
        <SymptomProgressionModal
          caseRecord={selectedCase}
          observations={caseObservations}
          onClose={() => setShowProgressionModal(false)}
        />
      )}
    </div>
  );
};

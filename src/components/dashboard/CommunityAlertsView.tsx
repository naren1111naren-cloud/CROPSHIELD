import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { CommunityReport } from '../../types';
import { subscribeCommunityReports, submitCommunityReport } from '../../services/fieldReportsService';
import { Plus, CheckCircle, Clock, RefreshCw, X, Send } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

export const CommunityAlertsView: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, profile } = useAuth();

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formVillage, setFormVillage] = useState('');
  const [formDistrict, setFormDistrict] = useState('Thanjavur');
  const [formVariety, setFormVariety] = useState('CR 1009 Sub 1');
  const [formStage, setStage] = useState('Tillering');
  const [formCondition, setFormCondition] = useState('Rice Blast (Spindle Leaf Spots)');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Auto-fill form defaults from farmer profile
  useEffect(() => {
    if (profile) {
      if (profile.displayName) setFormName(profile.displayName);
      if (profile.locality) setFormVillage(profile.locality);
      if (profile.district) setFormDistrict(profile.district);
      if (profile.activeVariety) setFormVariety(profile.activeVariety);
    }
  }, [profile]);

  useEffect(() => {
    setIsLoading(true);

    // 1. Subscribe to Firestore fieldReports
    const unsubscribe = subscribeCommunityReports(
      filterDistrict,
      (firestoreReports) => {
        if (firestoreReports.length > 0) {
          setReports(firestoreReports);
          setIsLoading(false);
        } else {
          // Fall back to server seeded reports
          fetchFallbackReports();
        }
      },
      (err) => {
        console.warn('Firestore community reports subscription error:', err);
        fetchFallbackReports();
      }
    );

    async function fetchFallbackReports() {
      try {
        const url = filterDistrict === 'all'
          ? '/api/community-reports'
          : `/api/community-reports?district=${encodeURIComponent(filterDistrict)}`;
        const res = await apiFetch(url);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setReports(json.data);
        } else {
          console.error('[CropShield] /api/community-reports returned unexpected shape:', json);
        }
      } catch (err) {
        console.error('[CropShield] Failed to load fallback community reports from backend:', err);
      } finally {
        setIsLoading(false);
      }
    }

    return () => unsubscribe();
  }, [filterDistrict]);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVillage || !formCondition) return;

    setIsSubmitting(true);
    try {
      const reporterUid = user?.uid || 'anon-farmer';
      const reporterName = formName || profile?.displayName || user?.displayName || 'Local Paddy Cultivator';

      // 1. Save to Firestore if available
      try {
        await submitCommunityReport({
          submittedBy: reporterUid,
          farmerName: reporterName,
          village: formVillage,
          district: formDistrict,
          variety: formVariety,
          growthStage: formStage,
          suspectedCondition: formCondition,
          fieldNotes: formNotes,
        });
      } catch (fsErr) {
        console.warn('[CropShield] Firestore report submit failed, trying Render server API:', fsErr);
        // Fallback to server endpoint
        await apiFetch('/api/community-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmerName: reporterName,
            village: formVillage,
            district: formDistrict,
            variety: formVariety,
            growthStage: formStage,
            suspectedCondition: formCondition,
            fieldNotes: formNotes,
          }),
        });
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setFormNotes('');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-[#D9DED3] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase text-[#426B43] tracking-wider block mb-1 font-semibold">
            VERIFIED REGIONAL SURVEILLANCE
          </span>
          <h2 className="font-serif text-2xl font-medium text-[#183B2A]">
            {t('alertsTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-[#4A584D] font-sans mt-0.5">
            {t('alertsSubtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 min-h-[44px] text-xs font-mono font-semibold text-white bg-[#183B2A] hover:bg-[#122c20] transition-colors rounded-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t('alertsSubmitNew')}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white border border-[#D9DED3] overflow-x-auto">
        <button
          onClick={() => setFilterDistrict('all')}
          className={`px-4 py-2 min-h-[40px] text-xs font-mono font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
            filterDistrict === 'all'
              ? 'bg-[#183B2A] text-white'
              : 'text-[#4A584D] hover:text-[#183B2A]'
          }`}
        >
          {t('alertsFilterAll')}
        </button>
        {['Thanjavur', 'Tiruvarur', 'Mayiladuthurai', 'Nagapattinam'].map((dist) => (
          <button
            key={dist}
            onClick={() => setFilterDistrict(dist)}
            className={`px-4 py-2 min-h-[40px] text-xs font-mono font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
              filterDistrict === dist
                ? 'bg-[#183B2A] text-white'
                : 'text-[#4A584D] hover:text-[#183B2A]'
            }`}
          >
            {dist}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="bg-white border border-[#D9DED3] p-12 text-center text-[#4A584D] font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#183B2A]" />
          <span>Retrieving verified reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-[#D9DED3] p-12 text-center text-[#4A584D] font-mono text-xs">
          No verified incidents currently recorded for this district query.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isVerified = report.verificationStatus.includes('Verified');
            return (
              <div
                key={report.id}
                className="bg-white border border-[#D9DED3] p-6 hover:border-[#183B2A] transition-colors shadow-xs"
              >
                <div className="border-b border-[#D9DED3] pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#183B2A]">{report.id}</span>
                    <span>·</span>
                    <span className="text-[#4A584D]">
                      {report.village}, {report.district}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium ${
                        isVerified
                          ? 'bg-[#426B43]/10 text-[#426B43] border border-[#426B43]/30'
                          : 'bg-[#B67B2A]/10 text-[#B67B2A] border border-[#B67B2A]/30'
                      }`}
                    >
                      {isVerified ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {language === 'ta'
                          ? report.verificationStatusTamil
                          : report.verificationStatus}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-8">
                    <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#183B2A] mb-1">
                      {language === 'ta'
                        ? report.suspectedConditionTamil
                        : report.suspectedCondition}
                    </h3>
                    <p className="text-sm sm:text-base text-[#202B22]/90 font-sans leading-relaxed mb-3">
                      {report.fieldNotes}
                    </p>

                    {/* Unboxed Metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A584D] font-mono">
                      <span>Cultivar: {report.variety}</span>
                      <span aria-hidden="true">·</span>
                      <span>Crop Stage: {report.growthStage}</span>
                      <span aria-hidden="true">·</span>
                      <span>Observer: {report.farmerName}</span>
                    </div>
                  </div>

                  <div className="md:col-span-4 md:text-right border-t md:border-t-0 md:border-l border-[#D9DED3] pt-4 md:pt-0 md:pl-6 text-xs font-mono text-[#4A584D] space-y-1">
                    <div>DATE: {report.reportedDate}</div>
                    <div>SEVERITY: {report.riskLevel.toUpperCase()}</div>
                    <div className="text-xs text-[#426B43] font-semibold mt-2">
                      COORDINATES: {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#183B2A] max-w-xl w-full p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D9DED3] pb-4 mb-6">
              <div>
                <span className="text-xs font-mono text-[#426B43] uppercase tracking-wider block font-semibold">
                  COMMUNITY SURVEILLANCE
                </span>
                <h3 className="font-serif text-2xl font-medium text-[#183B2A]">
                  {t('alertsModalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#667166] hover:text-[#183B2A] p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-6 bg-[#FAF9F3] border border-[#426B43] text-center text-sm font-sans space-y-2">
                <CheckCircle className="w-8 h-8 text-[#426B43] mx-auto" />
                <div className="font-serif text-lg font-medium text-[#183B2A]">
                  Observation Submitted Successfully
                </div>
                <p className="text-xs text-[#4A584D]">
                  Your report has been routed to the Block Agricultural Officer for field sample verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="formFarmerNameInput" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                      {t('alertsFormFarmerName')}
                    </label>
                    <input
                      id="formFarmerNameInput"
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. K. Murugan"
                      className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A]"
                    />
                  </div>

                  <div>
                    <label htmlFor="formVillageInput" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                      {t('alertsFormVillage')} *
                    </label>
                    <input
                      id="formVillageInput"
                      type="text"
                      required
                      value={formVillage}
                      onChange={(e) => setFormVillage(e.target.value)}
                      placeholder="e.g. Needamangalam"
                      className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="formDistrictSelect" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                      {t('alertsFormDistrict')} *
                    </label>
                    <select
                      id="formDistrictSelect"
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A]"
                    >
                      <option value="Thanjavur">Thanjavur</option>
                      <option value="Tiruvarur">Tiruvarur</option>
                      <option value="Mayiladuthurai">Mayiladuthurai</option>
                      <option value="Nagapattinam">Nagapattinam</option>
                      <option value="Tiruchirappalli">Tiruchirappalli</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="formVarietyInput" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                      {t('alertsFormVariety')}
                    </label>
                    <input
                      id="formVarietyInput"
                      type="text"
                      value={formVariety}
                      onChange={(e) => setFormVariety(e.target.value)}
                      placeholder="e.g. CR 1009 Sub 1"
                      className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="formConditionInput" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                    {t('alertsFormCondition')} *
                  </label>
                  <input
                    id="formConditionInput"
                    type="text"
                    required
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                    placeholder="e.g. Spindle spots on upper leaf blades after long morning mist"
                    className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A]"
                  />
                </div>

                <div>
                  <label htmlFor="formNotesInput" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                    {t('alertsFormNotes')}
                  </label>
                  <textarea
                    id="formNotesInput"
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Describe leaf symptoms, field moisture, dew hours, and recent fertilizer applied..."
                    className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] focus:outline-hidden focus:border-[#183B2A]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9DED3]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 min-h-[44px] text-xs font-mono text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
                  >
                    {t('alertsFormCancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 min-h-[44px] text-xs font-mono font-semibold text-white bg-[#183B2A] hover:bg-[#122c20] rounded-xs flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : t('alertsFormSubmit')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

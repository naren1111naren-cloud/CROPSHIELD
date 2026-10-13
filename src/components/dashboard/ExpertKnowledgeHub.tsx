/**
 * CropShield AI — Agricultural Expert Support & Knowledge Hub
 * Version: 1.0.0 (Phase 7)
 * 
 * Interactive module providing:
 * 1. Searchable agricultural knowledge hub with verified TNAU references.
 * 2. Directory of verified Krishi Vigyan Kendras (KVKs) and government extensions.
 * 3. Authenticated farmer enquiry workflow with tracking tokens and image validation.
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { FarmRecord, ScanData, KnowledgeArticle, ExpertServiceEntry, FarmerEnquiry, KnowledgeTopic, ExpertServiceType } from '../../types';
import { queryKnowledgeArticles, KNOWLEDGE_ARTICLES } from '../../config/knowledgeHubRegistry';
import { queryExpertDirectory, EXPERT_SERVICE_DIRECTORY } from '../../config/expertDirectoryRegistry';
import { createFarmerEnquiry, subscribeFarmerEnquiries, deleteFarmerEnquiry } from '../../services/enquiryService';
import { ALL_TAMIL_NADU_DISTRICTS } from '../../config/tamilNaduDistricts';
import {
  BookOpen,
  Building2,
  Send,
  Search,
  Filter,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload,
  Camera,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Sprout,
  HelpCircle,
  Layers,
  Calendar,
  Check
} from 'lucide-react';

interface ExpertKnowledgeHubProps {
  farms?: FarmRecord[];
  activeFarm?: FarmRecord | null;
  scans?: ScanData[];
  initialEnquiryContext?: {
    scanId?: string;
    cropId?: string;
    cropName?: string;
    conditionName?: string;
    severity?: string;
    imagePath?: string;
  } | null;
  onClearEnquiryContext?: () => void;
}

export const ExpertKnowledgeHub: React.FC<ExpertKnowledgeHubProps> = ({
  farms = [],
  activeFarm,
  scans = [],
  initialEnquiryContext,
  onClearEnquiryContext,
}) => {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const isTa = language === 'ta';

  // Subtabs: 'knowledge' | 'directory' | 'enquiries'
  const [activeSubTab, setActiveSubTab] = useState<'knowledge' | 'directory' | 'enquiries'>('knowledge');

  // --- Knowledge Hub State ---
  const [knowledgeSearch, setKnowledgeSearch] = useState<string>('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<KnowledgeTopic | 'all'>('all');
  const [selectedArticleModal, setSelectedArticleModal] = useState<KnowledgeArticle | null>(null);

  // --- Expert Directory State ---
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>(activeFarm?.district || profile?.district || 'all');
  const [selectedServiceTypeFilter, setSelectedServiceTypeFilter] = useState<ExpertServiceType | 'all'>('all');

  // --- Enquiries State ---
  const [enquiries, setEnquiries] = useState<FarmerEnquiry[]>([]);
  const [isEnquiriesLoading, setIsEnquiriesLoading] = useState<boolean>(true);
  const [showNewEnquiryModal, setShowNewEnquiryModal] = useState<boolean>(false);
  const [selectedEnquiryDetail, setSelectedEnquiryDetail] = useState<FarmerEnquiry | null>(null);

  // --- New Enquiry Form State ---
  const [formFarmerName, setFormFarmerName] = useState<string>(profile?.displayName || user?.displayName || '');
  const [formPhone, setFormPhone] = useState<string>(profile?.phone || '');
  const [formCropId, setFormCropId] = useState<string>(initialEnquiryContext?.cropId || 'rice');
  const [formCropName, setFormCropName] = useState<string>(initialEnquiryContext?.cropName || 'Rice (Paddy)');
  const [formFarmId, setFormFarmId] = useState<string>(activeFarm?.id || '');
  const [formDistrict, setFormDistrict] = useState<string>(activeFarm?.district || profile?.district || 'Thanjavur');
  const [formProblemCategory, setFormProblemCategory] = useState<FarmerEnquiry['problemCategory']>('disease_identification');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formUrgency, setFormUrgency] = useState<'standard' | 'high_priority'>('standard');
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(initialEnquiryContext?.imagePath || null);
  const [linkedScanId, setLinkedScanId] = useState<string>(initialEnquiryContext?.scanId || '');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState<boolean>(false);
  const [enquirySuccessToken, setEnquirySuccessToken] = useState<string | null>(null);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);

  // Listen to initialEnquiryContext trigger
  useEffect(() => {
    if (initialEnquiryContext) {
      setActiveSubTab('enquiries');
      setShowNewEnquiryModal(true);
      if (initialEnquiryContext.cropId) setFormCropId(initialEnquiryContext.cropId);
      if (initialEnquiryContext.cropName) setFormCropName(initialEnquiryContext.cropName);
      if (initialEnquiryContext.scanId) setLinkedScanId(initialEnquiryContext.scanId);
      if (initialEnquiryContext.imagePath) setFormPhotoPreview(initialEnquiryContext.imagePath);
      if (initialEnquiryContext.conditionName) {
        setFormDescription(
          isTa
            ? `ஸ்கேன் முடிவு: ${initialEnquiryContext.conditionName}. இலை அறிகுறிகள் தீவிரமாக உள்ளதால் நேரில் கள ஆய்வு தேவைப்படுகிறது.`
            : `Scan diagnosis indicated suspected ${initialEnquiryContext.conditionName}. Requesting specialist physical verification.`
        );
      }
    }
  }, [initialEnquiryContext, isTa]);

  // Subscribe to farmer's real-time enquiries
  useEffect(() => {
    if (!user) {
      setEnquiries([]);
      setIsEnquiriesLoading(false);
      return;
    }

    setIsEnquiriesLoading(true);
    const unsubscribe = subscribeFarmerEnquiries(
      user.uid,
      (loaded) => {
        setEnquiries(loaded);
        setIsEnquiriesLoading(false);
      },
      (err) => {
        console.error('Error listening to farmer enquiries:', err);
        setIsEnquiriesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Query Knowledge Hub
  const filteredArticles = queryKnowledgeArticles({
    searchQuery: knowledgeSearch,
    cropId: selectedCropFilter,
    topic: selectedTopicFilter,
  });

  // Query Expert Directory
  const filteredDirectory = queryExpertDirectory({
    searchQuery: directorySearch,
    district: selectedDistrictFilter,
    serviceType: selectedServiceTypeFilter,
  });

  // Handle Photo File Pick
  const handlePhotoChange = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert(isTa ? 'JPEG, PNG, அல்லது WebP படங்களை மட்டுமே பதிவேற்றவும்.' : 'Please upload JPEG, PNG, or WebP format.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert(isTa ? 'கோப்பின் அளவு 15 MBக்கு கீழ் இருக்க வேண்டும்.' : 'File size must be under 15 MB.');
      return;
    }

    setFormPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFormPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Handle Submit Enquiry
  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(isTa ? 'கோரிக்கை அனுப்ப முதலில் உள்நுழையவும்.' : 'Please sign in to submit an expert enquiry.');
      return;
    }
    if (!formDescription.trim()) {
      setEnquiryError(isTa ? 'பிரச்சினையின் விவரத்தை உள்ளிடவும்.' : 'Please enter a description of the problem.');
      return;
    }

    setIsSubmittingEnquiry(true);
    setEnquiryError(null);

    try {
      const selectedFarmObj = farms.find((f) => f.id === formFarmId);
      const res = await createFarmerEnquiry(user.uid, {
        farmerName: formFarmerName || profile?.displayName || 'Farmer',
        farmerPhone: formPhone,
        preferredLanguage: isTa ? 'ta' : 'en',
        farmId: formFarmId,
        farmName: selectedFarmObj?.farmName || '',
        cropId: formCropId,
        cropName: formCropName,
        district: formDistrict,
        problemCategory: formProblemCategory,
        description: formDescription,
        linkedScanId: linkedScanId || undefined,
        linkedScanCondition: initialEnquiryContext?.conditionName || undefined,
        linkedScanSeverity: initialEnquiryContext?.severity || undefined,
        urgency: formUrgency,
        photoFile: formPhotoFile,
        existingPhotoUrl: formPhotoPreview && !formPhotoFile ? formPhotoPreview : undefined,
      });

      setEnquirySuccessToken(res.enquiryId);
    } catch (err: any) {
      console.error('Failed to submit enquiry:', err);
      setEnquiryError(err.message || 'Failed to submit enquiry. Please retry.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const handleResetEnquiryForm = () => {
    setShowNewEnquiryModal(false);
    setEnquirySuccessToken(null);
    setEnquiryError(null);
    setFormDescription('');
    setFormPhotoFile(null);
    setFormPhotoPreview(null);
    setLinkedScanId('');
    onClearEnquiryContext?.();
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Navigation Subtabs */}
      <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DED3] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#426B43] uppercase tracking-wider mb-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#183B2A]" />
              <span>{isTa ? 'தமிழ்நாடு வேளாண் அறிவு & விரிவாக்க மையம்' : 'TAMIL NADU AGRICULTURAL EXPERT & KNOWLEDGE HUB'}</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A]">
              {isTa ? 'நம்பகமான வேளாண் அறிவு & வல்லுநர் தொடர்பு' : 'Trusted Agronomic Intelligence & Expert Support'}
            </h2>
            <p className="text-xs sm:text-sm font-sans text-[#4A584D] mt-1 max-w-2xl">
              {isTa
                ? 'TNAU மற்றும் ICAR சரிபார்த்த ஆராய்ச்சி வழிகாட்டல்கள், மாவட்ட KVK தொடர்பு எண்கள் மற்றும் நேரடி கள ஆய்வுக் கோரிக்கை முறை.'
                : 'Research-backed pest management protocols from TNAU & ICAR, official Krishi Vigyan Kendra directory, and authenticated sample enquiry tracking.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('enquiries');
              setShowNewEnquiryModal(true);
            }}
            className="px-5 py-3 bg-[#183B2A] hover:bg-[#122c20] text-white text-xs font-mono font-semibold rounded-xs flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>{isTa ? 'புதிய வல்லுநர் கோரிக்கை' : 'New Expert Enquiry'}</span>
          </button>
        </div>

        {/* Segmented Subtabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#D9DED3] pb-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('knowledge')}
            className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'knowledge'
                ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isTa ? 'கள அறிவு மையம் (TNAU)' : 'Knowledge Hub (TNAU/ICAR)'}</span>
            <span className="text-[10px] bg-[#E5EBDD] text-[#183B2A] px-1.5 py-0.5 rounded-full font-bold">
              {KNOWLEDGE_ARTICLES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('directory')}
            className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'directory'
                ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isTa ? 'வல்லுநர் & KVK முகவரி' : 'Support Directory (KVK/JDA)'}</span>
            <span className="text-[10px] bg-[#E5EBDD] text-[#183B2A] px-1.5 py-0.5 rounded-full font-bold">
              {EXPERT_SERVICE_DIRECTORY.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('enquiries')}
            className={`px-5 py-3 min-h-[44px] text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'enquiries'
                ? 'border-[#183B2A] text-[#183B2A] font-bold bg-[#FAF9F3]'
                : 'border-transparent text-[#4A584D] hover:text-[#183B2A]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isTa ? 'எனது கோரிக்கைகள்' : 'My Enquiries & Tracking'}</span>
            <span className="text-[10px] bg-[#E5EBDD] text-[#183B2A] px-1.5 py-0.5 rounded-full font-bold">
              {enquiries.length}
            </span>
          </button>
        </div>
      </div>

      {/* --- SUBTAB 1: KNOWLEDGE HUB --- */}
      {activeSubTab === 'knowledge' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-[#D9DED3] p-5 rounded-xs space-y-4 shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 text-[#4A584D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  isTa
                    ? 'நோய், பூச்சி, அறிகுறிகள் அல்லது TNAU நெறிமுறைகளைத் தேடுக...'
                    : 'Search diseases, pests, foliar symptoms, or TNAU protocols...'
                }
                value={knowledgeSearch}
                onChange={(e) => setKnowledgeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-sans rounded-xs focus:outline-hidden focus:border-[#183B2A]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Crop Filter */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <span className="text-[#4A584D] uppercase font-semibold mr-1">
                  {isTa ? 'பயிர்:' : 'Crop:'}
                </span>
                {['all', 'rice', 'tomato', 'chilli'].map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setSelectedCropFilter(crop)}
                    className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                      selectedCropFilter === crop
                        ? 'bg-[#183B2A] text-white font-bold'
                        : 'bg-[#FAF9F3] text-[#4A584D] hover:bg-[#E5EBDD]'
                    }`}
                  >
                    {crop === 'all'
                      ? (isTa ? 'அனைத்தும்' : 'All Crops')
                      : crop === 'rice'
                      ? (isTa ? 'நெல்' : 'Rice')
                      : crop === 'tomato'
                      ? (isTa ? 'தக்காளி' : 'Tomato')
                      : (isTa ? 'மிளகாய்' : 'Chilli')}
                  </button>
                ))}
              </div>

              {/* Topic Filter */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <span className="text-[#4A584D] uppercase font-semibold mr-1">
                  {isTa ? 'பிரிவு:' : 'Topic:'}
                </span>
                {[
                  { id: 'all', en: 'All Topics', ta: 'அனைத்தும்' },
                  { id: 'disease', en: 'Diseases', ta: 'நோய்கள்' },
                  { id: 'pest', en: 'Pests', ta: 'பூச்சிகள்' },
                  { id: 'weather_precautions', en: 'Weather Risks', ta: 'வானிலை இடர்' },
                  { id: 'professional_help', en: 'Lab Escalation', ta: 'ஆய்வகம்' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTopicFilter(t.id as any)}
                    className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                      selectedTopicFilter === t.id
                        ? 'bg-[#183B2A] text-white font-bold'
                        : 'bg-[#FAF9F3] text-[#4A584D] hover:bg-[#E5EBDD]'
                    }`}
                  >
                    {isTa ? t.ta : t.en}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          {filteredArticles.length === 0 ? (
            <div className="bg-white border border-[#D9DED3] p-12 text-center rounded-xs space-y-3">
              <Search className="w-8 h-8 text-[#4A584D] mx-auto" />
              <h4 className="font-serif text-xl font-medium text-[#183B2A]">
                {isTa ? 'கட்டுரைகள் எதுவும் பொருந்தவில்லை' : 'No Knowledge Articles Found'}
              </h4>
              <p className="text-xs font-mono text-[#4A584D]">
                {isTa ? 'வேறு தேடல் சொற்களைப் பயன்படுத்தவும்.' : 'Try adjusting your search keywords or crop filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white border border-[#D9DED3] hover:border-[#183B2A] transition-all p-6 rounded-xs flex flex-col justify-between shadow-2xs group"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9DED3] pb-3">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#E5EBDD] text-[#183B2A] rounded-xs font-semibold">
                        {article.cropId.toUpperCase()} · {article.topic.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-[#4A584D] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#426B43]" />
                        <span>VERIFIED {article.lastVerifiedDate}</span>
                      </span>
                    </div>

                    <h4 className="font-serif text-lg sm:text-xl font-medium text-[#183B2A] group-hover:text-[#426B43] transition-colors">
                      {isTa ? article.titleTamil : article.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-[#4A584D] font-sans leading-relaxed line-clamp-3">
                      {isTa ? article.summaryTamil : article.summary}
                    </p>

                    <div className="pt-2 text-xs font-sans text-[#202B22] space-y-1">
                      <strong className="text-[11px] font-mono uppercase text-[#183B2A] block">
                        {isTa ? 'முதல் தடுப்பு நடவடிக்கை:' : 'Primary Action:'}
                      </strong>
                      <p className="text-xs text-[#4A584D] line-clamp-2">
                        {isTa ? article.actionableStepsTamil[0] : article.actionableSteps[0]}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-[#D9DED3] mt-5 flex items-center justify-between gap-3 text-xs font-mono">
                    <span className="text-[11px] text-[#426B43] truncate font-medium max-w-[200px]" title={article.sourceName}>
                      {article.sourceName}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedArticleModal(article)}
                      className="px-3.5 py-1.5 bg-[#FAF9F3] hover:bg-[#E5EBDD] text-[#183B2A] border border-[#D9DED3] rounded-xs cursor-pointer flex items-center gap-1 font-semibold transition-colors"
                    >
                      <span>{isTa ? 'முழு வழிகாட்டி' : 'Read Guide'}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 2: AGRICULTURAL EXPERT DIRECTORY --- */}
      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          {/* Directory Search & Filter Bar */}
          <div className="bg-white border border-[#D9DED3] p-5 rounded-xs space-y-4 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-[#4A584D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    isTa
                      ? 'KVK, கல்லூரி அல்லது மாவட்டப் பெயர் மூலம் தேடுக...'
                      : 'Search by institution name, district, or crop...'
                  }
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-sans rounded-xs focus:outline-hidden focus:border-[#183B2A]"
                />
              </div>

              {/* District Filter Dropdown */}
              <div className="md:col-span-3">
                <select
                  value={selectedDistrictFilter}
                  onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-xs font-mono text-[#202B22] rounded-xs focus:outline-hidden focus:border-[#183B2A]"
                >
                  <option value="all">{isTa ? 'அனைத்து மாவட்டங்களும்' : 'All Tamil Nadu Districts'}</option>
                  {ALL_TAMIL_NADU_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.nameTamil})
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type Dropdown */}
              <div className="md:col-span-3">
                <select
                  value={selectedServiceTypeFilter}
                  onChange={(e) => setSelectedServiceTypeFilter(e.target.value as any)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-xs font-mono text-[#202B22] rounded-xs focus:outline-hidden focus:border-[#183B2A]"
                >
                  <option value="all">{isTa ? 'அனைத்து சேவை வகைகளும்' : 'All Support Types'}</option>
                  <option value="kvk">Krishi Vigyan Kendra (KVK)</option>
                  <option value="university_extension">TNAU University Extension</option>
                  <option value="district_jda">District JDA Office</option>
                  <option value="kisan_call_centre">Kisan Call Centre (Helpline)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Listings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDirectory.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-[#D9DED3] hover:border-[#183B2A] transition-all p-6 rounded-xs flex flex-col justify-between shadow-2xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-[#D9DED3] pb-3">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#FAF9F3] text-[#183B2A] border border-[#D9DED3] rounded-xs font-semibold">
                      {entry.serviceType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-[#426B43] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isTa ? 'சரிபார்க்கப்பட்டது' : 'VERIFIED PUBLIC RECORD'}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif text-lg font-semibold text-[#183B2A]">
                      {isTa ? entry.nameTamil : entry.name}
                    </h4>
                    <div className="text-xs text-[#4A584D] font-mono mt-0.5">
                      {isTa ? entry.institutionNameTamil : entry.institutionName}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="text-xs font-sans text-[#202B22] flex items-start gap-2 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#426B43] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {isTa ? entry.officeAddressTamil : entry.officeAddress}
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="text-[11px] font-mono text-[#4A584D] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#426B43] shrink-0" />
                    <span>{isTa ? entry.operatingHoursTamil : entry.operatingHours}</span>
                  </div>

                  {/* Crops / Topics Covered */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {entry.cropsOrTopicsCovered.map((crop, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono bg-[#FAF9F3] text-[#4A584D] px-1.5 py-0.5 rounded-xs"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="pt-4 border-t border-[#D9DED3] flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={`tel:${entry.contactPhone.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183B2A] hover:bg-[#122c20] text-white text-xs font-mono font-semibold rounded-xs shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{entry.contactPhone}</span>
                  </a>

                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[#4A584D] hover:text-[#183B2A] text-xs font-mono flex items-center gap-1"
                    title="Official Portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{isTa ? 'இணையதளம்' : 'Portal'}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: MY ENQUIRIES & DISPATCH TRACKER --- */}
      {activeSubTab === 'enquiries' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 space-y-6 rounded-xs shadow-xs">
            <div className="border-b border-[#D9DED3] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase text-[#426B43] tracking-wider block font-semibold">
                  PROFILES/{user?.uid?.substring(0, 8)}/ENQUIRIES · FIRESTORE SUBCOLLECTION
                </span>
                <h3 className="font-serif text-2xl font-medium text-[#183B2A]">
                  {isTa ? 'எனது களக் கோரிக்கைகள் & ஆய்வு நிலவரம்' : 'My Field Enquiries & Escalation Dispatches'}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#4A584D]">
                  {enquiries.length} {isTa ? 'கோரிக்கைகள்' : 'ENQUIRIES'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewEnquiryModal(true)}
                  className="px-4 py-2 bg-[#183B2A] hover:bg-[#122c20] text-white text-xs font-mono font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer shadow-2xs min-h-[40px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isTa ? 'புதிய கோரிக்கை' : 'File Enquiry'}</span>
                </button>
              </div>
            </div>

            {/* Loading */}
            {isEnquiriesLoading && (
              <div className="py-12 text-center text-[#4A584D] font-mono text-xs flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-[#183B2A]" />
                <span>{isTa ? 'கோரிக்கைகள் ஏற்றப்படுகின்றன...' : 'Loading enquiry dispatches from Firestore...'}</span>
              </div>
            )}

            {/* Empty State */}
            {!isEnquiriesLoading && enquiries.length === 0 && (
              <div className="p-8 sm:p-12 text-center bg-[#FAF9F3] border border-dashed border-[#D9DED3] rounded-xs space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#183B2A]/10 flex items-center justify-center text-[#183B2A]">
                  <Send className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-xl font-medium text-[#183B2A]">
                    {isTa ? 'இதுவரை எந்தக் கோரிக்கைகளும் சமர்ப்பிக்கப்படவில்லை' : 'No Expert Enquiries Logged Yet'}
                  </h4>
                  <p className="text-xs text-[#4A584D] font-sans max-w-md mx-auto">
                    {isTa
                      ? 'உங்கள் பயிரில் சந்தேகம் அல்லது தீவிர அறிகுறிகள் தென்பட்டால் இலை ஒளிப்படத்துடன் கோரிக்கையை சமர்ப்பிக்கவும்.'
                      : 'If your field displays uncertain lesions or severe blighting, log an enquiry with your leaf photograph for physical KVK or extension officer escalation.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewEnquiryModal(true)}
                  className="px-6 py-2.5 bg-[#183B2A] text-white font-mono text-xs font-semibold hover:bg-[#122c20] rounded-xs cursor-pointer shadow-xs min-h-[44px]"
                >
                  {isTa ? 'முதல் கோரிக்கையை சமர்ப்பிக்க' : 'File Your First Enquiry'}
                </button>
              </div>
            )}

            {/* Enquiries List */}
            {!isEnquiriesLoading && enquiries.length > 0 && (
              <div className="divide-y divide-[#D9DED3]">
                {enquiries.map((enq) => {
                  const statusColors = {
                    submitted: 'bg-[#B67B2A]/10 text-[#B67B2A] border-[#B67B2A]/30',
                    under_review: 'bg-[#183B2A]/10 text-[#183B2A] border-[#183B2A]/30',
                    response_available: 'bg-[#426B43]/10 text-[#426B43] border-[#426B43]/30',
                    closed: 'bg-[#4A584D]/10 text-[#4A584D] border-[#4A584D]/30',
                  };

                  return (
                    <div
                      key={enq.enquiryId}
                      className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF9F3] px-3 rounded-xs transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {enq.photoUrl && (
                          <div className="w-16 h-16 shrink-0 bg-white border border-[#D9DED3] overflow-hidden rounded-xs">
                            <img
                              src={enq.photoUrl}
                              alt="Specimen thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#4A584D]">
                            <span className="font-semibold text-[#183B2A]">{enq.enquiryId}</span>
                            <span>·</span>
                            <span>{enq.district}</span>
                            <span>·</span>
                            <span>{enq.cropName}</span>
                            {enq.linkedScanId && (
                              <span className="text-[10px] bg-[#E5EBDD] text-[#183B2A] px-1.5 py-0.5 rounded-xs">
                                LINKED SCAN: {enq.linkedScanId}
                              </span>
                            )}
                          </div>

                          <div className="font-serif text-base sm:text-lg font-medium text-[#183B2A]">
                            {enq.problemCategory.replace('_', ' ').toUpperCase()}
                          </div>

                          <p className="text-xs font-sans text-[#4A584D] line-clamp-2 max-w-xl">
                            {enq.description}
                          </p>

                          <div className="text-[11px] font-mono text-[#426B43] pt-1">
                            {isTa && enq.statusNotesTamil ? enq.statusNotesTamil : enq.statusNotes}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
                        <span
                          className={`text-xs font-mono font-semibold px-2.5 py-1 uppercase rounded-xs border ${
                            statusColors[enq.status] || statusColors.submitted
                          }`}
                        >
                          {enq.status.replace('_', ' ').toUpperCase()}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedEnquiryDetail(enq)}
                          className="px-3 py-1.5 text-xs font-mono text-[#183B2A] bg-white hover:bg-[#E5EBDD] border border-[#D9DED3] rounded-xs cursor-pointer"
                        >
                          {isTa ? 'விவரங்கள்' : 'View Details'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: ARTICLE FULL DETAILS --- */}
      {selectedArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-[#183B2A] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 rounded-xs shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-[#D9DED3] pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-[#426B43] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#183B2A]" />
                  <span>{selectedArticleModal.sourceName}</span>
                </span>
                <h3 className="font-serif text-2xl font-medium text-[#183B2A] mt-1">
                  {isTa ? selectedArticleModal.titleTamil : selectedArticleModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticleModal(null)}
                className="p-1 text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm font-sans text-[#202B22] leading-relaxed whitespace-pre-line space-y-4">
              {isTa ? selectedArticleModal.contentTamil : selectedArticleModal.content}
            </div>

            {/* Actionable Steps */}
            <div className="p-4 bg-[#FAF9F3] border border-[#D9DED3] rounded-xs space-y-2">
              <strong className="text-xs font-mono uppercase text-[#183B2A] block">
                {isTa ? 'பரிந்துரைக்கப்பட்ட IPM தடுப்பு முறைகள் (TNAU):' : 'TNAU Verified IPM Action Checklist:'}
              </strong>
              <ul className="space-y-1.5 text-xs sm:text-sm font-sans text-[#202B22]">
                {(isTa ? selectedArticleModal.actionableStepsTamil : selectedArticleModal.actionableSteps).map(
                  (step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#426B43] font-bold">✓</span>
                      <span>{step}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* When to seek help */}
            <div className="p-3 bg-[#FAF3F2] border-l-4 border-[#A94338] text-xs font-sans text-[#202B22] space-y-1">
              <strong className="font-mono uppercase text-[#A94338]">
                {isTa ? 'எப்போது நேரில் உதவி கோர வேண்டும்:' : 'When to Seek Direct Confirmation:'}
              </strong>
              <p>{isTa ? selectedArticleModal.whenToSeekHelpTamil : selectedArticleModal.whenToSeekHelp}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#D9DED3]">
              <a
                href={selectedArticleModal.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#426B43] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isTa ? 'அதிகாரப்பூர்வ TNAU இணையதளத்தில் காண்க' : 'View on Official TNAU Portal'}</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedArticleModal(null)}
                className="px-5 py-2 bg-[#183B2A] text-white text-xs font-mono font-semibold rounded-xs cursor-pointer hover:bg-[#122c20]"
              >
                {isTa ? 'மூடுக' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE NEW ENQUIRY --- */}
      {showNewEnquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-[#183B2A] max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-xs shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-[#D9DED3] pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-[#426B43] font-semibold flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-[#183B2A]" />
                  <span>{isTa ? 'வேளாண் வல்லுநர் களக் கோரிக்கை' : 'AGRICULTURAL EXPERT ENQUIRY'}</span>
                </span>
                <h3 className="font-serif text-2xl font-medium text-[#183B2A] mt-1">
                  {isTa ? 'இலை மாதிரி & கள ஆய்வுக் கோரிக்கை' : 'Submit Specimen for Expert Escalation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetEnquiryForm}
                className="p-1 text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!enquirySuccessToken ? (
              <form onSubmit={handleSubmitEnquiry} className="space-y-4">
                <p className="text-xs sm:text-sm text-[#4A584D] font-sans leading-relaxed">
                  {isTa
                    ? 'உங்கள் வயலின் இலை ஒளிப்படம் மற்றும் அறிகுறிகளை விவரித்து கோரிக்கையை சமர்ப்பிக்கவும். இது தங்களுக்குரிய ஆய்வு அடையாளக் குறியீட்டை (Token) உருவாக்கும்.'
                    : 'Submit your crop leaf specimen and field notes. This queues a formal enquiry record in your CropShield cadastre and provides a verification token for your local KVK or extension officer.'}
                </p>

                {enquiryError && (
                  <div className="p-3 bg-[#A94338]/10 border border-[#A94338] text-[#A94338] text-xs font-sans rounded-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{enquiryError}</span>
                  </div>
                )}

                {/* Farmer Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                      {isTa ? 'விவசாயி பெயர்' : 'Farmer Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formFarmerName}
                      onChange={(e) => setFormFarmerName(e.target.value)}
                      placeholder="e.g. S. Ramanathan"
                      className="w-full p-2.5 bg-white border border-[#D9DED3] text-sm text-[#202B22] rounded-xs font-sans focus:outline-hidden focus:border-[#183B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                      {isTa ? 'தொடர்பு தொலைபேசி' : 'Contact Phone'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full p-2.5 bg-white border border-[#D9DED3] text-sm text-[#202B22] rounded-xs font-mono focus:outline-hidden focus:border-[#183B2A]"
                    />
                  </div>
                </div>

                {/* Crop & District */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                      {isTa ? 'பயிர்' : 'Cultivated Crop'}
                    </label>
                    <select
                      value={formCropId}
                      onChange={(e) => {
                        setFormCropId(e.target.value);
                        setFormCropName(e.target.value === 'rice' ? 'Rice (Paddy)' : e.target.value.toUpperCase());
                      }}
                      className="w-full p-2.5 bg-white border border-[#D9DED3] text-xs font-mono text-[#202B22] rounded-xs focus:outline-hidden focus:border-[#183B2A]"
                    >
                      <option value="rice">{isTa ? 'நெல் (பயிர்)' : 'Rice (Paddy)'}</option>
                      <option value="tomato">{isTa ? 'தக்காளி' : 'Tomato'}</option>
                      <option value="chilli">{isTa ? 'மிளகாய்' : 'Chilli'}</option>
                      <option value="cotton">{isTa ? 'பருத்தி' : 'Cotton'}</option>
                      <option value="maize">{isTa ? 'மக்காச்சோளம்' : 'Maize'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                      {isTa ? 'மாவட்டம்' : 'District'}
                    </label>
                    <select
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#D9DED3] text-xs font-mono text-[#202B22] rounded-xs focus:outline-hidden focus:border-[#183B2A]"
                    >
                      {ALL_TAMIL_NADU_DISTRICTS.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name} ({d.nameTamil})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Problem Category */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                    {isTa ? 'பிரச்சினைப் பிரிவு' : 'Issue Category'}
                  </label>
                  <select
                    value={formProblemCategory}
                    onChange={(e) => setFormProblemCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-[#D9DED3] text-xs font-mono text-[#202B22] rounded-xs focus:outline-hidden focus:border-[#183B2A]"
                  >
                    <option value="disease_identification">{isTa ? 'நோய் கண்டறிதல் (இலைக்கருகல் / புள்ளிகள்)' : 'Disease Identification (Blight/Spots)'}</option>
                    <option value="pest_infestation">{isTa ? 'பூச்சித் தாக்குதல் (தண்டு துளைப்பான் / இலைச்சுருட்டு)' : 'Pest Infestation (Borer/Folder)'}</option>
                    <option value="nutrient_deficiency">{isTa ? 'ஊட்டச்சத்து குறைபாடு சந்தேகம்' : 'Nutrient Deficiency Suspected'}</option>
                    <option value="weather_damage">{isTa ? 'பனிப்பொழிவு / மழைநீர் பாதிப்பு' : 'Weather / Dew / Flood Damage'}</option>
                    <option value="general_agronomy">{isTa ? 'பொது வேளாண் ஆலோசனைகள்' : 'General Agronomy Guidance'}</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                    {isTa ? 'அறிகுறிகள் மற்றும் களக் குறிப்புகள்' : 'Field Symptoms & Observations'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={
                      isTa
                        ? 'எ.கா. நடு இலைகளில் படகு வடிவப் புள்ளிகள் தென்படுகின்றன. 3 நாட்களுக்கு முன் யூரியா இடப்பட்டது; காலை பனிப்பொழிவு அதிகம்...'
                        : 'e.g. Spindle lesions on middle leaves; heavy morning mist for past 4 days; standing water drained yesterday...'
                    }
                    className="w-full p-3 bg-white border border-[#D9DED3] text-xs sm:text-sm text-[#202B22] rounded-xs font-sans focus:outline-hidden focus:border-[#183B2A]"
                  />
                </div>

                {/* Photo Upload with Validation */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                    {isTa ? 'இலைப் புகைப்படம் (விரும்பினால்)' : 'Specimen Foliage Photograph (Optional)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => e.target.files?.[0] && handlePhotoChange(e.target.files[0])}
                      className="text-xs font-mono text-[#4A584D]"
                    />
                    {formPhotoPreview && (
                      <div className="w-12 h-12 shrink-0 bg-white border border-[#D9DED3] overflow-hidden rounded-xs">
                        <img
                          src={formPhotoPreview}
                          alt="Specimen preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#667166] block mt-1">
                    {isTa ? 'JPEG, PNG, WebP · அதிகபட்சம் 15 MB' : 'Supports JPEG, PNG, WebP · Max 15 MB'}
                  </span>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#4A584D] mb-1 font-semibold">
                    {isTa ? 'முன்னுரிமை' : 'Urgency Level'}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        checked={formUrgency === 'standard'}
                        onChange={() => setFormUrgency('standard')}
                        className="accent-[#183B2A]"
                      />
                      <span>{isTa ? 'வழக்கமான ஆய்வு (2-3 நாட்கள்)' : 'Standard (2-3 days)'}</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        checked={formUrgency === 'high_priority'}
                        onChange={() => setFormUrgency('high_priority')}
                        className="accent-[#A94338]"
                      />
                      <span className="text-[#A94338] font-semibold">{isTa ? 'அவசரம் (24 மணி நேரம்)' : 'High Priority (24h)'}</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9DED3]">
                  <button
                    type="button"
                    onClick={handleResetEnquiryForm}
                    className="px-4 py-2 text-xs font-mono text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
                  >
                    {isTa ? 'ரத்து' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="px-6 py-2.5 bg-[#183B2A] hover:bg-[#122c20] text-white text-xs font-mono font-semibold rounded-xs flex items-center gap-2 cursor-pointer shadow-xs min-h-[42px]"
                  >
                    {isSubmittingEnquiry ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{isTa ? 'பதிவாகிறது...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isTa ? 'கோரிக்கையைச் சமர்ப்பிக்க' : 'Submit Enquiry Dispatch'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Confirmation */
              <div className="space-y-4 text-center py-4 animate-fadeIn">
                <div className="w-14 h-14 bg-[#E5EBDD] text-[#183B2A] rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <Check className="w-7 h-7 text-[#183B2A]" />
                </div>
                <div>
                  <h4 className="font-serif text-2xl font-medium text-[#183B2A]">
                    {isTa ? 'கோரிக்கை வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!' : 'Enquiry Logged in CropShield Dispatch'}
                  </h4>
                  <div className="mt-2 text-sm font-mono font-bold text-[#426B43] bg-[#FAF9F3] border border-[#D9DED3] p-2 inline-block rounded-xs">
                    TOKEN: {enquirySuccessToken}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#4A584D] font-sans leading-relaxed max-w-md mx-auto">
                  {isTa
                    ? `தங்கள் கோரிக்கை Firestore களப் பதிவேட்டில் சேர்க்கப்பட்டுள்ளது. தங்களின் ${formDistrict} வட்டார வேளாண்மை அலுவலர் அல்லது KVK மையத்தை நேரில் அணுகும் போது இந்த அடையாளக் குறியீட்டைப் (${enquirySuccessToken}) பயன்படுத்தலாம்.`
                    : `Your foliar specimen has been archived in your private Firestore dispatch register. You can present this tracking token (${enquirySuccessToken}) when consulting your local ${formDistrict} KVK or AEO extension desk.`}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetEnquiryForm}
                    className="px-6 py-2.5 bg-[#183B2A] text-white text-xs font-mono font-semibold rounded-xs cursor-pointer hover:bg-[#122c20] min-h-[42px]"
                  >
                    {isTa ? 'கோரிக்கைப் பட்டியலுக்குத் திரும்புக' : 'View in Enquiry List'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: ENQUIRY DETAIL VIEW --- */}
      {selectedEnquiryDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-[#183B2A] max-w-lg w-full p-6 sm:p-8 rounded-xs shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#D9DED3] pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-[#426B43] font-semibold">
                  DISPATCH DOSSIER
                </span>
                <h4 className="font-serif text-xl font-medium text-[#183B2A]">
                  {selectedEnquiryDetail.enquiryId}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiryDetail(null)}
                className="p-1 text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F3] border border-[#D9DED3] rounded-xs space-y-1 text-xs font-mono">
              <div><strong>CROP:</strong> {selectedEnquiryDetail.cropName}</div>
              <div><strong>DISTRICT:</strong> {selectedEnquiryDetail.district}, Tamil Nadu</div>
              <div><strong>CATEGORY:</strong> {selectedEnquiryDetail.problemCategory.replace('_', ' ').toUpperCase()}</div>
              <div><strong>URGENCY:</strong> {selectedEnquiryDetail.urgency.toUpperCase()}</div>
              <div><strong>STATUS:</strong> {selectedEnquiryDetail.status.toUpperCase()}</div>
            </div>

            {selectedEnquiryDetail.photoUrl && (
              <div className="aspect-16/9 bg-black/5 overflow-hidden rounded-xs border border-[#D9DED3]">
                <img
                  src={selectedEnquiryDetail.photoUrl}
                  alt="Enquiry specimen"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-1">
              <strong className="text-xs font-mono uppercase text-[#183B2A] block">
                {isTa ? 'விவசாயி களக் குறிப்பு:' : 'Farmer Field Description:'}
              </strong>
              <p className="text-xs sm:text-sm font-sans text-[#202B22] leading-relaxed">
                {selectedEnquiryDetail.description}
              </p>
            </div>

            <div className="p-3 bg-[#FAF9F3] border border-[#D9DED3] text-xs font-mono text-[#426B43] space-y-1">
              <strong>STATUS UPDATE:</strong>
              <p>{isTa && selectedEnquiryDetail.statusNotesTamil ? selectedEnquiryDetail.statusNotesTamil : selectedEnquiryDetail.statusNotes}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9DED3]">
              <button
                type="button"
                onClick={() => setSelectedEnquiryDetail(null)}
                className="px-5 py-2 bg-[#183B2A] text-white text-xs font-mono font-semibold rounded-xs cursor-pointer hover:bg-[#122c20]"
              >
                {isTa ? 'மூடுக' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

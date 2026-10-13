import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  User,
  MapPin,
  Sprout,
  Calendar,
  LogOut,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface FarmerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialSetup?: boolean;
}

const TN_DISTRICTS = [
  'Thanjavur',
  'Tiruvarur',
  'Mayiladuthurai',
  'Nagapattinam',
  'Cuddalore',
  'Madurai',
  'Tiruchirappalli',
  'Pudukkottai',
  'Tiruvannamalai',
  'Villupuram',
];

const RICE_VARIETIES = [
  'CR 1009 Sub 1 (Samba)',
  'BPT 5204 (Samba Mahsuri)',
  'ADT 45 (Kuruvai)',
  'ADT 43',
  'CO 51',
  'CO 52',
  'TKM 13',
  'ASD 16',
  'Karuppu Kavuni (Heritage)',
  'Mappillai Samba (Heritage)',
  'IR 20',
  'Other / Unlisted',
];

const CROP_STAGES = [
  'Nursery / Seedling (1-20 DAT)',
  'Active Tillering (21-45 DAT)',
  'Panicle Initiation (46-65 DAT)',
  'Flowering / Milk Stage (66-85 DAT)',
  'Ripening / Grain Maturity (>85 DAT)',
];

export const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({
  isOpen,
  onClose,
  isInitialSetup = false,
}) => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isTa = language === 'ta';

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [preferredLang, setPreferredLang] = useState<'en' | 'ta'>('en');
  const [district, setDistrict] = useState('Thanjavur');
  const [locality, setLocality] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('Rice (Paddy)');
  const [variety, setVariety] = useState('CR 1009 Sub 1 (Samba)');
  const [plantingDate, setPlantingDate] = useState('');
  const [cropStage, setCropStage] = useState('Active Tillering (21-45 DAT)');
  const [landSize, setLandSize] = useState('2.5');

  // Async & UI State
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever profile or user changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setPreferredLang(profile.preferredLanguage || language);
      setDistrict(profile.district || 'Thanjavur');
      setLocality(profile.locality || '');
      setPrimaryCrop(profile.primaryCrop || 'Rice (Paddy)');
      setVariety(profile.activeVariety || 'CR 1009 Sub 1 (Samba)');
      setPlantingDate(profile.plantingDate || '');
      setCropStage(profile.cropStage || 'Active Tillering (21-45 DAT)');
      setLandSize(String(profile.landSizeAcres ?? '2.5'));
    } else if (user) {
      setDisplayName(user.displayName || '');
      setPreferredLang(language);
    }
  }, [profile, user, isOpen, language]);

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!displayName.trim()) {
      setErrorMessage(isTa ? 'உங்கள் முழுப் பெயரை உள்ளிடவும்.' : 'Please enter your full name.');
      return;
    }
    if (!district.trim()) {
      setErrorMessage(isTa ? 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select your district in Tamil Nadu.');
      return;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfile({
        displayName: displayName.trim(),
        preferredLanguage: preferredLang,
        district: district.trim(),
        locality: locality.trim(),
        primaryCrop: primaryCrop.trim() || 'Rice (Paddy)',
        activeVariety: variety.trim(),
        plantingDate: plantingDate || '',
        cropStage: cropStage || '',
        landSizeAcres: parseFloat(landSize) || 2.5,
      });

      if (preferredLang !== language) {
        setLanguage(preferredLang);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Failed to save profile to Firestore:', err);
      // Retain entered form data and surface informative error
      setErrorMessage(
        err.message ||
          (isTa
            ? 'சுயவிவரத்தைச் சேமிக்க முடியவில்லை. உங்கள் இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
            : 'Could not save profile to Cloud Firestore. Please check your connection and retry.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOutClick = async () => {
    await signOut();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="bg-[#FAF9F3] border-2 border-[#183B2A] max-w-xl w-full p-6 sm:p-8 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#D9DED3] pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#426B43] uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#183B2A]" />
              <span>
                {isInitialSetup
                  ? (isTa ? 'புதிய விவசாயி பதிவு' : 'CADASTRE REGISTRATION · STEP 1')
                  : `FIRESTORE: profiles/${user?.uid?.substring(0, 8)}...`}
              </span>
            </div>
            <h2 id="profile-modal-title" className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A] mt-1">
              {isInitialSetup
                ? (isTa ? 'விவசாயி சுயவிவர அமைப்பு' : 'Set Up Your Farmer Profile')
                : (isTa ? 'விவசாயி சுயவிவரம் திருத்துதல்' : 'Farmer Cadastral Profile')}
            </h2>
            <p className="text-xs font-sans text-[#4A584D] mt-1">
              {isTa
                ? 'உங்கள் பகுதிக்குரிய துல்லியமான நெல் நோய் எச்சரிக்கைகளைப் பெற விவரங்களைப் பூர்த்தி செய்யவும்.'
                : 'Connect your Tamil Nadu field details to receive localized agro-climatic advisories.'}
            </p>
          </div>

          {!isInitialSetup && (
            <button
              onClick={onClose}
              className="text-[#4A584D] hover:text-[#183B2A] p-2 cursor-pointer rounded-xs"
              aria-label={isTa ? 'மூடு' : 'Close modal'}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Success Alert */}
        {savedSuccess && (
          <div className="mb-5 p-3.5 bg-[#426B43]/10 border border-[#426B43] text-[#183B2A] text-xs sm:text-sm font-sans flex items-center gap-2 rounded-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#426B43] shrink-0" />
            <span>
              {isTa ? 'சுயவிவரம் Cloud Firestore இல் சேமிக்கப்பட்டது!' : 'Profile saved to Cloud Firestore!'}
            </span>
          </div>
        )}

        {/* Error Alert with Retry */}
        {errorMessage && (
          <div className="mb-5 p-4 bg-[#A94338]/10 border border-[#A94338] text-[#A94338] text-xs font-sans rounded-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{isTa ? 'பிழை ஏற்பட்டது:' : 'Save Error:'}</span>
            </div>
            <p className="text-xs text-[#202B22]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#A94338] text-white font-mono text-xs hover:bg-[#8e372e] rounded-xs cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isTa ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry Save'}</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Full Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="farmerFullName" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold">
                {isTa ? 'முழுப் பெயர் (Full Name) *' : 'Full Name *'}
              </label>
              <span className="text-[11px] font-mono text-[#426B43]">{isTa ? 'தேவை' : 'Required'}</span>
            </div>
            <input
              id="farmerFullName"
              type="text"
              required
              placeholder={isTa ? 'எ.கா: மு. செந்தில்குமார்' : 'e.g. M. Senthil Kumar'}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
              {isTa ? 'விருப்பமான மொழி (Preferred Language) *' : 'Preferred Language *'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreferredLang('en')}
                className={`p-3 min-h-[44px] text-xs font-mono border text-center cursor-pointer transition-colors ${
                  preferredLang === 'en'
                    ? 'border-[#183B2A] bg-[#183B2A] text-white font-bold'
                    : 'border-[#D9DED3] bg-white text-[#4A584D] hover:bg-[#FAF9F3]'
                }`}
              >
                English (ஆங்கிலம்)
              </button>
              <button
                type="button"
                onClick={() => setPreferredLang('ta')}
                className={`p-3 min-h-[44px] text-xs font-mono border text-center cursor-pointer transition-colors ${
                  preferredLang === 'ta'
                    ? 'border-[#183B2A] bg-[#183B2A] text-white font-bold'
                    : 'border-[#D9DED3] bg-white text-[#4A584D] hover:bg-[#FAF9F3]'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          {/* District & Locality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="farmerDistrict" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold">
                  {isTa ? 'மாவட்டம் (District) *' : 'District in Tamil Nadu *'}
                </label>
                <span className="text-[11px] font-mono text-[#426B43]">{isTa ? 'தேவை' : 'Required'}</span>
              </div>
              <select
                id="farmerDistrict"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
              >
                {TN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="farmerLocality" className="block text-xs font-mono text-[#4A584D] uppercase">
                  {isTa ? 'கிராமம் / தாலுகா' : 'Village / Locality'}
                </label>
                <span className="text-[11px] font-mono text-[#667166]">{isTa ? 'விருப்பத்தேர்வு' : 'Optional'}</span>
              </div>
              <input
                id="farmerLocality"
                type="text"
                placeholder={isTa ? 'எ.கா: வலங்கைமான்' : 'e.g. Valangaiman Taluk'}
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
              />
            </div>
          </div>

          {/* Primary Crop & Variety */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="farmerCrop" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                {isTa ? 'முதன்மைப் பயிர் (Primary Crop)' : 'Primary Crop'}
              </label>
              <input
                id="farmerCrop"
                type="text"
                value={primaryCrop}
                onChange={(e) => setPrimaryCrop(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
              />
              <p className="text-[11px] font-mono text-[#667166] mt-0.5">
                {isTa ? 'இயல்புநிலை: நெல் (Paddy)' : 'Default: Rice (Paddy)'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="farmerVariety" className="block text-xs font-mono text-[#4A584D] uppercase">
                  {isTa ? 'நெல் ரகம் (Rice Variety)' : 'Rice Variety'}
                </label>
                <span className="text-[11px] font-mono text-[#667166]">{isTa ? 'விருப்பத்தேர்வு' : 'Optional'}</span>
              </div>
              <select
                id="farmerVariety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
              >
                {RICE_VARIETIES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Planting Date & Growth Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="farmerPlantingDate" className="block text-xs font-mono text-[#4A584D] uppercase">
                  {isTa ? 'விதைப்பு / நடவு தேதி' : 'Planting Date'}
                </label>
                <span className="text-[11px] font-mono text-[#667166]">{isTa ? 'விருப்பத்தேர்வு' : 'Optional'}</span>
              </div>
              <input
                id="farmerPlantingDate"
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="farmerCropStage" className="block text-xs font-mono text-[#4A584D] uppercase">
                  {isTa ? 'வளர்ச்சிப் பருவம்' : 'Current Growth Stage'}
                </label>
                <span className="text-[11px] font-mono text-[#667166]">{isTa ? 'விருப்பத்தேர்வு' : 'Optional'}</span>
              </div>
              <select
                id="farmerCropStage"
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
              >
                {CROP_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Area & Email notice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="farmerLandSize" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                {isTa ? 'நிலப்பரப்பு (ஏக்கர்)' : 'Plot Area (Acres)'}
              </label>
              <input
                id="farmerLandSize"
                type="number"
                step="0.1"
                min="0.1"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
              />
            </div>

            <div className="p-3 bg-white border border-[#D9DED3] text-xs font-mono text-[#4A584D] flex flex-col justify-center">
              <span className="text-[10px] text-[#667166] uppercase">AUTHENTICATED ACCOUNT</span>
              <span className="font-semibold text-[#183B2A] truncate">{user?.email}</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#D9DED3]">
            {!isInitialSetup ? (
              <button
                type="button"
                onClick={handleSignOutClick}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-mono text-[#A94338] hover:bg-[#FAF3F2] border border-[#A94338]/40 rounded-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isTa ? 'வெளியேறுக' : 'Sign Out'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-mono text-[#4A584D] hover:text-[#183B2A] hover:underline flex items-center justify-center cursor-pointer"
              >
                {isTa ? 'பிறகு நிரப்பவும்' : 'Complete optional details later'}
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] text-xs font-mono font-semibold text-white bg-[#183B2A] hover:bg-[#122c20] rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 transition-colors"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving to Firestore...'}</span>
                </>
              ) : (
                <span>
                  {isInitialSetup
                    ? (isTa ? 'சேமித்துத் தொடரவும்' : 'Save & Continue to Dashboard')
                    : (isTa ? 'மாற்றங்களைச் சேமி' : 'Save Cadastre Changes')}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  ShieldCheck,
  Droplets,
  Layers,
  FileText
} from 'lucide-react';

interface FarmerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialSetup?: boolean;
}

export const TN_DISTRICTS = [
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
  'Salem',
  'Coimbatore',
  'Erode',
  'Tirunelveli',
  'Dindigul',
  'Vellore',
  'Theni',
  'Karur',
  'Dharmapuri',
  'Ariyalur',
  'Perambalur',
  'Ramanathapuram',
  'Virudhunagar',
  'Sivaganga',
  'Thoothukudi',
  'Kanyakumari',
  'Krishnagiri',
  'Namakkal',
  'Nilgiris',
  'Tirupathur',
  'Ranipet',
  'Chengalpattu',
  'Kanchipuram',
  'Tiruvallur',
  'Tenkasi',
  'Kallakurichi',
];

export const AVAILABLE_CROPS = [
  { id: 'rice', name: 'Rice (Paddy)', nameTa: 'நெல் (Paddy)' },
  { id: 'tomato', name: 'Tomato', nameTa: 'தக்காளி (Tomato)' },
  { id: 'chilli', name: 'Chilli', nameTa: 'மிளகாய் (Chilli)' },
  { id: 'cotton', name: 'Cotton', nameTa: 'பருத்தி (Cotton)' },
  { id: 'maize', name: 'Maize', nameTa: 'மக்காச்சோளம் (Maize)' },
  { id: 'groundnut', name: 'Groundnut', nameTa: 'நிலக்கடலை' },
  { id: 'sugarcane', name: 'Sugarcane', nameTa: 'கரும்பு' },
  { id: 'pulses', name: 'Pulses (Blackgram)', nameTa: 'பயறு வகைகள்' },
];

export const RICE_VARIETIES = [
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
  'Other / Unlisted Cultivar',
];

export const CROP_STAGES = [
  { value: 'Nursery / Seedling (1-20 DAT)', labelEn: 'Nursery / Seedling (1-20 DAT)', labelTa: 'நாற்றங்கால் / இளம்பருவம்' },
  { value: 'Active Tillering (21-45 DAT)', labelEn: 'Active Tillering / Vegetative (21-45 DAT)', labelTa: 'தூர்கட்டும் பருவம் / கிளைப்பு' },
  { value: 'Panicle Initiation (46-65 DAT)', labelEn: 'Panicle Initiation / Booting (46-65 DAT)', labelTa: 'கதிர் உருவாகும் பருவம் / தண்டு உருளல்' },
  { value: 'Flowering / Milk Stage (66-85 DAT)', labelEn: 'Flowering / Milk Stage (66-85 DAT)', labelTa: 'பூக்கும் பருவம் / பால்கட்டும் பருவம்' },
  { value: 'Ripening / Grain Maturity (>85 DAT)', labelEn: 'Ripening / Maturity (>85 DAT)', labelTa: 'முதிர்ச்சி / அறுவடைப் பருவம்' },
];

export const IRRIGATION_METHODS = [
  { value: 'Canal / Cauvery Basin', labelEn: 'Canal / River (Cauvery Delta)', labelTa: 'கால்வாய் பாசனம்' },
  { value: 'Borewell', labelEn: 'Borewell (Groundwater)', labelTa: 'ஆழ்துளை கிணறு' },
  { value: 'Open Well', labelEn: 'Open Well / Farm Pond', labelTa: 'திறந்தவெளி கிணறு / குட்டை' },
  { value: 'Drip Irrigation', labelEn: 'Drip / Micro-Irrigation', labelTa: 'சொட்டு நீர் பாசனம்' },
  { value: 'Rainfed / Dryland', labelEn: 'Rainfed / Dryland (Manavari)', labelTa: 'மானாவாரி (மழைசார்ந்தது)' },
];

export const AREA_UNITS: ('Acres' | 'Cents' | 'Hectares')[] = ['Acres', 'Cents', 'Hectares'];

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
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Thanjavur');
  const [locality, setLocality] = useState('');
  const [primaryCrops, setPrimaryCrops] = useState<string[]>(['Rice (Paddy)']);
  const [activeVariety, setActiveVariety] = useState('CR 1009 Sub 1 (Samba)');
  const [landSizeArea, setLandSizeArea] = useState('2.5');
  const [areaUnit, setAreaUnit] = useState<'Acres' | 'Cents' | 'Hectares'>('Acres');
  const [irrigationMethod, setIrrigationMethod] = useState('Canal / Cauvery Basin');
  const [cropStage, setCropStage] = useState('Active Tillering (21-45 DAT)');
  const [plantingDate, setPlantingDate] = useState('');
  const [farmNotes, setFarmNotes] = useState('');

  // Async & UI State
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever profile or user changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setPreferredLang(profile.preferredLanguage || language);
      setStateName(profile.state || 'Tamil Nadu');
      setDistrict(profile.district || 'Thanjavur');
      setLocality(profile.locality || '');

      if (profile.primaryCrops && profile.primaryCrops.length > 0) {
        setPrimaryCrops(profile.primaryCrops);
      } else if (profile.primaryCrop) {
        setPrimaryCrops([profile.primaryCrop]);
      } else {
        setPrimaryCrops(['Rice (Paddy)']);
      }

      setActiveVariety(profile.activeVariety || 'CR 1009 Sub 1 (Samba)');
      setLandSizeArea(String(profile.landSizeArea ?? profile.landSizeAcres ?? '2.5'));
      setAreaUnit(profile.areaUnit || 'Acres');
      setIrrigationMethod(profile.irrigationMethod || 'Canal / Cauvery Basin');
      setCropStage(profile.cropStage || 'Active Tillering (21-45 DAT)');
      setPlantingDate(profile.plantingDate || '');
      setFarmNotes(profile.farmNotes || '');
    } else if (user) {
      setDisplayName(user.displayName || '');
      setPreferredLang(language);
      setStateName('Tamil Nadu');
      setDistrict('Thanjavur');
    }
  }, [profile, user, isOpen, language]);

  if (!isOpen) return null;

  const toggleCropSelection = (cropName: string) => {
    setPrimaryCrops((prev) => {
      if (prev.includes(cropName)) {
        // Keep at least one crop selected
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== cropName);
      } else {
        return [...prev, cropName];
      }
    });
  };

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
    if (primaryCrops.length === 0) {
      setErrorMessage(isTa ? 'குறைந்தது ஒரு முதன்மைப் பயிரையாவது தேர்ந்தெடுக்கவும்.' : 'Please select at least one primary cultivated crop.');
      return;
    }

    const areaNum = parseFloat(landSizeArea) || 2.5;

    // Convert area to acres for backward compatibility with landSizeAcres
    let acresEquivalent = areaNum;
    if (areaUnit === 'Cents') {
      acresEquivalent = areaNum / 100;
    } else if (areaUnit === 'Hectares') {
      acresEquivalent = areaNum * 2.471;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfile({
        displayName: displayName.trim(),
        preferredLanguage: preferredLang,
        state: stateName.trim() || 'Tamil Nadu',
        district: district.trim(),
        locality: locality.trim(),
        primaryCrop: primaryCrops[0] || 'Rice (Paddy)',
        primaryCrops,
        activeVariety: activeVariety.trim(),
        plantingDate: plantingDate || '',
        cropStage: cropStage || '',
        landSizeArea: areaNum,
        landSizeAcres: Math.round(acresEquivalent * 100) / 100,
        areaUnit,
        irrigationMethod,
        farmNotes: farmNotes.trim(),
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
      <div className="bg-[#FAF9F3] border-2 border-[#183B2A] max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#D9DED3] pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#426B43] uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#183B2A]" />
              <span>
                {isInitialSetup
                  ? (isTa ? 'புதிய விவசாயி பதிவு' : 'FARMER PROFILE REGISTRATION')
                  : `FIRESTORE: profiles/${user?.uid?.substring(0, 8)}...`}
              </span>
            </div>
            <h2 id="profile-modal-title" className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A] mt-1">
              {isInitialSetup
                ? (isTa ? 'விவசாயி சுயவிவர அமைப்பு' : 'Set Up Your Farmer Profile')
                : (isTa ? 'விவசாயி சுயவிவரம் திருத்துதல்' : 'Farmer & Farm Intelligence Profile')}
            </h2>
            <p className="text-xs font-sans text-[#4A584D] mt-1">
              {isTa
                ? 'தமிழ்நாடு வேளாண்மை பல்கலைக்கழக (TNAU) வழிகாட்டல்களுடன் இணைக்கப்பட்ட துல்லியமான பயிர் ஆலோசனைகளைப் பெற விவரங்களை நிரப்பவும்.'
                : 'Connect your regional agricultural parameters for tailored TNAU-aligned crop care and disease guidance.'}
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
              {isTa ? 'சுயவிவரம் Cloud Firestore இல் வெற்றிகரமாக சேமிக்கப்பட்டது!' : 'Farmer profile successfully saved to Cloud Firestore!'}
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

        <form onSubmit={handleSave} className="space-y-5">
          {/* Section 1: Farmer Identity */}
          <div className="space-y-3 bg-white p-4 border border-[#D9DED3] rounded-xs">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#183B2A] font-bold uppercase border-b border-[#F0F2EB] pb-1.5">
              <User className="w-3.5 h-3.5 text-[#426B43]" />
              <span>{isTa ? 'விவசாயி அடையாள விவரங்கள்' : 'Farmer Identification'}</span>
            </div>

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
          </div>

          {/* Section 2: Regional Location */}
          <div className="space-y-3 bg-white p-4 border border-[#D9DED3] rounded-xs">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#183B2A] font-bold uppercase border-b border-[#F0F2EB] pb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#426B43]" />
              <span>{isTa ? 'இருப்பிடம் & மாவட்டம்' : 'State & District (Tamil Nadu)'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="farmerState" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                  {isTa ? 'மாநிலம் (State)' : 'State'}
                </label>
                <input
                  id="farmerState"
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full p-3 bg-[#FAF9F3] border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                  placeholder="Tamil Nadu"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="farmerDistrict" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold">
                    {isTa ? 'மாவட்டம் (District) *' : 'District *'}
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
            <p className="text-[11px] font-mono text-[#667166]">
              {isTa
                ? 'குறிப்பு: தனியுரிமையைப் பாதுகாக்க உங்கள் துல்லியமான GPS அமைவிடத்தைக் கேட்கவில்லை.'
                : 'Privacy notice: Exact GPS coordinates are never requested or stored.'}
            </p>
          </div>

          {/* Section 3: Primary Cultivated Crops */}
          <div className="space-y-3 bg-white p-4 border border-[#D9DED3] rounded-xs">
            <div className="flex items-center justify-between border-b border-[#F0F2EB] pb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#183B2A] font-bold uppercase">
                <Sprout className="w-3.5 h-3.5 text-[#426B43]" />
                <span>{isTa ? 'பயிரிடப்படும் முதன்மைப் பயிர்கள்' : 'Primary Crops Cultivated'}</span>
              </div>
              <span className="text-[11px] font-mono text-[#426B43]">
                {primaryCrops.length} {isTa ? 'தேர்ந்தெடுக்கப்பட்டது' : 'Selected'}
              </span>
            </div>

            <p className="text-xs text-[#4A584D] font-sans">
              {isTa
                ? 'உங்கள் வயலில் பயிரிடப்படும் பயிர்களைத் தேர்ந்தெடுக்கவும் (ஒன்று அல்லது அதற்கு மேற்பட்டவை):'
                : 'Select one or more crops currently grown in your fields:'}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_CROPS.map((crop) => {
                const isSelected = primaryCrops.includes(crop.name);
                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => toggleCropSelection(crop.name)}
                    className={`px-3 py-2 text-xs font-mono rounded-xs border transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] ${
                      isSelected
                        ? 'bg-[#183B2A] text-white border-[#183B2A] font-semibold shadow-xs'
                        : 'bg-[#FAF9F3] text-[#202B22] border-[#D9DED3] hover:border-[#426B43]'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{isTa ? crop.nameTa : crop.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Variety if Rice is cultivated */}
            {primaryCrops.some((c) => c.toLowerCase().includes('rice') || c.toLowerCase().includes('paddy')) && (
              <div className="pt-2 border-t border-[#F0F2EB]">
                <label htmlFor="farmerVariety" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                  {isTa ? 'நெல் ரகம் (Rice Cultivar / Variety)' : 'Rice Cultivar / Variety'}
                </label>
                <select
                  id="farmerVariety"
                  value={activeVariety}
                  onChange={(e) => setActiveVariety(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                >
                  {RICE_VARIETIES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 4: Land Area & Irrigation Method */}
          <div className="space-y-3 bg-white p-4 border border-[#D9DED3] rounded-xs">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#183B2A] font-bold uppercase border-b border-[#F0F2EB] pb-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#426B43]" />
              <span>{isTa ? 'நிலப்பரப்பு மற்றும் பாசன முறை' : 'Cultivated Area & Irrigation'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cultivated Area and Unit */}
              <div>
                <label htmlFor="farmerLandSizeArea" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                  {isTa ? 'தோராயமான நிலப்பரப்பு (Cultivated Area)' : 'Approx. Cultivated Area & Unit'}
                </label>
                <div className="flex gap-2">
                  <input
                    id="farmerLandSizeArea"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={landSizeArea}
                    onChange={(e) => setLandSizeArea(e.target.value)}
                    className="w-2/3 p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                  />
                  <select
                    id="farmerAreaUnit"
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as any)}
                    className="w-1/3 p-3 bg-white border border-[#D9DED3] text-xs font-mono text-[#202B22] focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                  >
                    {AREA_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u === 'Acres' ? (isTa ? 'ஏக்கர்' : 'Acres') : u === 'Cents' ? (isTa ? 'சென்ட்' : 'Cents') : (isTa ? 'ஹெக்.' : 'Hectares')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Irrigation Method */}
              <div>
                <label htmlFor="farmerIrrigation" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                  {isTa ? 'பாசன முறை (Irrigation Method)' : 'Irrigation Method'}
                </label>
                <select
                  id="farmerIrrigation"
                  value={irrigationMethod}
                  onChange={(e) => setIrrigationMethod(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                >
                  {IRRIGATION_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {isTa ? m.labelTa : m.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Current Cultivation Stage & Notes */}
          <div className="space-y-3 bg-white p-4 border border-[#D9DED3] rounded-xs">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#183B2A] font-bold uppercase border-b border-[#F0F2EB] pb-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#426B43]" />
              <span>{isTa ? 'வளர்ச்சிப் பருவம் மற்றும் குறிப்புகள்' : 'Cultivation Stage & Farm Notes'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="farmerCropStage" className="block text-xs font-mono text-[#183B2A] uppercase font-semibold mb-1">
                  {isTa ? 'தற்போதைய வளர்ச்சிப் பருவம்' : 'Current Cultivation Stage'}
                </label>
                <select
                  id="farmerCropStage"
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                >
                  {CROP_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {isTa ? s.labelTa : s.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="farmerPlantingDate" className="block text-xs font-mono text-[#4A584D] uppercase mb-1">
                  {isTa ? 'விதைப்பு / நடவு தேதி' : 'Planting / Sowing Date'}
                </label>
                <input
                  id="farmerPlantingDate"
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-mono focus:outline-hidden focus:border-[#183B2A] min-h-[44px]"
                />
              </div>
            </div>

            {/* Optional Farm Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="farmerFarmNotes" className="block text-xs font-mono text-[#4A584D] uppercase">
                  {isTa ? 'பண்ணைக் குறிப்புகள் (விருப்பத்தேர்வு)' : 'Optional Farm Notes'}
                </label>
                <span className="text-[11px] font-mono text-[#667166]">{isTa ? 'விருப்பத்தேர்வு' : 'Optional'}</span>
              </div>
              <textarea
                id="farmerFarmNotes"
                rows={2}
                placeholder={
                  isTa
                    ? 'மண் வகை (களிமண்/வண்டல்), முந்தைய நோய்த் தாக்குதல், இயற்கை/ரசாயன உரம் போன்ற குறிப்புகள்...'
                    : 'Notes on soil type (clay/alluvial), past pest pressures, organic practices...'
                }
                value={farmNotes}
                onChange={(e) => setFarmNotes(e.target.value)}
                className="w-full p-3 bg-white border border-[#D9DED3] text-sm text-[#202B22] font-sans focus:outline-hidden focus:border-[#183B2A]"
              />
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
                    : (isTa ? 'சுயவிவர மாற்றங்களைச் சேமி' : 'Save Profile Changes')}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

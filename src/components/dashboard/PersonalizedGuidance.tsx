import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { FarmRecord } from '../../types';
import {
  Sprout,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ExternalLink,
  PhoneCall,
  Search,
  Droplets,
  Layers,
  Camera,
  Info,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  MapPin
} from 'lucide-react';

interface PersonalizedGuidanceProps {
  farms: FarmRecord[];
  activeFarm: FarmRecord | null;
  onSelectFarm: (farm: FarmRecord) => void;
  onNavigateToScan: (farm?: FarmRecord, cropId?: string) => void;
}

// Stage-specific phenological agronomic guidance calibrated for Tamil Nadu agro-climatic conditions
const STAGE_GUIDANCE_DATA: Record<
  string,
  {
    stageTitleEn: string;
    stageTitleTa: string;
    criticalRemindersEn: string[];
    criticalRemindersTa: string[];
    waterNutrientEn: string;
    waterNutrientTa: string;
    preventiveIpmEn: string[];
    preventiveIpmTa: string[];
    scoutingStepsEn: string[];
    scoutingStepsTa: string[];
  }
> = {
  nursery: {
    stageTitleEn: 'Nursery / Seedling Stage (1 - 20 DAT)',
    stageTitleTa: 'நாற்றங்கால் / இளம் பயிர் பருவம் (1 - 20 நாட்கள்)',
    criticalRemindersEn: [
      'Treat nursery seeds with biocontrol agents (Pseudomonas fluorescens @ 10g/kg or Trichoderma viride @ 4g/kg) to suppress early seed-borne pathogens.',
      'Maintain thin water film during germination; avoid stagnant deep flooding which suffocates tender rootlets.',
      'Scout seedlings for damping-off or early circular brown spots before field pulling and transplantation.',
    ],
    criticalRemindersTa: [
      'விதைகளை சூடோமோனாஸ் அல்லது டிரைக்கோடெர்மா மூலம் விதைநேர்த்தி செய்து விதைக்கவும்; இது ஆரம்பக்கட்ட வேரழுகல் நோய்களைத் தடுக்கும்.',
      'நாற்றங்காலில் மேலோட்டமான நீர் பாய்ச்சவும்; ஆழமான நீர் தேங்குவது வேர் வளர்ச்சியைப் பாதிக்கும்.',
      'நாற்று பறிப்பதற்கு முன் இலைப்புள்ளி அல்லது அழுகல் அறிகுறிகள் உள்ளதா என்று பரிசோதிக்கவும்.',
    ],
    waterNutrientEn: 'Ensure adequate drainage in raised nursery beds. Avoid heavy basal urea applications which cause succulent tender tissues susceptible to blast.',
    waterNutrientTa: 'நாற்றங்காலில் நீர் தேங்காமல் வடியச் செய்யும் வசதி வேண்டும். அதிகப்படியான யூரியா இடுவதைத் தவிர்க்கவும், இது திசுக்களை மென்மையாக்கி குலை நோய் வரவழைக்கும்.',
    preventiveIpmEn: [
      'Keep bunds and irrigation channels free from wild grass hosts (Leersia, Echinochloa).',
      'Apply neem cake or farmyard manure in the nursery bed to foster beneficial soil microorganisms.',
      'Pull seedlings gently without damaging the root-stem junction.',
    ],
    preventiveIpmTa: [
      'வரப்புகளில் உள்ள களைகளை அகற்றவும்; இவை பூச்சிகள் மற்றும் பூஞ்சைகளுக்கு புகலிடமாக அமையலாம்.',
      'மக்கிய தொழுவுரம் அல்லது வேப்பம்பிண்ணாக்கு இட்டு மண் வளத்தை மேம்படுத்தவும்.',
      'நாற்று பறிக்கும்போது தண்டு அல்லது வேர் சேதமடையாமல் கவனமாக எடுக்கவும்.',
    ],
    scoutingStepsEn: [
      'Inspect 20 random seedlings per plot in morning light.',
      'Check collar region for water-soaked constriction.',
      'Look for tiny elliptical pinhead spots on the first two leaves.',
    ],
    scoutingStepsTa: [
      'காலை வேளையில் 20 நாற்றுகளைத் தேர்ந்தெடுத்து ஆய்வு செய்யவும்.',
      'தண்டுப்பகுதியில் நீர் கசிந்தது போன்ற சுருக்கம் உள்ளதா எனப் பார்க்கவும்.',
      'முதல் இரண்டு இலைகளில் சிறிய புள்ளி புள்ளிகளாக ஏதேனும் தென்படுகிறதா எனக் கவனிக்கவும்.',
    ],
  },
  tillering: {
    stageTitleEn: 'Active Tillering & Vegetative Stage (21 - 45 DAT)',
    stageTitleTa: 'தூர்கட்டும் பருவம் / கிளைப்புப் பருவம் (21 - 45 நாட்கள்)',
    criticalRemindersEn: [
      'Practice Alternate Wetting and Drying (AWD) irrigation: allow water to recede until hairline cracks appear before re-irrigating to 2-3 cm.',
      'Split nitrogenous fertilizer application: apply nitrogen in 3-4 calibrated splits rather than a heavy single dose.',
      'Excess nitrogen together with continuous standing water dramatically elevates the risk of Blast (Magnaporthe oryzae) and Bacterial Leaf Blight.',
    ],
    criticalRemindersTa: [
      'காய்ச்சலும் பாய்ச்சலுமாக (AWD) நீர் பாய்ச்சவும்: நிலத்தில் சிறு கீறல் விழுந்த பிறகு 2-3 செ.மீ அளவு நீர் கட்டவும்.',
      'தழைச்சத்தை (நைட்ரஜன்) ஒரே முறையில் இடாமல் 3 முதல் 4 தவணைகளாகப் பிரித்து இடவும்.',
      'அதிகப்படியான தழைச்சத்தும் தொடர் நீர் தேக்கமும் குலை நோய் மற்றும் பாக்டீரியா இலைக்கருகல் நோய்களைத் தீவிரப்படுத்தும்.',
    ],
    waterNutrientEn: 'Regulate water depth to 2.5 - 5 cm. Top-dress potassium (MOP) alongside nitrogen split to fortify silica-rich leaf epidermal walls against fungal penetration.',
    waterNutrientTa: 'வயலில் 2.5 முதல் 5 செ.மீ நீர்மட்டம் பராமரிக்கவும். தழைச்சத்து இடும்போது சாம்பல் சத்தையும் (பொட்டாஷ்) சமச்சீராக இடுவது இலைகளை உறுதிப்படுத்தி பூஞ்சை ஊடுருவலைத் தடுக்கும்.',
    preventiveIpmEn: [
      'Erect bird perches (T-shaped bamboo pegs @ 20/acre) to encourage natural predatory birds.',
      'Use yellow sticky traps and pheromone traps to monitor adult stem borer and leaf folder flights.',
      'Spray Pseudomonas fluorescens (0.2% suspension @ 2g/litre) as an eco-friendly prophylactic biocontrol.',
    ],
    preventiveIpmTa: [
      'வயலில் ஏக்கருக்கு 20 டி-வடிவ பறவைத் தாங்கிகள் அமைத்து இயற்கைப் பறவை வேட்டையை ஊக்குவிக்கவும்.',
      'விளக்குப்பொறி அல்லது இனக்கவர்ச்சிப் பொறி வைத்து இலைச்சுருட்டுப்புழு, தண்டுத்துளைப்பான் நடமாட்டத்தைக் கண்காணிக்கவும்.',
      'சூடோமோனாஸ் புளோரசன்ஸ் கரைசலை (லிட்டருக்கு 2 கிராம்) முன்னெச்சரிக்கையாகத் தெளித்து நோய் எதிர்ப்பாற்றலை அதிகரிக்கவும்.',
    ],
    scoutingStepsEn: [
      'Walk a diagonal or zigzag "W" transect across the field parcel.',
      'Part tillers to inspect lower sheath areas near the water line for water-soaked oval lesions (Sheath Blight).',
      'Inspect middle and top leaf blades for diamond/spindle-shaped lesions with grayish ash centers (Leaf Blast).',
      'Check leaf edges for wavy yellow-orange water-soaked stripes running downward (Bacterial Leaf Blight).',
    ],
    scoutingStepsTa: [
      'வயலின் குறுக்கே ‘W’ வடிவில் நடந்து பல்வேறு இடங்களில் உள்ள தூர்களைப் பார்வையிடவும்.',
      'தூர்களை விரித்து நீர் மட்டத்திற்கு மேலுள்ள இலை உறைகளில் வெளிறிய புள்ளிகள் (உறை அழுகல்) உள்ளதா எனப் பார்க்கவும்.',
      'இலையின் நடுப்பகுதியில் சாம்பல் நிற மையத்துடன் கூடிய கதிர் வடிவப் புள்ளிகள் (குலை நோய்) உள்ளனவா எனப் பார்க்கவும்.',
      'இலை ஓரங்களில் அலை அலையான மஞ்சள் கோடுகள் கீழிறங்கி கருகுகிறதா (பாக்டீரியா இலைக்கருகல்) எனப் பரிசோதிக்கவும்.',
    ],
  },
  panicle: {
    stageTitleEn: 'Panicle Initiation & Booting Stage (46 - 65 DAT)',
    stageTitleTa: 'கதிர் உருவாகும் பருவம் / தண்டு உருளல் (46 - 65 நாட்கள்)',
    criticalRemindersEn: [
      'Maintain continuous shallow standing water (3-5 cm) — water stress during panicle initiation triggers high spikelet sterility.',
      'Avoid high-volume foliar chemical sprays during early morning dew; allow leaf surfaces to dry to minimize fungal spore dispersal.',
      'This is the critical window for Neck Blast and Sheath Rot prevention; inspect flag leaf sheaths closely.',
    ],
    criticalRemindersTa: [
      'கதிர் உருவாகும் தருணத்தில் வறட்சி ஏற்படாமல் 3 முதல் 5 செ.மீ நீர் தொடர்ந்து இருக்குமாறு பார்த்துக்கொள்ளவும்; நீர் பற்றாக்குறை பதர்களை அதிகரிக்கும்.',
      'காலை பனித்துளி இருக்கும்போது தெளிப்பு செய்வதைத் தவிர்க்கவும்; இலைகள் காய்ந்த பின்னர் இயற்கை மருந்துகளைப் பயன்படுத்தவும்.',
      'கழுத்து குலை நோய் மற்றும் கொடி இலை அழுகல் தடுப்புக்கான மிக முக்கியமான காலகட்டம் இதுவாகும்.',
    ],
    waterNutrientEn: 'Maintain 3 - 5 cm submergence. Complete the final split of potash and micronutrients (Zinc sulphate / Boron) if recommended by soil test.',
    waterNutrientTa: 'வயலில் 3-5 செ.மீ நீர் நிலைநிறுத்தவும். மண் பரிசோதனை பரிந்துரைப்படி இறுதி பொட்டாஷ் மற்றும் நுண்ணூட்டச் சத்துக்களை இடவும்.',
    preventiveIpmEn: [
      'Maintain clean bunds and eliminate collateral weed hosts.',
      'Avoid entering damp fields excessively to prevent mechanical transmission of bacterial blight exudates.',
      'Prophylactically spray Bacillus subtilis or Pseudomonas fluorescens prior to flag leaf emergence.',
    ],
    preventiveIpmTa: [
      'வரப்புகளை சுத்தமாக வைத்துக்கொள்ளவும்.',
      'பாக்டீரியா இலைக்கருகல் இருக்கும் வயலில் ஈரப்பதம் இருக்கும்போது நடமாடுவதைத் தவிர்க்கவும்.',
      'கொடி இலை வெளிவரும் முன் சூடோமோனாஸ் உயிரியல் பூஞ்சாணக் கொல்லியைத் தெளிக்கவும்.',
    ],
    scoutingStepsEn: [
      'Check flag leaf sheath for reddish-brown discolouration or rot enclosing the young panicle.',
      'Inspect stem nodes for dark constricted necrotic rings (Node Blast).',
      'Look for tiny amber bacterial droplets (ooze) oozing on early morning leaf lesions.',
    ],
    scoutingStepsTa: [
      'கொடி இலை உறையில் இளங்கதிரைச் சுற்றியுள்ள பகுதியில் பழுப்பு நிற அழுகல் உள்ளதா எனக் கவனிக்கவும்.',
      'தண்டு கணுக்களில் கருமையான சுருங்கிய வளையங்கள் உள்ளதா எனப் பார்க்கவும்.',
      'காலை வேளையில் இலை விளிம்புகளில் பனிநீருடன் பாக்டீரியா கசிவு திரவம் உள்ளதா என உற்றுநோக்கவும்.',
    ],
  },
  flowering: {
    stageTitleEn: 'Flowering & Grain Filling Stage (66 - 85 DAT)',
    stageTitleTa: 'பூக்கும் பருவம் / பால்கட்டும் பருவம் (66 - 85 நாட்கள்)',
    criticalRemindersEn: [
      'Never apply foliar sprays between 9:00 AM and 12:30 PM — anthesis (pollination) occurs in this window; spraying knocks off pollen and causes chaffy grains.',
      'Monitor for Earhead Bug (Gundhi bug) which punctures tender milk grains, leaving white chalky discoloured grains.',
      'Ensure uninterrupted irrigation until grain dough stage is attained.',
    ],
    criticalRemindersTa: [
      'காலை 9:00 மணி முதல் மதியம் 12:30 மணி வரை எந்தவொரு தெளிப்பும் செய்ய வேண்டாம்; இந்த நேரத்தில் மகரந்தச் சேர்க்கை நடைபெறுவதால் பதராகிவிடும் அபாயம் உண்டு.',
      'பால் பிடிக்கும் பருவத்தில் நாவாய்ப்பூச்சி (கருவண்டு) தாக்குதலைக் கண்காணிக்கவும்; இது பாலை உறிஞ்சி தானியங்களை பதராக்கும்.',
      'பால் பிடித்து தானியம் இறுகும் வரை வயலில் ஈரப்பதம் தொடர்ந்து இருக்க வேண்டும்.',
    ],
    waterNutrientEn: 'Maintain saturated to shallow water (2 cm). Stop all nitrogen application.',
    waterNutrientTa: 'வயலில் 2 செ.மீ மேலோட்டமான நீர் வைக்கவும். இந்த காலகட்டத்தில் தழைச்சத்து (யூரியா) இடுவதை முற்றிலும் நிறுத்தவும்.',
    preventiveIpmEn: [
      'Hand netting or light traps for adult earhead bugs in evening hours.',
      'Avoid burning straw near flowering fields.',
      'Conserve spider populations (Lycosa, Tetragnatha) which hunt insect vectors in the canopy.',
    ],
    preventiveIpmTa: [
      'மாலை வேளையில் விளக்குப் பொறி வைத்து பூச்சிகளைக் கவரவும்.',
      'பூக்கும் பயிர்களுக்கு அருகில் புகையோ தீயோ போட வேண்டாம்.',
      'வயலில் உள்ள சிலந்தி போன்ற நன்மை செய்யும் பூச்சிகளைப் பாதுகாக்கவும்.',
    ],
    scoutingStepsEn: [
      'Scout 10 hills in 5 different spots in the field for earhead bugs early morning.',
      'Examine panicle neck base for blackish-brown girdling (Neck Blast).',
      'Inspect developing grains for yellowish-green velvety fungal balls (False Smut).',
    ],
    scoutingStepsTa: [
      'காலை வேளையில் 5 வெவ்வேறு இடங்களில் தலா 10 தூர்களில் நாவாய்ப்பூச்சி உள்ளதா எனப் பார்க்கவும்.',
      'கதிரின் அடிப்பகுதியில் (கழுத்து) கறுப்பு அல்லது பழுப்பு வளையம் உள்ளதா எனப் பார்க்கவும்.',
      'பால் பிடிக்கும் மணிகளில் மஞ்சள் அல்லது பச்சை நிற வெல்வெட் போன்ற பந்துகள் (கரிப்பூட்டை நோய்) உள்ளதா எனக் கவனிக்கவும்.',
    ],
  },
  ripening: {
    stageTitleEn: 'Ripening & Harvest Maturity (> 85 DAT)',
    stageTitleTa: 'முதிர்ச்சி மற்றும் அறுவடைப் பருவம் (> 85 நாட்கள்)',
    criticalRemindersEn: [
      'Completely withhold irrigation 7 to 10 days before expected harvest date to ensure uniform grain hardening and facilitate mechanical harvesting.',
      'Harvest crop when 80-85% of panicles turn golden straw-yellow; delaying harvest leads to grain shattering and lodging.',
      'Dry harvested paddy immediately on clean drying floors down to 12-14% moisture to prevent post-harvest storage mold.',
    ],
    criticalRemindersTa: [
      'அறுவடைக்கு 7 முதல் 10 நாட்களுக்கு முன்பு நீர்ப்பாசனத்தை முற்றிலும் நிறுத்திவிடவும்; இது சீரான முதிர்ச்சிக்கும் அறுவடைக்கும் உதவும்.',
      'கதிர்களில் 80-85% மணிகள் பொன்னிறமாக மாறியதும் அறுவடை செய்யவும்; தாமதித்தால் தானியங்கள் உதிரும்.',
      'அறுவடை செய்த நெல்லை களத்தில் உலர்த்தி 12-14% ஈரப்பதத்திற்குக் கொண்டு வரவும்; இது சேமிப்பில் பூஞ்சை பிடிப்பதைத் தடுக்கும்.',
    ],
    waterNutrientEn: 'Drain water completely from the field parcel.',
    waterNutrientTa: 'வயலிலிருந்து நீரை முழுமையாக வடியச் செய்யவும்.',
    preventiveIpmEn: [
      'Clean harvesting combines before moving between fields to avoid transporting weed seeds or sclerotial resting bodies.',
      'Store harvested paddy in moisture-proof gunny bags elevated on wooden pallets.',
    ],
    preventiveIpmTa: [
      'அறுவடை இயந்திரங்களை நன்கு தூய்மை செய்த பின்னரே வயலில் இறக்கவும்.',
      'விளைந்த தானியங்களை ஈரமில்லாத கிடங்குகளில் மரப்பலகைகளின் மேல் வைக்கவும்.',
    ],
    scoutingStepsEn: [
      'Check grain hardness with fingernail test.',
      'Examine panicle branches for any late-season sooty mold or grain discolouration.',
    ],
    scoutingStepsTa: [
      'தானியத்தை நகத்தால் அழுத்தி ஈரப்பதத்தைக் கணிக்கவும்.',
      'கதிர் தண்டுகளில் கரும்பூஞ்சை ஏதேனும் பரவியுள்ளதா எனக் கவனிக்கவும்.',
    ],
  },
};

function getStageKey(cropStageText?: string): string {
  if (!cropStageText) return 'tillering';
  const lower = cropStageText.toLowerCase();
  if (lower.includes('nursery') || lower.includes('seedling')) return 'nursery';
  if (lower.includes('tillering') || lower.includes('vegetative')) return 'tillering';
  if (lower.includes('panicle') || lower.includes('booting')) return 'panicle';
  if (lower.includes('flower') || lower.includes('milk')) return 'flowering';
  if (lower.includes('ripen') || lower.includes('matur') || lower.includes('harvest')) return 'ripening';
  return 'tillering';
}

export const PersonalizedGuidance: React.FC<PersonalizedGuidanceProps> = ({
  farms,
  activeFarm,
  onSelectFarm,
  onNavigateToScan,
}) => {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const isTa = language === 'ta';

  // Selected farm or fallback to profile
  const [selectedFarmId, setSelectedFarmId] = useState<string>(
    activeFarm?.id || (farms.length > 0 ? farms[0].id || '' : '')
  );

  const currentFarm = farms.find((f) => f.id === selectedFarmId) || activeFarm || null;

  const currentCrop = currentFarm?.cropType || profile?.primaryCrop || 'Rice (Paddy)';
  const currentVariety = currentFarm?.riceVariety || profile?.activeVariety || 'CR 1009 Sub 1 (Samba)';
  const currentDistrict = currentFarm?.district || profile?.district || 'Thanjavur';
  const currentLocality = currentFarm?.locality || profile?.locality;
  const currentStage = currentFarm?.cropStage || profile?.cropStage || 'Active Tillering (21-45 DAT)';
  const currentIrrigation = currentFarm?.irrigationMethod || profile?.irrigationMethod || 'Canal / Cauvery Basin';
  const currentArea = currentFarm?.landSizeArea ?? currentFarm?.landSizeAcres ?? profile?.landSizeArea ?? profile?.landSizeAcres ?? 2.5;
  const currentAreaUnit = currentFarm?.areaUnit || profile?.areaUnit || 'Acres';

  const stageKey = getStageKey(currentStage);
  const guidance = STAGE_GUIDANCE_DATA[stageKey] || STAGE_GUIDANCE_DATA.tillering;

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedFarmId(newId);
    const found = farms.find((f) => f.id === newId);
    if (found) onSelectFarm(found);
  };

  return (
    <div className="space-y-6">
      {/* Cadastral & Agro-Climatic Intelligence Header */}
      <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#D9DED3] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#426B43] uppercase tracking-wider font-semibold">
              <Compass className="w-4 h-4 text-[#183B2A]" />
              <span>TNAU AGRONOMIC EXTENSION INTELLIGENCE</span>
              <span>·</span>
              <span className="text-[#183B2A]">{currentDistrict.toUpperCase()} DISTRICT</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#183B2A] mt-1">
              {isTa ? 'தனிப்பயனாக்கப்பட்ட பயிர் பராமரிப்பு வழிகாட்டல்' : 'Personalized Crop Guidance & Care'}
            </h2>
            <p className="text-xs text-[#4A584D] font-sans mt-1">
              {isTa
                ? 'உங்கள் குறிப்பிட்ட பயிர், மாவட்டம் மற்றும் வளர்ச்சிப் பருவத்திற்கு ஏற்ப சரிபார்க்கப்பட்ட வேளாண் பல்கலைக்கழக நடைமுறைகள்.'
                : 'Tailored agronomic reminders, integrated pest management, and foliar scouting calibrated to your field parcel.'}
            </p>
          </div>

          {/* Farm Switcher Dropdown */}
          <div className="bg-[#FAF9F3] border border-[#E5EBDD] p-3.5 rounded-xs min-w-[280px] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#4A584D]">
              <span className="uppercase font-semibold">{isTa ? 'செயலில் உள்ள வயல்' : 'ACTIVE FIELD PARCEL'}</span>
              <Sprout className="w-4 h-4 text-[#426B43]" />
            </div>

            {farms.length > 0 ? (
              <select
                value={selectedFarmId}
                onChange={handleFarmChange}
                className="w-full p-2 bg-white border border-[#D9DED3] text-xs font-mono text-[#183B2A] font-semibold focus:outline-hidden focus:border-[#183B2A]"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farmName} ({f.cropType} · {f.district})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs font-mono text-[#183B2A] font-semibold">
                {currentCrop} · {currentDistrict}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] font-mono text-[#426B43]">
              <span>{currentVariety}</span>
              <span>
                {currentArea} {currentAreaUnit}
              </span>
            </div>
          </div>
        </div>

        {/* Missing Live Telemetry Notice & Transparency Alert */}
        <div className="p-4 bg-[#FAF9F3] border-l-4 border-[#426B43] border-y border-r border-[#D9DED3] rounded-xs space-y-2 mb-6 text-xs font-sans">
          <div className="flex items-center gap-2 font-mono text-[#183B2A] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#426B43] shrink-0" />
            <span>
              {isTa
                ? 'சரிபார்க்கப்பட்ட வேளாண் அறிவியல் vs தானியங்கி வழிகாட்டல் நெறிமுறை'
                : 'Verified Agronomy vs Computational Advisory Transparency'}
            </span>
          </div>
          <p className="text-[#4A584D] leading-relaxed">
            {isTa
              ? 'கீழே உள்ள பயிர் பராமரிப்பு மற்றும் நோய் தடுப்பு ஆலோசனைகள் தமிழ்நாடு வேளாண்மை பல்கலைக்கழக (TNAU) வேளாண் நடைமுறைகள் மற்றும் உழவன் செயலி வழிகாட்டல்களை அடிப்படையாகக் கொண்டவை. உங்கள் குறிப்பிட்ட வயலுக்கான தானியங்கி வானிலை சென்சார் (IoT Telemetry) தற்போது இணைக்கப்படவில்லை; எனவே வானிலை மற்றும் மண் ஈரப்பதம் பற்றிய விவரங்கள் உங்கள் பிராந்தியப் பருவநிலையைக் கொண்டு பொதுவான வழிகாட்டலாகவே வழங்கப்படுகின்றன.'
              : 'The crop management and preventive IPM protocols below are derived from verified Tamil Nadu Agricultural University (TNAU) Agritech Portal standards. Real-time IoT micro-station sensor telemetry is not connected for this parcel; local weather and soil moisture variables represent general agro-climatic seasonal baselines for ' +
                currentDistrict +
                ' district.'}
          </p>
        </div>

        {/* Current Active Agronomic Badge Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-8">
          <div className="bg-[#FAF9F3] border border-[#E5EBDD] p-3 rounded-xs">
            <span className="text-[10px] text-[#667166] uppercase block mb-0.5">{isTa ? 'பயிர் & ரகம்' : 'CROP & CULTIVAR'}</span>
            <span className="font-semibold text-[#183B2A] text-sm font-serif truncate block">
              {currentCrop}
            </span>
            <span className="text-[11px] text-[#426B43] truncate block">{currentVariety}</span>
          </div>

          <div className="bg-[#FAF9F3] border border-[#E5EBDD] p-3 rounded-xs">
            <span className="text-[10px] text-[#667166] uppercase block mb-0.5">{isTa ? 'வளர்ச்சிப் பருவம்' : 'GROWTH STAGE'}</span>
            <span className="font-semibold text-[#426B43] text-xs truncate block mt-1">
              {currentStage}
            </span>
          </div>

          <div className="bg-[#FAF9F3] border border-[#E5EBDD] p-3 rounded-xs">
            <span className="text-[10px] text-[#667166] uppercase block mb-0.5">{isTa ? 'பாசன முறை' : 'IRRIGATION'}</span>
            <span className="font-semibold text-[#183B2A] text-xs truncate block mt-1">
              {currentIrrigation}
            </span>
          </div>

          <div className="bg-[#FAF9F3] border border-[#E5EBDD] p-3 rounded-xs flex flex-col justify-between">
            <span className="text-[10px] text-[#667166] uppercase block mb-0.5">{isTa ? 'மாவட்ட பிராந்தியம்' : 'AGRO-CLIMATIC ZONE'}</span>
            <div className="flex items-center gap-1 text-xs text-[#183B2A] font-semibold">
              <MapPin className="w-3 h-3 text-[#426B43] shrink-0" />
              <span>{currentDistrict}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Growth-Stage Phenological Checklist */}
        <div className="space-y-4 mb-8">
          <div className="border-b border-[#D9DED3] pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#426B43]" />
              <h3 className="font-serif text-xl font-medium text-[#183B2A]">
                {isTa ? guidance.stageTitleTa : guidance.stageTitleEn}
              </h3>
            </div>
            <span className="text-xs font-mono text-[#426B43] bg-[#E5EBDD] px-2 py-0.5 rounded-xs font-bold uppercase">
              {isTa ? 'முக்கிய நினைவூட்டல்' : 'CRITICAL REMINDERS'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(isTa ? guidance.criticalRemindersTa : guidance.criticalRemindersEn).map((rem, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#FAF9F3] border border-[#E5EBDD] rounded-xs flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#183B2A] text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-[#202B22] font-sans leading-relaxed">{rem}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Water & Nutrient Guidance */}
          <div className="p-4 bg-white border border-[#D9DED3] rounded-xs flex items-start gap-3">
            <Droplets className="w-5 h-5 text-[#426B43] shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs font-sans">
              <span className="font-mono font-semibold uppercase text-[#183B2A] block">
                {isTa ? 'நீர் & உர மேலாண்மை வழிகாட்டல்:' : 'Water & Nutrient Regulation for this Stage:'}
              </span>
              <p className="text-[#4A584D] leading-relaxed">
                {isTa ? guidance.waterNutrientTa : guidance.waterNutrientEn}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Preventive Integrated Disease Management (IPM) */}
        <div className="space-y-4 mb-8">
          <div className="border-b border-[#D9DED3] pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#183B2A]" />
              <h3 className="font-serif text-xl font-medium text-[#183B2A]">
                {isTa
                  ? 'ஒருங்கிணைந்த பயிர் பாதுகாப்பு & தடுப்பு முறைகள் (IPM)'
                  : 'Preventive Disease Management & Biocontrol Practices'}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#667166]">
              {isTa ? 'இரசாயன விஷங்கள் இல்லாதது' : 'Non-Chemical / Bio-first'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(isTa ? guidance.preventiveIpmTa : guidance.preventiveIpmEn).map((ipmItem, idx) => (
              <div key={idx} className="p-4 bg-white border border-[#D9DED3] rounded-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#426B43] font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#426B43]" />
                  <span>{isTa ? `நடைமுறை ${idx + 1}` : `Practice #${idx + 1}`}</span>
                </div>
                <p className="text-xs text-[#202B22] font-sans leading-relaxed">{ipmItem}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Plant Symptom Scouting Protocol */}
        <div className="space-y-4 mb-8 bg-[#FAF9F3] p-5 sm:p-6 border border-[#D9DED3] rounded-xs">
          <div className="flex items-center justify-between border-b border-[#D9DED3] pb-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#183B2A]" />
              <h3 className="font-serif text-xl font-medium text-[#183B2A]">
                {isTa ? 'வயல் ஆய்வு & இலை அறிகுறிகள் பரிசோதனை வழிகாட்டி' : 'Foliar Symptom Scouting Protocol'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateToScan(currentFarm || undefined, currentCrop.toLowerCase().includes('tomato') ? 'tomato' : currentCrop.toLowerCase().includes('chilli') ? 'chilli' : currentCrop.toLowerCase().includes('cotton') ? 'cotton' : currentCrop.toLowerCase().includes('maize') ? 'maize' : 'rice')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183B2A] text-white font-mono text-xs font-semibold hover:bg-[#122c20] rounded-xs cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isTa ? 'இப்போது ஸ்கேன் செய்' : 'Scan Leaf with Camera'}</span>
            </button>
          </div>

          <p className="text-xs text-[#4A584D] font-sans">
            {isTa
              ? 'வயலில் நடக்கும்போது பின்வரும் படிகளைப் பின்பற்றி ஆரம்பக்கட்ட நோய் அறிகுறிகளைக் கவனிக்கவும்:'
              : 'Follow this diagnostic path across the parcel to distinguish physiological stress from pathological infections:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(isTa ? guidance.scoutingStepsTa : guidance.scoutingStepsEn).map((step, idx) => (
              <div key={idx} className="bg-white p-3.5 border border-[#E5EBDD] rounded-xs space-y-1">
                <span className="text-[10px] font-mono text-[#426B43] font-bold uppercase">
                  STEP 0{idx + 1}
                </span>
                <p className="text-xs text-[#202B22] font-sans leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Verified Agricultural Resources & Extension Portals */}
        <div className="space-y-4">
          <div className="border-b border-[#D9DED3] pb-2">
            <h3 className="font-serif text-xl font-medium text-[#183B2A] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#426B43]" />
              <span>{isTa ? 'சரிபார்க்கப்பட்ட வேளாண்மைத் தொடர்பு மையங்கள்' : 'Verified Extension & Agronomy Resources'}</span>
            </h3>
            <p className="text-xs text-[#4A584D] font-sans mt-0.5">
              {isTa
                ? 'அதிகாரப்பூர்வ தமிழ்நாடு அரசு மற்றும் வேளாண் பல்கலைக்கழகத் தொடர்புகள் (கற்பனையான எண்கள் அல்ல):'
                : 'Direct verified contacts and portals for in-person advisory and laboratory soil/leaf assays in Tamil Nadu:'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
            {/* TNAU Agritech Portal */}
            <div className="p-4 bg-white border border-[#D9DED3] rounded-xs space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#426B43] uppercase font-bold block mb-1">
                  OFFICIAL AGRONOMY REPOSITORY
                </span>
                <h4 className="font-serif text-base font-semibold text-[#183B2A]">
                  TNAU Agritech Portal
                </h4>
                <p className="text-[#4A584D] text-xs mt-1">
                  {isTa
                    ? 'தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழகத்தின் விரிவான பயிர் பாதுகாப்பு மற்றும் ஊட்டச்சத்து வழிகாட்டி.'
                    : 'Official Package of Practices, crop calendars, and symptom photographic library by TNAU Coimbatore.'}
                </p>
              </div>
              <a
                href="https://agritech.tnau.ac.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#183B2A] font-semibold hover:underline pt-2 border-t border-[#F0F2EB]"
              >
                <span>agritech.tnau.ac.in</span>
                <ExternalLink className="w-3 h-3 text-[#426B43]" />
              </a>
            </div>

            {/* Kisan Call Centre */}
            <div className="p-4 bg-white border border-[#D9DED3] rounded-xs space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#426B43] uppercase font-bold block mb-1">
                  GOVERNMENT TOLL-FREE HELPLINE
                </span>
                <h4 className="font-serif text-base font-semibold text-[#183B2A]">
                  Kisan Call Centre (KCC)
                </h4>
                <p className="text-[#4A584D] text-xs mt-1">
                  {isTa
                    ? 'விவசாயிகள் தங்கள் தாய்மொழியான தமிழில் வேளாண் வல்லுநர்களுடன் இலவசமாகப் பேசலாம்.'
                    : 'Nationwide toll-free telephone advisory answering farmer queries in Tamil 6:00 AM to 10:00 PM.'}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-[#F0F2EB] font-mono text-xs font-bold text-[#183B2A]">
                <PhoneCall className="w-3.5 h-3.5 text-[#426B43]" />
                <span>1800-180-1551 (Toll-Free)</span>
              </div>
            </div>

            {/* Uzhavan Mobile Portal */}
            <div className="p-4 bg-white border border-[#D9DED3] rounded-xs space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#426B43] uppercase font-bold block mb-1">
                  TAMIL NADU AGRI DEPARTMENT
                </span>
                <h4 className="font-serif text-base font-semibold text-[#183B2A]">
                  Uzhavan App & Krishi Vigyan Kendra
                </h4>
                <p className="text-[#4A584D] text-xs mt-1">
                  {isTa
                    ? `${currentDistrict} மாவட்ட வட்டார வேளாண் விரிவாக்க மையம் (ADA) மற்றும் KVK மையங்கள்.`
                    : `District KVK extension specialists and Assistant Directors of Agriculture (ADA) in ${currentDistrict}.`}
                </p>
              </div>
              <div className="text-[11px] font-mono text-[#4A584D] pt-2 border-t border-[#F0F2EB]">
                {isTa ? 'உழவன் செயலியில் விதை இருப்பு & வானிலை காண்க' : 'Access via Uzhavan App (Dept. of Agri, TN)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * CropShield Multi-Crop Registry & Pathology Configuration
 * Centralized, extensible configuration for crops, supported disease classes,
 * validation status, and agricultural guidance.
 */

export type SupportStatus = 'validated' | 'preliminary' | 'planned';

export interface SupportedDisease {
  diseaseId: string;
  nameEnglish: string;
  nameTamil: string;
  scientificName: string;
  category: 'fungal' | 'bacterial' | 'viral' | 'physiological' | 'nominal';
  typicalSymptoms: string[];
  typicalSymptomsTamil: string[];
  severityDefault: 'low' | 'moderate' | 'high' | 'nominal';
  preventionGuidance: string[];
  preventionGuidanceTamil: string[];
  inspectionGuidance: string[];
  inspectionGuidanceTamil: string[];
  sourceRef: string;
}

export interface CropConfig {
  cropId: string;
  cropNameEnglish: string;
  cropNameTamil: string;
  scientificName: string;
  category: 'Cereal' | 'Vegetable' | 'Spices' | 'Fiber' | 'Pulses';
  supportedStatus: SupportStatus;
  statusBadge: {
    en: string;
    ta: string;
  };
  description: {
    en: string;
    ta: string;
  };
  supportedDiseases: SupportedDisease[];
  acceptedImageTypes: string[];
  guidanceLanguage: ('en' | 'ta')[];
  modelIdentifier: string;
  modelVersion: string;
  isPrimary?: boolean;
  sampleVarieties: string[];
  unsupportedNotice?: {
    en: string;
    ta: string;
  };
}

export const CROP_REGISTRY: Record<string, CropConfig> = {
  rice: {
    cropId: 'rice',
    cropNameEnglish: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    scientificName: 'Oryza sativa L.',
    category: 'Cereal',
    supportedStatus: 'validated',
    isPrimary: true,
    statusBadge: {
      en: 'Validated · Primary Crop',
      ta: 'சரிபார்க்கப்பட்டது · முதன்மைப் பயிர்',
    },
    description: {
      en: 'Full diagnostic pipeline calibrated with Tamil Nadu Agricultural University (TNAU) pathology protocols for the Cauvery Delta and southern rice basins.',
      ta: 'காவிரி டெல்டா மற்றும் தென்பகுதி நெல் மண்டலங்களுக்கான TNAU பயிர் மருத்துவ வழிகாட்டுதலுடன் முழுமையாக ஒருங்கிணைக்கப்பட்டது.',
    },
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    guidanceLanguage: ['en', 'ta'],
    modelIdentifier: 'gemini-3.8-flash',
    modelVersion: 'cropshield-rice-v3.0',
    sampleVarieties: [
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
    ],
    supportedDiseases: [
      {
        diseaseId: 'rice-blast',
        nameEnglish: 'Rice Blast (Leaf Blast)',
        nameTamil: 'குலை நோய் (இலைக் குலை)',
        scientificName: 'Magnaporthe oryzae (Pyricularia oryzae)',
        category: 'fungal',
        typicalSymptoms: [
          'Spindle-shaped or diamond-shaped lesions with grayish centers and brown margins',
          'Foliar blighting under continuous dew (>6 hours)',
          'Collar rot or node discoloration during panicle emergence',
        ],
        typicalSymptomsTamil: [
          'இலைகளில் கண் போன்ற அல்லது கதிர் போன்ற புள்ளிகள்',
          'சாம்பல் நிற மையமும் பழுப்பு நிற ஓரங்களும் கொண்ட புள்ளிகள்',
          'பனிப்பொழிவு உள்ள நேரங்களில் இலைகள் காய்ந்து போதல்',
        ],
        severityDefault: 'high',
        preventionGuidance: [
          'Postpone nitrogen/urea top-dressing until lesion sporulation subsides.',
          'Maintain shallow standing water (2-3 cm); avoid complete soil desiccation.',
          'Foliar spray of Pseudomonas fluorescens @ 5 g/L in early stages.',
        ],
        preventionGuidanceTamil: [
          'தழைச்சத்து (யூரியா) இடுவதை தற்காலிகமாக தள்ளி வைக்கவும்.',
          'வயலில் 2-3 செ.மீ மிதமான நீர் மட்டத்தை பராமரிக்கவும்.',
          'சூடோமோனாஸ் ஃப்ளோரசன்ஸ் 1 லிட்டருக்கு 5 கிராம் வீதம் தெளிக்கவும்.',
        ],
        inspectionGuidance: [
          'Inspect middle and top leaves for spindle-shaped spots after morning mist.',
          'Check leaf collars for brown water-soaked banding.',
        ],
        inspectionGuidanceTamil: [
          'காலை பனி நேரத்தில் நடு மற்றும் மேல் இலைகளில் கண் வடிவ புள்ளிகளை சரிபார்க்கவும்.',
          'இலைக் கழுத்து பகுதியில் பழுப்பு நிற பட்டைகளை கவனிக்கவும்.',
        ],
        sourceRef: 'TNAU Agritech Portal · Crop Protection (Rice)',
      },
      {
        diseaseId: 'bacterial-leaf-blight',
        nameEnglish: 'Bacterial Leaf Blight (BLB)',
        nameTamil: 'பாக்டீரியா இலைக்கருகல் நோய்',
        scientificName: 'Xanthomonas oryzae pv. oryzae',
        category: 'bacterial',
        typicalSymptoms: [
          'Water-soaked wavy yellow lesions progressing from leaf tips along margins',
          'Milky bacterial ooze beads on young lesions in morning hours',
          'Straw-bleached foliar desiccation resembling drought scorch',
        ],
        typicalSymptomsTamil: [
          'இலை நுனியிலிருந்து ஓரங்களில் அலை அலையாக தொடங்கும் மஞ்சள் கருகல்',
          'காலை வேளையில் இலை விளிம்புகளில் பால் போன்ற பாக்டீரியா திரவம்',
          'வைக்கோல் நிறத்தில் காய்ந்து வறண்டு போகும் இலைகள்',
        ],
        severityDefault: 'high',
        preventionGuidance: [
          'Drain standing field water to aerate root rhizosphere for 24-48 hours.',
          'Withhold nitrogen; apply Muriate of Potash (MOP) @ 15 kg/acre.',
          'Foliar spray of fresh 20% cow dung extract or Copper Hydroxide.',
        ],
        preventionGuidanceTamil: [
          'தேங்கிய நீரை உடனடியாக வடித்து வயலுக்கு காற்றோட்டம் தரவும்.',
          'தழைச்சத்தை தவிர்த்து, ஏக்கருக்கு 15 கிலோ பொட்டாஷ் உரம் இடவும்.',
          '20% புதிய சாணக்கரைசல் அல்லது காப்பர் ஹைட்ராக்சைடு தெளிக்கவும்.',
        ],
        inspectionGuidance: [
          'Perform bacterial ooze test: cut leaf margin and immerse in clear water.',
          'Check if clipping of seedlings preceded stormy winds.',
        ],
        inspectionGuidanceTamil: [
          'இலை நறுக்கு சோதனை: இலையின் ஓரத்தை வெட்டி தெளிந்த நீரில் வைத்து திரவ கசிவை சோதிக்கவும்.',
        ],
        sourceRef: 'TNAU Agritech Portal & IRRI Rice Knowledge Bank',
      },
      {
        diseaseId: 'brown-spot',
        nameEnglish: 'Brown Spot Disease',
        nameTamil: 'இலைப்புள்ளி நோய்',
        scientificName: 'Bipolaris oryzae (Cochliobolus miyabeanus)',
        category: 'fungal',
        typicalSymptoms: [
          'Isolated round to oval dark-brown spots resembling sesame seeds',
          'Light-brown or greyish center with distinct yellowish chlorotic halo',
          'Widespread across nutrient-depleted or salinity-affected soils',
        ],
        typicalSymptomsTamil: [
          'எள் போன்ற உருண்டையான அடர் பழுப்பு நிற புள்ளிகள்',
          'மஞ்சள் நிற வளையத்துடன் கூடிய பழுப்பு நிற மையம்',
          'ஊட்டச்சத்து குறைபாடுள்ள நிலங்களில் அதிக பரவல்',
        ],
        severityDefault: 'moderate',
        preventionGuidance: [
          'Correct soil potassium and zinc deficiency with Zinc Sulphate @ 10 kg/acre.',
          'Apply balanced NPK according to soil test recommendations.',
          'Spray Mancozeb @ 2 g/L at early lesion appearance.',
        ],
        preventionGuidanceTamil: [
          'சாம்பல் சத்து மற்றும் ஜிங்க் சல்பேட் (ஏக்கருக்கு 10 கிலோ) இடவும்.',
          'மண் பரிசோதனைக்கு ஏற்ப சமச்சீர் உரம் இடவும்.',
        ],
        inspectionGuidance: [
          'Verify that spots maintain rounded margins without spindle elongation.',
          'Examine glumes for seed discoloration.',
        ],
        inspectionGuidanceTamil: [
          'புள்ளிகள் நீளமாகாமல் உருண்டையாக இருப்பதை உறுதிப்படுத்தவும்.',
        ],
        sourceRef: 'TNAU Agritech Portal · Pathology Division',
      },
      {
        diseaseId: 'sheath-blight',
        nameEnglish: 'Sheath Blight',
        nameTamil: 'உறை அழுகல் நோய்',
        scientificName: 'Rhizoctonia solani',
        category: 'fungal',
        typicalSymptoms: [
          'Snake-skin or greenish-grey oval lesions starting on leaf sheaths near water level',
          'Lesions enlarge with dark brown or purplish-brown irregular borders',
          'White mycelial growth and small spherical sclerotia visible in humid canopy',
        ],
        typicalSymptomsTamil: [
          'தண்ணீர் மட்டத்திற்கு மேல் இலை உறைகளில் பாம்பு தோல் போன்ற புள்ளிகள்',
          'அடர் பழுப்பு நிற விளிம்புகளுடன் கூடிய பரவும் அழுகல்',
          'அடர்ந்த பயிர்களில் வெண்மையான பூஞ்சாண இழை வளர்ச்சி',
        ],
        severityDefault: 'moderate',
        preventionGuidance: [
          'Avoid dense plant spacing; ensure proper sunlight penetration.',
          'Reduce excess nitrogen fertilizer split application.',
          'Foliar spray of Validamycin 3% L @ 2 ml/L or Hexaconazole 5% SC @ 2 ml/L.',
        ],
        preventionGuidanceTamil: [
          'நெருக்கமாக பயிரிடுவதை தவிர்த்து போதிய சூரிய ஒளி கிடைக்கச் செய்யவும்.',
          'அதிக தழைச்சத்து இடுவதை குறைக்கவும்.',
          'வேலிடாமைய்சின் 3% L (லிட்டருக்கு 2 மி.லி) கலந்து தெளிக்கவும்.',
        ],
        inspectionGuidance: [
          'Part the dense canopy and inspect lowest leaf sheaths 5-10 cm above water line.',
        ],
        inspectionGuidanceTamil: [
          'பயிரை விலக்கி நீர் மட்டத்திற்கு மேல் உள்ள கீழ்ப்பகுதி இலை உறைகளை சோதிக்கவும்.',
        ],
        sourceRef: 'TNAU Department of Plant Pathology, Coimbatore',
      },
      {
        diseaseId: 'healthy-rice',
        nameEnglish: 'Healthy Rice Leaf',
        nameTamil: 'ஆரோக்கியமான நெற்பயிர்',
        scientificName: 'Oryza sativa L.',
        category: 'nominal',
        typicalSymptoms: [
          'Uniform vibrant emerald green pigmentation across blade',
          'Absence of fungal spots, marginal necrotic banding, or water-soaked streaks',
          'Normal erect canopy vigor and intact ligule anatomy',
        ],
        typicalSymptomsTamil: [
          'சீரான அடர் பச்சை நிற இலைப்பரப்பு',
          'புள்ளிகளோ, கருகலோ, கசிவுகளோ இல்லாத தூய்மையான இலைகள்',
          'இயல்பான பயிர் வளர்ச்சி மற்றும் வீரியம்',
        ],
        severityDefault: 'nominal',
        preventionGuidance: [
          'Continue balanced nutrition and alternate wetting and drying water management.',
          'Conserve natural predators such as predatory spiders and mirid bugs.',
        ],
        preventionGuidanceTamil: [
          'சமச்சீர் உரமிடுதல் மற்றும் காய்ச்சலும் பாய்ச்சலுமான பாசனத்தை தொடரவும்.',
        ],
        inspectionGuidance: [
          'Conduct weekly routine field walk in W-pattern.',
        ],
        inspectionGuidanceTamil: [
          'வாரந்தோறும் வயல் வலம் வந்து பூச்சி மற்றும் நோய் கண்காணிப்பை தொடரவும்.',
        ],
        sourceRef: 'TNAU Integrated Crop Management Guidelines',
      },
    ],
  },

  tomato: {
    cropId: 'tomato',
    cropNameEnglish: 'Tomato',
    cropNameTamil: 'தக்காளி',
    scientificName: 'Solanum lycopersicum',
    category: 'Vegetable',
    supportedStatus: 'preliminary',
    statusBadge: {
      en: 'Preliminary Screening',
      ta: 'பூர்வாங்க ஆய்வு',
    },
    description: {
      en: 'Foliar pathology detection for common solanaceous leaf spots. Calibrated for early blight, septoria, and healthy foliage.',
      ta: 'தக்காளி இலைப்புள்ளி மற்றும் கருகல் நோய்களுக்கான ஆரம்ப கட்ட ஆய்வு முறை.',
    },
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    guidanceLanguage: ['en', 'ta'],
    modelIdentifier: 'gemini-3.8-flash',
    modelVersion: 'cropshield-tomato-v1.0',
    sampleVarieties: ['Shivam Hybrid', 'PKM 1', 'Arka Rakshak', 'Local Delta Cultivar'],
    supportedDiseases: [
      {
        diseaseId: 'tomato-early-blight',
        nameEnglish: 'Early Blight',
        nameTamil: 'முன் கருகல் நோய்',
        scientificName: 'Alternaria solani',
        category: 'fungal',
        typicalSymptoms: [
          'Concentric rings resembling a target board on older foliage',
          'Yellow chlorotic halos surrounding brown necrotic lesions',
          'Progressive lower-canopy defoliation',
        ],
        typicalSymptomsTamil: [
          'இலைகளில் வளையம் போன்ற வட்ட வடிவ பழுப்புப் புள்ளிகள்',
          'புள்ளிகளைச் சுற்றி மஞ்சள் நிற வளையம்',
          'அடிப்பகுதி இலைகள் பழுத்து உதிர்தல்',
        ],
        severityDefault: 'moderate',
        preventionGuidance: [
          'Remove infected lower leaves touching the soil surface.',
          'Avoid overhead sprinkler irrigation; keep foliage dry.',
          'Apply copper oxychloride or Mancozeb @ 2 g/L.',
        ],
        preventionGuidanceTamil: [
          'மண்ணில் படும் அடிப்பகுதி பாதிக்கப்பட்ட இலைகளை அகற்றவும்.',
          'செடிகளின் மேல் தண்ணீர் தெளிப்பதைத் தவிர்த்து சொட்டு நீர்ப்பாசனம் செய்யவும்.',
        ],
        inspectionGuidance: [
          'Check lowest mature leaves first for target-board rings.',
        ],
        inspectionGuidanceTamil: [
          'அடிப்பகுதி முதிர்ந்த இலைகளில் வளையப் புள்ளிகளை சோதிக்கவும்.',
        ],
        sourceRef: 'TNAU Vegetable Pathology Guide',
      },
      {
        diseaseId: 'tomato-septoria',
        nameEnglish: 'Septoria Leaf Spot',
        nameTamil: 'செப்டோரியா இலைப்புள்ளி',
        scientificName: 'Septoria lycopersici',
        category: 'fungal',
        typicalSymptoms: [
          'Numerous small circular spots with greyish-white centers and dark margins',
          'Tiny black fruiting bodies (pycnidia) within mature spot centers',
        ],
        typicalSymptomsTamil: [
          'அடர் விளிம்புடன் கூடிய சிறிய சாம்பல் நிற வட்டப் புள்ளிகள்',
          'புள்ளிகளின் மையத்தில் மிகச் சிறிய கரும்புள்ளிகள்',
        ],
        severityDefault: 'moderate',
        preventionGuidance: [
          'Practice 2-year crop rotation away from solanaceous crops.',
          'Mulch around plant base to prevent rain splash from soil.',
        ],
        preventionGuidanceTamil: [
          'பயிர் சுழற்சி முறையை கடைபிடிக்கவும்.',
          'மழைத்துளி மூலம் மண் தெறிக்காமல் இருக்க நிலப்போர்வை அமைக்கவும்.',
        ],
        inspectionGuidance: [
          'Examine underside and upper surface of lower leaves with a hand lens.',
        ],
        inspectionGuidanceTamil: [
          'இலையின் இருபுறமும் பூதக்கண்ணாடி மூலம் பரிசோதிக்கவும்.',
        ],
        sourceRef: 'TNAU Vegetable Pathology Guide',
      },
      {
        diseaseId: 'healthy-tomato',
        nameEnglish: 'Healthy Tomato Foliage',
        nameTamil: 'ஆரோக்கியமான தக்காளி இலை',
        scientificName: 'Solanum lycopersicum',
        category: 'nominal',
        typicalSymptoms: ['Uniform green foliage without concentric spots or curling.'],
        typicalSymptomsTamil: ['புள்ளிகளோ சுருட்டையோ இல்லாத இயல்பான இலைகள்.'],
        severityDefault: 'nominal',
        preventionGuidance: ['Maintain balanced fertigation and regular staking.'],
        preventionGuidanceTamil: ['சமச்சீர் உரமிடுதல் மற்றும் ஆதரவு குச்சிகள் அமைத்தலை தொடரவும்.'],
        inspectionGuidance: ['Inspect foliage twice weekly.'],
        inspectionGuidanceTamil: ['வாரமிருமுறை இலைகளைக் கண்காணிக்கவும்.'],
        sourceRef: 'TNAU Horticultural Protocols',
      },
    ],
  },

  chilli: {
    cropId: 'chilli',
    cropNameEnglish: 'Chilli',
    cropNameTamil: 'மிளகாய்',
    scientificName: 'Capsicum annuum L.',
    category: 'Spices',
    supportedStatus: 'preliminary',
    statusBadge: {
      en: 'Preliminary Screening',
      ta: 'பூர்வாங்க ஆய்வு',
    },
    description: {
      en: 'Foliar symptom detection for anthracnose spots, cercospora leaf spot, and healthy capsicum leaves.',
      ta: 'மிளகாய் இலைப்புள்ளி மற்றும் கருகல் நோய்களுக்கான ஆரம்ப கட்ட ஆய்வு முறை.',
    },
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    guidanceLanguage: ['en', 'ta'],
    modelIdentifier: 'gemini-3.8-flash',
    modelVersion: 'cropshield-chilli-v1.0',
    sampleVarieties: ['K1', 'K2', 'CO 4', 'Guntur Sannam', 'Local Delta Chilli'],
    supportedDiseases: [
      {
        diseaseId: 'chilli-anthracnose',
        nameEnglish: 'Anthracnose / Die-back',
        nameTamil: 'காய் அழுகல் / நுனிக் கருகல்',
        scientificName: 'Colletotrichum capsici',
        category: 'fungal',
        typicalSymptoms: [
          'Circular to angular dark sunken lesions on leaves and tender twigs',
          'Concentric rings of dark acervuli (spore masses)',
          'Die-back of twigs from tip downwards',
        ],
        typicalSymptomsTamil: [
          'இலை மற்றும் தண்டுகளில் வட்டமான குழிந்த கரும் புள்ளிகள்',
          'நுனியிலிருந்து கீழ்நோக்கி காய்ந்து போகும் நுனிக்கருகல்',
        ],
        severityDefault: 'high',
        preventionGuidance: [
          'Prune and destroy infected twig tips.',
          'Spray Copper Oxychloride @ 2.5 g/L or Azoxystrobin @ 1 ml/L.',
        ],
        preventionGuidanceTamil: [
          'பாதிக்கப்பட்ட நுனிப் பகுதிகளை வெட்டி அகற்றவும்.',
          'காப்பர் ஆக்ஸிகுளோரைடு (லிட்டருக்கு 2.5 கிராம்) தெளிக்கவும்.',
        ],
        inspectionGuidance: [
          'Inspect upper leaf twigs and green fruit surfaces.',
        ],
        inspectionGuidanceTamil: [
          'மேற்பகுதி இலைகள் மற்றும் காய்களை கவனமாக சோதிக்கவும்.',
        ],
        sourceRef: 'TNAU Spices & Plantation Crops Advisory',
      },
      {
        diseaseId: 'chilli-cercospora',
        nameEnglish: 'Cercospora Leaf Spot (Frogeye)',
        nameTamil: 'செர்கோஸ்போரா இலைப்புள்ளி',
        scientificName: 'Cercospora capsici',
        category: 'fungal',
        typicalSymptoms: [
          'Circular lesions with prominent white/grey centers and dark margins (frogeye appearance)',
        ],
        typicalSymptomsTamil: [
          'தவளைக் கண் போன்ற வெள்ளை மையமும் அடர் விளிம்பும் கொண்ட புள்ளிகள்',
        ],
        severityDefault: 'moderate',
        preventionGuidance: [
          'Foliar spray of Carbendazim @ 1 g/L or Mancozeb @ 2 g/L.',
        ],
        preventionGuidanceTamil: [
          'கார்பன்டசிம் அல்லது மேன்கோசெப் தெளிக்கவும்.',
        ],
        inspectionGuidance: [
          'Check both leaf surfaces for frogeye spots.',
        ],
        inspectionGuidanceTamil: [
          'இலையின் இருபுறமும் வட்டப் புள்ளிகளை கவனிக்கவும்.',
        ],
        sourceRef: 'TNAU Spices & Plantation Crops Advisory',
      },
      {
        diseaseId: 'healthy-chilli',
        nameEnglish: 'Healthy Chilli Foliage',
        nameTamil: 'ஆரோக்கியமான மிளகாய் இலை',
        scientificName: 'Capsicum annuum L.',
        category: 'nominal',
        typicalSymptoms: ['Clean dark green foliage without spots or cupping.'],
        typicalSymptomsTamil: ['சுருக்கம் இல்லாத அடர் பச்சை நிற இலைகள்.'],
        severityDefault: 'nominal',
        preventionGuidance: ['Maintain balanced nutrition and prophylactic neem oil spray.'],
        preventionGuidanceTamil: ['வேப்பெண்ணெய் கரைசல் மூலம் பூச்சித் தடுப்பு மேலாண்மை செய்யவும்.'],
        inspectionGuidance: ['Monitor weekly.'],
        inspectionGuidanceTamil: ['வாரம் ஒருமுறை கண்காணிக்கவும்.'],
        sourceRef: 'TNAU Integrated Crop Management',
      },
    ],
  },

  cotton: {
    cropId: 'cotton',
    cropNameEnglish: 'Cotton',
    cropNameTamil: 'பருத்தி',
    scientificName: 'Gossypium hirsutum L.',
    category: 'Fiber',
    supportedStatus: 'planned',
    statusBadge: {
      en: 'Planned · In Calibration',
      ta: 'திட்டமிடப்பட்டுள்ளது · ஆய்வில் உள்ளது',
    },
    description: {
      en: 'Calibrated detection pipeline for cotton bacterial blight and leaf curl is currently undergoing TNAU regional validation.',
      ta: 'பருத்தி இலைக்கருகல் மற்றும் சுருட்டல் நோய்களுக்கான மாதிரி ஆய்வுப் பணிகள் தற்போது நடைபெற்று வருகின்றன.',
    },
    acceptedImageTypes: ['image/jpeg', 'image/png'],
    guidanceLanguage: ['en', 'ta'],
    modelIdentifier: 'pending-calibration',
    modelVersion: 'unreleased',
    sampleVarieties: ['MCU 5', 'MCU 7', 'Suraj', 'Bt Cotton Hybrid'],
    supportedDiseases: [],
    unsupportedNotice: {
      en: 'Validated disease diagnosis for Cotton is currently undergoing regional agronomic calibration with TNAU datasets. To ensure scientific integrity, CropShield does not run generic image classifiers. Full support will be activated in an upcoming update.',
      ta: 'பருத்திப் பயிர்க்கான துல்லியமான நோய் கணிப்பு மாதிரி தற்போது கள ஆய்வில் உள்ளது. தவறான கணிப்புகளைத் தவிர்க்க CropShield பொதுவான மாடல்களைப் பயன்படுத்துவதில்லை. அடுத்த பதிப்பில் முழு சேவை வழங்கப்படும்.',
    },
  },

  maize: {
    cropId: 'maize',
    cropNameEnglish: 'Maize (Corn)',
    cropNameTamil: 'மக்காச்சோளம்',
    scientificName: 'Zea mays L.',
    category: 'Cereal',
    supportedStatus: 'planned',
    statusBadge: {
      en: 'Planned · In Calibration',
      ta: 'திட்டமிடப்பட்டுள்ளது · ஆய்வில் உள்ளது',
    },
    description: {
      en: 'Pathology evaluation for Turcicum leaf blight and Maydis blight is scheduled for subsequent release.',
      ta: 'மக்காச்சோள இலைக்கருகல் மற்றும் புள்ளி நோய்களுக்கான மாதிரி அடுத்த பதிப்பில் சேர்க்கப்படும்.',
    },
    acceptedImageTypes: ['image/jpeg', 'image/png'],
    guidanceLanguage: ['en', 'ta'],
    modelIdentifier: 'pending-calibration',
    modelVersion: 'unreleased',
    sampleVarieties: ['CoH(M) 6', 'CoH(M) 8', 'Pioneer 30V92', 'NK 6240'],
    supportedDiseases: [],
    unsupportedNotice: {
      en: 'Validated pathology screening for Maize is currently undergoing field calibration. CropShield maintains strict scientific standards and does not present speculative AI predictions without verified regional datasets.',
      ta: 'மக்காச்சோளப் பயிர்க்கான ஆய்வு மாதிரி தற்போது கள ஆய்வில் உள்ளது. விவசாயிகளுக்கு நம்பகமான வழிகாட்டலை வழங்க முழுமையான சரிபார்ப்பிற்குப் பின் இது வெளியிடப்படும்.',
    },
  },
};

/**
 * Returns all registered crops as an array
 */
export function getAllCrops(): CropConfig[] {
  return Object.values(CROP_REGISTRY);
}

/**
 * Returns crop configuration by cropId, defaulting to rice
 */
export function getCropConfig(cropId: string): CropConfig {
  return CROP_REGISTRY[cropId] || CROP_REGISTRY.rice;
}

/**
 * Checks whether a crop is eligible for active analysis
 */
export function isCropAnalysisSupported(cropId: string): boolean {
  const crop = CROP_REGISTRY[cropId];
  return Boolean(crop && (crop.supportedStatus === 'validated' || crop.supportedStatus === 'preliminary'));
}

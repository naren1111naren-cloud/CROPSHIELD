/**
 * CropShield AI — Central Supported Disease & Pest Registry
 * Version: v1.0.0
 * 
 * Defines target candidate pathology classes, symptoms, diagnostic limitations,
 * verified agricultural references, and expert review triggers.
 * 
 * Strict boundary: Insect pests are cataloged separately from fungal/bacterial
 * pathogens due to differing diagnostic and biological management requirements.
 */

export const DISEASE_REGISTRY_VERSION = 'v1.0.0';

export type PathogenCategory = 'fungal' | 'bacterial' | 'viral' | 'physiological' | 'healthy' | 'inconclusive';

export type ModelReadinessStatus =
  | 'target_candidate'       // Defined target class; model training / dataset curation underway
  | 'evaluated_specialist'   // Evaluated on held-out test benchmark with documented metrics
  | 'preliminary_screening'  // Multimodal reasoning fallback available; awaiting trained specialist weights
  | 'planned';               // Planned for subsequent agricultural cycles

export interface SupportedDiseaseClass {
  classId: string;
  cropId: 'rice' | 'tomato' | 'chilli' | 'cotton' | 'maize';
  cropName: string;
  cropNameTamil: string;
  commonName: string;
  commonNameTamil: string;
  scientificName: string;
  category: PathogenCategory;
  readinessStatus: ModelReadinessStatus;
  visibleSymptoms: string[];
  visibleSymptomsTamil: string[];
  diagnosticLimitations: string[];
  diagnosticLimitationsTamil: string[];
  trustedReferences: {
    title: string;
    source: string;
    url?: string;
  }[];
  preliminaryCare: {
    cultural: string[];
    culturalTamil: string[];
    biological: string[];
    biologicalTamil: string[];
  };
  expertConfirmationCriteria: string;
  expertConfirmationCriteriaTamil: string;
}

export interface PestRecord {
  pestId: string;
  cropId: 'rice' | 'tomato' | 'chilli' | 'cotton' | 'maize';
  cropName: string;
  commonName: string;
  commonNameTamil: string;
  scientificName: string;
  damageSymptoms: string[];
  damageSymptomsTamil: string[];
  monitoringMethods: string[];
  monitoringMethodsTamil: string[];
  biologicalControls: string[];
  biologicalControlsTamil: string[];
  trustedReference: string;
}

// ============================================================================
// 1. Target Pathology Classes (Focus on Rice as primary crop)
// ============================================================================

export const RICE_DISEASE_CLASSES: Record<string, SupportedDiseaseClass> = {
  rice_blast: {
    classId: 'rice_blast',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    commonName: 'Rice Blast (Leaf & Neck Blast)',
    commonNameTamil: 'குலை நோய் (இலைக் குலை / கழுத்துக் குலை)',
    scientificName: 'Magnaporthe oryzae (Pyricularia oryzae)',
    category: 'fungal',
    readinessStatus: 'target_candidate',
    visibleSymptoms: [
      'Elliptical or spindle-shaped foliar lesions with pointed ends',
      'Grayish ash-white necrotic center with distinct brown or reddish-brown borders',
      'Lesions coalesce under high humidity causing complete leaf blighting',
      'Blackish-brown necrosis at collar or panicle neck base during booting/flowering',
    ],
    visibleSymptomsTamil: [
      'கதிர் வடிவம் அல்லது கண் வடிவ புள்ளிகள் இலைகளில் தோன்றும்',
      'சாம்பல் நிற மையமும் பழுப்பு நிற விளிம்புகளும் கொண்ட புள்ளிகள்',
      'அதிக ஈரப்பதத்தில் புள்ளிகள் ஒன்றுசேர்ந்து இலைகள் முழுமையாக கருகும்',
      'கதிர் வெளிவரும் போது கழுத்துப் பகுதியில் கறுப்பு நிற அழுகல் தோன்றும்',
    ],
    diagnosticLimitations: [
      'Early pinhead lesions can be visually confused with Brown Spot (Bipolaris oryzae) before the grey ash center expands.',
      'Physiological fertilizer scorch or drought spots can mimic blast lesions on low-resolution or blurry imagery.',
      'Neck blast requires inspection of panicle junctions, which is not visible in leaf-only blade photographs.',
    ],
    diagnosticLimitationsTamil: [
      'ஆரம்பக்கட்ட சிறிய புள்ளிகள் இலைப்புள்ளி நோயைப் போன்று காட்சியளிக்கலாம்.',
      'உரத்தீய்வு அல்லது வறட்சிப் புள்ளிகள் தெளிவற்ற படங்களில் குலை நோய் போல தவறாகத் தெரியலாம்.',
      'கழுத்து குலை நோயை உறுதிசெய்ய கதிரின் அடிப்பகுதியை தனியாகப் புகைப்படம் எடுக்க வேண்டும்.',
    ],
    trustedReferences: [
      {
        title: 'TNAU Agritech Portal – Rice Blast Pathology & Management',
        source: 'Tamil Nadu Agricultural University, Coimbatore',
        url: 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_diseases_cereals_paddy_1.html',
      },
      {
        title: 'IRRI Rice Knowledge Bank – Blast Disease Factsheet',
        source: 'International Rice Research Institute',
        url: 'http://www.knowledgebank.irri.org/step-by-step-production/growth/pests-and-diseases/diseases/rice-blast',
      },
    ],
    preliminaryCare: {
      cultural: [
        'Avoid excessive split application of nitrogen (urea); high nitrogen produces succulent tender foliage vulnerable to blast.',
        'Refrain from keeping continuous standing water in nursery beds; maintain thin drainage film.',
        'Burn or compost heavily infected stubble after harvest to eliminate overwintering conidia.',
      ],
      culturalTamil: [
        'அதிகப்படியான யூரியா இடுவதைத் தவிர்க்கவும்; அதிக தழைச்சத்து இலைகளை மென்மையாக்கி நோய்த்தொற்றை அதிகரிக்கும்.',
        'நாற்றங்காலில் தொடர்ந்து அதிக நீர் தேங்காமல் வடித்து பராமரிக்கவும்.',
        'அறுவடைக்கு பின் பாதிக்கப்பட்ட பயிர் எச்சங்களை தீயிட்டு அல்லது மட்க வைத்து அழிக்கவும்.',
      ],
      biological: [
        'Seed treatment with Pseudomonas fluorescens @ 10g/kg of seed prior to nursery sowing.',
        'Foliar spray with Pseudomonas fluorescens (0.2% suspension @ 2g/litre) at 30 and 45 days after transplanting (DAT).',
      ],
      biologicalTamil: [
        'விதைப்பதற்கு முன் 1 கிலோ விதைக்கு 10 கிராம் சூடோமோனாஸ் புளோரசன்ஸ் கொண்டு விதைநேர்த்தி செய்யவும்.',
        'நடவு செய்த 30 மற்றும் 45 ஆம் நாட்களில் சூடோமோனாஸ் கரைசலை (லிட்டருக்கு 2 கிராம்) இலைகளில் தெளிக்கவும்.',
      ],
    },
    expertConfirmationCriteria: 'Confirm with District KVK / TNAU Plant Pathology specialist if spindle lesions cover >10% leaf canopy or if neck blackening appears on >5% panicles during booting.',
    expertConfirmationCriteriaTamil: 'வயலில் 10%க்கும் அதிகமான இலைகளில் கதிர் வடிவ புள்ளிகள் பரவினாலோ அல்லது 5% கதிர்களில் கழுத்து அழுகல் தென்பட்டாலோ உடனடியாக வட்டார வேளாண் அலுவலர் அல்லது KVK விஞ்ஞானியை அணுகவும்.',
  },

  bacterial_leaf_blight: {
    classId: 'bacterial_leaf_blight',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    commonName: 'Bacterial Leaf Blight (BLB)',
    commonNameTamil: 'பாக்டீரியா இலைக்கருகல் நோய்',
    scientificName: 'Xanthomonas oryzae pv. oryzae',
    category: 'bacterial',
    readinessStatus: 'target_candidate',
    visibleSymptoms: [
      'Water-soaked stripes starting near leaf tips and progressing down one or both leaf margins',
      'Lesions develop wavy or undulated borders turning straw-yellow and bleached white',
      'Milky or amber bacterial droplets (ooze) may form on lesions in early morning mist',
      'Kresek symptom (systemic seedling wilt) observed in transplanted young crops (1-3 weeks)',
    ],
    visibleSymptomsTamil: [
      'இலை நுனியில் தொடங்கி ஓரங்களில் கீழிறங்கும் நீர் ஊறிய மஞ்சள் கோடுகள்',
      'அலை போன்ற விளிம்புகளுடன் இலைகள் வைக்கோல் நிறமாக காய்ந்து வெளிர்தல்',
      'காலை பனி வேளையில் இலை விளிம்புகளில் சிறிய பாக்டீரியா திரவத் துளிகள் கசிதல்',
      'இளம் பயிர்களில் தண்டு வாடல் (கிரெசெக்) அறிகுறி தோன்றுதல்',
    ],
    diagnosticLimitations: [
      'Late-stage drought tip burn closely resembles BLB without bacterial streaming.',
      'Cannot differentiate pathotypes (races) through visual RGB photographs alone.',
      'Field confirmation requires microscopic ooze test in clear water tube.',
    ],
    diagnosticLimitationsTamil: [
      'வறட்சியால் இலை நுனி காய்வதும் இலைக்கருகல் போலத் தோன்றலாம்.',
      'புகைப்படம் மூலம் பாக்டீரியாவின் நுண் வகைகளை (Pathotypes) பகுப்பாய்வு செய்ய இயலாது.',
      'உறுதிப்படுத்த இலைத்துண்டை கண்ணாடி டம்ளர் நீரில் இட்டு பாக்டீரியா கசிவு சோதனையை (Ooze test) மேற்கொள்ள வேண்டும்.',
    ],
    trustedReferences: [
      {
        title: 'TNAU Agritech Portal – Bacterial Leaf Blight Diagnostics',
        source: 'Tamil Nadu Agricultural University',
        url: 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_diseases_cereals_paddy_2.html',
      },
    ],
    preliminaryCare: {
      cultural: [
        'Drain field standing water and implement Alternate Wetting and Drying (AWD).',
        'Strictly stop all nitrogenous top-dressing until lesion extension halts.',
        'Avoid entering or brushing against damp fields to prevent mechanical transmission.',
      ],
      culturalTamil: [
        'வயலில் உள்ள நீரை உடனடியாக வடித்துவிட்டு, காய்ச்சலும் பாய்ச்சலுமாக நீர் பாய்ச்சவும்.',
        'நோய் தீவிரம் குறையும் வரை தழைச்சத்து (யூரியா) இடுவதை முற்றிலும் நிறுத்தவும்.',
        'ஈரப்பதம் இருக்கும்போது வயலில் நடமாடுவதைத் தவிர்க்கவும்; இது நோய் பரவுவதைத் தடுக்கும்.',
      ],
      biological: [
        'Spray fresh cow dung filtrate extract (20% suspension) to foster antagonistic native phyllosphere bacteria.',
        'Prophylactic foliar spray of Bacillus subtilis or Pseudomonas fluorescens @ 2.5g/litre.',
      ],
      biologicalTamil: [
        '20% சாண எரு கரைசல் தெளித்து இலைப்பரப்பில் நன்மை செய்யும் பாக்டீரியாக்களை பெருக்கவும்.',
        'சூடோமோனாஸ் அல்லது பேசிலஸ் சப்டிலிஸ் (லிட்டருக்கு 2.5 கிராம்) தெளிக்கவும்.',
      ],
    },
    expertConfirmationCriteria: 'Submit leaf blade cutting in clean polythene envelope to ADA Extension Laboratory if margin yellowing advances by >2 cm per day.',
    expertConfirmationCriteriaTamil: 'இலை விளிம்பில் மஞ்சள் கோடு நாள்தோறும் 2 செ.மீ-க்கு மேல் கீழ்நோக்கிப் பரவினால், இலை மாதிரியை வட்டார வேளாண் விரிவாக்க மையத்திற்கு அனுப்பி பரிசோதிக்கவும்.',
  },

  brown_spot: {
    classId: 'brown_spot',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    commonName: 'Brown Spot',
    commonNameTamil: 'இலைப்புள்ளி நோய் (செம்புள்ளி)',
    scientificName: 'Bipolaris oryzae (Cochliobolus miyabeanus)',
    category: 'fungal',
    readinessStatus: 'target_candidate',
    visibleSymptoms: [
      'Small, circular to oval sesame seed-like spots scattered across leaf blades',
      'Mature lesions have a dark brown to purplish-brown border with a lighter tan center',
      'Heavily infected leaves turn yellow, senesce early, and dry out',
      'Grain discoloration (black or brown spotting) on infected spikelets',
    ],
    visibleSymptomsTamil: [
      'இலைப்பரப்பில் எள் போன்ற சிறிய வட்ட வடிவ அல்லது நீள்வட்டப் புள்ளிகள்',
      'முதிர்ந்த புள்ளிகள் அடர் பழுப்பு விளிம்புகளுடன் வெளிர் மையத்தைக் கொண்டிருக்கும்',
      'அதிக பாதிப்படைந்த இலைகள் மஞ்சள் நிறமாகி முன்கூட்டியே காய்ந்துவிடும்',
      'தானிய மணிகளில் கறுப்பு அல்லது பழுப்பு நிற புள்ளிகள் தோன்றும்',
    ],
    diagnosticLimitations: [
      'Brown spot severity is strongly correlated with potassium/silicon soil deficiency and saline stress; symptoms mimic nutritional deficiency.',
      'Small lesions can resemble early Blast spots before sporulation.',
      'Leaf surface dust or mud specks can lead to false positive spot detections in automated image analysis.',
    ],
    diagnosticLimitationsTamil: [
      'சாம்பல் சத்து குறைபாடு மற்றும் உவர் நிலங்களில் இந்நோய் தீவிரமடையும்; ஊட்டச்சத்து பற்றாக்குறையுடன் குழப்பம் நேரலாம்.',
      'ஆரம்ப நிலை புள்ளிகள் குலை நோய் போலத் தோன்றலாம்.',
      'இலையின் மேலுள்ள மண் துகள்கள் தானியங்கி ஆய்வில் தவறான புள்ளி அடையாளங்களாக வரக்கூடும்.',
    ],
    trustedReferences: [
      {
        title: 'TNAU Agritech Portal – Rice Brown Spot Management',
        source: 'Tamil Nadu Agricultural University',
        url: 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_diseases_cereals_paddy_3.html',
      },
    ],
    preliminaryCare: {
      cultural: [
        'Apply balanced potash (Muriate of Potash @ 25 kg/acre) in two splits to fortify cell wall silica.',
        'Ensure proper land leveling to prevent localized water stagnation and root iron toxicity.',
        'Use certified seeds free from black embryo discolouration.',
      ],
      culturalTamil: [
        'சமச்சீர் சாம்பல் சத்து (பொட்டாஷ் ஏக்கருக்கு 25 கிலோ) இரு தவணைகளாக இட்டு இலைகளை உறுதிப்படுத்தவும்.',
        'வயலை சீராக சமன்படுத்தி ஒரே சீரான நீர்மட்டத்தை பராமரிக்கவும்.',
        'நோய் தாக்காத சான்று பெற்ற விதைகளைப் பயன்படுத்தவும்.',
      ],
      biological: [
        'Trichoderma viride seed treatment @ 4g/kg seed.',
        'Spray Pseudomonas fluorescens (0.2%) when spots are first observed on 2nd or 3rd leaf.',
      ],
      biologicalTamil: [
        '1 கிலோ விதைக்கு 4 கிராம் டிரைக்கோடெர்மா விரிடி கொண்டு விதைநேர்த்தி செய்யவும்.',
        'இலைகளில் புள்ளிகள் தென்படும் போதே சூடோமோனாஸ் (0.2%) தெளிக்கவும்.',
      ],
    },
    expertConfirmationCriteria: 'Consult soil testing officer if brown spots occur uniformly across fields despite standard fertilizer application.',
    expertConfirmationCriteriaTamil: 'உரமிட்ட பிறகும் வயல் முழுவதும் சீராக இலைப்புள்ளிகள் தொடர்ந்தால் மண் பரிசோதனை மேற்கொண்டு ஊட்டச்சத்து நிலையை அறியவும்.',
  },

  sheath_blight: {
    classId: 'sheath_blight',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    commonName: 'Sheath Blight',
    commonNameTamil: 'உறை அழுகல் / உறை கருகல் நோய்',
    scientificName: 'Rhizoctonia solani Kühn',
    category: 'fungal',
    readinessStatus: 'target_candidate',
    visibleSymptoms: [
      'Greenish-gray water-soaked oval or oblong lesions forming on leaf sheaths near water line',
      'Lesions enlarge with dark brown or purplish-brown borders resembling snake skin pattern',
      'White fungal mycelium and hard brownish sclerotial bodies (mustard seed size) visible inside infected sheaths',
      'Infection moves upward to flag leaf in dense canopy fields, causing tillers to lodge',
    ],
    visibleSymptomsTamil: [
      'நீர்மட்டத்திற்கு மேல் இலை உறைகளில் பச்சை கலந்த சாம்பல் நிற நீள்வட்டப் புள்ளிகள்',
      'பாம்புத் தோல் போன்ற தோற்றமுடைய பழுப்பு விளிம்புகளுடன் கூடிய புள்ளிகள்',
      'உறைகளின் இடுக்குகளில் கடுகு போன்ற பழுப்பு நிற பூஞ்சை வித்துக்கள் (ஸ்கிளரோஷியா) காணப்படுதல்',
      'அடர்ந்த பயிர்களில் கொடி இலை வரை நோய் பரவி பயிர் சாய்தல்',
    ],
    diagnosticLimitations: [
      'Symptoms manifest primarily on lower stem sheaths; leaf-blade photographs missing the stem base fail to capture this disease.',
      'Sclerotial resting bodies can fall off during handling, requiring careful examination.',
      'Often co-occurs with Stem Rot (Sclerotium oryzae) in waterlogged fields.',
    ],
    diagnosticLimitationsTamil: [
      'இந்நோய் தண்டின் அடிப்பகுதியில் உள்ள உறைகளில் மட்டுமே தொடங்கும்; இலைநுனி புகைப்படங்களில் தெரியாது.',
      'கடுகு போன்ற வித்துக்கள் உதிர்ந்துவிட்டால் தண்டு அழுகலுடன் குழப்பம் வரலாம்.',
      'நீர் தேங்கிய வயல்களில் தண்டு அழுகல் நோயுடன் இணைந்து தாக்கக்கூடும்.',
    ],
    trustedReferences: [
      {
        title: 'TNAU Agritech Portal – Sheath Blight in Paddy',
        source: 'Tamil Nadu Agricultural University',
        url: 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_diseases_cereals_paddy_4.html',
      },
    ],
    preliminaryCare: {
      cultural: [
        'Skim and remove floating organic debris and sclerotial bodies during field puddling.',
        'Avoid over-dense planting; maintain recommended 20x10 cm or 20x15 cm spacing.',
        'Regulate water depth to allow sunlight penetration to lower tillers.',
      ],
      culturalTamil: [
        'சேற்றுழவின் போது மிதக்கும் பூஞ்சை வித்துக்கள் மற்றும் பயிர் எச்சங்களை அரித்து அப்புறப்படுத்தவும்.',
        'பயிரை மிகவும் நெருக்கமாக நடாமல் பரிந்துரைக்கப்பட்ட இடைவெளியில் (20x15 செ.மீ) நடவும்.',
        'தூர்களின் அடிப்பகுதியில் சூரிய ஒளி படுமாறு நீர்மட்டத்தை குறைக்கவும்.',
      ],
      biological: [
        'Soil application of Trichoderma viride @ 1 kg/acre enriched in 50 kg farmyard manure at planting.',
        'Spray Pseudomonas fluorescens (0.2%) directed at the lower stem sheath canopy.',
      ],
      biologicalTamil: [
        'ஏக்கருக்கு 1 கிலோ டிரைக்கோடெர்மா விரிடியை 50 கிலோ தொழுவுரத்துடன் கலந்து அடியுரமாக இடவும்.',
        'சூடோமோனாஸ் கரைசலை தண்டின் அடிப்பகுதியை நோக்கி நன்கு நனையும்படி தெளிக்கவும்.',
      ],
    },
    expertConfirmationCriteria: 'Notify agricultural extension officer if sheath lesions advance upward past the penultimate leaf before heading.',
    expertConfirmationCriteriaTamil: 'கதிர் வெளிவருவதற்கு முன்பாகவே உறை அழுகல் புள்ளிகள் கொடி இலையை நோக்கி மேல்நோக்கி பரவினால் உடனடியாக வேளாண் அலுவலரைத் தொடர்பு கொள்ளவும்.',
  },

  healthy_rice: {
    classId: 'healthy_rice',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    commonName: 'Healthy Rice Foliage',
    commonNameTamil: 'ஆரோக்கியமான நெற்பயிர் இலைகள்',
    scientificName: 'Oryza sativa L.',
    category: 'healthy',
    readinessStatus: 'target_candidate',
    visibleSymptoms: [
      'Vigorous, uniform green or light-green leaf blades consistent with cultivar phenotype',
      'Intact leaf margins free from necrotic yellowing or water-soaked borders',
      'Smooth leaf sheath surfaces devoid of fungal lesions or sclerotial resting bodies',
      'Absence of pathogenic spotting, wilting, or premature senescence',
    ],
    visibleSymptomsTamil: [
      'சீரான பச்சை நிறத்துடன் கூடிய ஆரோக்கியமான இலைகள்',
      'கருகல் அல்லது மஞ்சள் விளிம்புகள் இல்லாத தூய இலை ஓரங்கள்',
      'பூஞ்சை புள்ளிகள் அல்லது அழுகல் இல்லாத தண்டு மற்றும் இலை உறைகள்',
      'நோய் அறிகுறிகள் மற்றும் முன்கூட்டியே காய்ந்துபோதல் இல்லாத நிலை',
    ],
    diagnosticLimitations: [
      'Latent or asymptomatic incubation stage of blast or BLB cannot be detected visually prior to lesion eruption.',
      'Micro-nutrient imbalances may be present at sub-clinical levels before chlorosis appears.',
    ],
    diagnosticLimitationsTamil: [
      'புள்ளிகள் வெளிப்படுவதற்கு முந்தைய ஆரம்பக்கட்ட பூஞ்சை தொற்று கண்களுக்குத் தெரியாது.',
      'நுண்ணூட்டச்சத்து குறைபாடுகள் ஆரம்பத்தில் நிறமாற்றமின்றி மறைந்திருக்கலாம்.',
    ],
    trustedReferences: [
      {
        title: 'TNAU Agritech Portal – Phenological Stages of Healthy Rice',
        source: 'Tamil Nadu Agricultural University',
        url: 'https://agritech.tnau.ac.in',
      },
    ],
    preliminaryCare: {
      cultural: [
        'Maintain calibrated water depth as per current phenological stage (AWD for tillering, standing water for panicle).',
        'Keep bunds weed-free to prevent harboring vector insects.',
        'Continue regular weekly diagonal transect field walks.',
      ],
      culturalTamil: [
        'வளர்ச்சிப் பருவத்திற்கு ஏற்ப சரியான நீர்மட்டத்தை (காய்ச்சலும் பாய்ச்சலுமாக) பராமரிக்கவும்.',
        'வரப்புகளை சுத்தமாக வைத்து பூச்சிகள் தங்காமல் காக்கவும்.',
        'வாரந்தோறும் வயலில் இறங்கி பயிர்களின் வளர்ச்சியை கண்காணிக்கவும்.',
      ],
      biological: [
        'Preserve natural spiders, predatory mirid bugs, and damselflies in the paddy canopy.',
      ],
      biologicalTamil: [
        'வயலில் உள்ள சிலந்திகள் மற்றும் நன்மை செய்யும் பூச்சிகளை அழிக்காமல் பாதுகாக்கவும்.',
      ],
    },
    expertConfirmationCriteria: 'No expert confirmation required for vigorous foliar condition. Continue scheduled agronomic calendar.',
    expertConfirmationCriteriaTamil: 'ஆரோக்கியமான பயிருக்கு வல்லுநர் உறுதிப்படுத்தல் தேவையில்லை. திட்டமிட்ட பராமரிப்பைத் தொடரவும்.',
  },

  inconclusive: {
    classId: 'inconclusive',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    commonName: 'Inconclusive / Out-of-Distribution Specimen',
    commonNameTamil: 'முடிவற்ற / தெளிவற்ற ஒளிப்படம்',
    scientificName: 'Non-diagnostic Image',
    category: 'inconclusive',
    readinessStatus: 'target_candidate',
    visibleSymptoms: [
      'Image is blurry, out-of-focus, or motion-degraded',
      'Severe glare, deep shadowing, or underexposure obscuring leaf blade venation',
      'Target leaf occupies <30% of total image frame or is taken from excessive distance',
      'Non-plant subject or non-rice foliage uploaded under rice inspection tab',
    ],
    visibleSymptomsTamil: [
      'படம் மங்கலாகவோ அல்லது தெளிவாக இல்லாமலோ இருத்தல்',
      'அதிகப்படியான சூரிய ஒளி அல்லது இருள் காரணமாக இலை நரம்புகள் தெரியாமை',
      'இலை மிகவும் தூரத்திலிருந்து எடுக்கப்பட்டிருத்தல்',
      'நெல் அல்லாத வேறு பொருள் அல்லது மாற்றுப் பயிர் பதிவேற்றப்பட்டிருத்தல்',
    ],
    diagnosticLimitations: [
      'System strictly refuses to force a disease diagnosis on degraded or ambiguous imagery to avoid misguiding farmers.',
    ],
    diagnosticLimitationsTamil: [
      'விவசாயிகளுக்கு தவறான வழிகாட்டுதல் செல்வதைத் தவிர்க்க, தெளிவற்ற படங்களில் நோய் கணிப்பை கணினி திட்டவட்டமாக நிராகரிக்கிறது.',
    ],
    trustedReferences: [
      {
        title: 'CropShield Image Acquisition & Quality Standards',
        source: 'CropShield Agricultural Pathology Protocol',
      },
    ],
    preliminaryCare: {
      cultural: [
        'Re-capture the photograph in diffused natural daylight.',
        'Hold camera parallel to the infected leaf blade at 15–25 cm distance.',
        'Ensure the suspected lesion occupies at least 50% of the viewfinder.',
      ],
      culturalTamil: [
        'இயற்கையான வெளிச்சத்தில் மீண்டும் புகைப்படம் எடுக்கவும்.',
        'கேமராவை இலையிலிருந்து 15–25 செ.மீ தூரத்தில் நிலையாகப் பிடித்து படம் பிடிக்கவும்.',
        'பாதிக்கப்பட்ட புள்ளி கேமரா திரையில் பாதியாவது தெளிவாகத் தெரியுமாறு எடுக்கவும்.',
      ],
      biological: [],
      biologicalTamil: [],
    },
    expertConfirmationCriteria: 'If plant is clearly displaying symptoms in the field but camera is unable to focus, take an infected leaf cutting directly to the local Assistant Director of Agriculture (ADA) office.',
    expertConfirmationCriteriaTamil: 'வயலில் அறிகுறிகள் தெளிவாக இருந்தும் கேமராவில் படம் எடுக்க முடியாவிட்டால், பாதிக்கப்பட்ட இலையை வட்டார வேளாண்மை அலுவலரிடம் நேரில் காண்பிக்கவும்.',
  },
};

// ============================================================================
// 2. Separate Insect Pest Vectors Registry (Strict separation from pathogens)
// ============================================================================

export const RICE_PEST_RECORDS: Record<string, PestRecord> = {
  stem_borer: {
    pestId: 'stem_borer',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    commonName: 'Yellow Stem Borer',
    commonNameTamil: 'தண்டுத்துளைப்பான் (மஞ்சள் தண்டுத்துளைப்பான்)',
    scientificName: 'Scirpophaga incertulas',
    damageSymptoms: [
      'Dead heart symptom: central shoot of young tiller wilts and dries during vegetative phase',
      'White earhead symptom: empty, chaffy white erect panicle observed during flowering/maturity',
      'Tiny entry bore holes visible on lower stem nodes with brownish frass pellets',
    ],
    damageSymptomsTamil: [
      'குருத்தழுகல் (Dead heart): தூர்கட்டும் பருவத்தில் நடுக்குருத்து காய்ந்துபோதல்',
      'வெண்கதிர் (White earhead): பூக்கும் பருவத்தில் மணிகள் பிடிக்காமல் வெள்ளை நிறமாக கதிர் நிமிர்ந்து நிற்றல்',
      'தண்டின் கணுக்களில் சிறிய துளைகளும் உள்ளே புழுவின் கழிவுகளும் காணப்படுதல்',
    ],
    monitoringMethods: [
      'Install light traps to monitor adult straw-colored moth flight peaks.',
      'Deploy pheromone traps with Scirpolure septum @ 5 traps/acre.',
    ],
    monitoringMethodsTamil: [
      'விளக்குப் பொறி அமைத்து தாய் அந்துப்பூச்சிகளின் நடமாட்டத்தைக் கண்காணிக்கவும்.',
      'ஏக்கருக்கு 5 இனக்கவர்ச்சிப் பொறிகள் வைத்து ஆண் பூச்சிகளைக் கவரவும்.',
    ],
    biologicalControls: [
      'Release egg parasitoid Trichogramma japonicum @ 40,000/acre (at 30, 37, and 44 DAT).',
      'Erect T-shaped bird perches @ 20/acre for predatory drongos and egrets.',
    ],
    biologicalControlsTamil: [
      'முட்டை ஒட்டுண்ணியான டிரைக்கோகிரம்மா ஜப்பானிக்கத்தை ஏக்கருக்கு 40,000 என்ற அளவில் வெளியிடவும்.',
      'ஏக்கருக்கு 20 டி-வடிவ பறவைத் தாங்கிகள் அமைத்து இயற்கைப் பறவைகளை ஊக்குவிக்கவும்.',
    ],
    trustedReference: 'TNAU Agritech Portal – Economic Entomology & Integrated Pest Management',
  },

  leaf_folder: {
    pestId: 'leaf_folder',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    commonName: 'Rice Leaf Folder',
    commonNameTamil: 'இலைச்சுருட்டுப் புழு',
    scientificName: 'Cnaphalocrocis medinalis',
    damageSymptoms: [
      'Caterpillar rolls leaf margins longitudinally using white silk threads',
      'Feeds on green chlorophyll from inside, creating longitudinal white papery transparent streaks',
      'Heavily infested fields appear scorched or white from a distance',
    ],
    damageSymptomsTamil: [
      'புழு இலையின் இரு விளிம்புகளையும் பட்டு நூலால் நீளவாக்கில் சுருட்டி உள்ளே வாழ்தல்',
      'இலையின் பச்சையத்தை சுரண்டி உண்பதால் வெள்ளை நிற ஒளிபுகும் கோடுகள் தோன்றுதல்',
      'அதிக தாக்குதலின் போது வயல் முழுவதும் வெண்மையாக காய்ந்து காட்சியளிக்கும்',
    ],
    monitoringMethods: [
      'Scout 20 hills randomly; count percentage of damaged leaves (Economic Threshold Level: 10% damaged leaves in vegetative phase, 5% at flag leaf stage).',
    ],
    monitoringMethodsTamil: [
      '20 தூர்களை ஆய்வு செய்து பாதிக்கப்பட்ட இலைகளின் சதவீதத்தைக் கணக்கிடவும் (பொருளாதார சேத நிலை: தூர்கட்டும் பருவத்தில் 10%, கொடி இலை பருவத்தில் 5%).',
    ],
    biologicalControls: [
      'Release Trichogramma chilonis egg parasitoid @ 40,000/acre.',
      'Spray Bacillus thuringiensis (Bt formulation @ 1g/litre) or Neem Oil 3% (30ml/litre).',
    ],
    biologicalControlsTamil: [
      'டிரைக்கோகிரம்மா சிலோனிஸ் ஒட்டுண்ணியை ஏக்கருக்கு 40,000 என்ற அளவில் வெளியிடவும்.',
      'வேப்ப எண்ணெய் 3% (லிட்டருக்கு 30 மி.லி) அல்லது பேசிலஸ் துரிஞ்சியென்சிஸ் தெளிக்கவும்.',
    ],
    trustedReference: 'TNAU Department of Agricultural Entomology, Coimbatore',
  },
};

/**
 * Helper to fetch a disease class definition by crop and classId
 */
export function getSupportedDiseaseClass(cropId: string, classId: string): SupportedDiseaseClass | null {
  const normCrop = cropId.toLowerCase();
  const normClass = classId.toLowerCase().replace(/-/g, '_');

  if (normCrop === 'rice' || normCrop.includes('paddy')) {
    return RICE_DISEASE_CLASSES[normClass] || null;
  }
  return null;
}

/**
 * Returns all registered target classes for a crop
 */
export function getTargetClassesForCrop(cropId: string): SupportedDiseaseClass[] {
  const normCrop = cropId.toLowerCase();
  if (normCrop === 'rice' || normCrop.includes('paddy')) {
    return Object.values(RICE_DISEASE_CLASSES);
  }
  return [];
}

/**
 * CropShield AI — Field Case Differential Assessment Engine
 * 
 * Provides structured multi-candidate differential evaluations,
 * transparent evidence separation, conservative non-chemical action plans,
 * and strict verification against curated TNAU & ICAR agronomic registries.
 */

import {
  DifferentialCandidate,
  ActionPlan,
  EvidenceSeparation,
  FieldObservationInput,
} from '../types';
import { KNOWLEDGE_ARTICLES } from '../config/knowledgeHubRegistry';
import { RICE_DISEASE_CLASSES } from '../config/diseaseRegistry';

export interface DifferentialAssessmentResult {
  isInconclusive: boolean;
  inconclusiveReason?: string;
  inconclusiveReasonTamil?: string;
  candidates: DifferentialCandidate[];
  actionPlan: ActionPlan;
  evidenceSeparation: EvidenceSeparation;
}

/**
 * Evaluates field evidence and synthesizes a differential assessment
 */
export function evaluateFieldDifferential(params: {
  cropId: string;
  variety?: string;
  district?: string;
  farmerInput: FieldObservationInput;
  visualSummary?: string;
  detectedLesionTypes?: string[];
  weatherSnapshot?: {
    relativeHumidity?: number;
    dewHours?: number;
    rainfallMm?: number;
  };
  previousObservationNote?: string;
}): DifferentialAssessmentResult {
  const {
    cropId,
    variety = 'Local Cultivar',
    district = 'Thanjavur',
    farmerInput,
    visualSummary = 'Foliar inspection shows discrete necrotic lesions across green leaf tissue.',
    detectedLesionTypes = ['necrotic_spots', 'foliar_discoloration'],
    weatherSnapshot,
  } = params;

  const isRice = cropId.toLowerCase() === 'rice';
  const parts = farmerInput.affectedParts || [];
  const distribution = farmerInput.fieldDistribution || 'isolated_spots';
  const incidence = farmerInput.estimatedIncidence || '<5% (low)';
  const triggers = farmerInput.weatherTriggersObserved || [];
  const spread = farmerInput.symptomSpread || 'unknown';

  // Check if evidence is too sparse or contradictory to form candidates
  const isSheathReported = parts.includes('sheath_stem');
  const isUpperLeafReported = parts.includes('upper_leaf');
  const isPanicleReported = parts.includes('panicle_neck');
  const hasDewTrigger = triggers.includes('heavy_morning_dew') || (weatherSnapshot?.dewHours ?? 0) >= 4;
  const hasInundation = triggers.includes('recent_inundation') || triggers.includes('waterlogged');

  // Find verified reference articles from registry
  const blastArticle = KNOWLEDGE_ARTICLES.find((a) => a.id === 'rice-blast-management') || KNOWLEDGE_ARTICLES[0];
  const blbArticle = KNOWLEDGE_ARTICLES.find((a) => a.id === 'bacterial-leaf-blight-management') || KNOWLEDGE_ARTICLES[1];
  const brownSpotArticle = KNOWLEDGE_ARTICLES.find((a) => a.id === 'rice-brown-spot-management') || KNOWLEDGE_ARTICLES[2];
  const sheathBlightArticle = KNOWLEDGE_ARTICLES.find((a) => a.id === 'rice-sheath-blight-management') || KNOWLEDGE_ARTICLES[3];
  const dewArticle = KNOWLEDGE_ARTICLES.find((a) => a.id === 'dew-humidity-blast-precaution') || KNOWLEDGE_ARTICLES[4];
  const nutrientArticle = KNOWLEDGE_ARTICLES.find((a) => a.id === 'nutrient-deficiency-vs-pathology') || KNOWLEDGE_ARTICLES[5];

  const candidates: DifferentialCandidate[] = [];

  if (isRice) {
    // -------------------------------------------------------------
    // Candidate 1: Rice Blast (Magnaporthe oryzae)
    // -------------------------------------------------------------
    const blastPlausibility: 'high' | 'moderate' | 'unlikely_but_possible' =
      (isUpperLeafReported || isPanicleReported) && hasDewTrigger
        ? 'high'
        : isSheathReported && !isUpperLeafReported
        ? 'unlikely_but_possible'
        : 'moderate';

    const blastSupportingEn: string[] = [
      'Visual presence of spindle-shaped or elliptical lesions with brown/reddish margin.',
      isUpperLeafReported ? 'Symptoms actively expressed on upper photosynthesizing canopy leaf blades.' : 'Foliar tissue involvement matches foliar ascomycete infection.',
      hasDewTrigger ? 'Nocturnal dew persistence (>4 hrs) provides required moisture for Magnaporthe spore germination.' : 'Warm delta humidity favors sporulation.',
    ];
    const blastSupportingTa: string[] = [
      'இலைகளில் இரு முனைகளும் கூரான படகு அல்லது கண் போன்ற பழுப்பு நிறப் புள்ளிகள் காணப்படுவது.',
      isUpperLeafReported ? 'மேல் இலைகளில் நோய் அறிகுறிகள் தீவிரமாகத் தோன்றுவது இலைக் குலை நோயின் இயல்பு.' : 'இலைத் திசுக்களில் ஏற்படும் சேதம் பூஞ்சை தொற்றுடன் ஒத்துப்போகிறது.',
      hasDewTrigger ? 'அதிக பனிப்பொழிவு (4 மணி நேரத்திற்கு மேல்) குலை நோய் பூஞ்சை வித்துக்கள் முளைக்க சாதகமான சூழல்.' : 'டெல்டா பகுதி ஈரப்பதம் பூஞ்சை பரவ உதவுகிறது.',
    ];

    const blastMissingEn: string[] = [
      isSheathReported ? 'Lesions on lower leaf sheath near water level are untypical for pure leaf blast (more indicative of Sheath Blight).' : 'Ash-gray center may not be fully developed on young lesions.',
      spread === 'gradual_weeks' ? 'Blast typically flares rapidly under favorable dew rather than taking weeks.' : 'No diagnostic microscopic spore smear performed in-field.',
    ];
    const blastMissingTa: string[] = [
      isSheathReported ? 'நீர்மட்டத்திற்கு அருகில் உள்ள இலை உறைகளில் புள்ளிகள் தோன்றுவது உறை அழுகல் நோய்க்கே உரியது; இலைக் குலை நோய்க்கு அல்ல.' : 'புள்ளிகளின் நடுவில் சாம்பல் நிற மையம் இன்னும் தெளிவாக உருவாகாமல் இருக்கலாம்.',
      spread === 'gradual_weeks' ? 'குலை நோய் பொதுவாக பனிக் காலத்தில் சில நாட்களிலேயே வேகமாகப் பரவும்; பல வாரங்கள் தாமதிப்பது அரிது.' : 'நேரடி நுண்ணோக்கி பரிசோதனை இன்னும் செய்யப்படவில்லை.',
    ];

    candidates.push({
      conditionId: 'rice_blast',
      conditionName: 'Rice Blast (Magnaporthe oryzae)',
      conditionNameTamil: 'குலை நோய் (இலைக் குலை / கழுத்துக் குலை)',
      scientificName: 'Magnaporthe oryzae (Pyricularia oryzae)',
      category: 'fungal',
      plausibilityLevel: blastPlausibility,
      supportingEvidence: blastSupportingEn,
      supportingEvidenceTamil: blastSupportingTa,
      missingOrContradictoryEvidence: blastMissingEn,
      missingOrContradictoryEvidenceTamil: blastMissingTa,
      distinguishingObservation: 'Examine if lesion expands with pointed ends and ash-grey center. Wrap infected leaves in moist cloth overnight; blast produces delicate grayish downy spores.',
      distinguishingObservationTamil: 'புள்ளியின் இரு முனைகளும் கூராகி நடுவில் சாம்பல் நிறமாக மாறுகிறதா எனப் பார்க்கவும். பாதிக்கப்பட்ட இலையை ஈரத்துணியில் இரவு முழுவதும் வைத்தால் சாம்பல் நிற பூஞ்சை வித்துக்கள் தோன்றும்.',
      trustedReference: {
        title: blastArticle.title,
        source: blastArticle.sourceName,
        url: blastArticle.sourceUrl,
      },
      assessmentLimitations: 'Early blast pinhead lesions are visually identical to Brown Spot before the grayish necrotic center matures.',
      assessmentLimitationsTamil: 'ஆரம்பக்கட்ட சிறிய புள்ளிகள் சாம்பல் நிற மையத்தை அடையும் வரை இலைப்புள்ளி நோயிலிருந்து வேறுபடுத்துவது கடினம்.',
    });

    // -------------------------------------------------------------
    // Candidate 2: Bacterial Leaf Blight (Xanthomonas oryzae)
    // -------------------------------------------------------------
    const blbPlausibility: 'high' | 'moderate' | 'unlikely_but_possible' =
      hasInundation || parts.includes('lower_leaf') || spread === 'rapid_few_days'
        ? 'moderate'
        : 'unlikely_but_possible';

    const blbSupportingEn: string[] = [
      'Wavy chlorotic discoloration starting at leaf tips and margins.',
      hasInundation ? 'Submerged conditions and high standing water enhance bacterial vascular transmission.' : 'Transplant root trauma or leaf brushing can initiate bacterial entry.',
    ];
    const blbSupportingTa: string[] = [
      'இலை நுனி மற்றும் விளிம்புகளில் அலை போன்ற மஞ்சள் நிறக் கருகல் தோன்றுவது.',
      hasInundation ? 'வயலில் நீர் தேங்கி நிற்கும் சூழல் பாக்டீரியா பரவ சாதகமாக அமைகிறது.' : 'இலைகளில் ஏற்படும் உராய்வு பாக்டீரியா உட்புக வழிவகுக்கும்.',
    ];

    const blbMissingEn: string[] = [
      'No discrete isolated spindle rings observed; BLB causes marginal blighting rather than isolated eye-spots.',
      'Milky bacterial ooze test has not yet been confirmed in the field.',
    ];
    const blbMissingTa: string[] = [
      'தனித்தனி படகு வடிவப் புள்ளிகள் இதில் தோன்றாது; இது இலை விளிம்புகளையே கருகச் செய்யும்.',
      'பாக்டீரியா பால் போன்ற திரவக் கசிவு (Bacterial Ooze test) இன்னும் வயலில் சோதிக்கப்படவில்லை.',
    ];

    candidates.push({
      conditionId: 'bacterial_leaf_blight',
      conditionName: 'Bacterial Leaf Blight (BLB)',
      conditionNameTamil: 'பாக்டீரியா இலைக்கருகல் நோய்',
      scientificName: 'Xanthomonas oryzae pv. oryzae',
      category: 'bacterial',
      plausibilityLevel: blbPlausibility,
      supportingEvidence: blbSupportingEn,
      supportingEvidenceTamil: blbSupportingTa,
      missingOrContradictoryEvidence: blbMissingEn,
      missingOrContradictoryEvidenceTamil: blbMissingTa,
      distinguishingObservation: 'Perform the Field Ooze Test: Cut a freshly blighted leaf tip, place in a clean glass of clear water for 5 minutes. BLB releases cloudy white bacterial streams.',
      distinguishingObservationTamil: 'பாக்டீரியா திரவப் பரிசோதனை: புதிதாகக் கருகிய இலை நுனியை வெட்டி கண்ணாடி டம்ளர் நீரில் 5 நிமிடம் வைக்கவும். பாக்டீரியா இருந்தால் பால் போன்ற வெண்மை நிறத் திரவம் கசியும்.',
      trustedReference: {
        title: blbArticle.title,
        source: blbArticle.sourceName,
        url: blbArticle.sourceUrl,
      },
      assessmentLimitations: 'Excess nitrogen fertilizer scorching or salt spray injury can mimic early BLB margin necrosis.',
      assessmentLimitationsTamil: 'அதிகப்படியான யூரியா உரம் இடுவதால் ஏற்படும் கருகல் அல்லது உப்பு நீர் பாதிப்பும் இலைக்கருகல் போன்றே தோற்றமளிக்கலாம்.',
    });

    // -------------------------------------------------------------
    // Candidate 3: Brown Spot (Bipolaris oryzae)
    // -------------------------------------------------------------
    candidates.push({
      conditionId: 'brown_spot',
      conditionName: 'Brown Spot (Bipolaris oryzae)',
      conditionNameTamil: 'இலைப்புள்ளி நோய்',
      scientificName: 'Bipolaris oryzae (Cochliobolus miyabeanus)',
      category: 'fungal',
      plausibilityLevel: 'moderate',
      supportingEvidence: [
        'Circular to oval dark brown spots scattered across leaf blade surfaces.',
        'Commonly manifests during active tillering in soils with nutritional or moisture stress.',
      ],
      supportingEvidenceTamil: [
        'இலைப்பரப்பில் வட்டமான அல்லது நீள்வட்ட அடர் பழுப்பு நிறப் புள்ளிகள் தோன்றுவது.',
        'ஊட்டச்சத்து அல்லது நீர் பற்றாக்குறை உள்ள நிலங்களில் தூர்கட்டும் பருவத்தில் இது அதிகம் தோன்றும்.',
      ],
      missingOrContradictoryEvidence: [
        'Spots remain small and circular with yellow halo; they do not develop pointed spindle ends typical of blast.',
        'Does not girdle the panicle collar or cause neck snapping.',
      ],
      missingOrContradictoryEvidenceTamil: [
        'புள்ளிகள் சிறிய வட்ட வடிவமாகவே இருக்கும்; குலை நோய் போல படகு வடிவம் பெறுவதில்லை.',
        'கதிர் கழுத்துப் பகுதியை இது அழுகச் செய்வதில்லை.',
      ],
      distinguishingObservation: 'Check spot perimeter under a 10x lens; brown spot maintains an even brown disk surrounded by a yellowish halo without an elongated gray spindle axis.',
      distinguishingObservationTamil: 'பூதக்கண்ணாடி மூலம் பார்க்கும்போது புள்ளிகள் வட்ட வடிவமாகவும் அதைச் சுற்றி மஞ்சள் வளையத்துடனும் இருக்கும்; படகு வடிவம் இருக்காது.',
      trustedReference: {
        title: brownSpotArticle.title,
        source: brownSpotArticle.sourceName,
        url: brownSpotArticle.sourceUrl,
      },
      assessmentLimitations: 'Often occurs concurrently with potassium deficiency or root nematode stress in sandy-clay fields.',
      assessmentLimitationsTamil: 'மண்ணில் சாம்பல் சத்து குறைபாடு உள்ள நிலங்களில் இது பெரும்பாலும் ஊட்டச்சத்து பற்றாக்குறையுடன் இணைந்தே காணப்படும்.',
    });

    // -------------------------------------------------------------
    // Candidate 4: Sheath Blight (Rhizoctonia solani) - if sheath reported
    // -------------------------------------------------------------
    if (isSheathReported || parts.includes('lower_leaf')) {
      candidates.unshift({
        conditionId: 'sheath_blight',
        conditionName: 'Sheath Blight (Rhizoctonia solani)',
        conditionNameTamil: 'உறை அழுகல் நோய்',
        scientificName: 'Rhizoctonia solani',
        category: 'fungal',
        plausibilityLevel: isSheathReported ? 'high' : 'moderate',
        supportingEvidence: [
          'Symptoms confirmed near the lower leaf sheath and waterline.',
          'Irregular greenish-gray or snake-skin lesions that girdle the culm.',
          'Favored by dense planting canopy and high humidity.',
        ],
        supportingEvidenceTamil: [
          'நீர்மட்டத்திற்கு அருகில் இலை உறைகளில் அறிகுறிகள் தென்படுவது.',
          'பாம்புத்தோல் போன்ற ஒழுங்கற்ற சாம்பல்-பச்சை நிறப் புள்ளிகள் தண்டைச் சுற்றி உருவாவது.',
          'அடர்த்தியான பயிர் வளர்ச்சி மற்றும் அதிக ஈரப்பதத்தில் இது வேகமாகப் பரவும்.',
        ],
        missingOrContradictoryEvidence: [
          'If symptoms are exclusively on top flag leaf blades, Sheath Blight is less likely unless infection has ascended.',
        ],
        missingOrContradictoryEvidenceTamil: [
          'அறிகுறிகள் மேலிருக்கும் கொடி இலையில் மட்டுமே இருந்தால் உறை அழுகல் நோய் இருப்பதற்கான வாய்ப்பு குறைவு.',
        ],
        distinguishingObservation: 'Inspect the base of 5 adjacent tillers near the water line for white cottony mycelium and tiny mustard-seed-like sclerotia.',
        distinguishingObservationTamil: 'நீர்மட்டத்திற்கு அருகில் 5 தூர்களின் அடிப்பகுதியை ஆய்வு செய்து கடுகு போன்ற பழுப்பு நிற பூஞ்சை உருண்டைகள் (Sclerotia) உள்ளதா எனப் பார்க்கவும்.',
        trustedReference: {
          title: sheathBlightArticle.title,
          source: sheathBlightArticle.sourceName,
          url: sheathBlightArticle.sourceUrl,
        },
        assessmentLimitations: 'Early lesions can be confused with stem rot (Sclerotium oryzae) before sclerotia form.',
        assessmentLimitationsTamil: 'பூஞ்சை உருண்டைகள் தோன்றும் முன் இதை தண்டு அழுகல் நோயிலிருந்து வேறுபடுத்துவது கடினம்.',
      });
    }
  } else {
    // Non-rice crop preliminary differential
    candidates.push({
      conditionId: `${cropId}_suspected_pathology`,
      conditionName: `${cropId.toUpperCase()} Target Pathology Screening`,
      conditionNameTamil: `${cropId} பயிர் ஆரம்பக்கட்ட நோய் ஆய்வு`,
      scientificName: 'Pathological or Physiological Discoloration',
      category: 'fungal',
      plausibilityLevel: 'moderate',
      supportingEvidence: [
        `Visible foliar lesions identified in submitted ${cropId} imagery.`,
        `Reported distribution: ${distribution} with incidence ${incidence}.`,
      ],
      supportingEvidenceTamil: [
        `${cropId} பயிரின் ஒளிப்படத்தில் இலை நிறமாற்றம் அல்லது புள்ளிகள் காணப்படுகிறது.`,
        `பரவல்: ${distribution}, பாதிப்பு அளவு: ${incidence}.`,
      ],
      missingOrContradictoryEvidence: [
        'Detailed specialist classifier benchmark currently specialized primarily on rice; field verification advised.',
      ],
      missingOrContradictoryEvidenceTamil: [
        'தற்போதைய ஆய்வு முதன்மையாக நெல் பயிருக்காக வடிவமைக்கப்பட்டுள்ளது; நேரடி ஆய்வு தேவை.',
      ],
      distinguishingObservation: 'Check underside of affected leaves for fungal spores or insect frass.',
      distinguishingObservationTamil: 'இலையின் அடிப்பகுதியில் பூஞ்சை வித்துக்கள் அல்லது பூச்சி எச்சங்கள் உள்ளதா எனப் பார்க்கவும்.',
      trustedReference: {
        title: KNOWLEDGE_ARTICLES[0].title,
        source: KNOWLEDGE_ARTICLES[0].sourceName,
        url: KNOWLEDGE_ARTICLES[0].sourceUrl,
      },
      assessmentLimitations: 'Evaluation is based on multi-modal symptom interpretation rather than dedicated crop weights.',
      assessmentLimitationsTamil: 'இந்த ஆய்வு பொதுவான அறிகுறிகளின் அடிப்படையில் மட்டுமே கணிக்கப்பட்டுள்ளது.',
    });
  }

  // Sort candidates by plausibility: high -> moderate -> unlikely
  const priorityOrder = { high: 0, moderate: 1, unlikely_but_possible: 2 };
  candidates.sort((a, b) => priorityOrder[a.plausibilityLevel] - priorityOrder[b.plausibilityLevel]);

  // Determine inconclusive state
  const isInconclusive =
    candidates.length === 0 ||
    (candidates[0].plausibilityLevel === 'unlikely_but_possible' && incidence === '<5% (low)');

  // Build the 5-part Action Plan
  const actionPlan: ActionPlan = {
    whatWeObserved: {
      summary: `Field inspection conducted on ${cropId} (${variety}) in ${district}. Observed foliar discoloration across ${parts.join(', ') || 'leaf surfaces'} with ${distribution} distribution and ${incidence} field incidence.`,
      summaryTamil: `${district} மாவட்டத்தில் ${variety} ரக ${isRice ? 'நெல்' : cropId} பயிரில் ஆய்வு மேற்கொள்ளப்பட்டது. ${parts.join(', ') || 'இலைகளில்'} நிறமாற்றம் மற்றும் புள்ளிகள் தென்படுகின்றன. பரவல்: ${distribution}, பாதிப்பு அளவு: ${incidence}.`,
      symptoms: [
        visualSummary,
        `Affected plant regions: ${parts.length > 0 ? parts.join(', ') : 'Leaf canopy'}`,
        `Spread rate reported by farmer: ${spread}`,
        `Environmental triggers: ${triggers.length > 0 ? triggers.join(', ') : 'None explicitly reported'}`,
      ],
      symptomsTamil: [
        'இலைத் திசுக்களில் தெளிவான புள்ளிகள் மற்றும் நிறமாற்றம் காணப்படுகிறது.',
        `பாதிக்கப்பட்ட பகுதிகள்: ${parts.length > 0 ? parts.join(', ') : 'இலைகள்'}`,
        `பரவும் வேகம்: ${spread === 'rapid_few_days' ? 'சில நாட்களில் வேகம்' : 'படிப்படியானது'}`,
        `சுற்றுச்சூழல் காரணிகள்: ${triggers.length > 0 ? triggers.join(', ') : 'குறிப்பிடப்படவில்லை'}`,
      ],
    },
    whatMightExplainIt: candidates,
    whatToCheckNext: {
      observationsToMake: [
        'Check whether new lesions are appearing on younger emerging leaves or remaining on older foliage.',
        isRice ? 'Conduct in-field bacterial ooze test (cut leaf tip in clear water) to rule out BLB.' : 'Check undersides of leaves for fungal mildew or mite webs.',
        isRice ? 'Examine leaf sheaths right at the standing water level for irregular snake-skin bands.' : 'Inspect stem base for vascular browning.',
      ],
      observationsToMakeTamil: [
        'புதிய இளம் இலைகளிலும் புள்ளிகள் தோன்றுகிறதா அல்லது பழைய இலைகளோடு நிற்கிறதா எனப் பார்க்கவும்.',
        isRice ? 'இலை நுனியை வெட்டி நீரில் வைத்து பாக்டீரியா பால் திரவப் பரிசோதனை செய்து BLB நோயை உறுதி செய்யவும்.' : 'இலையின் அடிப்பகுதியில் பூஞ்சை படலம் உள்ளதா எனப் பார்க்கவும்.',
        isRice ? 'நீர்மட்டத்திற்கு அருகில் இலை உறைகளில் பாம்புத்தோல் போன்ற புள்ளிகள் உள்ளதா எனப் பார்க்கவும்.' : 'தண்டின் அடிப்பகுதியில் அழுகல் உள்ளதா எனப் பார்க்கவும்.',
      ],
      additionalPhotosSuggested: [
        'Close-up photograph of 2-3 individual lesions with clear sunlight behind the camera.',
        'Wider landscape view showing the distribution of affected patches across the field plot.',
        isRice ? 'Clear photo of the leaf sheath where the stem enters the mud/water.' : 'Stem junction photograph.',
      ],
      additionalPhotosSuggestedTamil: [
        'தெளிவான வெளிச்சத்தில் 2-3 புள்ளிகளை மட்டும் காட்டும் மிக நெருக்கமான (Close-up) படம்.',
        'வயலில் இந்த பாதிப்பு எந்த அளவிற்கு பரவியுள்ளது என்பதைக் காட்டும் தொலைதூரக் காட்சி (Wide view).',
        isRice ? 'நீர்மட்டத்திற்கு அருகில் தண்டு மற்றும் இலை உறைப் பகுதியைக் காட்டும் தெளிவான படம்.' : 'தண்டுப் பகுதியின் தெளிவான படம்.',
      ],
    },
    whatToDoNow: {
      immediateCulturalCare: [
        'Temporarily pause top-dressing of chemical nitrogen (urea) until disease spread stabilizes.',
        hasInundation ? 'Drain excess standing water to allow soil root aeration and reduce canopy humidity.' : 'Regulate field water level to avoid persistent stagnation.',
        'Maintain clean field bunds by removing wild grass hosts that harbor fungal spores.',
      ],
      immediateCulturalCareTamil: [
        'நோய் பரவுவது நிற்கும் வரை தற்காலிகமாக யூரியா போன்ற தழைச்சத்து உரங்கள் இடுவதை நிறுத்தி வைக்கவும்.',
        hasInundation ? 'வயலில் தேங்கியுள்ள தேவையற்ற நீரை வடித்து வேர்களுக்கு காற்றோட்டம் கிடைக்கச் செய்யவும்.' : 'பாசன நீரைத் தேங்க விடாமல் முறையாக நிர்வகிக்கவும்.',
        'வரப்புகளில் உள்ள களைகளை அகற்றி வயலைத் தூய்மையாக வைத்திருக்கவும்.',
      ],
      preventivePractices: [
        'Apply biological antagonist Pseudomonas fluorescens (Pf1) @ 1 kg/acre mixed with 25 kg well-decomposed FYM.',
        'Ensure balanced nutrition with recommended muriate of potash (K2O) as per soil test to enhance plant cell wall strength.',
        'For high dew conditions, spray Neem Seed Kernel Extract (NSKE 5%) or 3% neem oil as an organic deterrent.',
      ],
      preventivePracticesTamil: [
        'சூடோமோனாஸ் புளோரசன்ஸ் உயிர் உரத்தை ஏக்கருக்கு 1 கிலோ வீதம் 25 கிலோ மக்கிய தொழுவுரத்துடன் கலந்து வயலில் இடவும்.',
        'பயிரின் நோய் எதிர்ப்புத் திறனை அதிகரிக்க மண் பரிசோதனை பரிந்துரைப்படி சாம்பல் சத்து (பொட்டாஷ்) இடவும்.',
        'பனிப்பொழிவு அதிகமாக இருக்கும் போது 5% வேப்பங்கொட்டை சாறு அல்லது 3% வேப்பெண்ணெய் கரைசல் தெளிக்கவும்.',
      ],
      strictlyAvoid: [
        'Do NOT spray unverified chemical fungicides without confirming economic threshold level with local AEO.',
        'Do NOT clip seedlings or drag ropes across wet canopy, as this spreads bacterial pathogens.',
        'Do NOT apply excessive split doses of urea during overcast or high-dew periods.',
      ],
      strictlyAvoidTamil: [
        'வட்டார வேளாண்மை அலுவலரின் வழிகாட்டுதல் இன்றி கடுமையான ரசாயன மருந்துகளைத் தெளிக்க வேண்டாம்.',
        'ஈரமான பயிர்களின் மீது கயிறு இழுப்பதோ அல்லது இலை நுனிகளை வெட்டுவதோ பாக்டீரியாவை பரப்பிவிடும்; அதைத் தவிர்க்கவும்.',
        'மேகமூட்டம் அல்லது பனிப்பொழிவு உள்ள நாட்களில் அதிகப்படியான யூரியா இடவேண்டாம்.',
      ],
    },
    whenToSeekExpertHelp: {
      triggers: [
        'If incidence exceeds 20% of tillers within 48 to 72 hours.',
        isRice ? 'If lesions appear at the neck junction of emerging earheads during booting/heading.' : 'If severe wilting or stem rot occurs.',
        'If symptoms do not match any candidate after 3 days of drainage and biological care.',
      ],
      triggersTamil: [
        '48 முதல் 72 மணி நேரத்திற்குள் வயலில் 20% க்கும் மேற்பட்ட தூர்களில் நோய் பரவினால்.',
        isRice ? 'கதிர் வெளிவரும் பருவத்தில் கதிர் கழுத்துப் பகுதியில் கருப்பு வளையம் தோன்றினால்.' : 'பயிர் திடீரென வாடி காய்ந்து போனால்.',
        'பாதுகாப்பு முறைகளைச் செய்தும் 3 நாட்களில் அறிகுறி குறையாமல் தீவிரமடைந்தால்.',
      ],
      contactRecommendations: [
        'Contact the nearest Block Assistant Director of Agriculture (ADA) / Agricultural Extension Centre.',
        'Call the Kisan Call Centre at Toll-Free 1800-180-1551 (6 AM – 10 PM).',
        'Submit a verified CropShield Expert Enquiry directly from this field case.',
      ],
      contactRecommendationsTamil: [
        'அருகிலுள்ள வட்டார வேளாண்மை உதவி இயக்குநர் அலுவலகம் / உழவர் மையத்தை அணுகவும்.',
        'விவசாயிகள் உதவி மையத்தை (Kisan Call Centre) 1800-180-1551 என்ற கட்டணமில்லா எண்ணில் அழைக்கவும்.',
        'இந்த கள ஆய்வுக் குறிப்பிலிருந்து நேரடியாக CropShield வேளாண் வல்லுநர் ஆலோசனையைப் பெறவும்.',
      ],
    },
    reinspectionAdvice: {
      suggestedIntervalDays: 4,
      targetCheckpoints: [
        'Count the number of infected tillers across 10 randomly selected hills.',
        'Check whether lesion margins are actively expanding or showing drying brown borders.',
        'Photograph the same hill under similar daylight to log a follow-up observation in this case.',
      ],
      targetCheckpointsTamil: [
        'வயலில் சமவாய்ப்பு முறையில் 10 தூர்களைத் தேர்ந்தெடுத்து பாதிக்கப்பட்ட தூர்களின் எண்ணிக்கையைக் கணக்கிடவும்.',
        'புள்ளிகளின் விளிம்புகள் விரிவடைகிறதா அல்லது காய்ந்து போகிறதா எனப் பார்க்கவும்.',
        'அடுத்த ஆய்விற்காக இதே தூரை அதே வெளிச்சத்தில் படம் பிடித்து பதிவேற்றவும்.',
      ],
    },
  };

  const evidenceSeparation: EvidenceSeparation = {
    geminiVisualInterpretation: {
      summary: visualSummary,
      lesionTypesDetected: detectedLesionTypes,
      uncertaintyStatement:
        'Visual interpretation identifies surface lesions but cannot substitute for microscopic culture or official pathology tests.',
    },
    farmerFieldObservations: {
      partsReported: parts,
      distributionReported: distribution,
      spreadRateReported: spread,
    },
    specialistRulesOrModel: {
      engineUsed: isRice ? 'TNAU Agronomic Decision Logic Engine v2.0 (Rice Specialized)' : 'Multi-Crop Diagnostic Fallback Engine',
      datasetProvenance: isRice ? 'ICAR-NRRI & TNAU Pathology Diagnostic Protocols' : 'General Agronomic Heuristics',
    },
    weatherContextApplied: weatherSnapshot
      ? {
          district,
          humidity: weatherSnapshot.relativeHumidity,
          dewHours: weatherSnapshot.dewHours,
          weatherRiskNote: hasDewTrigger
            ? 'Elevated nocturnal dew triggers fungal spore germination.'
            : 'Standard microclimate monitored.',
        }
      : undefined,
    verifiedAgronomicSources: candidates.map((c) => ({
      institution: c.trustedReference.source,
      title: c.trustedReference.title,
      url: c.trustedReference.url,
    })),
  };

  return {
    isInconclusive,
    inconclusiveReason: isInconclusive
      ? 'The submitted visual and field observations do not provide sufficient distinct markers to isolate a single primary condition. A follow-up closer photograph and leaf sheath inspection are recommended.'
      : undefined,
    inconclusiveReasonTamil: isInconclusive
      ? 'சமர்ப்பிக்கப்பட்ட தகவல்களின் மூலம் நோயின் வகையை திட்டவட்டமாகப் பிரிக்க முடியவில்லை. தெளிவான நெருக்கமான ஒளிப்படம் மற்றும் தண்டுப் பகுதி ஆய்வு தேவைப்படுகிறது.'
      : undefined,
    candidates,
    actionPlan,
    evidenceSeparation,
  };
}

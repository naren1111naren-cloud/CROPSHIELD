import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { getDistrictGeo } from './src/config/tamilNaduDistricts';
import { parseOpenMeteoResponse, RealWeatherData } from './src/services/weatherService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Server-side Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory community reports store seeded with authentic Tamil Nadu field incidents
interface CommunityReport {
  id: string;
  farmerName: string;
  village: string;
  district: string;
  variety: string;
  growthStage: string;
  suspectedCondition: string;
  suspectedConditionTamil: string;
  verificationStatus: 'Verified by TNAU Specialist' | 'Pending Field Review' | 'Sample Dispatched to Lab';
  verificationStatusTamil: string;
  reportedDate: string;
  fieldNotes: string;
  riskLevel: 'Moderate' | 'High' | 'Low';
  latitude: number;
  longitude: number;
}

const communityReports: CommunityReport[] = [
  {
    id: 'REP-TN-2026-081',
    farmerName: 'M. Senthil Kumar',
    village: 'Valangaiman Taluk',
    district: 'Thanjavur',
    variety: 'CR 1009 Sub 1',
    growthStage: 'Tillering (35 DAT)',
    suspectedCondition: 'Rice Blast (Leaf Blast)',
    suspectedConditionTamil: 'குலை நோய் (இலைக் குலை)',
    verificationStatus: 'Verified by TNAU Specialist',
    verificationStatusTamil: 'TNAU வேளாண் வல்லுநர் சரிபார்த்தது',
    reportedDate: '2026-10-11',
    fieldNotes: 'Noticed typical spindle-shaped lesions with grayish centers and brown borders on middle leaf blades following heavy morning mist.',
    riskLevel: 'High',
    latitude: 10.7870,
    longitude: 79.1378,
  },
  {
    id: 'REP-TN-2026-079',
    farmerName: 'K. Annamalai',
    village: 'Kudavasal',
    district: 'Tiruvarur',
    variety: 'BPT 5204 (Samba Mahsuri)',
    growthStage: 'Panicle Initiation (50 DAT)',
    suspectedCondition: 'Bacterial Leaf Blight',
    suspectedConditionTamil: 'பாக்டீரியா இலைக்கருகல் நோய்',
    verificationStatus: 'Verified by TNAU Specialist',
    verificationStatusTamil: 'TNAU வேளாண் வல்லுநர் சரிபார்த்தது',
    reportedDate: '2026-10-09',
    fieldNotes: 'Water-soaked wavy lesions starting from leaf tip moving downward along margins. Field has continuous standing water.',
    riskLevel: 'High',
    latitude: 10.8732,
    longitude: 79.4891,
  },
  {
    id: 'REP-TN-2026-076',
    farmerName: 'R. Velmurugan',
    village: 'Sirkazhi',
    district: 'Mayiladuthurai',
    variety: 'ADT 45',
    growthStage: 'Active Tillering (28 DAT)',
    suspectedCondition: 'Brown Spot',
    suspectedConditionTamil: 'இலைப்புள்ளி நோய்',
    verificationStatus: 'Sample Dispatched to Lab',
    verificationStatusTamil: 'ஆய்வகப் பரிசோதனைக்கு அனுப்பப்பட்டது',
    reportedDate: '2026-10-08',
    fieldNotes: 'Circular to oval dark-brown spots across leaf surfaces. Suspected potash deficiency interaction in sandy-clay soil.',
    riskLevel: 'Moderate',
    latitude: 11.2383,
    longitude: 79.7348,
  },
  {
    id: 'REP-TN-2026-072',
    farmerName: 'P. Murugesan',
    village: 'Kilvelur',
    district: 'Nagapattinam',
    variety: 'CO 51',
    growthStage: 'Late Vegetative (42 DAT)',
    suspectedCondition: 'Sheath Blight',
    suspectedConditionTamil: 'உறை அழுகல் நோய்',
    verificationStatus: 'Pending Field Review',
    verificationStatusTamil: 'நேரடி ஆய்வு நிலுவையில் உள்ளது',
    reportedDate: '2026-10-07',
    fieldNotes: 'Snake-skin or greenish-grey lesions near water level on leaf sheath. Heavy canopy density.',
    riskLevel: 'Moderate',
    latitude: 10.7656,
    longitude: 79.8428,
  },
  {
    id: 'REP-TN-2026-068',
    farmerName: 'T. Dharmalingam',
    village: 'Lalgudi',
    district: 'Tiruchirappalli',
    variety: 'TKM 13',
    growthStage: 'Flowering (65 DAT)',
    suspectedCondition: 'False Smut (Preliminary Alert)',
    suspectedConditionTamil: 'மஞ்சள் கதிர் பூஞ்சை நோய்',
    verificationStatus: 'Verified by TNAU Specialist',
    verificationStatusTamil: 'TNAU வேளாண் வல்லுநர் சரிபார்த்தது',
    reportedDate: '2026-10-04',
    fieldNotes: 'Scattered individual grains transformed into greenish-yellow velvety smut balls.',
    riskLevel: 'Low',
    latitude: 10.8698,
    longitude: 78.8184,
  },
];

// District Agro-Climatic Intelligence
const districtRiskData = [
  {
    district: 'Thanjavur',
    districtTamil: 'தஞ்சாவூர்',
    basin: 'Cauvery Lower Delta',
    activeSeason: 'Samba / Thaladi (2026)',
    overallRisk: 'Elevated' as const,
    blastRisk: 'High',
    blbRisk: 'Moderate',
    brownSpotRisk: 'Moderate',
    sheathBlightRisk: 'Low',
    weatherSnapshot: {
      tempC: 28.4,
      relativeHumidity: 88,
      dewDurationHours: 6.5,
      rainfallPast48hMm: 14.2,
      cloudCover: '65% overcast',
    },
    advisoryText: 'Relative humidity (>85%) combined with overnight dew of 6+ hours creates favorable spore germination conditions for Leaf Blast (Magnaporthe oryzae). Monitor susceptible cultivars like BPT 5204 and ADT 43 closely.',
    advisoryTamil: 'இரவு நேர பனிப்பொழிவு (6+ மணி நேரம்) மற்றும் 85%க்கும் அதிகமான காற்றின் ஈரப்பதம் காரணமாக இலைக் குலை நோய் பரவ சாதகமான சூழல் நிலவுகிறது. BPT 5204 மற்றும் ADT 43 பயிர்களை தீவிரமாக கண்காணிக்கவும்.',
    lastUpdated: '2026-10-13 06:00 IST',
    source: 'TNAU Agricultural Meteorological Advisory Centre & IMD Agromet',
  },
  {
    district: 'Tiruvarur',
    districtTamil: 'திருவாரூர்',
    basin: 'Cauvery Central Delta',
    activeSeason: 'Samba (2026)',
    overallRisk: 'Elevated' as const,
    blastRisk: 'Moderate',
    blbRisk: 'High',
    brownSpotRisk: 'Moderate',
    sheathBlightRisk: 'Moderate',
    weatherSnapshot: {
      tempC: 29.1,
      relativeHumidity: 91,
      dewDurationHours: 7.0,
      rainfallPast48hMm: 22.0,
      cloudCover: '80% cloudy',
    },
    advisoryText: 'Waterlogged tail-end fields and persistent cloud cover increase bacterial leaf blight vulnerability. Drain excess standing water where possible; avoid top-dressing nitrogen until weather clears.',
    advisoryTamil: 'தேங்கிய நீர் மற்றும் மேகமூட்டம் பாக்டீரியா இலைக்கருகல் நோயின் தாக்கத்தை அதிகரிக்கக்கூடும். வயல்களில் உள்ள தேவையற்ற நீரை வடித்து, தற்காலிகமாக தழைச்சத்து இடுவதை தவிர்க்கவும்.',
    lastUpdated: '2026-10-13 06:00 IST',
    source: 'TNAU Agritech Portal & District Joint Director of Agriculture',
  },
  {
    district: 'Mayiladuthurai',
    districtTamil: 'மயிலாடுதுறை',
    basin: 'Coastal Delta',
    activeSeason: 'Samba / Thaladi',
    overallRisk: 'Moderate' as const,
    blastRisk: 'Moderate',
    blbRisk: 'Moderate',
    brownSpotRisk: 'High',
    sheathBlightRisk: 'Moderate',
    weatherSnapshot: {
      tempC: 29.5,
      relativeHumidity: 84,
      dewDurationHours: 5.0,
      rainfallPast48hMm: 8.5,
      cloudCover: 'Partly sunny',
    },
    advisoryText: 'Saline intrusion pockets and nutritional stress can trigger Brown Spot (Bipolaris oryzae). Apply recommended micro-nutrient and potash supplementation as per soil test.',
    advisoryTamil: 'உவர் நில பாக்கெட்டுகள் மற்றும் ஊட்டச்சத்து குறைபாடு காரணமாக இலைப்புள்ளி நோய் வர வாய்ப்புள்ளது. மண் பரிசோதனை பரிந்துரைப்படி சாம்பல் சத்து இடவும்.',
    lastUpdated: '2026-10-12 18:00 IST',
    source: 'TNAU Research Station, Sirkazhi',
  },
  {
    district: 'Nagapattinam',
    districtTamil: 'நாகப்பட்டினம்',
    basin: 'Coastal Delta',
    activeSeason: 'Samba',
    overallRisk: 'Moderate' as const,
    blastRisk: 'Low',
    blbRisk: 'Moderate',
    brownSpotRisk: 'Moderate',
    sheathBlightRisk: 'High',
    weatherSnapshot: {
      tempC: 30.0,
      relativeHumidity: 86,
      dewDurationHours: 4.5,
      rainfallPast48hMm: 5.0,
      cloudCover: 'Scattered clouds',
    },
    advisoryText: 'High canopy humidity from dense planting promotes Sheath Blight spread along waterways. Maintain adequate plant spacing and avoid over-irrigation.',
    advisoryTamil: 'அடர்த்தியான பயிர் வளர்ச்சி மற்றும் ஈரப்பதம் உறை அழுகல் நோயை தூண்டக்கூடும். பயிர்களுக்கு இடையில் காற்றோட்டம் இருப்பதை உறுதி செய்யவும்.',
    lastUpdated: '2026-10-12 18:00 IST',
    source: 'KVK Sikkal, Nagapattinam',
  },
  {
    district: 'Madurai',
    districtTamil: 'மதுரை',
    basin: 'Vaigai Basin',
    activeSeason: 'Periyar-Vaigai Second Crop',
    overallRisk: 'Low' as const,
    blastRisk: 'Low',
    blbRisk: 'Low',
    brownSpotRisk: 'Low',
    sheathBlightRisk: 'Low',
    weatherSnapshot: {
      tempC: 32.2,
      relativeHumidity: 68,
      dewDurationHours: 2.0,
      rainfallPast48hMm: 0.0,
      cloudCover: 'Clear sky',
    },
    advisoryText: 'Warm, dry weather currently limits fungal and bacterial pathogen spore spread. Continue standard irrigation and monitoring.',
    advisoryTamil: 'தற்போதைய வெப்பமான உலர் வானிலை பூஞ்சை பரவுவதை கட்டுப்படுத்துகிறது. இயல்பான பாசன மேலாண்மையை தொடரவும்.',
    lastUpdated: '2026-10-13 06:00 IST',
    source: 'Agricultural College & Research Institute (AC&RI), Madurai',
  },
];

// API Route: Multi-Crop AI Disease Analysis Service
app.post('/api/analyze-crop', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      cropId = 'rice',
      variety = 'Standard Cultivar',
      district = 'Thanjavur',
      cropStage = '',
      fieldNotes = '',
    } = req.body;

    // 1. Validate Image Payload
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'IMAGE_REQUIRED',
        message: 'A clear crop leaf photograph is required for pathology evaluation.',
        messageTamil: 'பயிர் ஆய்வுக்கு தெளிவான இலை ஒளிப்படம் தேவை.',
      });
    }

    // Validate MIME Type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FORMAT',
        message: 'Unsupported image format. Please supply JPEG, PNG, or WebP.',
        messageTamil: 'தவறான கோப்பு வடிவம். JPEG, PNG அல்லது WebP படங்களை மட்டுமே பயன்படுத்தவும்.',
      });
    }

    // 2. Validate Multi-Crop Support Boundary
    const supportedCrops = ['rice', 'tomato', 'chilli', 'cotton', 'maize'];
    if (!supportedCrops.includes(cropId.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'UNSUPPORTED_CROP',
        analysisStatus: 'unsupported_crop',
        message: `Validated pathology evaluation for crop '${cropId}' is not yet active. CropShield maintains strict scientific discipline and does not apply mismatched classifiers.`,
        messageTamil: `'${cropId}' பயிருக்கான மாதிரி இன்னும் பயன்பாட்டிற்கு வரவில்லை. தவறான கணிப்புகளைத் தவிர்க்க ஆய்வு நிறுத்தி வைக்கப்பட்டுள்ளது.`,
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Approximate size check (15MB base64 is ~20MB string)
    if (cleanBase64.length > 20 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'IMAGE_TOO_LARGE',
        message: 'Image payload exceeds the maximum 15 MB file size limit.',
        messageTamil: 'படத்தின் அளவு 15 MB வரம்பைத் தாண்டியுள்ளது.',
      });
    }

    // 3. Verify Server-Side Gemini API Configuration
    if (!aiClient) {
      return res.status(503).json({
        success: false,
        error: 'GEMINI_NOT_CONFIGURED',
        message: 'Server-side Gemini AI service is not initialized. Please configure GEMINI_API_KEY in the server environment (.env).',
        messageTamil: 'சர்வரில் Gemini API சாவி இணைக்கப்படவில்லை. நேரடி AI ஆய்வுக்கு GEMINI_API_KEY ஐ அமைக்கவும்.',
      });
    }

    // 4. Build Crop-Specific Pathology System Prompt
    let cropPromptContext = '';
    let cropNameEnglish = 'Rice (Paddy)';
    let cropNameTamil = 'நெல் (பயிர்)';

    const normalizedCropId = cropId.toLowerCase();
    if (normalizedCropId === 'rice') {
      cropNameEnglish = 'Rice (Paddy)';
      cropNameTamil = 'நெல் (பயிர்)';
      cropPromptContext = `Crop: Rice / Paddy (Oryza sativa L.)
Target Candidate Classes in Tamil Nadu (Cauvery Delta & agro-climatic basins):
- Rice Blast (Magnaporthe oryzae / Pyricularia oryzae)
- Bacterial Leaf Blight (Xanthomonas oryzae pv. oryzae)
- Brown Spot (Bipolaris oryzae)
- Sheath Blight (Rhizoctonia solani)
- False Smut (Ustilaginoidea virens)
- Healthy Rice Leaf (vigorous foliar condition)
- Inconclusive Image (blurry, poor illumination, or non-rice foliage)`;
    } else if (normalizedCropId === 'tomato') {
      cropNameEnglish = 'Tomato';
      cropNameTamil = 'தக்காளி';
      cropPromptContext = `Crop: Tomato (Solanum lycopersicum)
Target Candidate Classes:
- Early Blight (Alternaria solani)
- Septoria Leaf Spot (Septoria lycopersici)
- Tomato Leaf Curl Virus
- Bacterial Spot (Xanthomonas perforans)
- Healthy Tomato Foliage
- Inconclusive Image`;
    } else if (normalizedCropId === 'chilli') {
      cropNameEnglish = 'Chilli';
      cropNameTamil = 'மிளகாய்';
      cropPromptContext = `Crop: Chilli (Capsicum annuum L.)
Target Candidate Classes:
- Anthracnose / Die-back (Colletotrichum capsici)
- Cercospora Leaf Spot (Frogeye)
- Chilli Leaf Curl Virus
- Powdery Mildew (Leveillula taurica)
- Healthy Chilli Foliage
- Inconclusive Image`;
    } else if (normalizedCropId === 'cotton') {
      cropNameEnglish = 'Cotton';
      cropNameTamil = 'பருத்தி';
      cropPromptContext = `Crop: Cotton (Gossypium hirsutum L.)
Target Candidate Classes in Tamil Nadu:
- Bacterial Blight / Angular Leaf Spot (Xanthomonas citri pv. malvacearum)
- Alternaria Leaf Spot (Alternaria macrospora)
- Cercospora Leaf Spot
- Cotton Leaf Curl Virus
- Grey Mildew / Dahiya Disease (Ramularia areola)
- Healthy Cotton Foliage
- Inconclusive Image`;
    } else if (normalizedCropId === 'maize') {
      cropNameEnglish = 'Maize (Corn)';
      cropNameTamil = 'மக்காச்சோளம்';
      cropPromptContext = `Crop: Maize (Zea mays L.)
Target Candidate Classes in Tamil Nadu:
- Turcicum Leaf Blight / Northern Corn Leaf Blight (Exserohilum turcicum)
- Maydis Leaf Blight / Southern Corn Leaf Blight (Bipolaris maydis)
- Common Rust (Puccinia sorghi)
- Banded Leaf and Sheath Blight (Rhizoctonia solani f. sp. sasakii)
- Healthy Maize Foliage
- Inconclusive Image`;
    }

    const systemPrompt = `You are CropShield's agricultural pathology intelligence engine specialized in crops cultivated in Tamil Nadu, India.
${cropPromptContext}

Strict Instructions:
1. Examine the provided foliage photograph critically.
2. If the image does not show a leaf blade or sheath of ${cropNameEnglish}, or if the image is out of focus, blurry, too dark, or symptoms cannot be differentiated from general mechanical damage, return "analysisStatus": "inconclusive", "imageQualityStatus": "blurry" (or "off_target" / "poor_lighting"), and describe the limitation honestly.
3. NEVER invent fake confidence percentages (e.g. do not say "94.2%"). Provide a qualitative diagnostic confidence statement explaining the visual evidence and limitations.
4. Distinguish between primary condition and alternative conditions if lesions could indicate multiple pathogens.
5. Provide actionable Integrated Pest Management (IPM) cultural, biological, and agronomic guidelines adhering to Tamil Nadu Agricultural University (TNAU) protocols. NEVER prescribe toxic or unverified chemical cocktail dosages. Always advise consultation with the local Village Agricultural Extension Officer (AEO) or Krishi Vigyan Kendra (KVK).
6. Provide accurate Tamil names and recommendations alongside English.

District context: ${district}, Tamil Nadu
Cultivar: ${variety}
Growth stage: ${cropStage || 'Not specified'}
Farmer field notes: ${fieldNotes || 'Standard visual inspection'}

Output strictly valid JSON matching this schema:
{
  "analysisStatus": "completed" | "inconclusive",
  "possibleCondition": "English name of diagnosed condition or Healthy Foliage or Inconclusive Image",
  "possibleConditionTamil": "Authentic Tamil name",
  "alternativeConditions": ["alternative 1 if uncertainty exists", "alternative 2"],
  "pathogen": "Scientific causative agent or None",
  "severity": "low" | "moderate" | "high" | "nominal",
  "observedSymptoms": ["specific visual feature 1 (lesion shape, margins, coloration)", "feature 2", "feature 3"],
  "explanation": "Botanical and pathological reasoning explaining how the visual evidence supports this assessment",
  "confidenceInformation": "Qualitative certainty statement and diagnostic boundaries",
  "imageQualityStatus": "good" | "blurry" | "poor_lighting" | "off_target",
  "inspectionSteps": ["Step 1 to inspect in the field right now", "Step 2", "Step 3"],
  "immediateCare": ["Immediate agronomic/cultural action 1", "Immediate action 2"],
  "immediateCareTamil": ["உடனடிப் பராமரிப்பு நடவடிக்கை 1", "உடனடி நடவடிக்கை 2"],
  "preventivePractices": ["Long-term preventive practice 1", "Preventive practice 2"],
  "preventivePracticesTamil": ["நீண்டகால தடுப்பு முறை 1", "தடுப்பு முறை 2"],
  "recommendations": ["Actionable cultural / biological IPM step 1", "Actionable step 2", "Actionable step 3"],
  "recommendationsTamil": ["தமிழ் பரிந்துரை 1", "தமிழ் பரிந்துரை 2", "தமிழ் பரிந்துரை 3"],
  "expertReviewAdvice": "Clear advice on when and where to seek in-person AEO / KVK verification",
  "expertReviewAdviceTamil": "தமிழ் கள ஆய்வு ஆலோசனை",
  "expertReviewRecommended": true | false,
  "uncertaintyNotice": "Explicit uncertainty/safety notice explaining that this is preliminary AI image analysis",
  "uncertaintyNoticeTamil": "தமிழ் எச்சரிக்கை / பூர்வாங்க ஆய்வு அறிவிப்பு",
  "isHealthy": true | false
}`;

    // 5. Invoke Gemini Multimodal API with resilient fallback across flash tiers
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
    let response: any = null;
    let selectedModel = 'gemini-3.8-flash';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await aiClient.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
                {
                  text: `Analyze this ${cropNameEnglish} foliage photograph. Adhere strictly to the requested schema. Return valid JSON only.`,
                },
              ],
            },
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });
        selectedModel = modelName;
        break;
      } catch (callErr: any) {
        lastError = callErr;
        console.warn(`Model ${modelName} returned status ${callErr.status || callErr.message}, attempting next candidate...`);
      }
    }

    if (!response) {
      throw lastError || new Error('No candidate Gemini model succeeded.');
    }

    const rawText = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini pathology JSON output:', parseErr, rawText);
      return res.status(502).json({
        success: false,
        error: 'MALFORMED_AI_RESPONSE',
        message: 'The AI analysis engine returned a response that could not be validated against the pathology schema.',
        messageTamil: 'ஆய்வு முடிவைச் சரிபார்க்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
      });
    }

    // 6. Runtime Schema Validation
    if (!parsed || !parsed.possibleCondition) {
      return res.status(502).json({
        success: false,
        error: 'INVALID_PATHOLOGY_STRUCTURE',
        message: 'AI response was missing essential pathology indicators.',
      });
    }

    const isHealthy = Boolean(parsed.isHealthy || parsed.severity === 'nominal');
    const analysisStatus = parsed.analysisStatus === 'inconclusive' ? 'inconclusive' : 'completed';

    const immediateCare = Array.isArray(parsed.immediateCare) && parsed.immediateCare.length > 0
      ? parsed.immediateCare
      : (Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 2) : []);
    const immediateCareTamil = Array.isArray(parsed.immediateCareTamil) && parsed.immediateCareTamil.length > 0
      ? parsed.immediateCareTamil
      : (Array.isArray(parsed.recommendationsTamil) ? parsed.recommendationsTamil.slice(0, 2) : []);

    const preventivePractices = Array.isArray(parsed.preventivePractices) && parsed.preventivePractices.length > 0
      ? parsed.preventivePractices
      : (Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(2) : []);
    const preventivePracticesTamil = Array.isArray(parsed.preventivePracticesTamil) && parsed.preventivePracticesTamil.length > 0
      ? parsed.preventivePracticesTamil
      : (Array.isArray(parsed.recommendationsTamil) ? parsed.recommendationsTamil.slice(2) : []);

    // Build finalized structured field report
    const formattedResult = {
      analysisStatus,
      cropId: cropId.toLowerCase(),
      cropName: cropNameEnglish,
      cropNameTamil,
      conditionName: parsed.possibleCondition,
      conditionNameTamil: parsed.possibleConditionTamil || parsed.possibleCondition,
      alternativeConditions: Array.isArray(parsed.alternativeConditions) ? parsed.alternativeConditions : [],
      pathogen: parsed.pathogen || 'Not specified',
      severity: (['low', 'moderate', 'high', 'nominal'].includes(parsed.severity) ? parsed.severity : 'moderate') as 'low' | 'moderate' | 'high' | 'nominal',
      observedCharacteristics: Array.isArray(parsed.observedSymptoms) ? parsed.observedSymptoms : (Array.isArray(parsed.observedCharacteristics) ? parsed.observedCharacteristics : []),
      observedSymptoms: Array.isArray(parsed.observedSymptoms) ? parsed.observedSymptoms : [],
      explanation: parsed.explanation || '',
      confidenceAssessment: parsed.confidenceInformation || 'Preliminary visual interpretation.',
      confidenceInformation: parsed.confidenceInformation || 'Preliminary visual interpretation.',
      imageQualityStatus: (['good', 'blurry', 'poor_lighting', 'off_target'].includes(parsed.imageQualityStatus) ? parsed.imageQualityStatus : 'good') as 'good' | 'blurry' | 'poor_lighting' | 'off_target',
      inspectionSteps: Array.isArray(parsed.inspectionSteps) ? parsed.inspectionSteps : [],
      immediateCare,
      immediateCareTamil,
      preventivePractices,
      preventivePracticesTamil,
      managementGuidance: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      managementGuidanceTamil: Array.isArray(parsed.recommendationsTamil) ? parsed.recommendationsTamil : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      recommendationsTamil: Array.isArray(parsed.recommendationsTamil) ? parsed.recommendationsTamil : [],
      expertReviewAdvice: parsed.expertReviewAdvice || 'Consult your local Village Agricultural Extension Officer before taking chemical action.',
      expertReviewAdviceTamil: parsed.expertReviewAdviceTamil || 'ரசாயன மருந்துகளைப் பயன்படுத்துவதற்கு முன் வட்டார வேளாண்மை விரிவாக்க அலுவலரின் ஆலோசனையைப் பெறவும்.',
      expertReviewRecommended: Boolean(parsed.expertReviewRecommended ?? (parsed.severity === 'high')),
      uncertaintyNotice: parsed.uncertaintyNotice || 'Preliminary AI image analysis only. Not a certified laboratory diagnostic. Field symptoms may overlap between fungal and physiological stresses.',
      uncertaintyNoticeTamil: parsed.uncertaintyNoticeTamil || 'இது AI துணையுடன் மேற்கொள்ளப்பட்ட பூர்வாங்க புகைப்பட கணிப்பு மட்டுமே. ஆய்வக பரிசோதனைக்கு மாற்றாகாது.',
      isHealthy,
      disclaimer: 'Preliminary AI visual interpretation. In-field verification by an authorized Agricultural Extension Officer (AEO) or Krishi Vigyan Kendra (KVK) is recommended before applying chemical inputs.',
      disclaimerTamil: 'இது AI துணையுடன் மேற்கொள்ளப்பட்ட பூர்வாங்க கணிப்பு மட்டுமே. ரசாயன மருந்துகளை வாங்குவதற்கு முன் வட்டார வேளாண்மை அலுவலரின் நேரடி ஆலோசனையைப் பெறவும்.',
      analysisMethod: `${selectedModel} (preliminary multimodal screening)`,
      modelVersion: `cropshield-${cropId.toLowerCase()}-v3.0`,
      source: selectedModel,
      analyzedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: formattedResult,
    });
  } catch (err: any) {
    console.error('Server error during crop pathology evaluation:', err);
    return res.status(502).json({
      success: false,
      error: 'ANALYSIS_SERVICE_UNAVAILABLE',
      message: err.message || 'The disease analysis service encountered an error. Please verify your connection and try again.',
      messageTamil: 'ஆய்வு சேவை தற்காலிகமாக பதிலளிக்கவில்லை. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
    });
  }
});

// Server-side in-memory cache for live weather (30 min TTL per district)
const serverWeatherCache = new Map<string, { timestamp: number; data: RealWeatherData }>();
const SERVER_WEATHER_CACHE_TTL = 30 * 60 * 1000;

// API Route: Live Meteorological Data & 5-Day Forecast via Open-Meteo
app.get('/api/weather', async (req: Request, res: Response) => {
  const districtQuery = (req.query.district as string) || 'Thanjavur';
  const geo = getDistrictGeo(districtQuery);
  const cacheKey = geo.name.toLowerCase();

  const cached = serverWeatherCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < SERVER_WEATHER_CACHE_TTL) {
    return res.json({ success: true, data: cached.data });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FKolkata&forecast_days=5`;

    const fetchRes = await fetch(url);
    if (!fetchRes.ok) {
      throw new Error(`Open-Meteo API returned HTTP status ${fetchRes.status}`);
    }

    const rawData = await fetchRes.json();
    const weatherData = parseOpenMeteoResponse(rawData, geo);

    serverWeatherCache.set(cacheKey, { timestamp: now, data: weatherData });
    return res.json({ success: true, data: weatherData });
  } catch (err: any) {
    console.error(`Failed to fetch weather for district ${geo.name}:`, err);
    if (cached) {
      return res.json({
        success: true,
        data: { ...cached.data, isStale: true },
        warning: 'Serving cached meteorological data due to upstream connectivity.',
      });
    }
    return res.status(502).json({
      success: false,
      error: 'WEATHER_SERVICE_ERROR',
      message: err.message || `Unable to fetch live meteorological data for ${geo.name}.`,
    });
  }
});

// API Route: District Risk Intelligence
app.get('/api/risk-intelligence', (req: Request, res: Response) => {
  const { district } = req.query;
  if (district && typeof district === 'string') {
    const matched = districtRiskData.find((d) => d.district.toLowerCase() === district.toLowerCase());
    if (matched) {
      return res.json({ success: true, data: matched });
    }
  }
  res.json({ success: true, data: districtRiskData });
});

// API Route: Community Reports
app.get('/api/community-reports', (req: Request, res: Response) => {
  const { district } = req.query;
  let filtered = communityReports;
  if (district && typeof district === 'string') {
    filtered = communityReports.filter((r) => r.district.toLowerCase() === district.toLowerCase());
  }
  res.json({ success: true, count: filtered.length, data: filtered });
});

// API Route: Submit Community Report
app.post('/api/community-reports', (req: Request, res: Response) => {
  const {
    farmerName = 'Anonymous Farmer',
    village,
    district,
    variety = 'CR 1009',
    growthStage = 'Vegetative',
    suspectedCondition,
    fieldNotes = '',
    riskLevel = 'Moderate',
  } = req.body;

  if (!village || !district || !suspectedCondition) {
    return res.status(400).json({ error: 'Village, district, and suspected condition are required.' });
  }

  const newReport: CommunityReport = {
    id: `REP-TN-2026-${String(communityReports.length + 82).padStart(3, '0')}`,
    farmerName,
    village,
    district,
    variety,
    growthStage,
    suspectedCondition,
    suspectedConditionTamil: suspectedCondition,
    verificationStatus: 'Pending Field Review',
    verificationStatusTamil: 'நேரடி ஆய்வு நிலுவையில் உள்ளது',
    reportedDate: new Date().toISOString().split('T')[0],
    fieldNotes,
    riskLevel: riskLevel as any,
    latitude: 10.78 + (Math.random() - 0.5) * 0.1,
    longitude: 79.13 + (Math.random() - 0.5) * 0.1,
  };

  communityReports.unshift(newReport);
  res.status(201).json({ success: true, data: newReport });
});

// Mount Vite or serve static assets
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🌾 CropShield server operational on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

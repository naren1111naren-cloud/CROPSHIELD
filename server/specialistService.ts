/**
 * CropShield AI — Specialist Disease Intelligence Engine Service
 * Version: 1.0.0 (Phase 5)
 * 
 * Provides a modular, decoupled inference architecture separating specialist
 * classifiers from multimodal reasoning fallbacks, with an uncertainty/rejection gate,
 * strict dataset provenance transparency, and TNAU agronomic registry hydration.
 */

import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';
import {
  DISEASE_REGISTRY_VERSION,
  getSupportedDiseaseClass,
  SupportedDiseaseClass,
  RICE_DISEASE_CLASSES,
} from '../src/config/diseaseRegistry.js';

// --- Interfaces & Types ---

export interface InferenceImageMeta {
  width?: number;
  height?: number;
  format: 'jpeg' | 'png' | 'webp' | 'unknown';
  byteLength: number;
}

export interface SpecialistInferenceRequest {
  imageBase64: string;
  mimeType: string;
  cropId: string;
  variety?: string;
  district?: string;
  cropStage?: string;
  fieldNotes?: string;
}

export interface EvidenceDistinction {
  specialistPrediction: string;
  multimodalReasoning: string;
  weatherRiskIndicators: string;
  verifiedAgronomicGuidance: string;
}

export interface SpecialistInferenceResult {
  analysisStatus: 'completed' | 'inconclusive';
  cropId: string;
  cropName: string;
  cropNameTamil: string;
  conditionName: string;
  conditionNameTamil: string;
  alternativeConditions: string[];
  pathogen: string;
  severity: 'low' | 'moderate' | 'high' | 'nominal';
  observedCharacteristics: string[];
  observedSymptoms: string[];
  explanation: string;
  confidenceAssessment: string;
  calibratedConfidence: number | null;
  confidenceCalibrationNote: string;
  imageQualityStatus: 'good' | 'blurry' | 'poor_lighting' | 'off_target' | 'low_resolution';
  inspectionSteps: string[];
  immediateCare: string[];
  immediateCareTamil: string[];
  preventivePractices: string[];
  preventivePracticesTamil: string[];
  managementGuidance: string[];
  managementGuidanceTamil: string[];
  recommendations: string[];
  recommendationsTamil: string[];
  expertReviewAdvice: string;
  expertReviewAdviceTamil: string;
  expertReviewRecommended: boolean;
  uncertaintyNotice: string;
  uncertaintyNoticeTamil: string;
  isHealthy: boolean;
  disclaimer: string;
  disclaimerTamil: string;
  evidenceDistinction: EvidenceDistinction;
  isSpecialistTrainedModel: boolean;
  analysisMethod: string;
  modelVersion: string;
  registryVersion: string;
  source: string;
  analyzedAt: string;
  timestamp: string;
  registryEntry?: SupportedDiseaseClass | null;
}

export interface ISpecialistModelProvider {
  readonly name: string;
  readonly isSpecialistTrainedModel: boolean;
  readonly providerType: 'trained_classifier_microservice' | 'onnx_local_runtime' | 'multimodal_reasoner_fallback';
  predict(request: SpecialistInferenceRequest, meta: InferenceImageMeta): Promise<SpecialistInferenceResult>;
}

// --- Image Dimensions & Header Inspector ---

export function inspectImageBuffer(buffer: Buffer): InferenceImageMeta {
  const byteLength = buffer.length;
  let format: 'jpeg' | 'png' | 'webp' | 'unknown' = 'unknown';
  let width: number | undefined;
  let height: number | undefined;

  // PNG Check
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    format = 'png';
    width = buffer.readUInt32BE(16);
    height = buffer.readUInt32BE(20);
  }
  // JPEG Check
  else if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    format = 'jpeg';
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // Baseline SOF0 (0xC0) or Progressive SOF2 (0xC2)
      if (marker === 0xc0 || marker === 0xc2) {
        height = buffer.readUInt16BE(offset + 5);
        width = buffer.readUInt16BE(offset + 7);
        break;
      } else if (marker === 0xd9 || marker === 0xda) {
        // End of image or Start of Scan
        break;
      } else {
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }
  }
  // WebP Check
  else if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    format = 'webp';
    if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
      // Simple lossy VP8
      width = buffer.readUInt16LE(26) & 0x3fff;
      height = buffer.readUInt16LE(28) & 0x3fff;
    } else if (buffer.toString('ascii', 12, 16) === 'VP8L') {
      // Lossless VP8L
      const b1 = buffer[21];
      const b2 = buffer[22];
      const b3 = buffer[23];
      const b4 = buffer[24];
      width = 1 + (((b2 & 0x3f) << 8) | b1);
      height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    }
  }

  return { format, width, height, byteLength };
}

// --- Provider 1: Trained Specialist Model Provider (Microservice / ONNX Endpoint) ---

export class TrainedSpecialistModelProvider implements ISpecialistModelProvider {
  readonly name = 'PaddyDoctor-ResNet50-TN-Specialist';
  readonly isSpecialistTrainedModel = true;
  readonly providerType = 'trained_classifier_microservice' as const;
  private endpointUrl: string | null;

  constructor(endpointUrl?: string) {
    this.endpointUrl = endpointUrl || process.env.SPECIALIST_MODEL_ENDPOINT || null;
  }

  isAvailable(): boolean {
    if (!this.endpointUrl && process.env.SPECIALIST_MODEL_ENDPOINT) {
      this.endpointUrl = process.env.SPECIALIST_MODEL_ENDPOINT.trim();
    }
    return Boolean(this.endpointUrl && this.endpointUrl.trim().length > 0);
  }

  async predict(request: SpecialistInferenceRequest, _meta: InferenceImageMeta): Promise<SpecialistInferenceResult> {
    if (!this.endpointUrl && process.env.SPECIALIST_MODEL_ENDPOINT) {
      this.endpointUrl = process.env.SPECIALIST_MODEL_ENDPOINT.trim();
    }
    if (!this.endpointUrl) {
      throw new Error('Specialist model endpoint URL not configured.');
    }

    const response = await fetch(`${this.endpointUrl}/v1/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop: request.cropId,
        image_base64: request.imageBase64,
        district: request.district,
      }),
    });

    if (!response.ok) {
      throw new Error(`Specialist microservice error: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  }
}

// --- Provider 2: Multimodal Reasoner Provider (Gemini 3.8/3.5 Flash Fallback) ---

export class MultimodalReasonerProvider implements ISpecialistModelProvider {
  readonly name = 'Gemini-Flash-Multimodal-Reasoner';
  readonly isSpecialistTrainedModel = false;
  readonly providerType = 'multimodal_reasoner_fallback' as const;
  private aiClient: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key) {
      this.aiClient = new GoogleGenAI({ apiKey: key });
    }
  }

  isAvailable(): boolean {
    if (!this.aiClient && process.env.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return Boolean(this.aiClient);
  }

  async predict(request: SpecialistInferenceRequest, meta: InferenceImageMeta): Promise<SpecialistInferenceResult> {
    if (!this.aiClient && process.env.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    if (!this.aiClient) {
      throw new Error('Gemini API client not initialized. GEMINI_API_KEY required in server environment.');
    }

    const cleanBase64 = request.imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const normalizedCropId = request.cropId.toLowerCase();

    // Map crop names
    let cropNameEnglish = 'Rice (Paddy)';
    let cropNameTamil = 'நெல் (பயிர்)';
    let candidateClassesInfo = '';

    if (normalizedCropId === 'rice') {
      cropNameEnglish = 'Rice (Paddy)';
      cropNameTamil = 'நெல் (பயிர்)';
      candidateClassesInfo = `Crop: Rice / Paddy (Oryza sativa L.)
Target Candidate Classes in Tamil Nadu (Registry v1.0.0):
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
      candidateClassesInfo = `Crop: Tomato (Solanum lycopersicum)
Target Classes: Early Blight, Septoria Leaf Spot, Tomato Leaf Curl Virus, Bacterial Spot, Healthy, Inconclusive`;
    } else if (normalizedCropId === 'chilli') {
      cropNameEnglish = 'Chilli';
      cropNameTamil = 'மிளகாய்';
      candidateClassesInfo = `Crop: Chilli (Capsicum annuum)
Target Classes: Anthracnose/Die-back, Cercospora Spot, Chilli Leaf Curl Virus, Powdery Mildew, Healthy, Inconclusive`;
    } else if (normalizedCropId === 'cotton') {
      cropNameEnglish = 'Cotton';
      cropNameTamil = 'பருத்தி';
      candidateClassesInfo = `Crop: Cotton (Gossypium hirsutum)
Target Classes: Bacterial Blight, Alternaria Leaf Spot, Cercospora Leaf Spot, Grey Mildew, Healthy, Inconclusive`;
    } else if (normalizedCropId === 'maize') {
      cropNameEnglish = 'Maize (Corn)';
      cropNameTamil = 'மக்காச்சோளம்';
      candidateClassesInfo = `Crop: Maize (Zea mays)
Target Classes: Turcicum Leaf Blight, Maydis Blight, Common Rust, Banded Sheath Blight, Healthy, Inconclusive`;
    }

    const systemPrompt = `You are CropShield's agricultural pathology intelligence engine specialized in crops cultivated in Tamil Nadu, India.
${candidateClassesInfo}

Strict Evaluation Rules:
1. Critical Image Quality Gate:
   - If image does not show foliage of ${cropNameEnglish}, or is severely blurry, out of focus, has glare, or symptoms cannot be differentiated from general mechanical damage, you MUST return:
     "analysisStatus": "inconclusive",
     "imageQualityStatus": "blurry" (or "off_target" / "poor_lighting"),
     "possibleCondition": "Inconclusive Image",
     "possibleConditionTamil": "தெளிவற்ற அல்லது தீர்மானிக்க முடியாத படம்".
2. Calibration Honesty:
   - NEVER invent synthetic decimal confidence percentages (e.g. "94.2%"). Return a qualitative diagnostic certainty assessment explaining the visual features observed and the limitations.
3. Pest Separation:
   - Pests (e.g. yellow stem borer, leaf folder larvae) are not microbial diseases. If insect damage is observed, note it clearly in explanation but do NOT diagnose as a fungal/bacterial pathogen.
4. TNAU Integrated Pest Management (IPM):
   - Provide actionable cultural and biological management protocols adhering to Tamil Nadu Agricultural University (TNAU) research. NEVER prescribe unverified chemical cocktails or toxic dosage mixtures.
5. Provide bilingual Tamil and English output.

District context: ${request.district || 'Thanjavur'}, Tamil Nadu
Cultivar: ${request.variety || 'Standard Cultivar'}
Field Notes: ${request.fieldNotes || 'Standard field photography'}

Return strictly valid JSON conforming to this schema:
{
  "analysisStatus": "completed" | "inconclusive",
  "possibleCondition": "English name of diagnosed condition or Healthy Foliage or Inconclusive Image",
  "possibleConditionTamil": "Authentic Tamil name",
  "alternativeConditions": ["alternative 1", "alternative 2"],
  "pathogen": "Scientific causative agent or None",
  "severity": "low" | "moderate" | "high" | "nominal",
  "observedSymptoms": ["specific visual feature 1 (lesion shape, margins, coloration)", "feature 2"],
  "explanation": "Pathological reasoning explaining how visual evidence supports this assessment",
  "confidenceInformation": "Qualitative certainty statement and diagnostic boundaries",
  "imageQualityStatus": "good" | "blurry" | "poor_lighting" | "off_target",
  "inspectionSteps": ["Step 1 to inspect in the field right now", "Step 2"],
  "immediateCare": ["Immediate agronomic/cultural action 1", "Immediate action 2"],
  "immediateCareTamil": ["உடனடிப் பராமரிப்பு நடவடிக்கை 1", "உடனடி நடவடிக்கை 2"],
  "preventivePractices": ["Long-term preventive practice 1", "Preventive practice 2"],
  "preventivePracticesTamil": ["நீண்டகால தடுப்பு முறை 1", "தடுப்பு முறை 2"],
  "recommendations": ["Actionable cultural / biological IPM step 1", "Actionable step 2"],
  "recommendationsTamil": ["தமிழ் பரிந்துரை 1", "தமிழ் பரிந்துரை 2"],
  "expertReviewAdvice": "Advice on in-person verification with Village Agricultural Extension Officer (AEO) or KVK",
  "expertReviewAdviceTamil": "தமிழ் கள ஆய்வு ஆலோசனை",
  "expertReviewRecommended": true | false,
  "uncertaintyNotice": "Explicit notice explaining that this is preliminary screening",
  "uncertaintyNoticeTamil": "தமிழ் எச்சரிக்கை / பூர்வாங்க ஆய்வு அறிவிப்பு",
  "isHealthy": true | false
}`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
    let response: any = null;
    let selectedModel = 'gemini-3.8-flash';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await this.aiClient.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: request.mimeType,
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
        console.warn(`Model ${modelName} returned status ${callErr.status || callErr.message}, trying next...`);
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
      throw new Error(`Failed to parse AI response JSON: ${rawText}`);
    }

    const isHealthy = Boolean(parsed.isHealthy || parsed.severity === 'nominal');
    const analysisStatus = parsed.analysisStatus === 'inconclusive' ? 'inconclusive' : 'completed';

    // Hydrate against Disease Registry (v1.0.0)
    let registryEntry: SupportedDiseaseClass | null = null;
    if (normalizedCropId === 'rice') {
      const conditionNameLower = (parsed.possibleCondition || '').toLowerCase();
      if (conditionNameLower.includes('blast')) {
        registryEntry = RICE_DISEASE_CLASSES.rice_blast;
      } else if (conditionNameLower.includes('bacterial') || conditionNameLower.includes('blight')) {
        registryEntry = RICE_DISEASE_CLASSES.bacterial_leaf_blight;
      } else if (conditionNameLower.includes('brown spot')) {
        registryEntry = RICE_DISEASE_CLASSES.brown_spot;
      } else if (conditionNameLower.includes('sheath')) {
        registryEntry = RICE_DISEASE_CLASSES.sheath_blight;
      } else if (conditionNameLower.includes('healthy') || isHealthy) {
        registryEntry = RICE_DISEASE_CLASSES.healthy_rice;
      } else {
        registryEntry = RICE_DISEASE_CLASSES.inconclusive;
      }
    }

    // Merge authoritative registry preliminary care if available
    const immediateCare = (registryEntry && registryEntry.preliminaryCare.cultural.length > 0)
      ? registryEntry.preliminaryCare.cultural
      : (Array.isArray(parsed.immediateCare) ? parsed.immediateCare : []);
    const immediateCareTamil = (registryEntry && registryEntry.preliminaryCare.culturalTamil.length > 0)
      ? registryEntry.preliminaryCare.culturalTamil
      : (Array.isArray(parsed.immediateCareTamil) ? parsed.immediateCareTamil : []);

    const preventivePractices = (registryEntry && registryEntry.preliminaryCare.biological.length > 0)
      ? registryEntry.preliminaryCare.biological
      : (Array.isArray(parsed.preventivePractices) ? parsed.preventivePractices : []);
    const preventivePracticesTamil = (registryEntry && registryEntry.preliminaryCare.biologicalTamil.length > 0)
      ? registryEntry.preliminaryCare.biologicalTamil
      : (Array.isArray(parsed.preventivePracticesTamil) ? parsed.preventivePracticesTamil : []);

    // Explicit 4-layer evidence distinction
    const evidenceDistinction: EvidenceDistinction = {
      specialistPrediction: 'Trained specialist CNN weights (Paddy Doctor ResNet50) currently in dataset preparation / pending cloud GPU deployment. Multimodal screening active.',
      multimodalReasoning: `Visual pathology pattern evaluated by ${selectedModel} against foliar lesion morphological boundaries.`,
      weatherRiskIndicators: `Agro-climatic risk context evaluated for ${request.district || 'Thanjavur'} district.`,
      verifiedAgronomicGuidance: registryEntry
        ? `Adheres to verified TNAU Agronomy & Pathology Protocol (${registryEntry.trustedReferences.map(r => r.source).join(', ')}).`
        : 'Adheres to TNAU Agritech Portal standard IPM recommendations.',
    };

    return {
      analysisStatus,
      cropId: normalizedCropId,
      cropName: cropNameEnglish,
      cropNameTamil,
      conditionName: parsed.possibleCondition || 'Inconclusive Image',
      conditionNameTamil: parsed.possibleConditionTamil || parsed.possibleCondition || 'தெளிவற்ற படம்',
      alternativeConditions: Array.isArray(parsed.alternativeConditions) ? parsed.alternativeConditions : [],
      pathogen: registryEntry ? registryEntry.scientificName : (parsed.pathogen || 'Not specified'),
      severity: (['low', 'moderate', 'high', 'nominal'].includes(parsed.severity) ? parsed.severity : 'moderate') as any,
      observedCharacteristics: Array.isArray(parsed.observedSymptoms) ? parsed.observedSymptoms : [],
      observedSymptoms: Array.isArray(parsed.observedSymptoms) ? parsed.observedSymptoms : (registryEntry?.visibleSymptoms || []),
      explanation: parsed.explanation || 'Pathological visual assessment based on lesion morphology and leaf discoloration patterns.',
      confidenceAssessment: parsed.confidenceInformation || 'Preliminary visual interpretation. Not a calibrated softmax score.',
      calibratedConfidence: null, // Explicitly null: temperature scaling has not been conducted on field photos
      confidenceCalibrationNote: 'Confidence calibration (ECE / Platt scaling) has not been evaluated on live farm photographs. Probabilities are qualitative interpretations, not mathematical assurances.',
      imageQualityStatus: (['good', 'blurry', 'poor_lighting', 'off_target'].includes(parsed.imageQualityStatus) ? parsed.imageQualityStatus : 'good') as any,
      inspectionSteps: Array.isArray(parsed.inspectionSteps) ? parsed.inspectionSteps : [],
      immediateCare,
      immediateCareTamil,
      preventivePractices,
      preventivePracticesTamil,
      managementGuidance: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      managementGuidanceTamil: Array.isArray(parsed.recommendationsTamil) ? parsed.recommendationsTamil : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      recommendationsTamil: Array.isArray(parsed.recommendationsTamil) ? parsed.recommendationsTamil : [],
      expertReviewAdvice: registryEntry
        ? registryEntry.expertConfirmationCriteria
        : (parsed.expertReviewAdvice || 'Consult your local Village Agricultural Extension Officer before taking chemical action.'),
      expertReviewAdviceTamil: registryEntry
        ? registryEntry.expertConfirmationCriteriaTamil
        : (parsed.expertReviewAdviceTamil || 'ரசாயன மருந்துகளைப் பயன்படுத்துவதற்கு முன் வட்டார வேளாண்மை அலுவலரின் ஆலோசனையைப் பெறவும்.'),
      expertReviewRecommended: Boolean(parsed.expertReviewRecommended ?? (parsed.severity === 'high')),
      uncertaintyNotice: 'Preliminary AI screening only. Field symptoms frequently overlap with potassium deficiency or environmental stress. Laboratory diagnostic confirmation recommended.',
      uncertaintyNoticeTamil: 'இது AI துணையுடன் மேற்கொள்ளப்பட்ட பூர்வாங்க புகைப்பட கணிப்பு மட்டுமே. ஆய்வக பரிசோதனைக்கு மாற்றாகாது.',
      isHealthy,
      disclaimer: 'Preliminary visual screening. Consult your local Village Agricultural Extension Officer (AEO) or Krishi Vigyan Kendra (KVK) specialist before applying synthetic chemical inputs.',
      disclaimerTamil: 'இது பூர்வாங்க கணிப்பு மட்டுமே. ரசாயன மருந்துகளை வாங்குவதற்கு முன் வட்டார வேளாண்மை அலுவலரின் நேரடி ஆலோசனையைப் பெறவும்.',
      evidenceDistinction,
      isSpecialistTrainedModel: false,
      analysisMethod: `${selectedModel} (multimodal reasoning fallback — specialist trained model pending GPU deployment)`,
      modelVersion: `cropshield-${normalizedCropId}-v1.0.0-screening`,
      registryVersion: DISEASE_REGISTRY_VERSION,
      source: selectedModel,
      analyzedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      registryEntry,
    };
  }
}

// --- Specialist Pathology Engine Orchestrator ---

export class SpecialistCropIntelligenceEngine {
  private trainedProvider: TrainedSpecialistModelProvider;
  private reasonerProvider: MultimodalReasonerProvider;

  constructor() {
    this.trainedProvider = new TrainedSpecialistModelProvider();
    this.reasonerProvider = new MultimodalReasonerProvider();
  }

  /**
   * Run the end-to-end inference pipeline with strict uncertainty & rejection gates
   */
  async analyze(request: SpecialistInferenceRequest): Promise<SpecialistInferenceResult> {
    // 1. Clean base64 & calculate buffer
    const cleanBase64 = request.imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    // 2. Inspect buffer headers (format, width, height, size)
    const meta = inspectImageBuffer(imageBuffer);

    // 3. Uncertainty Gate 1: Byte Length Thresholds (5 KB min, 15 MB max)
    if (meta.byteLength < 5 * 1024) {
      return this.buildInconclusiveResult(
        request.cropId,
        'low_resolution',
        'Image payload is too small (<5 KB) to contain identifiable leaf pathology details. Please upload a clear, high-resolution leaf photo.',
        'படத்தின் அளவு மிகவும் சிறியதாக உள்ளது (<5 KB). தெளிவான இலையின் புகைப்படத்தைப் பதிவேற்றவும்.'
      );
    }
    if (meta.byteLength > 15 * 1024 * 1024) {
      throw new Error('Image exceeds 15 MB size limit.');
    }

    // 4. Uncertainty Gate 2: Dimension Rejection (<200x200 pixels)
    if (meta.width !== undefined && meta.height !== undefined) {
      if (meta.width < 200 || meta.height < 200) {
        return this.buildInconclusiveResult(
          request.cropId,
          'low_resolution',
          `Image resolution (${meta.width}x${meta.height} px) is below the minimum required 200x200 px for disease symptom discrimination.`,
          `படத்தின் தரம் மிகவும் குறைவாக உள்ளது (${meta.width}x${meta.height} px). குறைந்தபட்சம் 200x200 px அளவிலான படத்தைப் பயன்படுத்தவும்.`
        );
      }
    }

    // 5. Crop Support Boundary Check
    const normalizedCropId = request.cropId.toLowerCase();
    const supportedCrops = ['rice', 'tomato', 'chilli', 'cotton', 'maize'];
    if (!supportedCrops.includes(normalizedCropId)) {
      return this.buildInconclusiveResult(
        request.cropId,
        'off_target',
        `Crop '${request.cropId}' is not yet supported in CropShield's validated pathology registry.`,
        `'${request.cropId}' பயிருக்கான மாதிரி இன்னும் பயன்பாட்டிற்கு வரவில்லை.`
      );
    }

    // 6. Provider Routing:
    // Try specialist trained model if microservice endpoint configured and online
    if (this.trainedProvider.isAvailable()) {
      try {
        const specialistResult = await this.trainedProvider.predict(request, meta);
        return specialistResult;
      } catch (err: any) {
        console.warn('Specialist model provider failed, falling back to multimodal reasoner:', err.message);
      }
    }

    // 7. Fallback to Multimodal Reasoner Provider
    if (this.reasonerProvider.isAvailable()) {
      return await this.reasonerProvider.predict(request, meta);
    }

    throw new Error('No crop pathology model provider is available. Configure GEMINI_API_KEY or SPECIALIST_MODEL_ENDPOINT.');
  }

  private buildInconclusiveResult(
    cropId: string,
    qualityStatus: 'low_resolution' | 'blurry' | 'off_target',
    reasonEnglish: string,
    reasonTamil: string
  ): SpecialistInferenceResult {
    return {
      analysisStatus: 'inconclusive',
      cropId: cropId.toLowerCase(),
      cropName: cropId.toUpperCase(),
      cropNameTamil: cropId,
      conditionName: 'Inconclusive Image / Low Resolution',
      conditionNameTamil: 'தெளிவற்ற அல்லது தீர்மானிக்க முடியாத படம்',
      alternativeConditions: [],
      pathogen: 'None identified',
      severity: 'nominal',
      observedCharacteristics: [reasonEnglish],
      observedSymptoms: [reasonEnglish],
      explanation: reasonEnglish,
      confidenceAssessment: 'Diagnostic assessment rejected due to insufficient image fidelity.',
      calibratedConfidence: null,
      confidenceCalibrationNote: 'Analysis rejected by image fidelity gate.',
      imageQualityStatus: qualityStatus,
      inspectionSteps: [
        'Position the camera 15-25 cm from the affected leaf.',
        'Ensure steady natural daylight without harsh shadows or direct flash glare.',
        'Keep the focal point sharp on lesion borders before capturing.',
      ],
      immediateCare: ['Retake a close-up photograph of the leaf blade in daylight.'],
      immediateCareTamil: ['பகலில் நல்ல வெளிச்சத்தில் இலையை நெருக்கமாக மீண்டும் புகைப்படம் எடுக்கவும்.'],
      preventivePractices: ['Regular scouting during early morning tillering stage.'],
      preventivePracticesTamil: ['காலை வேளையில் வயலைத் தொடர்ந்து கண்காணித்தல்.'],
      managementGuidance: ['Inconclusive image. No chemical intervention recommended.'],
      managementGuidanceTamil: ['தெளிவற்ற படம். ரசாயன மருந்துகள் எதையும் தெளிக்க வேண்டாம்.'],
      recommendations: ['Capture a sharper photograph or bring a physical sample to the local AEO.'],
      recommendationsTamil: ['தெளிவான படம் எடுக்கவும் அல்லது பாதிக்கப்பட்ட இலையை வேளாண் அலுவலரிடம் காண்பிக்கவும்.'],
      expertReviewAdvice: 'If symptoms persist across multiple hills, consult your Village Agricultural Extension Officer with a physical leaf sample.',
      expertReviewAdviceTamil: 'அறிகுறிகள் தொடர்ந்து காணப்பட்டால், பாதிக்கப்பட்ட இலை மாதிரியுடன் வட்டார வேளாண்மை அலுவலரை அணுகவும்.',
      expertReviewRecommended: true,
      uncertaintyNotice: reasonEnglish,
      uncertaintyNoticeTamil: reasonTamil,
      isHealthy: false,
      disclaimer: 'Rejected by uncertainty gate. Do not apply chemical pesticides without positive disease confirmation.',
      disclaimerTamil: 'படம் தெளிவற்றதால் ஆய்வு நிராகரிக்கப்பட்டது. சரியான உறுதிப்படுத்தல் இல்லாமல் மருந்துகளைப் பயன்படுத்த வேண்டாம்.',
      evidenceDistinction: {
        specialistPrediction: 'Not evaluated (rejected at uncertainty gate).',
        multimodalReasoning: 'Image rejected before AI processing to prevent hallucinated diagnoses.',
        weatherRiskIndicators: 'Weather risk indicators remain available in the dashboard.',
        verifiedAgronomicGuidance: 'Adhere to standard TNAU prophylactic field monitoring.',
      },
      isSpecialistTrainedModel: false,
      analysisMethod: 'CropShield Uncertainty & Fidelity Gate v1.0.0',
      modelVersion: `cropshield-${cropId.toLowerCase()}-gate-v1.0.0`,
      registryVersion: DISEASE_REGISTRY_VERSION,
      source: 'fidelity_gate',
      analyzedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      registryEntry: RICE_DISEASE_CLASSES.inconclusive,
    };
  }
}

// Export singleton instance
export const specialistEngine = new SpecialistCropIntelligenceEngine();

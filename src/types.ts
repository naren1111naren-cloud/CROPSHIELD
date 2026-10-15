export type Language = 'en' | 'ta';

export interface AnalysisResult {
  analysisStatus: 'completed' | 'inconclusive' | 'unsupported_crop' | 'failed';
  cropId: string;
  cropName: string;
  cropNameTamil?: string;
  conditionName: string;
  conditionNameTamil: string;
  alternativeConditions?: string[];
  pathogen: string;
  severity: 'low' | 'moderate' | 'high' | 'nominal';
  observedCharacteristics: string[];
  observedSymptoms?: string[];
  explanation?: string;
  confidenceAssessment: string;
  confidenceInformation?: string;
  imageQualityStatus?: 'good' | 'blurry' | 'poor_lighting' | 'off_target';
  inspectionSteps: string[];
  managementGuidance: string[];
  managementGuidanceTamil?: string[];
  recommendations?: string[];
  recommendationsTamil?: string[];
  immediateCare?: string[];
  immediateCareTamil?: string[];
  preventivePractices?: string[];
  preventivePracticesTamil?: string[];
  uncertaintyNotice?: string;
  uncertaintyNoticeTamil?: string;
  expertReviewAdvice: string;
  expertReviewAdviceTamil?: string;
  expertReviewRecommended?: boolean;
  isHealthy: boolean;
  disclaimer: string;
  disclaimerTamil?: string;
  timestamp: string;
  source: string;
  analysisMethod?: string;
  modelVersion?: string;
  registryVersion?: string;
  isSpecialistTrainedModel?: boolean;
  calibratedConfidence?: number | null;
  confidenceCalibrationNote?: string;
  evidenceDistinction?: {
    specialistPrediction: string;
    multimodalReasoning: string;
    weatherRiskIndicators: string;
    verifiedAgronomicGuidance: string;
  };
  analyzedAt?: string;
  isFallback?: boolean;
}

export interface WeatherSnapshot {
  tempC: number;
  relativeHumidity: number;
  dewDurationHours: number;
  rainfallPast48hMm: number;
  cloudCover: string;
}

export interface DistrictRisk {
  district: string;
  districtTamil: string;
  basin: string;
  activeSeason: string;
  overallRisk: 'Elevated' | 'Moderate' | 'Low';
  blastRisk: string;
  blbRisk: string;
  brownSpotRisk: string;
  sheathBlightRisk: string;
  weatherSnapshot: WeatherSnapshot;
  advisoryText: string;
  advisoryTamil: string;
  lastUpdated: string;
  source: string;
}

export interface CommunityReport {
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

export interface FarmerProfile {
  uid: string;
  displayName: string;
  email?: string;
  phone?: string;
  preferredLanguage: 'en' | 'ta';
  state?: string;
  district: string;
  locality?: string;
  primaryCrop: string;
  primaryCrops?: string[];
  activeVariety?: string;
  plantingDate?: string;
  cropStage?: string;
  landSizeAcres?: number;
  landSizeArea?: number;
  areaUnit?: 'Acres' | 'Cents' | 'Hectares';
  irrigationMethod?: string;
  farmNotes?: string;
  primaryFarmId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface FarmBoundary {
  type: 'Polygon';
  coordinates: [number, number][][]; // GeoJSON: Array of rings with [longitude, latitude]
  centroid?: [number, number]; // [latitude, longitude]
  measuredAreaSqMeters?: number;
  measuredPerimeterMeters?: number;
  measuredAcres?: number;
  measuredCents?: number;
  measuredHectares?: number;
  surveyStatus?: 'farmer_mapped' | 'verified_cadastral';
  mappedAt?: string;
}

export interface FarmRecord {
  id?: string;
  farmName: string;
  cropType: string;
  riceVariety?: string;
  district: string;
  locality?: string;
  plantingDate?: string;
  cropStage?: string;
  landSizeAcres?: number;
  landSizeArea?: number;
  areaUnit?: 'Acres' | 'Cents' | 'Hectares';
  irrigationMethod?: string;
  isPrimary?: boolean;
  notes?: string;
  boundary?: FarmBoundary;
  createdAt?: any;
  updatedAt?: any;
}

export interface ScanData {
  id?: string;
  scanId: string;
  ownerUid?: string;
  cropId?: string;
  cropName?: string;
  cropNameTamil?: string;
  imagePath: string;
  status: 'pending' | 'processing' | 'completed' | 'inconclusive' | 'failed';
  possibleCondition: string;
  possibleConditionTamil?: string;
  alternativeConditions?: string[];
  pathogen?: string;
  severity?: 'low' | 'moderate' | 'high' | 'nominal';
  observations: string[] | string;
  observedSymptoms?: string[];
  explanation?: string;
  recommendations: string[] | string;
  recommendationsTamil?: string[];
  immediateCare?: string[];
  immediateCareTamil?: string[];
  preventivePractices?: string[];
  preventivePracticesTamil?: string[];
  uncertaintyNotice?: string;
  uncertaintyNoticeTamil?: string;
  confidenceInformation: string;
  imageQualityStatus?: 'good' | 'blurry' | 'poor_lighting' | 'off_target';
  expertReviewRecommended: boolean;
  expertReviewAdvice?: string;
  expertReviewAdviceTamil?: string;
  analysisMethod: string;
  modelVersion: string;
  isHealthy?: boolean;
  farmId?: string;
  variety?: string;
  district?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ScanRecord {
  id: string;
  date: string;
  variety: string;
  plotName: string;
  conditionName: string;
  conditionNameTamil: string;
  severity: 'low' | 'moderate' | 'high' | 'nominal';
  isHealthy: boolean;
  thumbnailUrl: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

// --- Phase 7: Knowledge Hub & Expert Support Types ---

export type KnowledgeTopic =
  | 'disease'
  | 'pest'
  | 'symptoms'
  | 'growth_stage'
  | 'prevention'
  | 'weather_precautions'
  | 'professional_help';

export type KnowledgeContentType =
  | 'verified_reference'
  | 'general_guidance'
  | 'ai_explanation';

export interface KnowledgeArticle {
  id: string;
  title: string;
  titleTamil: string;
  summary: string;
  summaryTamil: string;
  content: string;
  contentTamil: string;
  cropId: 'rice' | 'tomato' | 'chilli' | 'cotton' | 'maize' | 'all';
  topic: KnowledgeTopic;
  targetConditionId?: string;
  applicableGrowthStages: string[];
  language: 'both' | 'ta' | 'en';
  sourceName: string;
  sourceUrl: string;
  publicationDate?: string;
  lastVerifiedDate: string;
  contentType: KnowledgeContentType;
  whenToSeekHelp: string;
  whenToSeekHelpTamil: string;
  actionableSteps: string[];
  actionableStepsTamil: string[];
  tags: string[];
}

export type ExpertServiceType =
  | 'kvk'
  | 'university_extension'
  | 'district_jda'
  | 'kisan_call_centre'
  | 'research_station';

export type VerificationStatusType =
  | 'verified_public_record'
  | 'awaiting_verification';

export interface ExpertServiceEntry {
  id: string;
  name: string;
  nameTamil: string;
  institutionName: string;
  institutionNameTamil: string;
  serviceType: ExpertServiceType;
  districtsServed: string[];
  cropsOrTopicsCovered: string[];
  contactPhone: string;
  contactEmail?: string;
  officeAddress: string;
  officeAddressTamil: string;
  operatingHours: string;
  operatingHoursTamil: string;
  sourceUrl: string;
  lastVerifiedDate: string;
  verificationStatus: VerificationStatusType;
}

export type EnquiryUrgency = 'standard' | 'high_priority';
export type EnquiryStatus = 'submitted' | 'under_review' | 'response_available' | 'closed';

export interface FarmerEnquiry {
  id?: string;
  enquiryId: string;
  userId: string;
  farmerName: string;
  farmerPhone: string;
  preferredLanguage: 'en' | 'ta';
  farmId?: string;
  farmName?: string;
  cropId: string;
  cropName: string;
  district: string;
  problemCategory: 'disease_identification' | 'pest_infestation' | 'nutrient_deficiency' | 'weather_damage' | 'general_agronomy';
  description: string;
  linkedScanId?: string;
  linkedScanCondition?: string;
  linkedScanSeverity?: string;
  photoUrl?: string;
  photoStoragePath?: string;
  urgency: EnquiryUrgency;
  status: EnquiryStatus;
  statusNotes?: string;
  statusNotesTamil?: string;
  createdAt: any;
  updatedAt: any;
  expertResponse?: {
    officerName?: string;
    institution?: string;
    comments?: string;
    recommendedAction?: string;
    respondedAt?: string;
  };
}

export type { RealWeatherData, CurrentWeatherState, DailyForecastDay } from './services/weatherService';
export type { CropWeatherRecommendation, RecommendationContext } from './services/cropRecommendationEngine';
export type { SeasonalCropWindow } from './config/seasonalRegistry';
export type { DistrictGeo } from './config/tamilNaduDistricts';

// ============================================================================
// Field Case Intelligence Engine Types
// ============================================================================

export type FieldCaseStatus = 'active' | 'monitoring' | 'resolved' | 'escalated';

export interface FieldObservationInput {
  affectedParts: ('upper_leaf' | 'lower_leaf' | 'sheath_stem' | 'panicle_neck' | 'whole_plant')[];
  fieldDistribution: 'isolated_spots' | 'patchy_areas' | 'widespread_field' | 'along_bunds_inlet';
  estimatedIncidence: '<5% (low)' | '5-25% (moderate)' | '>25% (severe)';
  growthStage?: string;
  symptomSpread: 'rapid_few_days' | 'gradual_weeks' | 'static_no_change' | 'unknown';
  weatherTriggersObserved?: string[];
  farmerNotes?: string;
}

export interface DifferentialCandidate {
  conditionId: string;
  conditionName: string;
  conditionNameTamil: string;
  scientificName: string;
  category: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'nutritional' | 'physiological';
  plausibilityLevel: 'high' | 'moderate' | 'unlikely_but_possible';
  supportingEvidence: string[];
  supportingEvidenceTamil: string[];
  missingOrContradictoryEvidence: string[];
  missingOrContradictoryEvidenceTamil: string[];
  distinguishingObservation: string;
  distinguishingObservationTamil: string;
  trustedReference: {
    title: string;
    source: string;
    url?: string;
  };
  assessmentLimitations: string;
  assessmentLimitationsTamil: string;
}

export interface ActionPlan {
  whatWeObserved: {
    summary: string;
    summaryTamil: string;
    symptoms: string[];
    symptomsTamil: string[];
  };
  whatMightExplainIt: DifferentialCandidate[];
  whatToCheckNext: {
    observationsToMake: string[];
    observationsToMakeTamil: string[];
    additionalPhotosSuggested?: string[];
    additionalPhotosSuggestedTamil?: string[];
  };
  whatToDoNow: {
    immediateCulturalCare: string[];
    immediateCulturalCareTamil: string[];
    preventivePractices: string[];
    preventivePracticesTamil: string[];
    strictlyAvoid: string[];
    strictlyAvoidTamil: string[];
  };
  whenToSeekExpertHelp: {
    triggers: string[];
    triggersTamil: string[];
    contactRecommendations: string[];
    contactRecommendationsTamil: string[];
  };
  reinspectionAdvice: {
    suggestedIntervalDays: number;
    targetCheckpoints: string[];
    targetCheckpointsTamil: string[];
  };
}

export interface EvidenceSeparation {
  geminiVisualInterpretation: {
    summary: string;
    lesionTypesDetected: string[];
    uncertaintyStatement: string;
  };
  farmerFieldObservations: {
    partsReported: string[];
    distributionReported: string;
    spreadRateReported: string;
  };
  specialistRulesOrModel: {
    engineUsed: string;
    datasetProvenance: string;
  };
  weatherContextApplied?: {
    district: string;
    humidity?: number;
    dewHours?: number;
    weatherRiskNote?: string;
  };
  verifiedAgronomicSources: {
    institution: string;
    title: string;
    url?: string;
  }[];
}

export interface FieldObservation {
  id: string;
  caseId: string;
  userId: string;
  observationIndex: number;
  createdAt: string;
  imageUrl: string;
  secondaryImageUrl?: string;
  imageStoragePath?: string;
  cropStage: string;
  farmerInput: FieldObservationInput;
  differentialAssessment: DifferentialCandidate[];
  actionPlan: ActionPlan;
  evidenceSeparation: EvidenceSeparation;
  isInconclusive: boolean;
  inconclusiveReason?: string;
  inconclusiveReasonTamil?: string;
  farmerReportedProgressionNote?: string;
}

export interface FieldCaseRecord {
  id: string;
  caseToken: string;
  userId: string;
  farmId?: string;
  farmName?: string;
  cropId: 'rice' | 'tomato' | 'chilli' | 'cotton' | 'maize';
  cropName: string;
  cropNameTamil: string;
  variety: string;
  district: string;
  initialDate: string;
  latestObservationDate: string;
  status: FieldCaseStatus;
  primarySuspectedCondition: string;
  primarySuspectedConditionTamil: string;
  observationCount: number;
  latestObservationId?: string;
  latestActionPlan: ActionPlan;
  latestDifferential: DifferentialCandidate[];
  nextReinspectionDate?: string;
  createdAt: any;
  updatedAt: any;
}

// ============================================================================
// Daily Crop Market Prices (OGD India / AGMARKNET) Types
// ============================================================================

export interface MandiPriceRecord {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  commodityTamil?: string;
  variety: string;
  grade: string;
  arrivalDate: string; // The market reported arrival date (e.g., "13/10/2026")
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceUnit: string; // "₹/quintal"
  source: string;
}

export interface MarketPriceFilters {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  limit?: number;
  offset?: number;
}

export interface MarketPricesResponse {
  success: boolean;
  records: MandiPriceRecord[];
  totalRecords: number;
  fetchedAt: string; // ISO timestamp when CropShield successfully fetched the data
  isCached: boolean;
  filtersApplied: MarketPriceFilters;
  error?: string;
  message?: string;
  messageTamil?: string;
  isConfigError?: boolean;
}


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

export type BoundarySurveyStatus = 'official_source' | 'farmer_drawn' | 'imported' | 'unavailable';

export interface CadastralSourceMetadata {
  provider: string;
  district?: string;
  taluk?: string;
  revenueVillage?: string;
  surveyNumber?: string;
  subdivisionNumber?: string;
  retrievedAt?: string;
  fileName?: string;
  licenseNotice?: string;
  officialExtentAcres?: number;
  officialExtentCents?: number;
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
  surveyStatus?: BoundarySurveyStatus;
  sourceMetadata?: CadastralSourceMetadata;
  officialExtentAcres?: number;
  officialExtentCents?: number;
  proposedCoordinates?: [number, number][][]; // If user proposes an edit to an official boundary
  mappedAt?: string;
}

export type RegionalSoilClassification =
  | 'red_sandy_loam'        // செம்மண் (Coimbatore, Karur, Dindigul, Tiruchirappalli)
  | 'red_loam'
  | 'black_cotton_clay'     // கரிசல் மண் / Vertisol (Thoothukudi, Tirunelveli, Virudhunagar)
  | 'vertisol_black'
  | 'cauvery_alluvial_clay' // வண்டல் மண் (Thanjavur, Tiruvarur, Nagapattinam, Mayiladuthurai)
  | 'cauvery_delta_clay'
  | 'coastal_saline_alluvium' // உவர் நிலம் (Coastal Cuddalore, Nagapattinam, Ramanathapuram)
  | 'coastal_saline'
  | 'laterite_clay_loam'    // சரளை மண் (Nilgiris, Kanyakumari, Pudukkottai)
  | 'laterite'
  | 'sandy_river_basin'     // மணல் கலந்த வண்டல் (Amaravathi / Cauvery floodplains)
  | 'undetermined';

export interface SoilGridsProperties {
  depthCm: string; // e.g., '0-30cm'
  phH2O: number; // e.g. 7.2
  phTopsoil?: number;
  organicCarbonGPerKg: number; // e.g. 8.5 g/kg = 0.85%
  organicCarbonContentGPerKg?: number;
  clayPercentage: number;
  clayContentPercent?: number;
  sandPercentage: number;
  sandContentPercent?: number;
  siltPercentage: number;
  siltContentPercent?: number;
  bulkDensityGPerCm3: number;
  cationExchangeCapacityCmolPerKg: number;
  modelConfidence: string; // e.g. 'ISRIC SoilGrids 250m Machine Learning Prediction'
  attribution?: string;
}

export interface FarmSoilProfile {
  regionalClassification: RegionalSoilClassification;
  regionalSeriesName: string; // e.g. 'Irugur Series' or 'Adanur Series' (TNAU)
  regionalSeriesNameTamil: string;
  regionalDescription: string;
  regionalDescriptionTamil: string;
  source: 'TNAU & ICAR-NBSS&LUP Soil Resource Atlas' | 'SoilGrids ISRIC 250m' | 'Farmer Laboratory Assay';
  soilGridsEstimate?: SoilGridsProperties;
  drainageClass: 'well_drained' | 'moderately_drained' | 'imperfectly_drained' | 'poorly_drained';
  isLaboratoryVerified: boolean;
}

export interface LaboratorySoilTest {
  id?: string;
  testId?: string;
  sampleDate: string; // 'YYYY-MM-DD'
  sampleId?: string;
  testingLaboratory?: string; // e.g. 'TNAU Soil Testing Laboratory'
  laboratoryName?: string;
  soilHealthCardNumber?: string;
  ph: number; // 0 - 14
  electricalConductivityDsM?: number; // dS/m (Salinity index)
  electricalConductivityDsm?: number;
  organicCarbonPercent?: number; // Organic Carbon %
  availableNitrogenKgPerHa?: number; // Available N in kg/ha
  availablePhosphorusKgPerHa?: number; // Available P2O5 in kg/ha
  availablePotassiumKgPerHa?: number; // Available K2O in kg/ha
  zincPpm?: number;
  ironPpm?: number;
  boronPpm?: number;
  sulphurPpm?: number;
  phRating?: 'acidic' | 'normal' | 'alkaline' | 'sodic';
  salinityRating?: 'non_saline' | 'slightly_saline' | 'moderately_saline' | 'highly_saline';
  nitrogenRating?: 'low' | 'medium' | 'high';
  phosphorusRating?: 'low' | 'medium' | 'high';
  potassiumRating?: 'low' | 'medium' | 'high';
  organicCarbonRating?: 'low' | 'medium' | 'high';
  notes?: string;
}

export type IrrigationSourceType =
  | 'open_well'           // துரவு / திறந்த கிணறு
  | 'borewell'            // ஆழ்துளைக் கிணறு
  | 'canal_sluice'        // கால்வாய் பாசனம் (Cauvery, Amaravathi, etc.)
  | 'tank_eri'            // ஏரிப் பாசனம்
  | 'farm_pond'           // பண்ணைக் குட்டை
  | 'river_lift'          // ஆற்று நீரேற்று
  | 'rainfed';            // மானாவாரி (மழை மட்டும்)

export type IrrigationDistributionMethod =
  | 'alternate_wetting_drying' // AWD (நெல் மாற்றுப் பாசனம்)
  | 'drip'                    // சொட்டுநீர்ப் பாசனம்
  | 'sprinkler'               // தெளிப்புநீர்ப் பாசனம்
  | 'basin_flooding'          // பாத்திப் பாசனம்
  | 'furrow'                  // சால் பாசனம்
  | 'none';

export interface FarmIrrigationInfrastructure {
  sourceType: IrrigationSourceType;
  sourceName?: string;
  distributionMethod: IrrigationDistributionMethod;
  waterQualityIndex?: 'sweet_potable' | 'normal_irrigation' | 'brackish' | 'saline_unsuitable';
  waterAvailabilityStatus: 'year_round' | 'seasonal_monsoon' | 'critical_scarcity' | 'tank_dependent';
  depthFeet?: number;
}

export interface WaterManagementGuidance {
  recommendedAction: string;
  recommendedActionTamil: string;
  irrigationSchedule: string;
  irrigationScheduleTamil: string;
  recommendedFrequencyDays?: number;
  recommendedWaterDepthMm?: number;
  waterConservationPotentialPercent?: number;
  cropType?: string;
  cropStage?: string;
  alternateWettingDryingAdvice?: string;
  alternateWettingDryingAdviceTamil?: string;
  salinitySoilAmendmentAdvice?: string;
  salinitySoilAmendmentAdviceTamil?: string;
  precipitationPauseAdvice?: string;
  cautiousNotice: string;
  cautiousNoticeTamil: string;
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
  satelliteReport?: SatelliteVegetationReport;
  soilProfile?: FarmSoilProfile;
  soilTests?: LaboratorySoilTest[];
  irrigationInfrastructure?: FarmIrrigationInfrastructure;
  waterGuidance?: WaterManagementGuidance;
  activities?: FarmActivityRecord[];
  createdAt?: any;
  updatedAt?: any;
}

export interface FarmActivityRecord {
  id: string;
  activityType: 'sowing' | 'irrigation' | 'fertilizer' | 'pesticide_spray' | 'weeding' | 'harvest' | 'scouting' | 'soil_amendment';
  activityDate: string; // 'YYYY-MM-DD'
  title: string;
  titleTamil?: string;
  description: string;
  descriptionTamil?: string;
  quantity?: string; // e.g. "50 kg Urea", "2 hours borewell run"
  costInr?: number;
  recordedBy?: string;
}

export interface FarmTimelineEvent {
  id: string;
  date: string; // 'YYYY-MM-DD' or timestamp string
  category: 'registration' | 'sowing' | 'boundary' | 'satellite' | 'soil_test' | 'diagnosis' | 'activity' | 'weather_alert';
  title: string;
  titleTamil: string;
  description: string;
  descriptionTamil: string;
  source: string;
  statusBadge?: string;
  badgeColor?: string;
  metrics?: Record<string, string | number | undefined>;
}

export interface FarmComparisonItem {
  farmId: string;
  farmName: string;
  district: string;
  locality?: string;
  cropType: string;
  variety?: string;
  cropStage?: string;
  plantingDate?: string;
  isPrimary: boolean;
  registeredAreaAcres?: number;
  areaFormatted: string;
  boundaryStatus: 'official_source' | 'imported' | 'farmer_drawn' | 'unmapped';
  hasBoundaryGeometry: boolean;
  measuredAcres?: number;
  irrigationSource?: string;
  irrigationMethod?: string;
  soilSeriesName?: string;
  soilClassification?: string;
  soilPh?: number;
  soilEc?: number;
  soilTestDate?: string;
  soilTestLab?: string;
  isLabSoilVerified: boolean;
  satelliteNdvi?: number;
  satelliteObsDate?: string;
  satelliteCategory?: string;
  satelliteCloudCover?: number;
  weatherTempC?: number;
  weatherHumidity?: number;
  weatherPrecip72hMm?: number;
  weatherHeatRisk?: string;
  diagnosisCount: number;
  highSeverityAlerts: number;
  activitiesCount: number;
}

export interface ExplainableInsight {
  id: string;
  category: 'vegetation' | 'weather' | 'soil' | 'health_incidents' | 'management';
  title: string;
  titleTamil: string;
  description: string;
  descriptionTamil: string;
  comparisonType: 'descriptive_differential' | 'temporal_change' | 'threshold_alert';
  dataPoints: {
    farmName: string;
    metricLabel: string;
    value: string | number;
    dateOrPeriod?: string;
    source: string;
  }[];
  calculationMethod: string;
  methodologyNotice: string;
}

export interface FarmComparisonReport {
  farms: FarmComparisonItem[];
  commonCrop: boolean;
  compatibleObservationDates: boolean;
  insights: ExplainableInsight[];
  generatedAt: string;
}

export interface SatelliteObservation {
  id: string;
  date: string; // ISO date e.g. '2026-10-12'
  satellite: 'Sentinel-2A' | 'Sentinel-2B' | 'Copernicus Sentinel-2';
  instrument: string; // e.g. 'MSI (Multispectral Instrument)'
  productLevel: 'Level-2A' | 'BOA Surface Reflectance';
  resolutionMeters: number; // 10
  cloudCoverPercent: number;
  validPixelPercent: number; // percentage of field free from clouds/shadows
  meanNdvi: number;
  minNdvi: number;
  maxNdvi: number;
  ndviCategory: 'water_bare' | 'sparse_early' | 'moderate' | 'good_vigor' | 'dense_canopy';
  interpretation: string;
  interpretationTamil: string;
  alertFlag?: 'normal' | 'water_stress' | 'canopy_loss' | 'rapid_growth';
  suggestFieldInspection: boolean;
  imageryOverlayUrl?: string;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  isCloudCovered: boolean;
  cloudShadowMaskApplied: boolean;
}

export interface SatelliteVegetationReport {
  farmId: string;
  farmName: string;
  cropType: string;
  cropStage?: string;
  sowingDate?: string;
  geometryAreaAcres: number;
  status: 'available' | 'credentials_required' | 'cloud_covered' | 'no_observations' | 'geometry_required';
  provider: string; // 'ESA Copernicus Data Space Ecosystem' or 'Sentinel Hub'
  providerAttribution: string;
  revisitFrequencyDays: number; // 5
  spectralBandsUsed: {
    nir: string; // 'B08 (842 nm, 10m)'
    red: string; // 'B04 (665 nm, 10m)'
    cloudMask: string; // 'SCL (Scene Classification Layer, 20m)'
  };
  latestObservation?: SatelliteObservation;
  historicalObservations: SatelliteObservation[];
  disclaimer: string;
  disclaimerTamil: string;
  setupInstructions?: {
    requiredEnvVars: string[];
    documentationUrl: string;
    instructions: string;
  };
  cachedAt?: string;
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


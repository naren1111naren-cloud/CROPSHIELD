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

/**
 * Types for the machine learning service
 */

// Feature data for training and prediction
export interface LeadFeatures {
  // Lead properties
  lead_score?: number;
  days_since_created?: number;
  days_since_last_contact?: number;
  
  // Interaction counts
  email_count?: number;
  email_open_rate?: number;
  email_click_rate?: number;
  call_count?: number;
  meeting_count?: number;
  note_count?: number;
  task_count?: number;
  task_completion_rate?: number;
  
  // Website activity
  website_visits?: number;
  page_views?: number;
  time_on_site?: number;
  
  // Lead properties as one-hot encoded features
  status_new?: number;
  status_contacted?: number;
  status_qualified?: number;
  status_proposal?: number;
  status_negotiation?: number;
  
  // Source features
  source_website?: number;
  source_referral?: number;
  source_event?: number;
  source_cold_call?: number;
  source_social?: number;
  
  // Company features
  company_size?: number;
  industry_tech?: number;
  industry_finance?: number;
  industry_healthcare?: number;
  industry_education?: number;
  industry_other?: number;
  
  // Custom features
  has_budget?: number;
  has_authority?: number;
  has_need?: number;
  has_timeline?: number;
}

// Training data with features and labels
export interface TrainingData {
  features: LeadFeatures[];
  labels: {
    converted: number[];  // 1 if converted, 0 if not
    conversion_time?: number[];  // Days to conversion
  };
}

// Model metadata
export interface ModelMetadata {
  id: string;
  version: string;
  created_at: string;
  updated_at: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  feature_importance: {
    feature: string;
    importance: number;
  }[];
}

// Prediction result
export interface PredictionResult {
  lead_id: number;
  conversion_probability: number;
  expected_conversion_time?: number;  // Days
  score_factors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendations: {
    text: string;
    priority: 'high' | 'medium' | 'low';
    expected_impact?: number;
  }[];
  confidence: number;
  model_id: string;
  model_version: string;
  prediction_id: string;
  created_at: string;
}

// Training job status
export interface TrainingJobStatus {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;  // 0-100
  started_at: string;
  completed_at?: string;
  error?: string;
  model_id?: string;
}

// ML Service interface
export interface MLService {
  // Training
  trainModel(data: TrainingData): Promise<TrainingJobStatus>;
  getTrainingStatus(jobId: string): Promise<TrainingJobStatus>;
  
  // Prediction
  predictConversion(leadId: number, features: LeadFeatures): Promise<PredictionResult>;
  batchPredictConversion(leads: { id: number; features: LeadFeatures }[]): Promise<PredictionResult[]>;
  
  // Model management
  getModels(): Promise<ModelMetadata[]>;
  getModelById(modelId: string): Promise<ModelMetadata>;
  deleteModel(modelId: string): Promise<void>;
  
  // Feature engineering
  extractFeatures(leadId: number): Promise<LeadFeatures>;
  batchExtractFeatures(leadIds: number[]): Promise<{ id: number; features: LeadFeatures }[]>;
} 
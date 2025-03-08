import { v4 as uuidv4 } from 'uuid';
import supabase from '@/lib/supabase/client';
import { 
  MLService, 
  LeadFeatures, 
  TrainingData, 
  ModelMetadata, 
  PredictionResult, 
  TrainingJobStatus 
} from './types';
import { extractFeaturesForLead, batchExtractFeatures } from './featureExtraction';

/**
 * Implementation of the ML service that integrates with Supabase
 */
export class SupabaseMLService implements MLService {
  private readonly modelsTable = 'ml_models';
  private readonly predictionsTable = 'ml_predictions';
  private readonly trainingJobsTable = 'ml_training_jobs';
  private readonly featuresTable = 'ml_lead_features';
  
  /**
   * Start a model training job
   */
  async trainModel(data: TrainingData): Promise<TrainingJobStatus> {
    try {
      // In a real implementation, this would send the training data to a backend service
      // For now, we'll simulate a training job
      const jobId = uuidv4();
      const startedAt = new Date().toISOString();
      
      const trainingJob: TrainingJobStatus = {
        job_id: jobId,
        status: 'pending',
        progress: 0,
        started_at: startedAt
      };
      
      // Store the training job in Supabase
      const { error } = await supabase
        .from(this.trainingJobsTable)
        .insert(trainingJob);
      
      if (error) {
        console.error('Error creating training job:', error);
        throw new Error(`Error creating training job: ${error.message}`);
      }
      
      // In a real implementation, this would trigger a backend process
      // For now, we'll simulate progress updates
      this.simulateTrainingProgress(jobId);
      
      return trainingJob;
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }
  
  /**
   * Get the status of a training job
   */
  async getTrainingStatus(jobId: string): Promise<TrainingJobStatus> {
    try {
      const { data, error } = await supabase
        .from(this.trainingJobsTable)
        .select('*')
        .eq('job_id', jobId)
        .single();
      
      if (error) {
        console.error('Error fetching training job:', error);
        throw new Error(`Error fetching training job: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Training job not found with ID: ${jobId}`);
      }
      
      return data as TrainingJobStatus;
    } catch (error) {
      console.error('Error getting training status:', error);
      throw error;
    }
  }
  
  /**
   * Predict conversion for a single lead
   */
  async predictConversion(leadId: number, features?: LeadFeatures): Promise<PredictionResult> {
    try {
      console.log(`Predicting conversion for lead ID: ${leadId}`);
      
      // Extract features if not provided
      const leadFeatures = features || await extractFeaturesForLead(leadId);
      
      // Get the latest model
      const { data: models, error: modelsError } = await supabase
        .from(this.modelsTable)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (modelsError) {
        console.error('Error fetching models:', modelsError);
        throw new Error(`Error fetching models: ${modelsError.message}`);
      }
      
      // If no models exist, use a default model
      const model = models && models.length > 0 
        ? models[0] as ModelMetadata
        : this.getDefaultModel();
      
      // In a real implementation, this would call a prediction API
      // For now, we'll generate a prediction based on the features
      const prediction = this.generatePrediction(leadId, leadFeatures, model);
      
      // Store the prediction in Supabase
      const { error: predictionError } = await supabase
        .from(this.predictionsTable)
        .insert(prediction);
      
      if (predictionError) {
        console.error('Error storing prediction:', predictionError);
        // Continue anyway, as this is not critical
      }
      
      return prediction;
    } catch (error) {
      console.error('Error predicting conversion:', error);
      throw error;
    }
  }
  
  /**
   * Predict conversion for multiple leads
   */
  async batchPredictConversion(leads: { id: number; features: LeadFeatures }[]): Promise<PredictionResult[]> {
    try {
      console.log(`Batch predicting conversion for ${leads.length} leads`);
      
      // Get the latest model
      const { data: models, error: modelsError } = await supabase
        .from(this.modelsTable)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (modelsError) {
        console.error('Error fetching models:', modelsError);
        throw new Error(`Error fetching models: ${modelsError.message}`);
      }
      
      // If no models exist, use a default model
      const model = models && models.length > 0 
        ? models[0] as ModelMetadata
        : this.getDefaultModel();
      
      // Generate predictions for each lead
      const predictions: PredictionResult[] = leads.map(lead => 
        this.generatePrediction(lead.id, lead.features, model)
      );
      
      // Store the predictions in Supabase
      const { error: predictionError } = await supabase
        .from(this.predictionsTable)
        .insert(predictions);
      
      if (predictionError) {
        console.error('Error storing predictions:', predictionError);
        // Continue anyway, as this is not critical
      }
      
      return predictions;
    } catch (error) {
      console.error('Error batch predicting conversion:', error);
      throw error;
    }
  }
  
  /**
   * Get all models
   */
  async getModels(): Promise<ModelMetadata[]> {
    try {
      const { data, error } = await supabase
        .from(this.modelsTable)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching models:', error);
        throw new Error(`Error fetching models: ${error.message}`);
      }
      
      return (data || []) as ModelMetadata[];
    } catch (error) {
      console.error('Error getting models:', error);
      throw error;
    }
  }
  
  /**
   * Get a model by ID
   */
  async getModelById(modelId: string): Promise<ModelMetadata> {
    try {
      const { data, error } = await supabase
        .from(this.modelsTable)
        .select('*')
        .eq('id', modelId)
        .single();
      
      if (error) {
        console.error('Error fetching model:', error);
        throw new Error(`Error fetching model: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Model not found with ID: ${modelId}`);
      }
      
      return data as ModelMetadata;
    } catch (error) {
      console.error('Error getting model:', error);
      throw error;
    }
  }
  
  /**
   * Delete a model
   */
  async deleteModel(modelId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.modelsTable)
        .delete()
        .eq('id', modelId);
      
      if (error) {
        console.error('Error deleting model:', error);
        throw new Error(`Error deleting model: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }
  
  /**
   * Extract features for a lead
   */
  async extractFeatures(leadId: number): Promise<LeadFeatures> {
    return extractFeaturesForLead(leadId);
  }
  
  /**
   * Extract features for multiple leads
   */
  async batchExtractFeatures(leadIds: number[]): Promise<{ id: number; features: LeadFeatures }[]> {
    return batchExtractFeatures(leadIds);
  }
  
  /**
   * Simulate training progress updates
   * In a real implementation, this would be handled by a backend service
   */
  private simulateTrainingProgress(jobId: string): void {
    let progress = 0;
    
    const interval = setInterval(async () => {
      progress += 10;
      
      if (progress <= 100) {
        const status = progress < 100 ? 'running' : 'completed';
        const completedAt = progress === 100 ? new Date().toISOString() : undefined;
        const modelId = progress === 100 ? uuidv4() : undefined;
        
        // Update the training job
        const { error } = await supabase
          .from(this.trainingJobsTable)
          .update({
            status,
            progress,
            completed_at: completedAt,
            model_id: modelId
          })
          .eq('job_id', jobId);
        
        if (error) {
          console.error('Error updating training job:', error);
          clearInterval(interval);
          return;
        }
        
        // If training is complete, create a model
        if (progress === 100 && modelId) {
          this.createModel(modelId);
          clearInterval(interval);
        }
      } else {
        clearInterval(interval);
      }
    }, 2000); // Update every 2 seconds
  }
  
  /**
   * Create a model after training is complete
   */
  private async createModel(modelId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const model: ModelMetadata = {
        id: modelId,
        version: '1.0.0',
        created_at: now,
        updated_at: now,
        metrics: {
          accuracy: 0.85,
          precision: 0.82,
          recall: 0.79,
          f1_score: 0.80
        },
        feature_importance: [
          { feature: 'days_since_last_contact', importance: 0.25 },
          { feature: 'email_count', importance: 0.20 },
          { feature: 'task_completion_rate', importance: 0.18 },
          { feature: 'lead_score', importance: 0.15 },
          { feature: 'meeting_count', importance: 0.12 },
          { feature: 'has_budget', importance: 0.10 }
        ]
      };
      
      const { error } = await supabase
        .from(this.modelsTable)
        .insert(model);
      
      if (error) {
        console.error('Error creating model:', error);
        throw new Error(`Error creating model: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }
  
  /**
   * Get a default model when no trained models exist
   */
  private getDefaultModel(): ModelMetadata {
    const now = new Date().toISOString();
    
    return {
      id: 'default-model',
      version: '1.0.0',
      created_at: now,
      updated_at: now,
      metrics: {
        accuracy: 0.75,
        precision: 0.72,
        recall: 0.70,
        f1_score: 0.71
      },
      feature_importance: [
        { feature: 'days_since_last_contact', importance: 0.25 },
        { feature: 'email_count', importance: 0.20 },
        { feature: 'task_completion_rate', importance: 0.18 },
        { feature: 'lead_score', importance: 0.15 },
        { feature: 'meeting_count', importance: 0.12 },
        { feature: 'has_budget', importance: 0.10 }
      ]
    };
  }
  
  /**
   * Generate a prediction based on features
   * In a real implementation, this would use a trained model
   */
  private generatePrediction(leadId: number, features: LeadFeatures, model: ModelMetadata): PredictionResult {
    // Calculate a base probability using a weighted sum of features
    let probability = 0.5; // Default
    let totalWeight = 0;
    
    // Apply weights from feature importance
    for (const { feature, importance } of model.feature_importance) {
      const featureValue = features[feature as keyof LeadFeatures];
      if (featureValue !== undefined) {
        // Normalize the feature value to a 0-1 scale
        const normalizedValue = this.normalizeFeature(feature, featureValue as number);
        probability += normalizedValue * importance;
        totalWeight += importance;
      }
    }
    
    // Adjust for total weight
    if (totalWeight > 0) {
      probability = probability / totalWeight;
    }
    
    // Ensure probability is between 0 and 1
    probability = Math.max(0, Math.min(1, probability));
    
    // Generate score factors based on features
    const scoreFactors = this.generateScoreFactors(features, model);
    
    // Generate recommendations based on probability and features
    const recommendations = this.generateRecommendations(probability, features);
    
    // Create the prediction result
    const prediction: PredictionResult = {
      lead_id: leadId,
      conversion_probability: probability,
      expected_conversion_time: this.estimateConversionTime(probability, features),
      score_factors: scoreFactors,
      recommendations: recommendations,
      confidence: 0.8, // Fixed confidence for now
      model_id: model.id,
      model_version: model.version,
      prediction_id: uuidv4(),
      created_at: new Date().toISOString()
    };
    
    return prediction;
  }
  
  /**
   * Normalize a feature value to a 0-1 scale
   */
  private normalizeFeature(feature: string, value: number): number {
    // Different normalization strategies for different features
    switch (feature) {
      case 'days_since_last_contact':
        // Inverse relationship: more days = lower score
        return Math.max(0, 1 - (value / 30)); // 30 days as max
        
      case 'email_count':
      case 'call_count':
      case 'meeting_count':
      case 'note_count':
        // More interactions = higher score, but with diminishing returns
        return Math.min(1, value / 10); // 10 as saturation point
        
      case 'task_completion_rate':
        // Direct mapping: 0-1 already
        return value;
        
      case 'lead_score':
        // Normalize from 0-10 to 0-1
        return value / 10;
        
      default:
        // For binary features, return as is
        return value;
    }
  }
  
  /**
   * Generate score factors based on features
   */
  private generateScoreFactors(features: LeadFeatures, model: ModelMetadata): PredictionResult['score_factors'] {
    const factors: PredictionResult['score_factors'] = [];
    
    // Check days since last contact
    if (features.days_since_last_contact !== undefined) {
      const impact = features.days_since_last_contact <= 7 
        ? 0.2 
        : features.days_since_last_contact <= 14 
          ? 0 
          : -0.3;
      
      factors.push({
        factor: 'Recent contact',
        impact,
        description: features.days_since_last_contact <= 7 
          ? 'Recent contact within the last week' 
          : features.days_since_last_contact <= 14 
            ? 'Contact within the last two weeks' 
            : 'No recent contact in over two weeks'
      });
    }
    
    // Check email engagement
    if (features.email_count !== undefined) {
      const impact = features.email_count >= 5 ? 0.25 : features.email_count >= 2 ? 0.1 : -0.1;
      
      factors.push({
        factor: 'Email engagement',
        impact,
        description: features.email_count >= 5 
          ? 'High email engagement' 
          : features.email_count >= 2 
            ? 'Moderate email engagement' 
            : 'Low email engagement'
      });
    }
    
    // Check meeting engagement
    if (features.meeting_count !== undefined) {
      const impact = features.meeting_count >= 2 ? 0.3 : features.meeting_count >= 1 ? 0.15 : -0.2;
      
      factors.push({
        factor: 'Meeting engagement',
        impact,
        description: features.meeting_count >= 2 
          ? 'Multiple meetings held' 
          : features.meeting_count >= 1 
            ? 'One meeting held' 
            : 'No meetings yet'
      });
    }
    
    // Check task completion
    if (features.task_completion_rate !== undefined) {
      const impact = features.task_completion_rate >= 0.8 
        ? 0.2 
        : features.task_completion_rate >= 0.5 
          ? 0.1 
          : -0.1;
      
      factors.push({
        factor: 'Task completion',
        impact,
        description: features.task_completion_rate >= 0.8 
          ? 'High task completion rate' 
          : features.task_completion_rate >= 0.5 
            ? 'Moderate task completion rate' 
            : 'Low task completion rate'
      });
    }
    
    // Check BANT criteria
    let bantCount = 0;
    if (features.has_budget) bantCount++;
    if (features.has_authority) bantCount++;
    if (features.has_need) bantCount++;
    if (features.has_timeline) bantCount++;
    
    if (bantCount > 0) {
      const impact = bantCount >= 3 ? 0.4 : bantCount >= 2 ? 0.2 : 0.1;
      
      factors.push({
        factor: 'BANT qualification',
        impact,
        description: bantCount >= 3 
          ? 'Well qualified (3+ BANT criteria)' 
          : bantCount >= 2 
            ? 'Partially qualified (2 BANT criteria)' 
            : 'Minimally qualified (1 BANT criterion)'
      });
    }
    
    // Sort factors by absolute impact
    return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }
  
  /**
   * Generate recommendations based on probability and features
   */
  private generateRecommendations(probability: number, features: LeadFeatures): PredictionResult['recommendations'] {
    const recommendations: PredictionResult['recommendations'] = [];
    
    // Recommendations based on conversion probability
    if (probability < 0.3) {
      // Low probability recommendations
      recommendations.push({
        text: 'Qualify lead interest level with discovery call',
        priority: 'high'
      });
      
      recommendations.push({
        text: 'Add to nurture campaign to build relationship',
        priority: 'medium'
      });
    } else if (probability < 0.7) {
      // Medium probability recommendations
      recommendations.push({
        text: 'Schedule product demonstration',
        priority: 'high'
      });
      
      recommendations.push({
        text: 'Share relevant case studies',
        priority: 'medium'
      });
    } else {
      // High probability recommendations
      recommendations.push({
        text: 'Prepare and send proposal',
        priority: 'high'
      });
      
      recommendations.push({
        text: 'Identify and engage decision makers',
        priority: 'high'
      });
    }
    
    // Recommendations based on features
    
    // Check days since last contact
    if (features.days_since_last_contact !== undefined && features.days_since_last_contact > 7) {
      recommendations.push({
        text: 'Follow up with lead (no contact in 7+ days)',
        priority: 'high'
      });
    }
    
    // Check email engagement
    if (features.email_count !== undefined && features.email_count < 2) {
      recommendations.push({
        text: 'Send personalized email to increase engagement',
        priority: 'medium'
      });
    }
    
    // Check meeting engagement
    if (features.meeting_count !== undefined && features.meeting_count === 0) {
      recommendations.push({
        text: 'Schedule initial discovery call',
        priority: features.days_since_created && features.days_since_created > 14 ? 'high' : 'medium'
      });
    }
    
    // Check BANT criteria
    if (!features.has_budget) {
      recommendations.push({
        text: 'Discuss budget and ROI expectations',
        priority: probability > 0.5 ? 'high' : 'medium'
      });
    }
    
    if (!features.has_authority) {
      recommendations.push({
        text: 'Identify key decision makers',
        priority: probability > 0.6 ? 'high' : 'medium'
      });
    }
    
    if (!features.has_need) {
      recommendations.push({
        text: 'Explore pain points and needs',
        priority: 'medium'
      });
    }
    
    if (!features.has_timeline) {
      recommendations.push({
        text: 'Establish timeline for decision making',
        priority: probability > 0.7 ? 'high' : 'medium'
      });
    }
    
    // Sort recommendations by priority
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    return recommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 5); // Limit to top 5 recommendations
  }
  
  /**
   * Estimate time to conversion based on probability and features
   */
  private estimateConversionTime(probability: number, features: LeadFeatures): number {
    // Base estimate based on probability
    let estimate = probability >= 0.8 ? 14 : // 2 weeks
                  probability >= 0.6 ? 30 : // 1 month
                  probability >= 0.4 ? 60 : // 2 months
                  90; // 3 months
    
    // Adjust based on features
    
    // More meetings = faster conversion
    if (features.meeting_count !== undefined && features.meeting_count > 0) {
      estimate *= 0.8;
    }
    
    // Higher task completion = faster conversion
    if (features.task_completion_rate !== undefined && features.task_completion_rate > 0.7) {
      estimate *= 0.9;
    }
    
    // BANT criteria = faster conversion
    let bantCount = 0;
    if (features.has_budget) bantCount++;
    if (features.has_authority) bantCount++;
    if (features.has_need) bantCount++;
    if (features.has_timeline) bantCount++;
    
    if (bantCount >= 3) {
      estimate *= 0.7;
    } else if (bantCount >= 2) {
      estimate *= 0.85;
    }
    
    return Math.round(estimate);
  }
} 
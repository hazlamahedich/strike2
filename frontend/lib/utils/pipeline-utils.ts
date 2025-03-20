import { PipelineStage } from '../types/pipeline';
import { LeadStatus } from '../types/lead';

/**
 * Maps a low conversion pipeline stage to the appropriate lead status
 * This ensures consistency between the pipeline stage and lead status
 */
export function mapStageToLeadStatus(stage: PipelineStage): LeadStatus {
  switch (stage) {
    case PipelineStage.EARLY_NURTURE:
      return LeadStatus.NEW;
    case PipelineStage.EDUCATION:
      return LeadStatus.CONTACTED;
    case PipelineStage.VALUE_PROPOSITION:
      return LeadStatus.ENGAGED;
    case PipelineStage.REENGAGEMENT:
      return LeadStatus.QUALIFIED;
    case PipelineStage.EXIT_DECISION:
      return LeadStatus.STALLED;
    default:
      return LeadStatus.NEW;
  }
}

/**
 * Determines if a lead status change is required when moving to a new stage
 */
export function shouldUpdateLeadStatus(currentStatus: LeadStatus, targetStage: PipelineStage): boolean {
  const targetStatus = mapStageToLeadStatus(targetStage);
  
  // Don't downgrade lead status (e.g., from QUALIFIED to CONTACTED)
  // Status hierarchy: NEW < CONTACTED < ENGAGED < QUALIFIED < STALLED
  const statusHierarchy = {
    [LeadStatus.NEW]: 1,
    [LeadStatus.CONTACTED]: 2,
    [LeadStatus.ENGAGED]: 3,
    [LeadStatus.QUALIFIED]: 4,
    [LeadStatus.STALLED]: 5,
  };
  
  // Only update if the new status is higher in the hierarchy
  return statusHierarchy[targetStatus] > statusHierarchy[currentStatus];
} 
/**
 * Pipeline stage enum for the low conversion pipeline
 */
export enum PipelineStage {
  EARLY_NURTURE = 'early_nurture',
  EDUCATION = 'education',
  VALUE_PROPOSITION = 'value_proposition',
  REENGAGEMENT = 're_engagement',
  EXIT_DECISION = 'exit_decision',
}

/**
 * Exit decision options for leads that reach the Exit Decision stage
 */
export enum ExitDecisionOption {
  MARK_AS_LOST = 'mark_as_lost',
  LONG_TERM_NURTURE = 'long_term_nurture',
  RECATEGORIZE = 'recategorize',
  RETURN_TO_SALES = 'return_to_sales',
  CONTINUE_MONITORING = 'continue_monitoring',
}

/**
 * Interface for workflow stages in the low conversion pipeline
 */
export interface WorkflowStage {
  id: string;
  name: string;
  leads: any[]; // This will be Lead[] in practice
} 
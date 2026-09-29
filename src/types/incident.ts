export type IncidentSeverity = 'P1 - Critical' | 'P2 - High' | 'P3 - Medium' | 'P4 - Low';

export type IncidentStatus = 
  | 'INVESTIGATING' 
  | 'AWAITING_APPROVAL' 
  | 'ACTION_EXECUTING' 
  | 'RESOLVED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface IncidentMetric {
  errorRate: string;
  p99Latency: string;
  activeConnections: number;
  cpuUsage: string;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  commandOrDiff: string;
  riskLevel: RiskLevel;
  estimatedRecoveryTime: string;
  whyThisAction: string;
  rollbackCommand?: string;
}

export interface FailedAttemptWarning {
  attemptedSolution: string;
  whyFailed: string;
  historicalIncidentId: string;
}

export interface IncidentDiagnosis {
  rootCause: string;
  confidence: number;
  reasoning: string;
  recalledMemoryId?: string;
  recalledMemoryTitle?: string;
  recalledSimilarityScore?: number;
  recommendedAction: RecommendedAction;
  failedPastAttempts: FailedAttemptWarning[];
  source: 'HINDSIGHT_MEMORY' | 'FIRST_PRINCIPLES_ANALYSIS';
}

export interface ApprovalRecord {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface ExecutionLog {
  timestamp: string;
  step: string;
  output: string;
  status: 'info' | 'running' | 'success' | 'failed';
}

export interface PostMortem {
  incidentId: string;
  title: string;
  durationMinutes: number;
  summary: string;
  timeline: Array<{
    time: string;
    event: string;
    type: 'alert' | 'agent' | 'human' | 'action' | 'recovery';
  }>;
  rootCause: string;
  remediationTaken: string;
  preventativeActions: string[];
  hindsightLearningCommitted: boolean;
  hindsightMemoryId?: string;
}

export interface Incident {
  id: string;
  title: string;
  service: string;
  environment: 'production' | 'staging';
  severity: IncidentSeverity;
  status: IncidentStatus;
  startedAt: string;
  resolvedAt?: string;
  errorSignature: string;
  rawLogs: string[];
  metrics: IncidentMetric;
  diagnosis?: IncidentDiagnosis;
  approval?: ApprovalRecord;
  executionLogs?: ExecutionLog[];
  postMortem?: PostMortem;
}

export interface HindsightMemory {
  id: string;
  title: string;
  service: string;
  errorSignature: string;
  rootCause: string;
  successfulSolutions: Array<{
    solution: string;
    actionCommand: string;
    approvedBy: string;
    ttfrMinutes: number;
    effectivenessScore: number;
    dateResolved: string;
    outcomeSummary: string;
  }>;
  failedSolutions: Array<{
    solution: string;
    attemptedCommand: string;
    whyFailed: string;
    dateAttempted: string;
  }>;
  frequencyCount: number;
  avgMttrMinutes: number;
  tags: string[];
  lessonsLearned: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryComparisonResult {
  incidentTitle: string;
  errorSignature: string;
  withoutMemory: {
    diagnosis: string;
    suggestedActions: string[];
    riskOfMistake: string;
    estimatedTimeToResolution: string;
    notes: string;
  };
  withHindsight: {
    recalledMemoryId: string;
    diagnosis: string;
    suggestedActions: string[];
    preemptedPitfalls: string[]; // what failed previously that we avoid now!
    estimatedTimeToResolution: string;
    confidence: number;
    provenRemediationScript: string;
  };
}

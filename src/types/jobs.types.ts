// =============================================================================
// BCIS — Job Data Type Definitions
//
// Plain TypeScript interfaces for BullMQ job payloads.
// No runtime dependencies.
// =============================================================================

export interface EvidenceJobData {
  productId: string
}

export interface MatchingJobData {
  caseId:      string
  triggeredBy: string   // advisor user id who triggered the job
}

export interface ExportJobData {
  stub:        true
  requestedBy: string   // user id who requested the export
}

// Shared TypeScript Types for trustmebro
// This file contains all shared types used across frontend, backend, and AI engine

// ============================================
// Verification Types
// ============================================

export type GigType = 'SOFTWARE' | 'COPYWRITING' | 'DATA_ENTRY' | 'TRANSLATION';

export type GigSubtype =
  // Software subtypes
  | 'WEB_DEVELOPMENT'
  | 'MOBILE_DEVELOPMENT'
  | 'DESKTOP_APPLICATIONS'
  | 'APIS_INTEGRATIONS'
  | 'DATABASE_DESIGN'
  | 'DEVOPS_INFRASTRUCTURE'
  // Copywriting subtypes
  | 'BLOG_POSTS'
  | 'WEBSITE_COPY'
  | 'EMAIL_MARKETING'
  | 'SOCIAL_MEDIA'
  | 'PRODUCT_DESCRIPTIONS'
  | 'SALES_MARKETING'
  // Data Entry subtypes
  | 'FORM_DIGITIZATION'
  | 'DATABASE_POPULATION'
  | 'DATA_CLEANING'
  | 'SPREADSHEET_CREATION'
  | 'DOCUMENT_TRANSCRIPTION'
  | 'DATA_EXTRACTION'
  // Translation subtypes
  | 'WEBSITE_LOCALIZATION'
  | 'DOCUMENT_TRANSLATION'
  | 'SUBTITLE_TRANSLATION'
  | 'MARKETING_TRANSLATION'
  | 'SOFTWARE_UI_TRANSLATION'
  | 'AUDIO_VIDEO_TRANSLATION';

export type CriterionType = 'PRIMARY' | 'SECONDARY';
export type CriterionStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'PENDING';
export type PaymentDecision = 'AUTO_RELEASE' | 'HOLD' | 'DISPUTE';
export type PFISignalStatus = 'WARNING' | 'INFO';

export interface Criterion {
  name: string;
  type: CriterionType;
  status: CriterionStatus;
  detail: string;
  weight: number; // 0-1, sum should be 1.0
  check_type?: string; // For backend: how to verify this criterion
}

export interface PFISignal {
  name: string;
  status: PFISignalStatus;
  detail: string;
}

export interface VerificationReport {
  milestone_id: string;
  gig_type: GigType;
  gig_subtype: GigSubtype;
  overall_score: number; // 0-100
  payment_decision: PaymentDecision;
  criteria: Criterion[];
  pfi_signals: PFISignal[];
  resubmissions_remaining: number;
  feedback_for_freelancer: string;
  created_at: string;
  verification_lane?: string; // For debugging
}

// ============================================
// Chat Types
// ============================================

export type Sender = 'employer' | 'freelancer' | 'ai_mediator';
export type MessageType = 'normal' | 'question' | 'scope_creep' | 'complaint' | 'contradiction';
export type AIActionType = 'spec_gap_intercept' | 'scope_creep_detect' | 'conflict_deescalate' | 'contradiction_warn';
export type AIResponseType = 'spec_clarification' | 'change_request' | 'none';

export interface AIAction {
  action_type: AIActionType;
  ai_response: string;
  requires_response: boolean;
  response_type: AIResponseType;
}

export interface ChatMessage {
  message_id: string;
  channel_id: string;
  sender: Sender;
  content: string;
  timestamp: string;
  type: MessageType;
  ai_action?: AIAction;
  attachments?: string[];
}

export interface ChatChannel {
  channel_id: string;
  job_id: string;
  participants: {
    employer_id: string;
    freelancer_id: string;
  };
  created_at: string;
  is_active: boolean;
}

// ============================================
// Job Types
// ============================================

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'ASSIGNED' | 'ESCROW_FUNDED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
export type UserRole = 'employer' | 'freelancer';

export interface Job {
  job_id: string;
  employer_id: string;
  title: string;
  description: string;
  gig_type: GigType;
  gig_subtype: GigSubtype;
  budget_range: BudgetRange;
  deadline: string;
  status: JobStatus;
  spec?: JobSpec;
  created_at: string;
  published_at?: string;
  employer_name?: string; // For display purposes
  employer_pfi?: number; // For display purposes
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
}

export interface JobSpec {
  spec_id: string;
  job_id: string;
  milestones: Milestone[];
  required_assets: RequiredAsset[];
  version: number;
  is_locked: boolean;
  locked_at?: string;
  clarifications: SpecClarification[];
}

export interface Milestone {
  milestone_id: string;
  order: number;
  title: string;
  deadline: string;
  criteria: MilestoneCriterion[];
  submission_requirements: SubmissionRequirement[];
}

export interface MilestoneCriterion {
  criterion_id: string;
  name: string;
  description: string;
  is_verifiable: boolean;
  status: CriterionStatus;
  is_vague: boolean;
  vague_resolved: boolean;
  weight?: number; // 0-1
}

export interface RequiredAsset {
  asset_id: string;
  name: string;
  description: string;
  is_delivered: boolean;
  delivered_at?: string;
}

export interface SubmissionRequirement {
  type: 'github_link' | 'file_upload' | 'text_paste' | 'document_pair';
  description: string;
  file_types?: string[];
  max_size_mb?: number;
}

export interface SpecClarification {
  clarification_id: string;
  spec_id: string;
  question: string;
  answer: string;
  asked_by: 'employer' | 'freelancer';
  answered_by: string;
  created_at: string;
  answered_at: string;
}

// ============================================
// User & Auth Types
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pfi_score?: number;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

// ============================================
// Bid Types
// ============================================

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Bid {
  bid_id: string;
  job_id: string;
  freelancer_id: string;
  freelancer_name: string;
  freelancer_pfi: number;
  cover_letter: string;
  proposed_deadline?: string;
  proposed_budget?: number;
  status: BidStatus;
  created_at: string;
}

// ============================================
// Submission Types
// ============================================

export type SubmissionStatus = 'PENDING' | 'VERIFIED' | 'PARTIAL' | 'FAIL' | 'RESUBMITTED';

export interface Submission {
  submission_id: string;
  job_id: string;
  milestone_id: string;
  freelancer_id: string;
  submission_type: 'github_link' | 'file_upload' | 'text_paste' | 'document_pair';
  github_link?: string;
  file_urls?: string[];
  text_content?: string;
  source_document_url?: string; // For translation gigs
  status: SubmissionStatus;
  verification_report?: VerificationReport;
  resubmission_count: number;
  resubmissions_remaining: number;
  created_at: string;
}

// ============================================
// Escrow Types
// ============================================

export type EscrowStatus = 'FUNDED' | 'HELD' | 'RELEASED' | 'REFUNDED';

export interface Escrow {
  escrow_id: string;
  job_id: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  funded_at?: string;
  released_at?: string;
  refunded_at?: string;
}

// ============================================
// Change Request Types
// ============================================

export type ChangeRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ChangeRequest {
  change_request_id: string;
  job_id: string;
  requested_by: 'employer' | 'freelancer';
  description: string;
  new_scope?: string;
  budget_adjustment?: number;
  deadline_adjustment?: string;
  status: ChangeRequestStatus;
  created_at: string;
  responded_at?: string;
}

// ============================================
// Dispute Types
// ============================================

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface Dispute {
  dispute_id: string;
  job_id: string;
  submission_id: string;
  raised_by: string;
  reason: string;
  status: DisputeStatus;
  arbitrator_notes?: string;
  decision?: string;
  winner_id?: string;
  pfi_penalty?: number;
  created_at: string;
  resolved_at?: string;
}

// ============================================
// API Response Types
// ============================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// ============================================
// Filter & Query Types
// ============================================

export interface JobFilters {
  gig_type?: GigType;
  min_budget?: number;
  max_budget?: number;
  deadline_before?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export interface BidFormData {
  cover_letter: string;
  proposed_timeline?: string;
  proposed_budget?: number;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// ============================================
// UI State Types
// ============================================

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// ============================================
// Stats & Dashboard Types
// ============================================

export interface EmployerStats {
  active_jobs: number;
  total_spent: number;
  pending_bids: number;
  in_progress_projects: number;
  completed_projects: number;
}

export interface FreelancerStats {
  active_projects: number;
  total_earned: number;
  pending_submissions: number;
  completed_projects: number;
  pfi_score: number;
}

// ============================================
// Verification Lane Specific Types
// ============================================

export interface SoftwareVerificationInput {
  github_url: string;
  deployed_url?: string;
}

export interface CopywritingVerificationInput {
  text_content: string;
  file_url?: string;
}

export interface DataEntryVerificationInput {
  file_url: string;
  file_type: 'csv' | 'xlsx';
}

export interface TranslationVerificationInput {
  source_document_url: string;
  target_document_url: string;
  terminology_glossary_url?: string;
}

export type VerificationInput =
  | SoftwareVerificationInput
  | CopywritingVerificationInput
  | DataEntryVerificationInput
  | TranslationVerificationInput;

/**
 * API Services for TrustMeBro Platform
 * Connects to the FastAPI backend
 */
import api from './client';

// ============== TYPES ==============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'employer' | 'freelancer';
  pfi_score: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  gig_type: string;
  gig_subtype: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  status: string;
  employer_id: number;
  employer_name?: string;
  employer_pfi?: number;
  assigned_freelancer_id?: number;
  assigned_freelancer_name?: string;
  created_at: string;
  published_at?: string;
}

export interface JobSpec {
  id: number;
  job_id: number;
  milestones_json: Milestone[];
  requirements_json: Record<string, any>;
  deliverables_json: string[];
  is_locked: boolean;
  employer_confirmed: boolean;
  freelancer_confirmed: boolean;
  created_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  order: number;
  deliverables?: string[];
}

export interface Bid {
  id: number;
  job_id: number;
  freelancer_id: number;
  freelancer_name: string;
  freelancer_pfi: number;
  amount: number;
  message: string;
  estimated_days: number;
  status: string;
  created_at: string;
}

export interface Submission {
  id: number;
  job_id: number;
  freelancer_id: number;
  milestone_id: string;
  file_url?: string;
  notes?: string;
  status: string;
  ai_score?: number;
  verification_report_json?: Record<string, any>;
  submitted_at: string;
  reviewed_at?: string;
}

export interface Escrow {
  id: number;
  job_id: number;
  employer_id: number;
  freelancer_id?: number;
  amount: number;
  platform_fee: number;
  status: string;
  released_amount: number;
  funded_at?: string;
  created_at: string;
}

export interface ChatMessage {
  message_id: number;
  channel_id: number;
  sender_id?: number;
  sender_type: string;
  sender_name: string;
  content: string;
  is_ai_generated: boolean;
  ai_intervention_type?: string;
  created_at: string;
}

export interface ChatChannel {
  channel_id: number;
  job_id: number;
  job_title?: string;
  employer_id: number;
  employer_name?: string;
  freelancer_id: number;
  freelancer_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  active_jobs: number;
  total_earned?: number;
  pending_submissions: number;
  completed_jobs: number;
  total_escrow?: number;
  pending_bids?: number;
}

export interface ChangeRequest {
  id: number;
  job_id: number;
  requester_id: number;
  change_type: string;
  description: string;
  budget_impact?: number;
  deadline_impact_days?: number;
  status: string;
  created_at: string;
}

export interface Dispute {
  id: number;
  job_id: number;
  initiated_by: number;
  reason: string;
  description: string;
  status: string;
  resolution?: string;
  created_at: string;
}

export interface NotificationPreferences {
  bid_notifications: boolean;
  assignment_notifications: boolean;
  submission_notifications: boolean;
  payment_notifications: boolean;
  deadline_reminders: boolean;
  ghost_warnings: boolean;
  dispute_notifications: boolean;
  change_request_notifications: boolean;
  verification_results: boolean;
  chat_notifications: boolean;
  email_frequency: 'immediate' | 'daily_digest' | 'weekly_digest';
}

// ============== AUTH SERVICES ==============

export const authService = {
  async register(data: { name: string; email: string; password: string; role: string }): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', data);
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', data);
  },

  async logout(): Promise<void> {
    return api.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    return api.get<User>('/users/me');
  },

  async updateProfile(data: { name: string }): Promise<ApiResponse<User>> {
    return api.put<ApiResponse<User>>('/users/me', data);
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>('/auth/change-password', data);
  },

  async verifyEmail(token: string): Promise<ApiResponse<any>> {
    return api.get<ApiResponse<any>>(`/auth/verify-email?token=${token}`);
  },

  async resendVerification(): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>('/auth/resend-verification');
  },
};

// ============== JOB SERVICES ==============

export const jobService = {
  async create(data: {
    title: string;
    description: string;
    gig_type: string;
    gig_subtype: string;
    budget_min: number;
    budget_max: number;
    deadline: string;
  }): Promise<ApiResponse<Job>> {
    return api.post<ApiResponse<Job>>('/jobs', data);
  },

  async getMyJobs(): Promise<ApiResponse<Job[]>> {
    return api.get<ApiResponse<Job[]>>('/jobs/my-jobs');
  },

  async getPublished(params?: {
    gig_type?: string;
    min_budget?: number;
    max_budget?: number;
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ jobs: Job[]; total: number; page: number; limit: number }>> {
    const searchParams = new URLSearchParams();
    if (params?.gig_type) searchParams.append('gig_type', params.gig_type);
    if (params?.min_budget) searchParams.append('min_budget', String(params.min_budget));
    if (params?.max_budget) searchParams.append('max_budget', String(params.max_budget));
    if (params?.keyword) searchParams.append('keyword', params.keyword);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const query = searchParams.toString();
    return api.get<ApiResponse<{ jobs: Job[]; total: number; page: number; limit: number }>>(
      `/jobs/published${query ? `?${query}` : ''}`
    );
  },

  async getById(jobId: number): Promise<ApiResponse<Job>> {
    return api.get<ApiResponse<Job>>(`/jobs/${jobId}`);
  },

  async generateSpec(jobId: number): Promise<ApiResponse<JobSpec>> {
    return api.post<ApiResponse<JobSpec>>(`/jobs/${jobId}/spec/generate`);
  },

  async getSpec(jobId: number): Promise<ApiResponse<JobSpec>> {
    return api.get<ApiResponse<JobSpec>>(`/jobs/${jobId}/spec`);
  },

  async updateSpec(jobId: number, data: {
    milestones_json?: Milestone[];
    requirements_json?: Record<string, any>;
    deliverables_json?: string[];
  }): Promise<ApiResponse<JobSpec>> {
    return api.put<ApiResponse<JobSpec>>(`/jobs/${jobId}/spec`, data);
  },

  async lockSpec(jobId: number): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/spec/lock`);
  },

  async publish(jobId: number): Promise<ApiResponse<Job>> {
    return api.post<ApiResponse<Job>>(`/jobs/${jobId}/publish`);
  },

  async getBids(jobId: number): Promise<ApiResponse<Bid[]>> {
    return api.get<ApiResponse<Bid[]>>(`/jobs/${jobId}/bids`);
  },

  async placeBid(jobId: number, data: {
    amount: number;
    message: string;
    estimated_days: number;
  }): Promise<ApiResponse<Bid>> {
    return api.post<ApiResponse<Bid>>(`/jobs/${jobId}/bids`, data);
  },

  async assignFreelancer(jobId: number, bidId: number): Promise<ApiResponse<Job>> {
    return api.post<ApiResponse<Job>>(`/jobs/${jobId}/assign`, { bid_id: bidId });
  },
};

// ============== ESCROW SERVICES ==============

export const escrowService = {
  async fund(jobId: number, data: {
    amount: number;
    payment_method_id?: string;
  }): Promise<ApiResponse<Escrow>> {
    return api.post<ApiResponse<Escrow>>(`/jobs/${jobId}/escrow/fund`, data);
  },

  async getStatus(jobId: number): Promise<ApiResponse<Escrow>> {
    return api.get<ApiResponse<Escrow>>(`/jobs/${jobId}/escrow`);
  },

  async requestRelease(jobId: number): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/escrow/release`);
  },

  async requestRefund(jobId: number, data: { reason: string }): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/escrow/refund`, data);
  },
};

// ============== SUBMISSION SERVICES ==============

export const submissionService = {
  async submit(jobId: number, data: {
    milestone_id: string;
    file_url?: string;
    notes?: string;
  }): Promise<ApiResponse<Submission>> {
    return api.post<ApiResponse<Submission>>(`/jobs/${jobId}/submissions`, data);
  },

  async getSubmissions(jobId: number): Promise<ApiResponse<Submission[]>> {
    return api.get<ApiResponse<Submission[]>>(`/jobs/${jobId}/submissions`);
  },

  async getSubmission(jobId: number, submissionId: number): Promise<ApiResponse<Submission>> {
    return api.get<ApiResponse<Submission>>(`/jobs/${jobId}/submissions/${submissionId}`);
  },

  async approve(jobId: number, submissionId: number): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/submissions/${submissionId}/approve`);
  },

  async reject(jobId: number, submissionId: number, data: { feedback: string }): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/submissions/${submissionId}/reject`, data);
  },

  async requestRevision(jobId: number, submissionId: number, data: { feedback: string }): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/submissions/${submissionId}/request-revision`, data);
  },

  async resubmit(jobId: number, submissionId: number, data: {
    file_url?: string;
    notes?: string;
  }): Promise<ApiResponse<Submission>> {
    return api.post<ApiResponse<Submission>>(`/jobs/${jobId}/submissions/${submissionId}/resubmit`, data);
  },
};

// ============== CHAT SERVICES ==============

export const chatService = {
  async createOrGetChannel(jobId: number): Promise<ApiResponse<ChatChannel>> {
    return api.post<ApiResponse<ChatChannel>>(`/jobs/${jobId}/chat`);
  },

  async getChannel(jobId: number): Promise<ApiResponse<ChatChannel>> {
    return api.get<ApiResponse<ChatChannel>>(`/jobs/${jobId}/chat`);
  },

  async getMessages(jobId: number, params?: {
    limit?: number;
    before_id?: number;
  }): Promise<ApiResponse<{ channel_id: number; messages: ChatMessage[]; has_more: boolean }>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.before_id) searchParams.append('before_id', String(params.before_id));

    const query = searchParams.toString();
    return api.get<ApiResponse<{ channel_id: number; messages: ChatMessage[]; has_more: boolean }>>(
      `/jobs/${jobId}/chat/messages${query ? `?${query}` : ''}`
    );
  },

  async sendMessage(jobId: number, data: { content: string }): Promise<ApiResponse<{
    message_id: number;
    content: string;
    bro_response?: {
      message_id: number;
      content: string;
      intervention_type: string;
    };
  }>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/chat/messages`, data);
  },

  async getNewMessages(jobId: number, afterId: number): Promise<ApiResponse<{ messages: ChatMessage[]; count: number }>> {
    return api.get<ApiResponse<{ messages: ChatMessage[]; count: number }>>(
      `/jobs/${jobId}/chat/new?after_id=${afterId}`
    );
  },

  async closeChannel(jobId: number): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/chat/close`);
  },
};

// ============== CHANGE REQUEST SERVICES ==============

export const changeRequestService = {
  async create(jobId: number, data: {
    change_type: string;
    description: string;
    budget_impact?: number;
    deadline_impact_days?: number;
  }): Promise<ApiResponse<ChangeRequest>> {
    return api.post<ApiResponse<ChangeRequest>>(`/jobs/${jobId}/change-requests`, data);
  },

  async getAll(jobId: number): Promise<ApiResponse<ChangeRequest[]>> {
    return api.get<ApiResponse<ChangeRequest[]>>(`/jobs/${jobId}/change-requests`);
  },

  async respond(jobId: number, requestId: number, data: {
    action: 'approve' | 'reject';
    response_note?: string;
  }): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/change-requests/${requestId}/respond`, data);
  },
};

// ============== DISPUTE SERVICES ==============

export const disputeService = {
  async create(jobId: number, data: {
    reason: string;
    description: string;
  }): Promise<ApiResponse<Dispute>> {
    return api.post<ApiResponse<Dispute>>(`/jobs/${jobId}/disputes`, data);
  },

  async get(jobId: number): Promise<ApiResponse<Dispute>> {
    return api.get<ApiResponse<Dispute>>(`/jobs/${jobId}/disputes`);
  },

  async addEvidence(jobId: number, disputeId: number, data: {
    evidence_type: string;
    content: string;
    file_url?: string;
  }): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/jobs/${jobId}/disputes/${disputeId}/evidence`, data);
  },
};

// ============== DASHBOARD SERVICES ==============

export const dashboardService = {
  async getEmployerDashboard(): Promise<ApiResponse<{
    stats: DashboardStats;
    recent_activity: any[];
    active_jobs: Job[];
    pending_bids: Bid[];
  }>> {
    return api.get<ApiResponse<any>>('/dashboard/employer');
  },

  async getFreelancerDashboard(): Promise<ApiResponse<{
    stats: DashboardStats;
    recent_activity: any[];
    active_projects: Job[];
    available_jobs: Job[];
  }>> {
    return api.get<ApiResponse<any>>('/dashboard/freelancer');
  },
};

// ============== UPLOAD SERVICES ==============

export const uploadService = {
  async uploadFile(file: File, type: 'submission' | 'evidence' | 'avatar'): Promise<ApiResponse<{ file_url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.upload<ApiResponse<{ file_url: string }>>('/uploads', formData);
  },
};

// ============== PAYMENT SERVICES ==============

export const paymentService = {
  async getPaymentMethods(): Promise<ApiResponse<any[]>> {
    return api.get<ApiResponse<any[]>>('/payments/methods');
  },

  async addPaymentMethod(data: { type: string; token: string }): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>('/payments/methods', data);
  },

  async removePaymentMethod(methodId: string): Promise<ApiResponse<any>> {
    return api.delete<ApiResponse<any>>(`/payments/methods/${methodId}`);
  },

  async setDefaultPaymentMethod(methodId: string): Promise<ApiResponse<any>> {
    return api.post<ApiResponse<any>>(`/payments/methods/${methodId}/default`);
  },

  async getTransactionHistory(): Promise<ApiResponse<any[]>> {
    return api.get<ApiResponse<any[]>>('/payments/transactions');
  },
};

// ============== NOTIFICATION SERVICES ==============

export const notificationService = {
  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return api.get<ApiResponse<NotificationPreferences>>('/users/notification-preferences');
  },

  async updatePreferences(data: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> {
    return api.put<ApiResponse<NotificationPreferences>>('/users/notification-preferences', data);
  },

  async resetPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return api.post<ApiResponse<NotificationPreferences>>('/users/notification-preferences/reset');
  },
};

export default {
  auth: authService,
  jobs: jobService,
  escrow: escrowService,
  submissions: submissionService,
  chat: chatService,
  changeRequests: changeRequestService,
  disputes: disputeService,
  dashboard: dashboardService,
  uploads: uploadService,
  payments: paymentService,
  notifications: notificationService,
};

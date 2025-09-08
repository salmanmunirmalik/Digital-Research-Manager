// Researcher Portfolio Service
// Service for managing researcher profiles, publications, and co-supervisor matching

export interface Publication {
  id: string;
  researcher_id: string;
  title: string;
  abstract?: string;
  authors: string[];
  journal?: string;
  publication_date?: string;
  doi?: string;
  arxiv_id?: string;
  pdf_url?: string;
  keywords: string[];
  research_domains: string[];
  publication_status: string;
  citation_count: number;
  impact_factor?: number;
  ai_summary?: string;
  ai_keywords?: string[];
  ai_research_areas?: string[];
  created_at: string;
  updated_at: string;
}

export interface ResearcherProfile {
  id: string;
  user_id: string;
  institution?: string;
  department?: string;
  position?: string;
  research_interests: string[];
  expertise_areas: string[];
  research_domains: string[];
  years_of_experience?: number;
  h_index: number;
  total_citations: number;
  total_publications: number;
  current_projects: string[];
  previous_institutions: string[];
  awards: string[];
  grants: string[];
  languages: string[];
  availability_status: string;
  max_students: number;
  current_students: number;
  collaboration_preferences?: string;
  research_philosophy?: string;
  mentorship_style?: string;
  lab_website?: string;
  orcid_id?: string;
  google_scholar_id?: string;
  researchgate_id?: string;
  linkedin_url?: string;
  twitter_handle?: string;
  ai_generated_bio?: string;
  ai_research_strengths?: string[];
  ai_collaboration_style?: string;
  created_at: string;
  updated_at: string;
}

export interface CoSupervisorMatch {
  id: string;
  student_id: string;
  supervisor_id: string;
  match_score: number;
  research_domain_match: string[];
  expertise_match: string[];
  interest_alignment: number;
  availability_match: boolean;
  collaboration_potential: number;
  student_message?: string;
  supervisor_response?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ExchangeOpportunity {
  id: string;
  host_lab_id: string;
  host_researcher_id: string;
  title: string;
  description: string;
  research_domains: string[];
  required_expertise: string[];
  duration_weeks?: number;
  start_date?: string;
  end_date?: string;
  funding_available: boolean;
  funding_amount?: number;
  accommodation_provided: boolean;
  visa_support: boolean;
  application_deadline?: string;
  max_applicants: number;
  current_applicants: number;
  requirements: string[];
  benefits: string[];
  contact_email?: string;
  application_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ExchangeApplication {
  id: string;
  opportunity_id: string;
  applicant_id: string;
  motivation: string;
  relevant_experience?: string;
  research_proposal?: string;
  cv_url?: string;
  recommendation_letter_url?: string;
  status: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysis {
  summary: string;
  keywords: string[];
  researchAreas: string[];
  confidence: number;
}

class ResearcherPortfolioService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://localhost:5001/api/researcher-portfolio';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Publication Management
  async uploadPublication(
    publicationData: {
      title: string;
      abstract?: string;
      authors: string[];
      journal?: string;
      publication_date?: string;
      doi?: string;
      keywords: string[];
      research_domains: string[];
    }
  ): Promise<{ publication: Publication; aiAnalysis: AIAnalysis }> {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${this.baseUrl}/publications/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(publicationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getPublications(researcherId: string): Promise<{ publications: Publication[] }> {
    return this.request<{ publications: Publication[] }>(`/publications/${researcherId}`);
  }

  async searchPublications(query: string, domain?: string, limit = 20): Promise<{ publications: Publication[] }> {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });
    if (domain) params.append('domain', domain);

    return this.request<{ publications: Publication[] }>(`/publications/search?${params}`);
  }

  // Researcher Profile Management
  async saveProfile(profileData: Partial<ResearcherProfile>): Promise<{ success: boolean; profile: ResearcherProfile }> {
    return this.request<{ success: boolean; profile: ResearcherProfile }>('/profiles', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getProfile(userId: string): Promise<{ profile: ResearcherProfile }> {
    return this.request<{ profile: ResearcherProfile }>(`/profiles/${userId}`);
  }

  // Co-Supervisor Matching
  async findSupervisors(
    searchCriteria: {
      research_interests?: string[];
      research_domains?: string[];
      max_results?: number;
    }
  ): Promise<{
    supervisors: Array<ResearcherProfile & { compatibility_score: number }>;
    studentProfile: { interests: string[]; domains: string[] };
  }> {
    return this.request<{
      supervisors: Array<ResearcherProfile & { compatibility_score: number }>;
      studentProfile: { interests: string[]; domains: string[] };
    }>('/matching/find-supervisors', {
      method: 'POST',
      body: JSON.stringify(searchCriteria),
    });
  }

  async sendSupervisorRequest(supervisorId: string, message: string): Promise<{ success: boolean; match: CoSupervisorMatch }> {
    return this.request<{ success: boolean; match: CoSupervisorMatch }>('/matching/send-request', {
      method: 'POST',
      body: JSON.stringify({ supervisor_id: supervisorId, message }),
    });
  }

  // Research Exchange
  async createExchangeOpportunity(opportunityData: Partial<ExchangeOpportunity>): Promise<{ success: boolean; opportunity: ExchangeOpportunity }> {
    return this.request<{ success: boolean; opportunity: ExchangeOpportunity }>('/exchange/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunityData),
    });
  }

  async getExchangeOpportunities(domain?: string, status = 'active', limit = 20): Promise<{ opportunities: ExchangeOpportunity[] }> {
    const params = new URLSearchParams({
      status,
      limit: limit.toString(),
    });
    if (domain) params.append('domain', domain);

    return this.request<{ opportunities: ExchangeOpportunity[] }>(`/exchange/opportunities?${params}`);
  }

  async applyForExchange(applicationData: {
    opportunity_id: string;
    motivation: string;
    relevant_experience?: string;
    research_proposal?: string;
    cv_url?: string;
    recommendation_letter_url?: string;
  }): Promise<{ success: boolean; application: ExchangeApplication }> {
    return this.request<{ success: boolean; application: ExchangeApplication }>('/exchange/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  // Dashboard
  async getDashboardData(userId: string): Promise<{
    profile: ResearcherProfile;
    recentPublications: Publication[];
    recentMatches: CoSupervisorMatch[];
  }> {
    return this.request<{
      profile: ResearcherProfile;
      recentPublications: Publication[];
      recentMatches: CoSupervisorMatch[];
    }>(`/dashboard/${userId}`);
  }

  // Utility methods
  async extractTextFromPDF(file: File): Promise<string> {
    // This would integrate with a PDF text extraction service
    // For now, return a placeholder
    return 'PDF text extraction not implemented yet';
  }

  async generateAISummary(text: string): Promise<AIAnalysis> {
    // This would integrate with an AI service for text analysis
    // For now, return a mock response
    return {
      summary: `AI-generated summary of the provided text`,
      keywords: ['research', 'analysis', 'study'],
      researchAreas: ['general research'],
      confidence: 0.8
    };
  }
}

export const researcherPortfolioService = new ResearcherPortfolioService();
export default researcherPortfolioService;

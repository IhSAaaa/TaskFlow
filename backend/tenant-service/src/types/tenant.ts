export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  status: TenantStatus;
  plan: TenantPlan;
  settings: TenantSettings;
  created_at: Date;
  updated_at: Date;
  owner_id: string;
  max_users: number;
  max_projects: number;
  max_storage_gb: number;
  features: string[];
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

export enum TenantPlan {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export interface TenantSettings {
  theme: {
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
    favicon_url?: string;
  };
  features: {
    task_management: boolean;
    project_management: boolean;
    time_tracking: boolean;
    reporting: boolean;
    integrations: boolean;
    api_access: boolean;
  };
  notifications: {
    email_enabled: boolean;
    push_enabled: boolean;
    sms_enabled: boolean;
  };
  security: {
    two_factor_required: boolean;
    session_timeout_minutes: number;
    password_policy: {
      min_length: number;
      require_uppercase: boolean;
      require_lowercase: boolean;
      require_numbers: boolean;
      require_special_chars: boolean;
    };
  };
  integrations: {
    slack_enabled: boolean;
    github_enabled: boolean;
    jira_enabled: boolean;
    trello_enabled: boolean;
  };
}

export interface CreateTenantRequest {
  name: string;
  domain: string;
  subdomain?: string;
  owner_id: string;
  plan?: TenantPlan;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  subdomain?: string;
  status?: TenantStatus;
  plan?: TenantPlan;
  settings?: Partial<TenantSettings>;
  max_users?: number;
  max_projects?: number;
  max_storage_gb?: number;
  features?: string[];
}

export interface TenantFilter {
  status?: TenantStatus;
  plan?: TenantPlan;
  owner_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TenantUsage {
  tenant_id: string;
  current_users: number;
  current_projects: number;
  current_storage_gb: number;
  last_updated: Date;
}

export interface TenantBilling {
  tenant_id: string;
  plan: TenantPlan;
  amount: number;
  currency: string;
  billing_cycle: string;
  next_billing_date: Date;
  status: 'active' | 'past_due' | 'cancelled';
} 
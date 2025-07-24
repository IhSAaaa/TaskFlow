export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  tenant_id: string;
  owner_id: string;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
  tags?: string[];
  budget?: number;
  progress: number;
  members: ProjectMember[];
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  joined_at: Date;
  permissions: string[];
}

export enum ProjectRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  tags?: string[];
  budget?: number;
  members?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: Date;
  end_date?: Date;
  tags?: string[];
  budget?: number;
}

export interface ProjectFilter {
  status?: ProjectStatus;
  owner_id?: string;
  member_id?: string;
  start_date_from?: Date;
  start_date_to?: Date;
  end_date_from?: Date;
  end_date_to?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AddMemberRequest {
  user_id: string;
  role: ProjectRole;
  permissions?: string[];
}

export interface UpdateMemberRequest {
  role?: ProjectRole;
  permissions?: string[];
} 
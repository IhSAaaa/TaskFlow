export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  project_id: string;
  tenant_id: string;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  parent_task_id?: string;
  subtasks?: Task[];
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_id?: string;
  project_id: string;
  due_date?: Date;
  tags?: string[];
  estimated_hours?: number;
  parent_task_id?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: Date;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  project_id?: string;
  created_by?: string;
  due_date_from?: Date;
  due_date_to?: Date;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskAssignment {
  task_id: string;
  assignee_id: string;
  assigned_by: string;
  assigned_at: Date;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
} 
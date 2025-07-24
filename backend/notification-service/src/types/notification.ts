export interface Notification {
  id: string;
  user_id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  data?: any;
  created_at: Date;
  read_at?: Date;
  expires_at?: Date;
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
  PROJECT_INVITATION = 'project_invitation',
  PROJECT_UPDATE = 'project_update',
  COMMENT_ADDED = 'comment_added',
  SYSTEM_ALERT = 'system_alert'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived'
}

export interface CreateNotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
  expires_at?: Date;
}

export interface NotificationFilter {
  status?: NotificationStatus;
  type?: NotificationType;
  user_id?: string;
  created_after?: Date;
  created_before?: Date;
  page?: number;
  limit?: number;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  tenant_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  task_assigned: boolean;
  task_completed: boolean;
  task_due_soon: boolean;
  task_overdue: boolean;
  project_invitation: boolean;
  project_update: boolean;
  comment_added: boolean;
  system_alert: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdatePreferencesRequest {
  email_enabled?: boolean;
  push_enabled?: boolean;
  in_app_enabled?: boolean;
  task_assigned?: boolean;
  task_completed?: boolean;
  task_due_soon?: boolean;
  task_overdue?: boolean;
  project_invitation?: boolean;
  project_update?: boolean;
  comment_added?: boolean;
  system_alert?: boolean;
}

export interface SocketMessage {
  type: string;
  data: any;
  timestamp: Date;
} 
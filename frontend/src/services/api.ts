import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and tenant info
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (user?.tenantId) {
      config.headers['x-tenant-id'] = user.tenantId;
    }
    if (user?.id) {
      config.headers['x-user-id'] = user.id;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: string;
  project_id: string;
  tenant_id: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  parent_task_id?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: string;
  project_id: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
  parent_task_id?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
}

export interface TaskFilter {
  status?: string;
  priority?: string;
  assignee_id?: string;
  project_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  tenant_id: string;
  owner_id: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  budget?: number;
  progress?: number;
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  permissions?: string[];
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  budget?: number;
  members?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  tags?: string[];
  budget?: number;
}

export interface ProjectFilter {
  status?: string;
  owner_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar_url?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  avatar_url?: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_completed' | 'task_due_soon' | 'task_overdue' | 'project_invitation' | 'project_update' | 'comment_added' | 'system_alert';
  status: 'unread' | 'read';
  data?: any;
  created_at: string;
  read_at?: string;
  expires_at?: string;
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
  created_at: string;
  updated_at: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  tenant_id?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  tenant: {
    id: string;
    name: string;
    domain: string;
    plan: string;
  };
}

// API Service class
export class ApiService {
  // Auth endpoints
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials);
    return response.data.data!;
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/register', userData);
    return response.data.data!;
  }

  static async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  }

  static async refreshToken(): Promise<{ token: string }> {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/api/auth/refresh');
    return response.data.data!;
  }

  // Task endpoints
  static async getTasks(filter?: TaskFilter): Promise<PaginatedResponse<Task>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>('/api/tasks', { params: filter });
    return response.data.data!;
  }

  static async getTaskById(taskId: string): Promise<Task> {
    const response = await apiClient.get<ApiResponse<Task>>(`/api/tasks/${taskId}`);
    return response.data.data!;
  }

  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>('/api/tasks', taskData);
    return response.data.data!;
  }

  static async updateTask(taskId: string, taskData: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.put<ApiResponse<Task>>(`/api/tasks/${taskId}`, taskData);
    return response.data.data!;
  }

  static async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/api/tasks/${taskId}`);
  }

  static async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/api/tasks/${taskId}/assign`, { assignee_id: assigneeId });
    return response.data.data!;
  }

  static async getTasksByProject(projectId: string): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>(`/api/tasks/project/${projectId}`);
    return response.data.data!;
  }

  static async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>(`/api/tasks/assignee/${assigneeId}`);
    return response.data.data!;
  }

  // Project endpoints
  static async getProjects(filter?: ProjectFilter): Promise<PaginatedResponse<Project>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Project>>>('/api/projects', { params: filter });
    return response.data.data!;
  }

  static async getProjectById(projectId: string): Promise<Project> {
    const response = await apiClient.get<ApiResponse<Project>>(`/api/projects/${projectId}`);
    return response.data.data!;
  }

  static async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>('/api/projects', projectData);
    return response.data.data!;
  }

  static async updateProject(projectId: string, projectData: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put<ApiResponse<Project>>(`/api/projects/${projectId}`, projectData);
    return response.data.data!;
  }

  static async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/api/projects/${projectId}`);
  }

  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiClient.get<ApiResponse<ProjectMember[]>>(`/api/projects/${projectId}/members`);
    return response.data.data!;
  }

  static async addProjectMember(projectId: string, memberData: { user_id: string; role: string; permissions?: string[] }): Promise<ProjectMember> {
    const response = await apiClient.post<ApiResponse<ProjectMember>>(`/api/projects/${projectId}/members`, memberData);
    return response.data.data!;
  }

  static async updateProjectMember(projectId: string, memberId: string, memberData: { role?: string; permissions?: string[] }): Promise<ProjectMember> {
    const response = await apiClient.put<ApiResponse<ProjectMember>>(`/api/projects/${projectId}/members/${memberId}`, memberData);
    return response.data.data!;
  }

  static async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/api/projects/${projectId}/members/${memberId}`);
  }

  // User endpoints
  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/api/users/me');
    return response.data.data!;
  }

  static async updateUser(userData: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/api/users/me', userData);
    return response.data.data!;
  }

  static async searchUsers(query: string): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>('/api/users/search', { params: { q: query } });
    return response.data.data!;
  }

  // Notification endpoints
  static async getNotifications(filter?: { status?: string; type?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Notification>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>('/api/notifications', { params: filter });
    return response.data.data!;
  }

  static async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<number>>('/api/notifications/unread-count');
    return response.data.data!;
  }

  static async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.put<ApiResponse<Notification>>(`/api/notifications/${notificationId}/read`);
    return response.data.data!;
  }

  static async markAllAsRead(): Promise<number> {
    const response = await apiClient.put<ApiResponse<number>>('/api/notifications/mark-all-read');
    return response.data.data!;
  }

  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<ApiResponse<NotificationPreferences>>('/api/notifications/preferences');
    return response.data.data!;
  }

  static async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiClient.put<ApiResponse<NotificationPreferences>>('/api/notifications/preferences', preferences);
    return response.data.data!;
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/api/notifications/${notificationId}`);
  }
}

export default ApiService; 
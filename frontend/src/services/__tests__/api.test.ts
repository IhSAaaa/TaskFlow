import ApiService from '../api';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage values
    (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'authToken': return 'mock-token';
        case 'tenantId': return 'tenant1';
        case 'userId': return 'user1';
        default: return null;
      }
    });

    // Mock axios instance
    mockAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    } as any);
  });

  describe('Auth endpoints', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: '1', email: 'test@example.com' },
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
            tenant: { id: 'tenant1', name: 'Test Tenant' }
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/auth/login',
        { email: 'test@example.com', password: 'password' }
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should register successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: '1', email: 'test@example.com' },
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
            tenant: { id: 'tenant1', name: 'Test Tenant' }
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.register({
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        password: 'password'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/auth/register',
        {
          email: 'test@example.com',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          password: 'password'
        }
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('Task endpoints', () => {
    it('should get tasks successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            data: [
              {
                id: '1',
                title: 'Test Task',
                status: 'todo',
                priority: 'medium',
                project_id: 'project1',
                tenant_id: 'tenant1',
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-01T10:00:00Z',
                created_by: 'user1'
              }
            ],
            total: 1,
            page: 1,
            limit: 10
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.getTasks({ page: 1, limit: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/tasks',
        { params: { page: 1, limit: 10 } }
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should create task successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            title: 'New Task',
            status: 'todo',
            priority: 'high',
            project_id: 'project1',
            tenant_id: 'tenant1',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z',
            created_by: 'user1'
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.createTask({
        title: 'New Task',
        priority: 'high',
        project_id: 'project1'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/tasks',
        {
          title: 'New Task',
          priority: 'high',
          project_id: 'project1'
        }
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should update task successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            title: 'Updated Task',
            status: 'in_progress',
            priority: 'high',
            project_id: 'project1',
            tenant_id: 'tenant1',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T11:00:00Z',
            created_by: 'user1'
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.updateTask('1', {
        title: 'Updated Task',
        status: 'in_progress'
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/api/tasks/1',
        {
          title: 'Updated Task',
          status: 'in_progress'
        }
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should delete task successfully', async () => {
      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.delete as jest.Mock).mockResolvedValue({});

      await ApiService.deleteTask('1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/tasks/1');
    });
  });

  describe('Project endpoints', () => {
    it('should get projects successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            data: [
              {
                id: '1',
                name: 'Test Project',
                status: 'active',
                tenant_id: 'tenant1',
                owner_id: 'user1',
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-01T10:00:00Z'
              }
            ],
            total: 1,
            page: 1,
            limit: 10
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.getProjects({ page: 1, limit: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/projects',
        { params: { page: 1, limit: 10 } }
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should create project successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            name: 'New Project',
            status: 'planning',
            tenant_id: 'tenant1',
            owner_id: 'user1',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z'
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.createProject({
        name: 'New Project',
        description: 'Test project'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/projects',
        {
          name: 'New Project',
          description: 'Test project'
        }
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('User endpoints', () => {
    it('should get current user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            tenant_id: 'tenant1',
            status: 'active',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z'
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.getCurrentUser();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/users/me');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should update user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            first_name: 'Updated',
            last_name: 'User',
            tenant_id: 'tenant1',
            status: 'active',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T11:00:00Z'
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.updateUser({
        first_name: 'Updated'
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/api/users/me',
        { first_name: 'Updated' }
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('Notification endpoints', () => {
    it('should get notifications successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            data: [
              {
                id: '1',
                user_id: 'user1',
                tenant_id: 'tenant1',
                title: 'Test Notification',
                message: 'Test message',
                type: 'task_assigned',
                status: 'unread',
                created_at: '2024-01-01T10:00:00Z'
              }
            ],
            total: 1,
            page: 1,
            limit: 20
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.getNotifications({ limit: 20 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/notifications',
        { params: { limit: 20 } }
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should get unread count successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: 5
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.getUnreadCount();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/notifications/unread-count');
      expect(result).toBe(5);
    });

    it('should mark notification as read successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            status: 'read',
            read_at: '2024-01-01T11:00:00Z'
          }
        }
      };

      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ApiService.markAsRead('1');

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/notifications/1/read');
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal Server Error' }
        }
      });

      await expect(ApiService.getCurrentUser()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockAxiosInstance = mockAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue(new Error('Network Error'));

      await expect(ApiService.getCurrentUser()).rejects.toThrow('Network Error');
    });
  });
}); 
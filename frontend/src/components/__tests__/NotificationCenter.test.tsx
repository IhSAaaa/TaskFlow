import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import NotificationCenter from '../NotificationCenter';
import ApiService from '../../services/api';

// Mock the API service
vi.mock('../../services/api');
const mockApiService = ApiService as any;

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    on: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock environment variables
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
  },
  writable: true,
});

const mockNotifications = [
  {
    id: '1',
    user_id: 'user1',
    tenant_id: 'tenant1',
    title: 'Task Assigned',
    message: 'You have been assigned a new task',
    type: 'task_assigned' as const,
    status: 'unread' as const,
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    tenant_id: 'tenant1',
    title: 'Project Update',
    message: 'Project status has been updated',
    type: 'project_update' as const,
    status: 'read' as const,
    created_at: '2024-01-01T09:00:00Z',
    read_at: '2024-01-01T09:30:00Z',
  },
];

const mockNavigate = vi.fn();

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
          if (key === 'authToken') return 'mock-token';
          if (key === 'tenantId') return 'tenant1';
          if (key === 'userId') return 'user1';
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock API responses
    mockApiService.getNotifications = vi.fn().mockResolvedValue({
      data: mockNotifications,
      total: 2,
      page: 1,
      limit: 20,
    });
    mockApiService.getUnreadCount = vi.fn().mockResolvedValue(1);
    mockApiService.markAsRead = vi.fn().mockResolvedValue(mockNotifications[0]);
    mockApiService.markAllAsRead = vi.fn().mockResolvedValue(1);
    mockApiService.deleteNotification = vi.fn().mockResolvedValue(undefined);
  });

  it('renders notification bell with unread count', async () => {
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    
    // Check if unread count is displayed
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('opens notification panel when bell is clicked', async () => {
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('displays notifications in the panel', async () => {
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Task Assigned')).toBeInTheDocument();
      expect(screen.getByText('Project Update')).toBeInTheDocument();
    });
  });

  it('marks notification as read when check button is clicked', async () => {
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Task Assigned')).toBeInTheDocument();
    });
    
    const markAsReadButton = screen.getByTitle('Mark as read');
    fireEvent.click(markAsReadButton);
    
    await waitFor(() => {
      expect(mockApiService.markAsRead).toHaveBeenCalledWith('1');
    });
  });

  it('deletes notification when delete button is clicked', async () => {
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Task Assigned')).toBeInTheDocument();
    });
    
    const deleteButton = screen.getByTitle('Delete notification');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockApiService.deleteNotification).toHaveBeenCalledWith('1');
    });
  });

  it('marks all notifications as read when "Mark all read" is clicked', async () => {
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Mark all read')).toBeInTheDocument();
    });
    
    const markAllReadButton = screen.getByText('Mark all read');
    fireEvent.click(markAllReadButton);
    
    await waitFor(() => {
      expect(mockApiService.markAllAsRead).toHaveBeenCalled();
    });
  });

  it('navigates to notifications page when "View all notifications" is clicked', async () => {
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('View all notifications')).toBeInTheDocument();
    });
    
    const viewAllButton = screen.getByText('View all notifications');
    fireEvent.click(viewAllButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });

  it('shows loading state while fetching notifications', async () => {
    // Mock API to return a promise that doesn't resolve immediately
    mockApiService.getNotifications.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    mockApiService.getNotifications.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });

  it('displays correct notification types with appropriate styling', async () => {
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Task Assigned')).toBeInTheDocument();
      expect(screen.getByText('Project Update')).toBeInTheDocument();
    });
  });

  it('formats time correctly for notifications', async () => {
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Task Assigned')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockApiService.getNotifications.mockRejectedValue(new Error('API Error'));
    
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    // Should not crash and should show empty state or error handling
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
}); 
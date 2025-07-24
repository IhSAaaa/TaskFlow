import { Request, Response } from 'express';
import { logger } from '../../shared/src/utils/logger';
import { NotificationService } from '../services/notificationService';
import { CreateNotificationRequest, NotificationFilter, UpdatePreferencesRequest } from '../types/notification';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  createNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const notificationData: CreateNotificationRequest = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const notification = await this.notificationService.createNotification(notificationData, tenantId);

      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      logger.error('Error in createNotification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create notification'
      });
    }
  };

  getNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const notification = await this.notificationService.getNotificationById(notificationId, tenantId);

      if (!notification) {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
        return;
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      logger.error('Error in getNotification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notification'
      });
    }
  };

  getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      
      const filter: NotificationFilter = {
        user_id: userId,
        status: req.query.status as any,
        type: req.query.type as any,
        created_after: req.query.created_after ? new Date(req.query.created_after as string) : undefined,
        created_before: req.query.created_before ? new Date(req.query.created_before as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const result = await this.notificationService.getNotifications(filter, tenantId);

      res.json({
        success: true,
        data: result.notifications,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      logger.error('Error in getNotifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notifications'
      });
    }
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const notification = await this.notificationService.markAsRead(notificationId, tenantId);

      if (!notification) {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
        return;
      }

      res.json({
        success: true,
        data: notification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Error in markAsRead:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }
  };

  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const count = await this.notificationService.markAllAsRead(userId, tenantId);

      res.json({
        success: true,
        data: { count },
        message: `${count} notifications marked as read`
      });
    } catch (error) {
      logger.error('Error in markAllAsRead:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read'
      });
    }
  };

  deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const deleted = await this.notificationService.deleteNotification(notificationId, tenantId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteNotification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete notification'
      });
    }
  };

  getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const count = await this.notificationService.getUnreadCount(userId, tenantId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      logger.error('Error in getUnreadCount:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get unread count'
      });
    }
  };

  getNotificationPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const preferences = await this.notificationService.getNotificationPreferences(userId, tenantId);

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      logger.error('Error in getNotificationPreferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notification preferences'
      });
    }
  };

  updateNotificationPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const tenantId = req.headers['x-tenant-id'] as string;
      const preferences: UpdatePreferencesRequest = req.body;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const updatedPreferences = await this.notificationService.updateNotificationPreferences(
        userId, 
        tenantId, 
        preferences
      );

      res.json({
        success: true,
        data: updatedPreferences,
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      logger.error('Error in updateNotificationPreferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update notification preferences'
      });
    }
  };

  sendBulkNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userIds, title, message, type, data } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'User IDs array is required'
        });
        return;
      }

      if (!title || !message || !type) {
        res.status(400).json({
          success: false,
          error: 'Title, message, and type are required'
        });
        return;
      }

      const count = await this.notificationService.sendBulkNotification(
        userIds, 
        title, 
        message, 
        type, 
        tenantId, 
        data
      );

      res.json({
        success: true,
        data: { count },
        message: `Bulk notification sent to ${count} users`
      });
    } catch (error) {
      logger.error('Error in sendBulkNotification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send bulk notification'
      });
    }
  };
} 
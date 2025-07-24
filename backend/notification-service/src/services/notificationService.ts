import { Pool } from 'pg';
import { Server } from 'socket.io';
import { logger } from '../../shared/src/utils/logger';
import { 
  Notification, 
  CreateNotificationRequest, 
  NotificationFilter, 
  NotificationStatus, 
  NotificationType,
  NotificationPreferences,
  UpdatePreferencesRequest
} from '../types/notification';

export class NotificationService {
  private pool: Pool;
  private io: Server;
  private userSockets: Map<string, string[]> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'taskflow',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });
  }

  async createNotification(notificationData: CreateNotificationRequest, tenantId: string): Promise<Notification> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO notifications (
          user_id, tenant_id, title, message, type, data, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        notificationData.user_id,
        tenantId,
        notificationData.title,
        notificationData.message,
        notificationData.type,
        notificationData.data ? JSON.stringify(notificationData.data) : null,
        notificationData.expires_at
      ];

      const result = await client.query(query, values);
      const notification = result.rows[0];

      await client.query('COMMIT');
      
      logger.info(`Notification created: ${notification.id}`);
      
      // Send real-time notification
      await this.sendRealTimeNotification(notification);
      
      return this.mapNotificationFromDb(notification);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating notification:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getNotificationById(notificationId: string, tenantId: string): Promise<Notification | null> {
    const query = `
      SELECT * FROM notifications 
      WHERE id = $1 AND tenant_id = $2
    `;
    
    const result = await this.pool.query(query, [notificationId, tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapNotificationFromDb(result.rows[0]);
  }

  async getNotifications(filter: NotificationFilter, tenantId: string): Promise<{ notifications: Notification[], total: number, page: number, limit: number }> {
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (filter.user_id) {
      conditions.push(`user_id = $${paramCount++}`);
      values.push(filter.user_id);
    }

    if (filter.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(filter.status);
    }

    if (filter.type) {
      conditions.push(`type = $${paramCount++}`);
      values.push(filter.type);
    }

    if (filter.created_after) {
      conditions.push(`created_at >= $${paramCount++}`);
      values.push(filter.created_after);
    }

    if (filter.created_before) {
      conditions.push(`created_at <= $${paramCount++}`);
      values.push(filter.created_before);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM notifications ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM notifications 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);
    const result = await this.pool.query(query, values);

    const notifications = result.rows.map(row => this.mapNotificationFromDb(row));

    return {
      notifications,
      total,
      page,
      limit
    };
  }

  async markAsRead(notificationId: string, tenantId: string): Promise<Notification | null> {
    const query = `
      UPDATE notifications 
      SET status = $1, read_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [NotificationStatus.READ, notificationId, tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Notification marked as read: ${notificationId}`);
    return this.mapNotificationFromDb(result.rows[0]);
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<number> {
    const query = `
      UPDATE notifications 
      SET status = $1, read_at = NOW()
      WHERE user_id = $2 AND tenant_id = $3 AND status = $4
    `;
    
    const result = await this.pool.query(query, [NotificationStatus.READ, userId, tenantId, NotificationStatus.UNREAD]);
    
    logger.info(`Marked ${result.rowCount} notifications as read for user ${userId}`);
    return result.rowCount || 0;
  }

  async deleteNotification(notificationId: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM notifications 
      WHERE id = $1 AND tenant_id = $2
    `;
    
    const result = await this.pool.query(query, [notificationId, tenantId]);
    
    if (result.rowCount === 0) {
      return false;
    }

    logger.info(`Notification deleted: ${notificationId}`);
    return true;
  }

  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) FROM notifications 
      WHERE user_id = $1 AND tenant_id = $2 AND status = $3
    `;
    
    const result = await this.pool.query(query, [userId, tenantId, NotificationStatus.UNREAD]);
    
    return parseInt(result.rows[0].count);
  }

  async getNotificationPreferences(userId: string, tenantId: string): Promise<NotificationPreferences | null> {
    const query = `
      SELECT * FROM notification_preferences 
      WHERE user_id = $1 AND tenant_id = $2
    `;
    
    const result = await this.pool.query(query, [userId, tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapPreferencesFromDb(result.rows[0]);
  }

  async updateNotificationPreferences(
    userId: string, 
    tenantId: string, 
    preferences: UpdatePreferencesRequest
  ): Promise<NotificationPreferences> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if preferences exist
      const existing = await this.getNotificationPreferences(userId, tenantId);
      
      if (!existing) {
        // Create default preferences
        const createQuery = `
          INSERT INTO notification_preferences (
            user_id, tenant_id, email_enabled, push_enabled, in_app_enabled,
            task_assigned, task_completed, task_due_soon, task_overdue,
            project_invitation, project_update, comment_added, system_alert
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `;
        
        const createValues = [
          userId, tenantId, true, true, true,
          true, true, true, true, true, true, true, true
        ];
        
        const createResult = await client.query(createQuery, createValues);
        const newPreferences = createResult.rows[0];
        
        await client.query('COMMIT');
        return this.mapPreferencesFromDb(newPreferences);
      }

      // Update existing preferences
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (preferences.email_enabled !== undefined) {
        updateFields.push(`email_enabled = $${paramCount++}`);
        values.push(preferences.email_enabled);
      }
      
      if (preferences.push_enabled !== undefined) {
        updateFields.push(`push_enabled = $${paramCount++}`);
        values.push(preferences.push_enabled);
      }
      
      if (preferences.in_app_enabled !== undefined) {
        updateFields.push(`in_app_enabled = $${paramCount++}`);
        values.push(preferences.in_app_enabled);
      }
      
      if (preferences.task_assigned !== undefined) {
        updateFields.push(`task_assigned = $${paramCount++}`);
        values.push(preferences.task_assigned);
      }
      
      if (preferences.task_completed !== undefined) {
        updateFields.push(`task_completed = $${paramCount++}`);
        values.push(preferences.task_completed);
      }
      
      if (preferences.task_due_soon !== undefined) {
        updateFields.push(`task_due_soon = $${paramCount++}`);
        values.push(preferences.task_due_soon);
      }
      
      if (preferences.task_overdue !== undefined) {
        updateFields.push(`task_overdue = $${paramCount++}`);
        values.push(preferences.task_overdue);
      }
      
      if (preferences.project_invitation !== undefined) {
        updateFields.push(`project_invitation = $${paramCount++}`);
        values.push(preferences.project_invitation);
      }
      
      if (preferences.project_update !== undefined) {
        updateFields.push(`project_update = $${paramCount++}`);
        values.push(preferences.project_update);
      }
      
      if (preferences.comment_added !== undefined) {
        updateFields.push(`comment_added = $${paramCount++}`);
        values.push(preferences.comment_added);
      }
      
      if (preferences.system_alert !== undefined) {
        updateFields.push(`system_alert = $${paramCount++}`);
        values.push(preferences.system_alert);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(userId, tenantId);

      const updateQuery = `
        UPDATE notification_preferences 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramCount++} AND tenant_id = $${paramCount++}
        RETURNING *
      `;

      const result = await client.query(updateQuery, values);
      
      await client.query('COMMIT');
      
      logger.info(`Notification preferences updated for user ${userId}`);
      return this.mapPreferencesFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating notification preferences:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Socket.io methods
  registerUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)!.push(socketId);
    logger.info(`User ${userId} connected with socket ${socketId}`);
  }

  unregisterUserSocket(userId: string, socketId: string): void {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      const index = userSockets.indexOf(socketId);
      if (index > -1) {
        userSockets.splice(index, 1);
        if (userSockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
    logger.info(`User ${userId} disconnected socket ${socketId}`);
  }

  private async sendRealTimeNotification(notification: any): Promise<void> {
    const userId = notification.user_id;
    const userSockets = this.userSockets.get(userId);
    
    if (userSockets && userSockets.length > 0) {
      const notificationData = this.mapNotificationFromDb(notification);
      
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification', {
          type: 'new_notification',
          data: notificationData,
          timestamp: new Date()
        });
      });
      
      logger.info(`Real-time notification sent to user ${userId}`);
    }
  }

  // Bulk notification methods
  async sendBulkNotification(
    userIds: string[], 
    title: string, 
    message: string, 
    type: NotificationType, 
    tenantId: string,
    data?: any
  ): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let createdCount = 0;
      
      for (const userId of userIds) {
        const notificationData: CreateNotificationRequest = {
          user_id: userId,
          title,
          message,
          type,
          data
        };
        
        await this.createNotification(notificationData, tenantId);
        createdCount++;
      }
      
      await client.query('COMMIT');
      
      logger.info(`Bulk notification sent to ${createdCount} users`);
      return createdCount;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error sending bulk notification:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private mapNotificationFromDb(row: any): Notification {
    return {
      id: row.id,
      user_id: row.user_id,
      tenant_id: row.tenant_id,
      title: row.title,
      message: row.message,
      type: row.type,
      status: row.status,
      data: row.data ? JSON.parse(row.data) : undefined,
      created_at: row.created_at,
      read_at: row.read_at,
      expires_at: row.expires_at
    };
  }

  private mapPreferencesFromDb(row: any): NotificationPreferences {
    return {
      id: row.id,
      user_id: row.user_id,
      tenant_id: row.tenant_id,
      email_enabled: row.email_enabled,
      push_enabled: row.push_enabled,
      in_app_enabled: row.in_app_enabled,
      task_assigned: row.task_assigned,
      task_completed: row.task_completed,
      task_due_soon: row.task_due_soon,
      task_overdue: row.task_overdue,
      project_invitation: row.project_invitation,
      project_update: row.project_update,
      comment_added: row.comment_added,
      system_alert: row.system_alert,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 
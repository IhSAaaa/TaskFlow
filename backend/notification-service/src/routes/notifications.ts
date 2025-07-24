import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { NotificationService } from '../services/notificationService';
import { Server as SocketIOServer } from 'socket.io';

export default function createNotificationRoutes(io: SocketIOServer): Router {
  const router = Router();
  const notificationService = new NotificationService(io);
  const notificationController = new NotificationController(notificationService);

  // CRUD operations
  router.post('/', notificationController.createNotification);
  router.get('/', notificationController.getNotifications);
  router.get('/unread-count', notificationController.getUnreadCount);
  router.get('/:notificationId', notificationController.getNotification);
  router.put('/:notificationId/read', notificationController.markAsRead);
  router.put('/mark-all-read', notificationController.markAllAsRead);
  router.delete('/:notificationId', notificationController.deleteNotification);

  // Preferences
  router.get('/preferences', notificationController.getNotificationPreferences);
  router.put('/preferences', notificationController.updateNotificationPreferences);

  // Bulk operations
  router.post('/bulk', notificationController.sendBulkNotification);

  return router;
} 